import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Square } from "lucide-react";
import { productivityService, formatClock } from "../../services/productivityService";
import { maskId } from "../../utils/idMasker";

/** Shows the running task timer anywhere in the app, with a one-click stop. */
export default function TimerChip() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(() => productivityService.getRunningTimer().then((r) => setEntry(r.data)).catch(() => setEntry(null)), []);

  useEffect(() => {
    refresh();
    window.addEventListener("pc:timer", refresh);
    return () => window.removeEventListener("pc:timer", refresh);
  }, [refresh]);

  useEffect(() => {
    if (!entry) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [entry]);

  if (!entry) return null;

  const stop = async (e) => {
    e.stopPropagation();
    await productivityService.stopTimer().catch(() => {});
    window.dispatchEvent(new Event("pc:timer"));
  };
  const task = entry.task;

  return (
    <button
      className="pc-btn sm"
      style={{ gap: 8 }}
      onClick={() => task && navigate(`/project/${maskId(task.project)}/task/${maskId(task._id)}`)}
      title={task ? `Timing ${task.taskKey}: ${task.title}` : "Timer running"}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red, #e5675f)" }} aria-hidden />
      <span className="pc-mono">{formatClock((now - new Date(entry.startTime)) / 1000)}</span>
      <span role="button" tabIndex={0} aria-label="Stop timer" onClick={stop} onKeyDown={(e) => e.key === "Enter" && stop(e)} style={{ display: "inline-flex" }}>
        <Square size={12} />
      </span>
    </button>
  );
}
