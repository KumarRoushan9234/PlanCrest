import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ListChecks, Plus, Trash2, Zap } from "lucide-react";
import { productivityService } from "../../services/productivityService";
import { PRIORITY_META, STATUS_META, Badge, Button, Card, CardHead, EmptyState, Field, Modal } from "../ui";

const TRIGGERS = {
  task_created: "A task is created",
  status_changed: "Status changes to…",
  priority_changed: "Priority changes to…",
  task_assigned: "A task is assigned",
};
const ACTIONS = {
  set_status: "Change status to…",
  set_priority: "Change priority to…",
  assign_user: "Assign to…",
  add_tag: "Add tag…",
  add_comment: "Post comment…",
  notify_user: "Notify…",
};

const describe = (rule, members) => {
  const val = (type, v) => (type.includes("status") ? STATUS_META[v]?.label : type.includes("priority") ? PRIORITY_META[v]?.label : v) || v;
  const who = (id) => members.find((m) => m._id === id)?.name || "someone";
  const when = `${TRIGGERS[rule.trigger.type].replace("…", " ").trim()} ${rule.trigger.value ? val(rule.trigger.type, rule.trigger.value) : ""}`;
  const then = rule.actions.map((a) => `${ACTIONS[a.type].replace("…", " ").trim()} ${["assign_user", "notify_user"].includes(a.type) ? who(a.value) : val(a.type, a.value)}`).join(", ");
  return `When ${when.toLowerCase()} → ${then.toLowerCase()}`;
};

function ActionValue({ action, onChange, members }) {
  if (action.type === "set_status")
    return <select className="pc-select" value={action.value} onChange={(e) => onChange(e.target.value)}><option value="">Status…</option>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>;
  if (action.type === "set_priority")
    return <select className="pc-select" value={action.value} onChange={(e) => onChange(e.target.value)}><option value="">Priority…</option>{Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>;
  if (action.type === "assign_user" || action.type === "notify_user")
    return <select className="pc-select" value={action.value} onChange={(e) => onChange(e.target.value)}><option value="">Person…</option>{members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select>;
  return <input className="pc-input" value={action.value} onChange={(e) => onChange(e.target.value)} placeholder={action.type === "add_tag" ? "tag" : "Comment text"} maxLength={500} />;
}

function RuleModal({ open, onClose, projectId, members, onSaved }) {
  const blank = { name: "", trigger: { type: "status_changed", value: "done" }, actions: [{ type: "add_comment", value: "" }] };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setForm(blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setAction = (i, patch) => setForm((f) => ({ ...f, actions: f.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await productivityService.createAutomation(projectId, form);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.error || "Couldn't save the automation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New automation" size="wide" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save} disabled={!form.name.trim()}>Create</Button></>}>
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <Field label="Name"><input className="pc-input" autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Close out finished work" maxLength={120} /></Field>
        <Field label="When">
          <div style={{ display: "flex", gap: 8 }}>
            <select className="pc-select" value={form.trigger.type} onChange={(e) => setForm((f) => ({ ...f, trigger: { type: e.target.value, value: "" } }))}>
              {Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {form.trigger.type === "status_changed" && <select className="pc-select" value={form.trigger.value} onChange={(e) => setForm((f) => ({ ...f, trigger: { ...f.trigger, value: e.target.value } }))}><option value="">Any status</option>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>}
            {form.trigger.type === "priority_changed" && <select className="pc-select" value={form.trigger.value} onChange={(e) => setForm((f) => ({ ...f, trigger: { ...f.trigger, value: e.target.value } }))}><option value="">Any priority</option>{Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>}
          </div>
        </Field>
        <div>
          <div className="pc-label" style={{ marginBottom: 8 }}>Then</div>
          <div style={{ display: "grid", gap: 8 }}>
            {form.actions.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <select className="pc-select" style={{ width: 190 }} value={a.type} onChange={(e) => setAction(i, { type: e.target.value, value: "" })}>
                  {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ActionValue action={a} members={members} onChange={(value) => setAction(i, { value })} />
                {form.actions.length > 1 && <button type="button" className="pc-btn ghost icon sm" onClick={() => setForm((f) => ({ ...f, actions: f.actions.filter((_, j) => j !== i) }))} aria-label="Remove action"><Trash2 size={13} /></button>}
              </div>
            ))}
            {form.actions.length < 5 && <div><Button size="sm" icon={Plus} onClick={() => setForm((f) => ({ ...f, actions: [...f.actions, { type: "add_tag", value: "" }] }))}>Add action</Button></div>}
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function CustomFieldsEditor({ project, onSaved }) {
  const [fields, setFields] = useState(project.customFieldDefs || []);
  const [busy, setBusy] = useState(false);
  const update = (i, patch) => setFields((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = async () => {
    setBusy(true);
    try {
      await productivityService.setCustomFieldDefs(project._id, fields.map((f) => ({ ...f, options: typeof f.options === "string" ? f.options.split(",") : f.options })));
      toast.success("Custom fields saved");
      onSaved();
    } catch (err) {
      toast.error(err?.error || "Couldn't save custom fields");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHead icon={ListChecks} title="Custom fields">
        <Button size="sm" icon={Plus} onClick={() => setFields((f) => [...f, { name: "", type: "text", options: [] }])}>Add field</Button>
      </CardHead>
      {fields.length === 0 ? (
        <p className="pc-muted" style={{ margin: 0 }}>Add fields like “Client”, “Story points” or “Environment” that appear on every task in this project.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {fields.map((f, i) => (
            <div key={f.key || i} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="pc-input" style={{ flex: 1, minWidth: 140 }} placeholder="Field name" value={f.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={60} />
              <select className="pc-select" style={{ width: 120 }} value={f.type} onChange={(e) => update(i, { type: e.target.value })}>
                {["text", "number", "date", "select", "checkbox", "url"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {f.type === "select" && <input className="pc-input" style={{ flex: 1, minWidth: 160 }} placeholder="Options, comma separated" value={Array.isArray(f.options) ? f.options.join(", ") : f.options} onChange={(e) => update(i, { options: e.target.value })} />}
              <button className="pc-btn ghost icon sm" onClick={() => setFields((all) => all.filter((_, j) => j !== i))} aria-label="Remove field"><Trash2 size={13} /></button>
            </div>
          ))}
          <div><Button variant="primary" loading={busy} onClick={save}>Save fields</Button></div>
        </div>
      )}
      {fields.length === 0 && project.customFieldDefs?.length > 0 && <div style={{ marginTop: 10 }}><Button variant="primary" loading={busy} onClick={save}>Save fields</Button></div>}
    </Card>
  );
}

/** Rules ("when X, do Y") and custom fields for a project. Admins edit; everyone can read. */
export default function AutomationsTab({ project, members, canManage, onProjectChanged }) {
  const [rules, setRules] = useState(null);
  const [modal, setModal] = useState(false);
  const load = useCallback(() => productivityService.getAutomations(project._id).then((r) => setRules(r.data || [])).catch(() => setRules([])), [project._id]);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (rule) => {
    await productivityService.updateAutomation(project._id, rule._id, { enabled: !rule.enabled }).catch((e) => toast.error(e?.error || "Couldn't update the rule"));
    load();
  };
  const remove = async (rule) => {
    if (!window.confirm(`Delete “${rule.name}”?`)) return;
    await productivityService.deleteAutomation(project._id, rule._id).catch((e) => toast.error(e?.error || "Couldn't delete the rule"));
    load();
  };

  return (
    <div className="pc-stack">
      <Card>
        <CardHead icon={Zap} title="Automations">
          {canManage && <Button size="sm" variant="primary" icon={Plus} onClick={() => setModal(true)}>New automation</Button>}
        </CardHead>
        {rules && rules.length === 0 ? (
          <EmptyState icon={Zap} title="No automations" />
        ) : (
          <ul className="pc-list" style={{ margin: "0 -8px" }}>
            {(rules || []).map((r) => (
              <li key={r._id} className="pc-row" style={{ cursor: "default" }}>
                <span className="grow"><b>{r.name}</b><small>{describe(r, members)} · ran {r.runCount} time{r.runCount === 1 ? "" : "s"}</small></span>
                <Badge tone={r.enabled ? "green" : ""}>{r.enabled ? "On" : "Off"}</Badge>
                {canManage && (
                  <>
                    <Button size="sm" onClick={() => toggle(r)}>{r.enabled ? "Turn off" : "Turn on"}</Button>
                    <button className="pc-btn ghost icon sm" onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Trash2 size={13} /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {canManage && <CustomFieldsEditor project={project} onSaved={onProjectChanged} />}
      <RuleModal open={modal} onClose={() => setModal(false)} projectId={project._id} members={members} onSaved={load} />
    </div>
  );
}
