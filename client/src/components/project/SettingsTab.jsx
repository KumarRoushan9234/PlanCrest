import { useState } from "react";
import toast from "react-hot-toast";
import { Archive, Settings } from "lucide-react";
import { projectService } from "../../services/projectService";
import { Button, Card, CardHead, Field } from "../ui";

const COLORS = ["#2563eb", "#7c5ce0", "#3fb97f", "#e8a93a", "#e5675f", "#0ea5e9", "#ec4899", "#64748b"];

export default function SettingsTab({ project, onSaved, onArchived }) {
  const [form, setForm] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "active",
    privacy: project.privacy || "public",
    color: project.color || COLORS[0],
  });
  const [busy, setBusy] = useState(false);
  const dirty = ["name", "description", "status", "privacy", "color"].some((k) => (form[k] ?? "") !== (project[k] ?? ""));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("A project needs a name");
    setBusy(true);
    try {
      await projectService.updateProject(project._id, { ...form, name: form.name.trim() });
      toast.success("Project updated");
      onSaved();
    } catch (err) {
      toast.error(err?.error || "Couldn't save changes");
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!window.confirm(`Archive “${project.name}”? It will disappear from your projects list.`)) return;
    try {
      await projectService.deleteProject(project._id);
      toast.success("Project archived");
      onArchived();
    } catch (err) {
      toast.error(err?.error || "Couldn't archive the project");
    }
  };

  return (
    <div className="pc-stack" style={{ maxWidth: 720 }}>
      <Card>
        <CardHead icon={Settings} title="General" />
        <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
          <Field label="Name">
            <input className="pc-input" value={form.name} onChange={set("name")} maxLength={80} />
          </Field>
          <Field label="Description">
            <textarea className="pc-textarea" value={form.description} onChange={set("description")} maxLength={500} />
          </Field>
          <div className="pc-grid pc-cols-2">
            <Field label="Status">
              <select className="pc-select" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Visibility">
              <select className="pc-select" value={form.privacy} onChange={set("privacy")}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </Field>
          </div>
          <Field label="Color">
            <div className="pc-chips">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))} aria-label={`Color ${c}`} aria-pressed={form.color === c} style={{ width: 26, height: 26, borderRadius: 7, border: form.color === c ? "2px solid #fff" : "2px solid transparent", background: c, cursor: "pointer" }} />
              ))}
            </div>
          </Field>
          <div>
            <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead icon={Archive} title="Danger zone" tone="red" />
        <p className="pc-muted" style={{ margin: "0 0 12px", fontSize: 13 }}>Archiving hides the project and its board from everyone. Tasks and history are kept.</p>
        <Button variant="danger" icon={Archive} onClick={archive}>Archive project</Button>
      </Card>
    </div>
  );
}
