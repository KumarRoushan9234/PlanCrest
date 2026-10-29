import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { projectService, taskService } from "../../services";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { maskId } from "../../utils/idMasker";
import { Button, Field, Modal } from "../ui";

/** "New task" from anywhere: pick a project, name it, done. */
export default function QuickTaskModal({ open, onClose, projectId }) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ projectId: "", title: "", priority: "medium", dueDate: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !currentWorkspace?._id) return;
    projectService
      .getWorkspaceProjects(currentWorkspace._id)
      .then((r) => {
        const list = r?.data || [];
        setProjects(list);
        setForm((f) => ({ ...f, projectId: (projectId && list.some((p) => p._id === projectId) ? projectId : f.projectId) || list[0]?._id || "" }));
      })
      .catch(() => setProjects([]));
  }, [open, currentWorkspace?._id, projectId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId) return;
    setBusy(true);
    try {
      const res = await taskService.createTask(form.projectId, {
        title: form.title.trim(),
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      });
      toast.success(`Created ${res?.data?.taskKey ?? "task"}`);
      setForm((f) => ({ ...f, title: "", dueDate: "" }));
      onClose();
      if (res?.data?._id) navigate(`/project/${maskId(form.projectId)}/task/${maskId(res.data._id)}`);
    } catch (error) {
      toast.error(error?.error || "Couldn't create the task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!form.title.trim() || !form.projectId} onClick={submit}>Create task</Button>
        </>
      }
    >
      {projects.length === 0 ? (
        <p className="pc-muted" style={{ margin: 0 }}>Create a project first, then you can add tasks to it.</p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <Field label="Project">
            <select className="pc-select" value={form.projectId} onChange={set("projectId")}>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input className="pc-input" autoFocus value={form.title} onChange={set("title")} placeholder="What needs to be done?" maxLength={200} />
          </Field>
          <div className="pc-grid pc-cols-2">
            <Field label="Priority">
              <select className="pc-select" value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" className="pc-input" value={form.dueDate} onChange={set("dueDate")} />
            </Field>
          </div>
          <button type="submit" hidden />
        </form>
      )}
    </Modal>
  );
}
