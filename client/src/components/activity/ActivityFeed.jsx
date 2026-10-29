import { Avatar, Badge, STATUS_META, timeAgo } from "../ui";

const VERBS = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  archived: "archived",
  restored: "restored",
  assigned: "assigned",
  unassigned: "unassigned",
  moved: "moved",
  commented: "commented on",
  uploaded: "uploaded",
  invited: "invited someone to",
  joined: "joined",
  left: "left",
  completed: "completed",
};

const TYPE_LABEL = {
  Task: "task",
  Project: "project",
  Board: "board",
  Column: "column",
  Document: "document",
  ChatChannel: "channel",
  ChatMessage: "message",
  Comment: "comment",
  Workspace: "workspace",
  User: "member",
};

const dayLabel = (value) => {
  const d = new Date(value);
  const today = new Date().setHours(0, 0, 0, 0);
  const diff = Math.round((today - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
};

function Detail({ item }) {
  const status = item.changes?.status;
  if (status?.from && status?.to) {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ marginLeft: 6 }}>
        <Badge>{STATUS_META[status.from]?.label ?? status.from}</Badge>
        <span className="pc-dim">→</span>
        <Badge tone="blue">{STATUS_META[status.to]?.label ?? status.to}</Badge>
      </span>
    );
  }
  if (item.action === "assigned" && item.metadata?.assignee) {
    return <span className="pc-muted"> to {item.metadata.assignee}</span>;
  }
  return null;
}

/** Day-grouped timeline of ActivityLog entries. */
export default function ActivityFeed({ items, showProject = false }) {
  const groups = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {groups.map((g) => (
        <section key={g.label}>
          <div className="pc-dim" style={{ fontSize: 11.5, fontWeight: 500, margin: "0 0 6px 2px" }}>{g.label}</div>
          <ul className="pc-list" style={{ display: "grid", gap: 2 }}>
            {g.items.map((a) => (
              <li key={a._id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 4px" }}>
                <Avatar user={a.actor} size="sm" />
                <div style={{ minWidth: 0, flex: 1, fontSize: 13, lineHeight: 1.5 }}>
                  <b style={{ fontWeight: 600 }}>{a.actor?.name ?? "Someone"}</b>{" "}
                  <span className="pc-muted">{VERBS[a.action] ?? a.action}</span>{" "}
                  <span className="pc-muted">{TYPE_LABEL[a.targetType] ?? String(a.targetType || "").toLowerCase()}</span>{" "}
                  {a.targetName && <b style={{ fontWeight: 500 }}>“{a.targetName}”</b>}
                  <Detail item={a} />
                  {showProject && a.project?.name && (
                    <span className="pc-badge" style={{ marginLeft: 8 }}>{a.project.name}</span>
                  )}
                </div>
                <span className="pc-dim" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
