import Connector from "../models/connector.js";
import { clientUrl } from "../config/env.js";
import { HttpError, assertProjectAccess, getWorkspaceAccess } from "../utils/workspaceAccess.js";
import { CATEGORIES, PROVIDERS, apiBaseUrl, getProvider, isConfigured, missingEnv, redirectUri } from "../integrations/registry.js";
import { buildAuthUrl, exchangeCode, fetchAccount, isOAuthGroup, signState, verifyState } from "../integrations/oauth.js";
import { loadConnector, markError, saveConnection, summarize } from "../integrations/store.js";
import { actionsFor as googleActions } from "../integrations/providers/google.js";
import { githubActions } from "../integrations/providers/github.js";
import { slackActions, validateSlackWebhook } from "../integrations/providers/slack.js";
import { teamsActions, validateTeamsWebhook } from "../integrations/providers/teams.js";
import { jiraActions, validateJira } from "../integrations/providers/jira.js";
import { trelloActions, validateTrello } from "../integrations/providers/trello.js";

const fail = (res, error, fallback = "Something went wrong") => {
  if (error instanceof HttpError) return res.status(error.status).json({ success: false, error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ success: false, error: fallback });
};

const actionTable = (type) => {
  if (type.startsWith("google_") || type === "gmail") return googleActions(type);
  return { github: githubActions, slack: slackActions, microsoft_teams: teamsActions, jira: jiraActions, trello: trelloActions }[type];
};

const validators = { jira: validateJira, trello: validateTrello, slack: validateSlackWebhook, microsoft_teams: validateTeamsWebhook };

/** Connecting a workspace-wide tool needs a manager; personal accounts only need you. */
const assertCanConnect = async (provider, workspaceId, userId) => {
  if (provider.scope !== "workspace") return;
  const access = await getWorkspaceAccess(workspaceId, userId);
  if (!access.isManager) throw new HttpError(403, "Only the workspace owner or an admin can connect this");
};

/** GET /api/integrations?workspaceId=… : the catalog with each provider's state */
export const catalog = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { workspaceId } = req.query;
    const access = workspaceId ? await getWorkspaceAccess(workspaceId, userId) : null;

    const connectors = await Connector.find({
      status: { $ne: "disconnected" },
      $or: [{ user: userId, scope: "personal" }, ...(workspaceId ? [{ workspace: workspaceId, scope: "workspace" }] : [])],
    });
    const byType = (type) => connectors.filter((c) => c.type === type).map(summarize);

    const providers = Object.values(PROVIDERS).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      auth: p.auth,
      altAuth: p.altAuth,
      scope: p.scope,
      features: p.features,
      fields: p.fields,
      help: p.help,
      webhookHint: p.webhookHint,
      derivedFrom: p.derivedFrom,
      configured: isConfigured(p),
      missingEnv: missingEnv(p),
      redirectUri: p.oauthGroup ? redirectUri(p.oauthGroup) : undefined,
      canManage: p.scope === "workspace" ? Boolean(access?.isManager) : true,
      connections: p.derivedFrom ? byType(p.derivedFrom) : byType(p.id),
    }));

    res.json({ success: true, data: { categories: CATEGORIES, providers, apiUrl: apiBaseUrl() } });
  } catch (error) {
    fail(res, error, "Failed to load integrations");
  }
};

/** POST /api/integrations/:provider/connect : returns the URL to send the user to */
export const startOAuth = async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider || provider.auth !== "oauth") throw new HttpError(404, "This integration doesn't use OAuth");
    if (!isConfigured(provider)) {
      throw new HttpError(503, `${provider.name} isn't set up on this server yet. Missing: ${missingEnv(provider).join(", ")}.`);
    }
    const { workspaceId } = req.body;
    await assertCanConnect(provider, workspaceId, req.auth._id);

    const state = signState({ userId: req.auth._id, providerId: provider.id, workspaceId });
    res.json({ success: true, authUrl: buildAuthUrl(provider.id, state) });
  } catch (error) {
    fail(res, error, "Couldn't start the connection");
  }
};

/** GET /api/integrations/:group/callback : the provider sends the browser back here */
export const oauthCallback = async (req, res) => {
  const { group } = req.params;
  const back = (providerId, query) => res.redirect(`${clientUrl}/integrations${providerId ? `/${providerId}` : ""}?${new URLSearchParams(query)}`);

  try {
    if (!isOAuthGroup(group)) return back(null, { error: "Unknown provider" });
    const state = verifyState(req.query.state);
    if (!state) return back(null, { error: "This connection link expired. Please try again." });
    if (req.query.error) return back(state.providerId, { error: `Access was not granted: ${req.query.error}` });

    const provider = getProvider(state.providerId);
    if (!provider || provider.oauthGroup !== group) return back(null, { error: "Mismatched provider" });

    // Re-check on return: the user's permissions may have changed while they were away
    await assertCanConnect(provider, state.workspaceId, state.userId);

    const tokens = await exchangeCode(provider.id, req.query.code);
    const account = await fetchAccount(provider.id, tokens);
    await saveConnection({
      userId: state.userId,
      workspaceId: state.workspaceId,
      providerId: provider.id,
      name: account.label ? `${provider.name} (${account.label})` : provider.name,
      account,
      config: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiryDate: tokens.expiryDate, scopes: tokens.scopes, externalAccountId: account.id },
    });
    return back(provider.id, { connected: "1" });
  } catch (error) {
    console.error("OAuth callback failed:", error.message);
    return back(null, { error: error instanceof HttpError ? error.message : "Couldn't finish connecting. Please try again." });
  }
};

/** POST /api/integrations/:provider/credentials : API tokens and webhook URLs */
export const connectWithCredentials = async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    const validate = validators[provider?.id];
    if (!provider || !validate) throw new HttpError(404, "This integration doesn't take pasted credentials");

    const { workspaceId, ...fields } = req.body;
    await assertCanConnect(provider, workspaceId, req.auth._id);

    const { config, account, name } = await validate(fields);
    const connector = await saveConnection({ userId: req.auth._id, workspaceId, providerId: provider.id, config, account, name });
    res.status(201).json({ success: true, data: summarize(connector) });
  } catch (error) {
    fail(res, error, "Couldn't connect");
  }
};

const ALLOWED_TASK_SYNC = ["autoCreateFromIssues", "autoLinkPRs", "autoCloseOnMerge", "trackCommits"];

/** PATCH /api/integrations/connectors/:id */
export const updateConnector = async (req, res) => {
  try {
    const { connector } = await loadConnector(req.params.id, req.auth._id, { manage: true });
    const { name, settings = {} } = req.body;

    if (typeof name === "string" && name.trim()) connector.name = name.trim().slice(0, 80);
    if (typeof settings.autoSync === "boolean") connector.settings.autoSync = settings.autoSync;
    if (typeof settings.notifications === "boolean") connector.settings.notifications = settings.notifications;
    if (["bidirectional", "import", "export"].includes(settings.syncDirection)) connector.settings.syncDirection = settings.syncDirection;
    if (settings.taskSync && typeof settings.taskSync === "object") {
      for (const key of ALLOWED_TASK_SYNC) {
        if (typeof settings.taskSync[key] === "boolean") connector.settings.taskSync[key] = settings.taskSync[key];
      }
    }
    if (settings.options?.notify && typeof settings.options.notify === "object") {
      const notify = {};
      for (const key of ["taskCreated", "taskAssigned", "taskCompleted", "commentAdded"]) {
        if (typeof settings.options.notify[key] === "boolean") notify[key] = settings.options.notify[key];
      }
      connector.settings.options = { ...(connector.settings.options || {}), notify: { ...(connector.settings.options?.notify || {}), ...notify } };
      connector.markModified("settings.options");
    }

    await connector.save();
    res.json({ success: true, data: summarize(connector) });
  } catch (error) {
    fail(res, error, "Couldn't update the connection");
  }
};

/** DELETE /api/integrations/connectors/:id */
export const disconnect = async (req, res) => {
  try {
    const { connector } = await loadConnector(req.params.id, req.auth._id, { manage: true });
    await connector.deleteOne();
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Couldn't disconnect");
  }
};

/** POST /api/integrations/connectors/:id/actions/:action */
export const runAction = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { connector } = await loadConnector(req.params.id, userId, { manage: true });
    const table = actionTable(connector.type);
    const fn = table && Object.prototype.hasOwnProperty.call(table, req.params.action) ? table[req.params.action] : null;
    if (!fn) throw new HttpError(404, "Unknown action");

    const params = req.body || {};
    const ctx = {
      connector,
      userId,
      params,
      async workspace() {
        const workspaceId = String(params.workspaceId || connector.workspace || "");
        const access = await getWorkspaceAccess(workspaceId, userId);
        return { workspaceId, access };
      },
      async project(projectId) {
        const { workspaceId, access } = await ctx.workspace();
        await assertProjectAccess(workspaceId, projectId, userId, access);
        return { workspaceId, access };
      },
    };

    try {
      const data = await fn(ctx, params);
      res.json({ success: true, data });
    } catch (error) {
      // The provider rejected our credentials: flag the connection so the UI offers "Reconnect"
      if (error instanceof HttpError && error.status === 424) await markError(connector, error.message).catch(() => {});
      throw error;
    }
  } catch (error) {
    fail(res, error, "That action failed");
  }
};
