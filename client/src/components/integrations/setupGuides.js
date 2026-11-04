/** Plain-language setup steps shown when a provider needs server configuration. */
export const SETUP_GUIDES = {
  google: {
    title: "Create a Google OAuth client",
    steps: [
      "Open Google Cloud Console → APIs & Services and create (or pick) a project.",
      "Enable the APIs you need: Google Calendar API, Google Drive API, Gmail API.",
      "Configure the OAuth consent screen, then create an OAuth client ID of type “Web application”.",
      "Add the redirect URI shown below under “Authorized redirect URIs”.",
      "Copy the client ID and secret into server/.env as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the server.",
    ],
  },
  github: {
    title: "Create a GitHub OAuth App",
    steps: [
      "Open GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.",
      "Set the callback URL to the redirect URI shown below.",
      "Generate a client secret and copy both values into server/.env as GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      "Restart the server. For live webhooks, also set API_PUBLIC_URL to an address GitHub can reach.",
    ],
  },
  slack: {
    title: "Create a Slack app (or use a webhook)",
    steps: [
      "Easiest: create an Incoming Webhook in Slack and paste its URL under “Use a webhook URL”. No server setup needed.",
      "For the full app: create a Slack app at api.slack.com/apps and add the bot scopes chat:write, chat:write.public, channels:read and groups:read.",
      "Add the redirect URL shown below, then put the client ID and secret in server/.env as SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.",
    ],
  },
};

export const GUIDE_FOR = { google_calendar: "google", google_drive: "google", google_meet: "google", gmail: "google", github: "github", slack: "slack" };
