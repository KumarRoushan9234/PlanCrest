/**
 * Everything PlanCrest can connect to. This list drives the integrations catalog,
 * the connect flows, and which setup instructions the UI shows.
 *
 *  auth:  "oauth"       user is redirected to the provider and back
 *         "credentials" user pastes an API token / site (validated on connect)
 *         "webhook"     user pastes an incoming-webhook URL
 *         "derived"     no connection of its own; uses another provider's connection
 *  scope: "personal"  belongs to the person who connected it (their Google account)
 *         "workspace" shared by the workspace, managed by owners and admins
 */

export const CATEGORIES = [
  { id: "google", name: "Google Workspace", description: "Calendar, Drive, Meet and Gmail" },
  { id: "code", name: "Source control", description: "Repositories, issues and pull requests" },
  { id: "chat", name: "Communication", description: "Send PlanCrest updates to your team chat" },
  { id: "cicd", name: "CI/CD & DevOps", description: "Watch builds and deployments" },
  { id: "pm", name: "Project management", description: "Move work between tools" },
];

export const PROVIDERS = {
  google_calendar: {
    id: "google_calendar",
    name: "Google Calendar",
    category: "google",
    description: "Two-way sync between PlanCrest events and your Google calendars.",
    auth: "oauth",
    scope: "personal",
    oauthGroup: "google",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    scopes: ["https://www.googleapis.com/auth/calendar"],
    features: ["Import events into your workspace calendar", "Push PlanCrest events to Google", "Choose which calendar to use"],
  },
  google_drive: {
    id: "google_drive",
    name: "Google Drive",
    category: "google",
    description: "Browse Drive and attach files to your workspace documents.",
    auth: "oauth",
    scope: "personal",
    oauthGroup: "google",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    features: ["Search and browse your Drive", "Link Drive files as workspace documents", "Files open in Drive, nothing is copied"],
  },
  google_meet: {
    id: "google_meet",
    name: "Google Meet",
    category: "google",
    description: "Create meeting links and schedule them on your calendar.",
    auth: "oauth",
    scope: "personal",
    oauthGroup: "google",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
    features: ["One-click Meet links", "Invite teammates by email", "Meetings appear in PlanCrest and Google Calendar"],
  },
  gmail: {
    id: "gmail",
    name: "Gmail",
    category: "google",
    description: "Turn emails into tasks and send mail from PlanCrest.",
    auth: "oauth",
    scope: "personal",
    oauthGroup: "google",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"],
    features: ["See recent mail", "Create a task from any email", "Send email without leaving PlanCrest"],
  },
  github: {
    id: "github",
    name: "GitHub",
    category: "code",
    description: "Link repositories, sync issues to tasks and follow pull requests.",
    auth: "oauth",
    scope: "personal",
    oauthGroup: "github",
    env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    scopes: ["repo", "read:user", "user:email", "workflow"],
    features: ["Import issues as tasks, create issues from tasks", "Pull requests and commits per repository", "Webhooks for live activity and auto-linking by task key"],
  },
  slack: {
    id: "slack",
    name: "Slack",
    category: "chat",
    description: "Post task and project updates to a Slack channel.",
    auth: "oauth",
    altAuth: "webhook",
    scope: "workspace",
    oauthGroup: "slack",
    env: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
    scopes: ["chat:write", "chat:write.public", "channels:read", "groups:read"],
    features: ["Notify a channel when tasks are created, assigned or completed", "Comment notifications", "Or use a simple incoming-webhook URL, no app needed"],
    webhookHint: "https://hooks.slack.com/services/…",
  },
  microsoft_teams: {
    id: "microsoft_teams",
    name: "Microsoft Teams",
    category: "chat",
    description: "Post updates to a Teams channel through a workflow webhook.",
    auth: "webhook",
    scope: "workspace",
    env: [],
    features: ["Task and project notifications in a channel", "Adaptive cards with a link back to PlanCrest", "No app registration required"],
    webhookHint: "https://…webhook.office.com/… or a Power Automate workflow URL",
  },
  github_actions: {
    id: "github_actions",
    name: "GitHub Actions",
    category: "cicd",
    description: "Watch workflow runs, re-run failures and see build health per repository.",
    auth: "derived",
    derivedFrom: "github",
    scope: "personal",
    env: [],
    features: ["Live workflow run status", "Re-run or cancel runs", "Failed runs raise an in-app notification"],
  },
  jira: {
    id: "jira",
    name: "Jira",
    category: "pm",
    description: "Import Jira issues as tasks and create issues from tasks.",
    auth: "credentials",
    scope: "workspace",
    env: [],
    fields: [
      { key: "site", label: "Jira site", placeholder: "your-team.atlassian.net" },
      { key: "email", label: "Account email", placeholder: "you@company.com" },
      { key: "token", label: "API token", placeholder: "Create one at id.atlassian.com", secret: true },
    ],
    features: ["Import issues from any project or JQL query", "Create a Jira issue from a PlanCrest task", "Status maps to your board columns"],
    help: "Create an API token at id.atlassian.com/manage-profile/security/api-tokens.",
  },
  trello: {
    id: "trello",
    name: "Trello",
    category: "pm",
    description: "Import cards from Trello boards and push tasks out as cards.",
    auth: "credentials",
    scope: "workspace",
    env: [],
    fields: [
      { key: "apiKey", label: "API key", placeholder: "From trello.com/power-ups/admin", secret: true },
      { key: "token", label: "API token", placeholder: "Generated from the same page", secret: true },
    ],
    features: ["Import a whole board or a single list", "Create a Trello card from a PlanCrest task", "List names map to task status"],
    help: "Get your key and token at trello.com/power-ups/admin (create a Power-Up, then generate a token).",
  },
};

export const getProvider = (id) => PROVIDERS[id] || null;

export const missingEnv = (provider) => (provider.env || []).filter((key) => !process.env[key]);

export const isConfigured = (provider) => missingEnv(provider).length === 0;

/** Public base URL of this API, used to build OAuth redirect and webhook URLs. */
export const apiBaseUrl = () => (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/$/, "");

/** The redirect URI to register at the provider (one per OAuth group). */
export const redirectUri = (group) => `${apiBaseUrl()}/api/integrations/${group}/callback`;
