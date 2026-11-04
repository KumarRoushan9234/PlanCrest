import { CalendarDays, Github, HardDrive, Mail, MessagesSquare, Slack, SquareKanban, Trello, Video, Workflow } from "lucide-react";

/** Icon + accent colour per integration, used by the hub and the detail pages. */
export const PROVIDER_META = {
  google_calendar: { icon: CalendarDays, color: "#4285f4" },
  google_drive: { icon: HardDrive, color: "#0f9d58" },
  google_meet: { icon: Video, color: "#00897b" },
  gmail: { icon: Mail, color: "#ea4335" },
  github: { icon: Github, color: "#8b949e" },
  github_actions: { icon: Workflow, color: "#2da44e" },
  slack: { icon: Slack, color: "#e01e5a" },
  microsoft_teams: { icon: MessagesSquare, color: "#6264a7" },
  jira: { icon: SquareKanban, color: "#2684ff" },
  trello: { icon: Trello, color: "#0079bf" },
};

/** The state shown on a provider card/header. */
export const providerState = (provider) => {
  if (provider.derivedFrom) {
    return provider.connections.length ? { label: "Ready", tone: "green" } : { label: "Needs GitHub", tone: "amber" };
  }
  const conn = provider.connections[0];
  if (conn?.status === "error") return { label: "Needs attention", tone: "red" };
  if (conn) return { label: "Connected", tone: "green" };
  if (provider.auth === "oauth" && !provider.configured) return { label: "Setup needed", tone: "amber" };
  return { label: "Not connected", tone: "" };
};
