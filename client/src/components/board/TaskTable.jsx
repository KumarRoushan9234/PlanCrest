import { AvatarStack, Badge, PRIORITY_META, STATUS_META, formatDate } from "../ui";

/** Sortable-by-nothing, dense task list with an inline status picker. */
export default function TaskTable({ tasks, onOpen, onStatus, showProject = false }) {
  return (
    <div className="pc-table-wrap">
      <table className="pc-table">
        <thead>
          <tr>
            <th>Task</th>
            {showProject && <th>Project</th>}
            <th>Status</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Assignees</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t._id} className="click" onClick={() => onOpen(t)}>
              <td>
                {t.taskKey && <span className="pc-mono pc-dim" style={{ marginRight: 8 }}>{t.taskKey}</span>}
                {t.title}
              </td>
              {showProject && <td className="pc-muted">{t.project?.name}</td>}
              <td onClick={(e) => e.stopPropagation()}>
                <select className="pc-select" style={{ width: 130, height: 28 }} value={t.status} onChange={(e) => onStatus(t, e.target.value)} aria-label={`Status of ${t.title}`}>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <span className="pc-dot" style={{ background: PRIORITY_META[t.priority]?.color }} />
                  {PRIORITY_META[t.priority]?.label}
                </span>
              </td>
              <td>
                {t.dueDate ? (
                  <Badge tone={new Date(t.dueDate) < new Date() && t.status !== "done" ? "red" : ""}>{formatDate(t.dueDate)}</Badge>
                ) : (
                  <span className="pc-dim">None</span>
                )}
              </td>
              <td><AvatarStack users={t.assignees || []} max={3} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
