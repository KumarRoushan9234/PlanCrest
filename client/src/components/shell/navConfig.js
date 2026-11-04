import { CalendarDays, CheckSquare, FileText, FolderKanban, LayoutDashboard, MessageSquare, Plug, Sparkles, Target, Users } from "lucide-react";

/** Sidebar: one flat list. `match` decides when an item shows as active. */
export const NAV = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My work", to: "/dashboard/tasks", icon: CheckSquare },
  { label: "Projects", to: "/projects", icon: FolderKanban, match: ["/projects", "/project/"] },
  { label: "Calendar", to: "/calendar", icon: CalendarDays, match: ["/calendar", "/dashboard/calendar"] },
  { label: "Chat", to: "/chat", icon: MessageSquare, badge: "chat" },
  { label: "Documents", to: "/documents", icon: FileText },
  { label: "Goals", to: "/goals", icon: Target },
  { label: "Team", to: "/dashboard/team", icon: Users, match: ["/dashboard/team", "/workload", "/timesheet", "/dashboard/activity"] },
  { label: "AI", to: "/ai-mode", icon: Sparkles },
  { label: "Integrations", to: "/integrations", icon: Plug, match: ["/integrations"] },
];

/** The four views that live under Team. */
export const TEAM_TABS = [
  { label: "Members", to: "/dashboard/team" },
  { label: "Workload", to: "/workload" },
  { label: "Timesheet", to: "/timesheet" },
  { label: "Activity", to: "/dashboard/activity" },
];

export const isActive = (item, pathname) => {
  if (item.match) return item.match.some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`));
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};
