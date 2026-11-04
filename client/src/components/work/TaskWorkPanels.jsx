import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, GitBranch, ListChecks, Pause, Play, Plus, Trash2, X } from "lucide-react";
import { productivityService, formatClock, formatDuration } from "../../services/productivityService";
import { taskService } from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import { maskId } from "../../utils/idMasker";
import { Avatar, Badge, Button, Card, CardHead, STATUS_META, timeAgo } from "../ui";

const message = (error, fallback) => error?.error || error?.message || fallback;

/** Start/stop timer, manual entries and the log for one task. */
export function TimeTracker({ taskId }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [manual, setManual] = useState({ open: false, minutes: "", description: "" });

  const load = useCallback(() => productivityService.getTaskTime(taskId).then((r) => setData(r.data)).catch(() => setData({ entries: [], totalSeconds: 0 })), [taskId]);
  useEffect(() => {
    load();
  }, [load]);

  const running = data?.entries.find((e) => e.isRunning && String(e.user?._id) === String(user?._id));
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = running ? (now - new Date(running.startTime)) / 1000 : 0;
  const total = (data?.totalSeconds || 0) + (running ? elapsed - Math.round((Date.now() - new Date(running.startTime)) / 1000) : 0);

  const toggle = async () => {
    try {
      if (running) await productivityService.stopTimer();
      else await productivityService.startTimer(taskId);
      window.dispatchEvent(new Event("pc:timer"));
      load();
    } catch (error) {
      toast.error(message(error, "Couldn't change the timer"));
    }
  };

  const logManual = async (e) => {
    e.preventDefault();
    const raw = manual.minutes.trim();
    // Accept "90", "1.5h" and "1h 30m"
    const h = /(\d+(?:\.\d+)?)\s*h/i.exec(raw);
    const m = /(\d+(?:\.\d+)?)\s*m/i.exec(raw);
    const minutes = h || m ? (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0) : Number(raw);
    try {
      await productivityService.logTime(taskId, { minutes, description: manual.description });
      setManual({ open: false, minutes: "", description: "" });
      load();
    } catch (error) {
      toast.error(message(error, "Couldn't log time"));
    }
  };

  const remove = async (entry) => {
    try {
      await productivityService.deleteTime(entry._id);
      load();
    } catch (error) {
      toast.error(message(error, "Couldn't delete the entry"));
    }
  };

  return (
    <Card>
      <CardHead icon={Clock} title="Time tracking">
        <Badge>{formatDuration(total)} total</Badge>
      </CardHead>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Button variant={running ? "danger" : "primary"} icon={running ? Pause : Play} onClick={toggle}>{running ? "Stop" : "Start timer"}</Button>
        {running && <span className="pc-mono" style={{ fontSize: 15 }}>{formatClock(elapsed)}</span>}
        <span style={{ flex: 1 }} />
        <Button size="sm" icon={Plus} onClick={() => setManual((m) => ({ ...m, open: !m.open }))}>Log time</Button>
      </div>

      {manual.open && (
        <form onSubmit={logManual} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input className="pc-input" style={{ width: 110 }} autoFocus placeholder="1h 30m" value={manual.minutes} onChange={(e) => setManual((m) => ({ ...m, minutes: e.target.value }))} aria-label="Duration" />
          <input className="pc-input" style={{ flex: 1, minWidth: 140 }} placeholder="What did you work on?" value={manual.description} onChange={(e) => setManual((m) => ({ ...m, description: e.target.value }))} aria-label="Description" />
          <Button type="submit" variant="primary" disabled={!manual.minutes.trim()}>Add</Button>
        </form>
      )}

      {data?.entries.filter((e) => !e.isRunning).length > 0 && (
        <ul className="pc-list" style={{ margin: "12px -8px 0" }}>
          {data.entries.filter((e) => !e.isRunning).slice(0, 8).map((entry) => (
            <li key={entry._id} className="pc-row" style={{ cursor: "default" }}>
              <Avatar user={entry.user} size="sm" />
              <span className="grow"><b>{formatDuration(entry.duration)}</b><small>{entry.description || (entry.isManual ? "Logged manually" : "Timer")} · {timeAgo(entry.startTime)}</small></span>
              {String(entry.user?._id) === String(user?._id) && <button className="pc-btn ghost icon sm" onClick={() => remove(entry)} aria-label="Delete entry"><Trash2 size={13} /></button>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** "Waiting on" and "Blocking" relationships between tasks of the same project. */
export function Dependencies({ taskId, projectId, onChanged }) {
  const [deps, setDeps] = useState(null);
  const [choices, setChoices] = useState(null);
  const [pick, setPick] = useState("");

  const load = useCallback(() => productivityService.getDependencies(taskId).then((r) => setDeps(r.data)).catch(() => setDeps({ blockedBy: [], blocking: [] })), [taskId]);
  useEffect(() => {
    load();
  }, [load]);

  const openPicker = async () => {
    if (choices) return setChoices(null);
    try {
      const res = await taskService.getProjectTasks(projectId);
      setChoices(res.data || []);
    } catch {
      setChoices([]);
    }
  };

  const taken = useMemo(() => new Set([taskId, ...(deps?.blockedBy || []).map((t) => t._id)]), [taskId, deps]);

  const add = async () => {
    if (!pick) return;
    try {
      await productivityService.addDependency(taskId, pick);
      setPick("");
      setChoices(null);
      load();
      onChanged?.();
    } catch (error) {
      toast.error(message(error, "Couldn't add the dependency"));
    }
  };

  const remove = async (other) => {
    await productivityService.removeDependency(taskId, other._id).catch((e) => toast.error(message(e, "Couldn't remove it")));
    load();
    onChanged?.();
  };

  const Row = ({ t, removable }) => (
    <li className="pc-row" style={{ cursor: "default" }}>
      <Link className="grow pc-link" to={`/project/${maskId(projectId)}/task/${maskId(t._id)}`}><b>{t.taskKey}</b> <small>{t.title}</small></Link>
      <Badge tone={t.status === "done" ? "green" : ""}>{STATUS_META[t.status]?.label || t.status}</Badge>
      {removable && <button className="pc-btn ghost icon sm" onClick={() => remove(t)} aria-label={`Remove ${t.taskKey}`}><X size={13} /></button>}
    </li>
  );

  const openBlockers = deps?.blockedBy.filter((t) => !["done", "cancelled"].includes(t.status)).length || 0;

  return (
    <Card>
      <CardHead icon={GitBranch} title="Dependencies">
        {openBlockers > 0 && <Badge tone="red">Blocked by {openBlockers}</Badge>}
        <Button size="sm" icon={Plus} onClick={openPicker}>Waiting on</Button>
      </CardHead>
      {choices && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="pc-select" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a task…</option>
            {choices.filter((t) => !taken.has(t._id)).map((t) => <option key={t._id} value={t._id}>{t.taskKey} · {t.title}</option>)}
          </select>
          <Button variant="primary" disabled={!pick} onClick={add}>Add</Button>
        </div>
      )}
      {deps && deps.blockedBy.length === 0 && deps.blocking.length === 0 && <p className="pc-muted" style={{ margin: 0 }}>No dependencies. Mark this task as waiting on another to stop it being completed too early.</p>}
      {deps?.blockedBy.length > 0 && (<><div className="pc-label">Waiting on</div><ul className="pc-list" style={{ margin: "4px -8px 8px" }}>{deps.blockedBy.map((t) => <Row key={t._id} t={t} removable />)}</ul></>)}
      {deps?.blocking.length > 0 && (<><div className="pc-label">Blocking</div><ul className="pc-list" style={{ margin: "4px -8px 0" }}>{deps.blocking.map((t) => <Row key={t._id} t={t} />)}</ul></>)}
    </Card>
  );
}

/** Make a task come back after it's completed. */
export function RepeatSetting({ task, onChanged }) {
  const [frequency, setFrequency] = useState(task.recurrence?.frequency || "none");
  const [interval, setIntervalValue] = useState(task.recurrence?.interval || 1);

  const save = async (nextFrequency, nextInterval) => {
    try {
      await productivityService.setRecurrence(task._id, { frequency: nextFrequency, interval: nextInterval });
      onChanged?.();
    } catch (error) {
      toast.error(message(error, "Couldn't save the repeat setting"));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {frequency !== "none" && (
        <>
          <span className="pc-dim">every</span>
          <input type="number" min={1} max={365} className="pc-input" style={{ width: 56, height: 30 }} value={interval} aria-label="Repeat interval"
            onChange={(e) => setIntervalValue(e.target.value)} onBlur={() => save(frequency, Math.max(1, Number(interval) || 1))} />
        </>
      )}
      <select className="pc-select" style={{ height: 30 }} value={frequency} aria-label="Repeat"
        onChange={(e) => { setFrequency(e.target.value); save(e.target.value, Math.max(1, Number(interval) || 1)); }}>
        <option value="none">Doesn't repeat</option>
        <option value="daily">{Number(interval) === 1 ? "day" : "days"}</option>
        <option value="weekly">{Number(interval) === 1 ? "week" : "weeks"}</option>
        <option value="monthly">{Number(interval) === 1 ? "month" : "months"}</option>
      </select>
    </div>
  );
}

/** Per-project custom fields, edited on each task. */
export function CustomFields({ task, project, onChanged }) {
  const defs = project?.customFieldDefs || [];
  const initial = useMemo(() => {
    const raw = task.customFields || {};
    return raw instanceof Map ? Object.fromEntries(raw) : raw;
  }, [task.customFields]);
  const [values, setValues] = useState(initial);
  useEffect(() => setValues(initial), [initial]);
  if (defs.length === 0) return null;

  const save = async (key, value) => {
    try {
      await productivityService.setCustomValues(task._id, { [key]: value });
      onChanged?.();
    } catch (error) {
      toast.error(message(error, "Couldn't save the field"));
    }
  };

  return (
    <Card>
      <CardHead icon={ListChecks} title="Custom fields" />
      <div style={{ display: "grid", gap: 8 }}>
        {defs.map((d) => {
          const value = values[d.key] ?? (d.type === "checkbox" ? false : "");
          const set = (v, commit = true) => {
            setValues((s) => ({ ...s, [d.key]: v }));
            if (commit) save(d.key, v);
          };
          return (
            <div key={d.key} style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", alignItems: "center", gap: 10 }}>
              <span className="pc-dim" style={{ fontSize: 12.5 }} title={d.name}>{d.name}</span>
              {d.type === "checkbox" ? (
                <label className="pc-check"><input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} /> Yes</label>
              ) : d.type === "select" ? (
                <select className="pc-select" style={{ height: 30 }} value={value} onChange={(e) => set(e.target.value)}>
                  <option value="">—</option>
                  {d.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className="pc-input" style={{ height: 30 }} type={d.type === "number" ? "number" : d.type === "date" ? "date" : d.type === "url" ? "url" : "text"}
                  value={d.type === "date" && value ? String(value).slice(0, 10) : value}
                  onChange={(e) => set(e.target.value, d.type === "date")} onBlur={(e) => d.type !== "date" && save(d.key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
