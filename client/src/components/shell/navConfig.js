import {
  Activity,
  CalendarDays,
  CheckSquare,
  FileText,
  Gauge,
  Clock,
  Target,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

/** Sidebar structure. `match` decides when an item shows as active. */
export const NAV = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
      { label: "My work", to: "/dashboard/tasks", icon: CheckSquare },
      { label: "Projects", to: "/projects", icon: FolderKanban, match: ["/projects", "/project/"] },
      { label: "Calendar", to: "/calendar", icon: CalendarDays, match: ["/calendar", "/dashboard/calendar"] },
    ],
  },
  {
    label: "Collaborate",
    items: [
      { label: "Chat", to: "/chat", icon: MessageSquare, badge: "chat" },
      { label: "Documents", to: "/documents", icon: FileText },
      { label: "Team", to: "/dashboard/team", icon: Users },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Goals", to: "/goals", icon: Target },
      { label: "Workload", to: "/workload", icon: Gauge },
      { label: "Timesheet", to: "/timesheet", icon: Clock },
      { label: "Activity", to: "/dashboard/activity", icon: Activity },
    ],
  },
  {
    label: "Automate",
    items: [
      { label: "AI Mode", to: "/ai-mode", icon: Sparkles },
      { label: "Integrations", to: "/integrations", icon: Plug, match: ["/integrations"] },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", to: "/profile-settings", icon: Settings }],
  },
];

export const isActive = (item, pathname) => {
  if (item.match) return item.match.some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`) || pathname.startsWith(m));
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};
