import mongoose from "mongoose";
import Connector from "../models/connector.js";
import { HttpError, getWorkspaceAccess } from "../utils/workspaceAccess.js";
import { getProvider } from "./registry.js";

/** What the client may see about a connection. Tokens and secrets never leave the server. */
export const summarize = (connector) => ({
  _id: connector._id,
  type: connector.type,
  name: connector.name,
  scope: connector.scope,
  workspace: connector.workspace,
  user: connector.user,
  status: connector.status,
  account: {
    email: connector.metadata?.userInfo?.email,
    name: connector.metadata?.userInfo?.name,
    username: connector.metadata?.userInfo?.username,
    picture: connector.metadata?.userInfo?.picture || connector.metadata?.userInfo?.avatar,
    site: connector.config?.site,
  },
  settings: {
    autoSync: connector.settings?.autoSync,
    syncDirection: connector.settings?.syncDirection,
    notifications: connector.settings?.notifications,
    taskSync: connector.settings?.taskSync?.toObject?.() ?? connector.settings?.taskSync,
    options: connector.settings?.options || {},
    webhookActive: Boolean(connector.settings?.webhooks?.enabled),
  },
  linkedResources: (connector.linkedResources || []).map((r) => ({
    repositoryFullName: r.repositoryFullName,
    project: r.project,
    defaultBranch: r.defaultBranch,
  })),
  stats: connector.metadata?.stats,
  connectedAt: connector.metadata?.connectedAt,
  lastSync: connector.metadata?.lastSync,
});

/** Create or refresh a connection. Personal ones are per user, workspace ones per workspace. */
export const saveConnection = async ({ userId, workspaceId, providerId, config, account, name }) => {
  const provider = getProvider(providerId);
  const personal = provider.scope === "personal";
  const filter = personal ? { user: userId, type: providerId, scope: "personal" } : { workspace: workspaceId, type: providerId, scope: "workspace" };

  let connector = await Connector.findOne(filter);
  if (!connector) {
    connector = new Connector({
      user: userId,
      type: providerId,
      scope: personal ? "personal" : "workspace",
      workspace: personal ? undefined : workspaceId,
      name: name || provider.name,
    });
  }

  connector.name = name || connector.name || provider.name;
  connector.status = "active";
  connector.config = {
    ...(connector.toObject().config ?? {}),
    ...config,
    // A refresh token is only sent on first consent; never lose the one we have
    refreshToken: config.refreshToken || connector.config?.refreshToken,
    scopes: config.scopes ?? connector.config?.scopes,
  };
  connector.metadata = {
    ...(connector.toObject().metadata ?? {}),
    connectedAt: connector.metadata?.connectedAt || new Date(),
    userInfo: {
      email: account?.email,
      name: account?.name,
      picture: account?.picture,
      username: account?.username,
    },
  };
  await connector.save();
  return connector;
};

/**
 * Load a connector the caller may use. Personal: only its owner. Workspace:
 * any member can see it, only its creator or workspace managers can change it.
 */
export const loadConnector = async (connectorId, userId, { manage = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(connectorId)) throw new HttpError(404, "Connection not found");
  const connector = await Connector.findById(connectorId);
  if (!connector) throw new HttpError(404, "Connection not found");

  if (connector.scope === "personal") {
    if (String(connector.user) !== String(userId)) throw new HttpError(403, "This connection belongs to someone else");
    return { connector, access: null };
  }

  const access = await getWorkspaceAccess(connector.workspace, userId);
  if (manage && !access.isManager && String(connector.user) !== String(userId)) {
    throw new HttpError(403, "Only the workspace owner or an admin can change this connection");
  }
  return { connector, access };
};

export const markError = async (connector, message) => {
  connector.status = "error";
  connector.metadata = {
    ...(connector.toObject().metadata ?? {}),
    stats: { ...(connector.toObject().metadata?.stats ?? {}), lastSyncStatus: message, errorCount: (connector.metadata?.stats?.errorCount || 0) + 1 },
  };
  await connector.save();
};

export const markSynced = async (connector, status = "ok") => {
  connector.metadata = {
    ...(connector.toObject().metadata ?? {}),
    lastSync: new Date(),
    stats: {
      ...(connector.toObject().metadata?.stats ?? {}),
      totalSyncs: (connector.metadata?.stats?.totalSyncs || 0) + 1,
      lastSyncStatus: status,
    },
  };
  if (connector.status === "error") connector.status = "active";
  await connector.save();
};
