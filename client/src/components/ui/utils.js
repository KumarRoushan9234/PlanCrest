// Small helpers shared by the ui primitives and pages.

export const cn = (...parts) => parts.filter(Boolean).join(" ");

export const initials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** Users store the photo as `avatar.url`, `avatar` (string) or `picture`. */
export const avatarUrl = (user) => {
  if (!user) return null;
  const a = user.avatar;
  if (typeof a === "string" && a) return a;
  if (a?.url) return a.url;
  if (user.picture && user.picture !== "/avatar.png") return user.picture;
  return null;
};

export const timeAgo = (value) => {
  if (!value) return "never";
  const s = (Date.now() - new Date(value).getTime()) / 1000;
  if (s < 0) {
    const m = Math.ceil(-s / 60);
    return m < 60 ? `in ${m}m` : m < 1440 ? `in ${Math.round(m / 60)}h` : `in ${Math.round(m / 1440)}d`;
  }
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const formatDate = (value, opts = { month: "short", day: "numeric" }) =>
  value ? new Date(value).toLocaleDateString(undefined, opts) : "";

export const num = (x) => (x ?? 0).toLocaleString("en-US");

/** Pick a "nice" axis step for a chart whose max is `raw`. */
export const niceStep = (raw) => {
  const exp = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const f = raw / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
};

export const STATUS_META = {
  backlog: { label: "Backlog", color: "#6c7180" },
  todo: { label: "To do", color: "#9ea2ae" },
  in_progress: { label: "In progress", color: "#4d8dff" },
  in_review: { label: "In review", color: "#cfabff" },
  blocked: { label: "Blocked", color: "#e5675f" },
  done: { label: "Done", color: "#3fb97f" },
  cancelled: { label: "Cancelled", color: "#4b4f5c" },
};

export const PRIORITY_META = {
  low: { label: "Low", color: "#6c7180" },
  medium: { label: "Medium", color: "#e8a93a" },
  high: { label: "High", color: "#e5675f" },
};
