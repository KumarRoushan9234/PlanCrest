import { HttpError } from "../../utils/workspaceAccess.js";
import { bearer, call } from "../http.js";

const SLACK_API = "https://slack.com/api";

/** Only post to real Slack webhook hosts. Anything else would let a user aim the server at internal URLs. */
export const assertSlackWebhook = (url) => {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch {
    throw new HttpError(400, "That doesn't look like a URL");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "hooks.slack.com") {
    throw new HttpError(400, "Use an incoming webhook URL from Slack (https://hooks.slack.com/services/…)");
  }
  return parsed.toString();
};

const toText = ({ title, subtitle, detail, url }) => `*${subtitle}*\n<${url}|${title}>${detail ? `\n${detail}` : ""}`;

/** Send a message through whichever mode this connection uses: webhook or bot token. */
export const postToSlack = async (connector, message) => {
  const text = typeof message === "string" ? message : toText(message);

  if (connector.config.webhookUrl) {
    await call({ method: "POST", url: assertSlackWebhook(connector.config.webhookUrl), data: { text } });
    return;
  }

  const channel = connector.settings?.options?.channel?.id;
  if (!channel) throw new HttpError(400, "Choose a Slack channel first");
  const data = await call({
    method: "POST",
    url: `${SLACK_API}/chat.postMessage`,
    headers: bearer(connector.config.accessToken),
    data: { channel, text, unfurl_links: false },
  });
  if (!data.ok) {
    throw new HttpError(400, data.error === "not_in_channel" ? "Invite the PlanCrest app to that channel first (type /invite @PlanCrest in Slack)." : `Slack error: ${data.error}`);
  }
};

/** Validate a pasted incoming-webhook URL by posting a test message. */
export const validateSlackWebhook = async ({ webhookUrl }) => {
  const url = assertSlackWebhook(webhookUrl);
  await call({ method: "POST", url, data: { text: "PlanCrest is now connected to this channel. :white_check_mark:" } });
  return { config: { webhookUrl: url }, account: { name: "Incoming webhook" }, name: "Slack (webhook)" };
};

export const slackActions = {
  async channels(ctx) {
    if (ctx.connector.config.webhookUrl) return { channels: [], mode: "webhook" };
    const data = await call({
      url: `${SLACK_API}/conversations.list`,
      headers: bearer(ctx.connector.config.accessToken),
      params: { types: "public_channel,private_channel", exclude_archived: true, limit: 200 },
    });
    if (!data.ok) throw new HttpError(400, `Slack error: ${data.error}`);
    return {
      mode: "app",
      selected: ctx.connector.settings?.options?.channel || null,
      channels: data.channels.map((c) => ({ id: c.id, name: c.name, private: c.is_private, member: c.is_member })),
    };
  },

  async set_channel(ctx, { id, name }) {
    ctx.connector.settings.options = { ...(ctx.connector.settings.options || {}), channel: { id, name } };
    ctx.connector.markModified("settings.options");
    await ctx.connector.save();
    return { channel: { id, name } };
  },

  async test(ctx) {
    await postToSlack(ctx.connector, "PlanCrest test message. If you can read this, notifications are working. :tada:");
    return { sent: true };
  },

  async post(ctx, { text }) {
    if (!String(text || "").trim()) throw new HttpError(400, "Write a message first");
    await postToSlack(ctx.connector, String(text).slice(0, 3000));
    return { sent: true };
  },
};
