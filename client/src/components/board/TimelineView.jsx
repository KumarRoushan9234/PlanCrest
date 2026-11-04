import { useMemo } from "react";
import { STATUS_META, PRIORITY_META, EmptyState, formatDate } from "../ui";
import { CalendarRange } from "lucide-react";

const DAY = 86400000;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/** Gantt-style bars from each task's start date to its due date. */
export default function TimelineView({ tasks, onOpen }) {
  const { rows, unscheduled, min, span, ticks } = useMemo(() => {
    const scheduled = tasks
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => {
        const end = startOfDay(t.dueDate || t.startDate);
        const start = Math.min(startOfDay(t.startDate || t.dueDate), end);
        return { task: t, start, end: end + DAY };
      })
      .sort((a, b) => a.start - b.start);
    if (!scheduled.length) return { rows: [], unscheduled: tasks, min: 0, span: 1, ticks: [] };

    const lo = Math.min(...scheduled.map((r) => r.start), startOfDay(Date.now())) - DAY * 2;
    const hi = Math.max(...scheduled.map((r) => r.end), startOfDay(Date.now())) + DAY * 2;
    const total = hi - lo;
    const step = total > 90 * DAY ? 30 * DAY : total > 30 * DAY ? 7 * DAY : DAY;
    const marks = [];
    for (let t = startOfDay(lo); t <= hi; t += step) marks.push(t);
    return { rows: scheduled, unscheduled: tasks.filter((t) => !t.startDate && !t.dueDate), min: lo, span: total, ticks: marks };
  }, [tasks]);

  if (!rows.length) {
    return <EmptyState icon={CalendarRange} title="Nothing scheduled" />;
  }

  const pct = (t) => ((t - min) / span) * 100;
  const todayPct = pct(startOfDay(Date.now()));

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", overflowX: "auto" }}>
      <div style={{ minWidth: 720, position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--dim)" }}>
          <div style={{ padding: "8px 12px" }}>Task</div>
          <div style={{ position: "relative", height: 30 }}>
            {ticks.map((t) => (
              <span key={t} style={{ position: "absolute", left: `${pct(t)}%`, top: 8, whiteSpace: "nowrap", transform: "translateX(-50%)" }}>{formatDate(t, { month: "short", day: "numeric" })}</span>
            ))}
          </div>
        </div>
        {rows.map(({ task, start, end }) => {
          const done = task.status === "done";
          const overdue = !done && task.dueDate && end < Date.now();
          return (
            <div key={task._id} style={{ display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
              <button onClick={() => onOpen(task)} className="pc-row" style={{ textAlign: "left", padding: "8px 12px", minWidth: 0 }}>
                <span className="grow" style={{ minWidth: 0 }}><b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{task.title}</b><small>{task.taskKey}</small></span>
              </button>
              <div style={{ position: "relative", height: 34 }}>
                {ticks.map((t) => <span key={t} style={{ position: "absolute", left: `${pct(t)}%`, top: 0, bottom: 0, borderLeft: "1px solid var(--line)", opacity: 0.5 }} />)}
                <span style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, borderLeft: "1px dashed var(--red, #e5675f)" }} />
                <button
                  onClick={() => onOpen(task)}
                  title={`${task.title} · ${STATUS_META[task.status]?.label || task.status} · ${PRIORITY_META[task.priority]?.label || ""}`}
                  style={{
                    position: "absolute",
                    left: `${pct(start)}%`,
                    width: `${Math.max(1.2, ((end - start) / span) * 100)}%`,
                    top: 8,
                    height: 18,
                    borderRadius: 4,
                    border: 0,
                    cursor: "pointer",
                    background: done ? "var(--green, #3fb97f)" : overdue ? "var(--red, #e5675f)" : "var(--blue, #4d8dff)",
                    opacity: done ? 0.65 : 1,
                  }}
                  aria-label={`${task.title}, ${formatDate(start, { month: "short", day: "numeric" })} to ${formatDate(end - DAY, { month: "short", day: "numeric" })}`}
                />
              </div>
            </div>
          );
        })}
        {unscheduled.length > 0 && <div className="pc-dim" style={{ padding: "8px 12px", fontSize: 12 }}>{unscheduled.length} task{unscheduled.length === 1 ? "" : "s"} without dates aren't shown.</div>}
      </div>
    </div>
  );
}
