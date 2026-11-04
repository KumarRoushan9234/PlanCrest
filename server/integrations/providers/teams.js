import { HttpError } from "../../utils/workspaceAccess.js";
import { call } from "../http.js";

const ALLOWED_SUFFIXES = [".webhook.office.com", ".logic.azure.com", ".powerplatform.com", ".office.com", ".microsoft.com"];

/** Teams webhooks live on Microsoft hosts only; refuse anything else (SSRF guard). */
export const assertTeamsWebhook = (url) => {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch {
    throw new HttpError(400, "That doesn't look like a URL");
  }
  const ok = parsed.protocol === "https:" && ALLOWED_SUFFIXES.some((s) => parsed.hostname === s.slice(1) || parsed.hostname.endsWith(s));
  if (!ok) throw new HttpError(400, "Use the webhook URL from your Teams channel's Workflows or Incoming Webhook connector.");
  return parsed.toString();
};

const card = ({ title, subtitle, detail, url }) => ({
  type: "message",
  attachments: [
    {
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          { type: "TextBlock", text: subtitle, weight: "Bolder", wrap: true },
          { type: "TextBlock", text: title, size: "Medium", wrap: true },
          ...(detail ? [{ type: "TextBlock", text: detail, isSubtle: true, wrap: true, spacing: "None" }] : []),
        ],
        ...(url ? { actions: [{ type: "Action.OpenUrl", title: "Open in PlanCrest", url }] } : {}),
      },
    },
  ],
});

export const postToTeams = async (connector, message) => {
  const payload = typeof message === "string" ? card({ title: message, subtitle: "PlanCrest" }) : card(message);
  await call({ method: "POST", url: assertTeamsWebhook(connector.config.webhookUrl), data: payload });
};

export const validateTeamsWebhook = async ({ webhookUrl }) => {
  const url = assertTeamsWebhook(webhookUrl);
  await call({ method: "POST", url, data: card({ title: "PlanCrest is now connected to this channel.", subtitle: "Connected", detail: "You'll see task updates here." }) });
  return { config: { webhookUrl: url }, account: { name: "Teams channel" }, name: "Microsoft Teams" };
};

export const teamsActions = {
  async test(ctx) {
    await postToTeams(ctx.connector, { title: "If you can read this, notifications are working.", subtitle: "PlanCrest test message" });
    return { sent: true };
  },

  async post(ctx, { text }) {
    if (!String(text || "").trim()) throw new HttpError(400, "Write a message first");
    await postToTeams(ctx.connector, String(text).slice(0, 3000));
    return { sent: true };
  },
};
