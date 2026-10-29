import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Plus, Target, Trash2 } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { productivityService } from "../services/productivityService";
import { taskService } from "../services";
import { Avatar, Badge, Button, Card, CardHead, EmptyState, Field, Modal, PageHead, Progress, Skeleton, formatDate } from "../components/ui";

const COLORS = ["#4d8dff", "#7c5ce0", "#3fb97f", "#e8a93a", "#e5675f", "#2dd4bf"];
const blankTarget = () => ({ name: "", type: "number", current: 0, target: 100, unit: "" });

function GoalModal({ open, onClose, goal, workspaceId, onSaved }) {
  const [form, setForm] = useState({ name: "", description: "", dueDate: "", color: COLORS[0], targets: [blankTarget()] });
  const [tasks, setTasks] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      goal
        ? { name: goal.name, description: goal.description || "", dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : "", color: goal.color || COLORS[0], targets: goal.targets.map(({ name, type, current, target, unit, task, done }) => ({ name, type, current, target, unit, task, done })) }
        : { name: "", description: "", dueDate: "", color: COLORS[0], targets: [blankTarget()] }
    );
    taskService.getWorkspaceTasks(workspaceId).then((r) => setTasks(r.data || [])).catch(() => setTasks([]));
  }, [open, goal, workspaceId]);

  const setTarget = (i, patch) => setForm((f) => ({ ...f, targets: f.targets.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Give the goal a name");
    setBusy(true);
    try {
      const body = { ...form, dueDate: form.dueDate || null, targets: form.targets.filter((t) => t.name.trim()) };
      if (goal) await productivityService.updateGoal(workspaceId, goal._id, body);
      else await productivityService.createGoal(workspaceId, body);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.error || "Couldn't save the goal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? "Edit goal" : "New goal"} size="wide" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{goal ? "Save" : "Create goal"}</Button></>}>
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <Field label="Name"><input className="pc-input lg" autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Launch v2" maxLength={150} /></Field>
        <Field label="Description"><textarea className="pc-textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <div className="pc-grid pc-cols-2">
          <Field label="Due date"><input type="date" className="pc-input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
          <Field label="Colour">
            <div style={{ display: "flex", gap: 6 }}>
              {COLORS.map((c) => <button type="button" key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} aria-label={c} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: form.color === c ? "2px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />)}
            </div>
          </Field>
        </div>
        <div>
          <div className="pc-label" style={{ marginBottom: 8 }}>Targets</div>
          <div style={{ display: "grid", gap: 8 }}>
            {form.targets.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <select className="pc-select" style={{ width: 120 }} value={t.type} onChange={(e) => setTarget(i, { type: e.target.value })} aria-label="Target type">
                  <option value="number">Number</option>
                  <option value="task">Task</option>
                  <option value="boolean">Yes / no</option>
                </select>
                <input className="pc-input" style={{ flex: 1, minWidth: 140 }} placeholder="Target name" value={t.name} onChange={(e) => setTarget(i, { name: e.target.value })} />
                {t.type === "number" && (
                  <>
                    <input type="number" className="pc-input" style={{ width: 80 }} value={t.current} onChange={(e) => setTarget(i, { current: e.target.value })} aria-label="Current" />
                    <span className="pc-dim">of</span>
                    <input type="number" className="pc-input" style={{ width: 80 }} value={t.target} onChange={(e) => setTarget(i, { target: e.target.value })} aria-label="Goal" />
                    <input className="pc-input" style={{ width: 70 }} placeholder="unit" value={t.unit} onChange={(e) => setTarget(i, { unit: e.target.value })} />
                  </>
                )}
                {t.type === "task" && (
                  <select className="pc-select" style={{ width: 200 }} value={t.task || ""} onChange={(e) => setTarget(i, { task: e.target.value })} aria-label="Linked task">
                    <option value="">Pick a task…</option>
                    {tasks.map((task) => <option key={task._id} value={task._id}>{task.taskKey} · {task.title}</option>)}
                  </select>
                )}
                {t.type === "boolean" && <label className="pc-check"><input type="checkbox" checked={t.done} onChange={(e) => setTarget(i, { done: e.target.checked })} /> Done</label>}
                <button type="button" className="pc-btn ghost icon sm" onClick={() => setForm((f) => ({ ...f, targets: f.targets.filter((_, j) => j !== i) }))} aria-label="Remove target"><Trash2 size={13} /></button>
              </div>
            ))}
            <div><Button size="sm" icon={Plus} onClick={() => setForm((f) => ({ ...f, targets: [...f.targets, blankTarget()] }))}>Add target</Button></div>
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function GoalsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?._id;
  const [goals, setGoals] = useState(null);
  const [modal, setModal] = useState({ open: false, goal: null });

  const load = useCallback(() => {
    if (!workspaceId) return;
    productivityService.getGoals(workspaceId).then((r) => setGoals(r.data || [])).catch(() => setGoals([]));
  }, [workspaceId]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (goal) => {
    if (!window.confirm(`Delete “${goal.name}”?`)) return;
    try {
      await productivityService.deleteGoal(workspaceId, goal._id);
      load();
    } catch (err) {
      toast.error(err?.error || "Couldn't delete the goal");
    }
  };

  // Quick progress update on a manual target without opening the editor
  const bump = async (goal, index, patch) => {
    const targets = goal.targets.map((t, i) => (i === index ? { ...t, ...patch } : t));
    try {
      await productivityService.updateGoal(workspaceId, goal._id, { targets });
      load();
    } catch (err) {
      toast.error(err?.error || "Couldn't update the target");
    }
  };

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Goals" sub="Track outcomes with numeric, task-based and checklist targets.">
          <Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, goal: null })}>New goal</Button>
        </PageHead>

        {goals === null ? (
          <Skeleton h={200} />
        ) : goals.length === 0 ? (
          <Card><EmptyState icon={Target} title="No goals yet" action={<Button variant="primary" icon={Plus} onClick={() => setModal({ open: true, goal: null })}>Create a goal</Button>}>Set a goal, add targets, and watch progress roll up as work gets done.</EmptyState></Card>
        ) : (
          <div className="pc-grid pc-cols-2">
            {goals.map((goal) => (
              <Card key={goal._id}>
                <CardHead icon={Target} title={goal.name}>
                  <Badge>{goal.progress}%</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setModal({ open: true, goal })}>Edit</Button>
                  <button className="pc-btn ghost icon sm" onClick={() => remove(goal)} aria-label={`Delete ${goal.name}`}><Trash2 size={13} /></button>
                </CardHead>
                <Progress value={goal.progress} />
                {goal.description && <p className="pc-muted" style={{ margin: "10px 0 0", fontSize: 12.5 }}>{goal.description}</p>}
                <ul className="pc-list" style={{ margin: "10px -8px 0" }}>
                  {goal.targets.map((t, i) => (
                    <li key={t._id || i} className="pc-row" style={{ cursor: "default" }}>
                      <span className="grow">
                        <b>{t.name}</b>
                        <small>
                          {t.type === "number" && `${t.current} / ${t.target} ${t.unit || ""}`}
                          {t.type === "task" && (t.linked ? `${t.linked.taskKey} · ${t.linked.status === "done" ? "done" : t.linked.status.replace("_", " ")}` : "Task removed")}
                          {t.type === "boolean" && (t.done ? "Done" : "Not done")}
                        </small>
                      </span>
                      {t.type === "number" && <input type="number" className="pc-input" style={{ width: 72, height: 28 }} defaultValue={t.current} aria-label={`${t.name} progress`} onBlur={(e) => Number(e.target.value) !== t.current && bump(goal, i, { current: Number(e.target.value) })} />}
                      {t.type === "boolean" && <button className="pc-btn sm" onClick={() => bump(goal, i, { done: !t.done })} aria-pressed={t.done}><Check size={13} /></button>}
                      {t.type === "task" && t.ratio === 1 && <Check size={14} style={{ color: "var(--green, #3fb97f)" }} />}
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }} className="pc-dim">
                  <Avatar user={goal.owner} size="sm" /> {goal.owner?.name}
                  {goal.dueDate && <span style={{ marginLeft: "auto" }}>Due {formatDate(goal.dueDate, { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <GoalModal open={modal.open} goal={modal.goal} workspaceId={workspaceId} onClose={() => setModal((m) => ({ ...m, open: false }))} onSaved={load} />
    </Layout>
  );
}
