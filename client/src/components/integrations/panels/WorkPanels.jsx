import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, Download, ExternalLink, Hash, Lock, Send } from "lucide-react";
import { integrationsApi } from "../../../services/integrationsApi";
import { Badge, Button, Card, CardHead, EmptyState, Field, Skeleton } from "../../ui";
import { ErrorLine, ProjectSelect, ReconnectBanner, useAsync, useConnectorActions } from "../panelKit";

// ── Slack + Teams share notification settings ───────────────────────────────

const EVENTS = [
  ["taskCreated", "A task is created", true],
  ["taskCompleted", "A task is completed", true],
  ["taskAssigned", "A task is assigned to someone", false],
  ["commentAdded", "Someone comments on a task", false],
];

function NotifyCard({ connector, run, onChanged, children }) {
  const notify = connector.settings.options?.notify || {};
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(null);

  const save = async (settings) => {
    await integrationsApi.update(connector._id, { settings }).catch((e) => toast.error(e.error));
    onChanged();
  };

  const act = async (kind) => {
    setBusy(kind);
    try {
      await run(kind === "test" ? "test" : "post", kind === "test" ? {} : { text });
      toast.success(kind === "test" ? "Test message sent" : "Message sent");
      if (kind === "post") setText("");
    } catch {
      /* toast already shown */
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Card>
        <CardHead icon={Bell} title="Notifications">
          <Button size="sm" icon={Send} loading={busy === "test"} onClick={() => act("test")}>Send test message</Button>
        </CardHead>
        {children}
        <label className="pc-check" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={connector.settings.notifications !== false} onChange={(e) => save({ notifications: e.target.checked })} />
          Send PlanCrest updates to {connector.type === "slack" ? "Slack" : "Teams"}
        </label>
        <div style={{ display: "grid", gap: 8, opacity: connector.settings.notifications === false ? 0.5 : 1 }}>
          <span className="pc-label">Notify when…</span>
          {EVENTS.map(([key, label, def]) => (
            <label key={key} className="pc-check">
              <input type="checkbox" checked={notify[key] ?? def} onChange={(e) => save({ options: { notify: { [key]: e.target.checked } } })} />
              {label}
            </label>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead icon={Send} title="Post a message" />
        <div style={{ display: "grid", gap: 10 }}>
          <textarea className="pc-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Share an update with the channel" maxLength={3000} />
          <div><Button variant="primary" icon={Send} disabled={!text.trim()} loading={busy === "post"} onClick={() => act("post")}>Post</Button></div>
        </div>
      </Card>
    </>
  );
}

export function SlackPanel({ connector, onChanged, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const channels = useAsync(() => run("channels", {}, { silent: true }), [connector._id]);
  const selected = connector.settings.options?.channel;

  const choose = async (id) => {
    const channel = channels.data.channels.find((c) => c.id === id);
    if (!channel) return;
    await run("set_channel", { id: channel.id, name: channel.name }).catch(() => {});
    onChanged();
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <NotifyCard connector={connector} run={run} onChanged={onChanged}>
        {channels.loading ? (
          <Skeleton h={36} />
        ) : channels.error ? (
          <ErrorLine error={channels.error} />
        ) : channels.data.mode === "webhook" ? (
          <p className="pc-muted" style={{ margin: "0 0 12px" }}>Using an incoming webhook, so messages go to the channel you picked when creating it.</p>
        ) : (
          <Field label="Channel">
            <select className="pc-select" value={selected?.id || ""} onChange={(e) => choose(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="">Choose a channel</option>
              {channels.data.channels.map((c) => (
                <option key={c.id} value={c.id}>#{c.name}{c.private ? " (private)" : ""}</option>
              ))}
            </select>
          </Field>
        )}
        {selected && channels.data?.mode !== "webhook" && <Badge tone="green"><Hash size={11} />{selected.name}</Badge>}
      </NotifyCard>
    </div>
  );
}

export function TeamsPanel({ connector, onChanged }) {
  const { run } = useConnectorActions(connector);
  return (
    <div className="pc-stack">
      <NotifyCard connector={connector} run={run} onChanged={onChanged}>
        <p className="pc-muted" style={{ margin: "0 0 12px" }}>Messages go to the channel your webhook belongs to. Send a test message to confirm it works.</p>
      </NotifyCard>
    </div>
  );
}

// ── Jira ────────────────────────────────────────────────────────────────────

export function JiraPanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const projects = useAsync(() => run("projects", {}, { silent: true }), [connector._id]);
  const [key, setKey] = useState("");
  const [jql, setJql] = useState("");
  const [target, setTarget] = useState("");
  const [importing, setImporting] = useState(false);
  const issues = useAsync(() => (key || jql ? run("issues", { projectKey: key, jql }, { silent: true }) : Promise.resolve(null)), [key, jql]);

  const importAll = async () => {
    if (!target) return toast.error("Choose the PlanCrest project to import into");
    setImporting(true);
    try {
      const r = await run("import_issues", { projectKey: key, jql, projectId: target });
      toast.success(`Imported ${r.created} issue${r.created === 1 ? "" : "s"}${r.skipped ? `, skipped ${r.skipped} already imported` : ""}`);
    } catch {
      /* toast already shown */
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card>
        <CardHead icon={Download} title="Import from Jira" />
        {projects.loading ? (
          <Skeleton h={80} />
        ) : projects.error ? (
          <ErrorLine error={projects.error} />
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="pc-grid pc-cols-2">
              <Field label="Jira project">
                <select className="pc-select" value={key} onChange={(e) => setKey(e.target.value)}>
                  <option value="">Choose a project</option>
                  {projects.data.projects.map((p) => <option key={p.id} value={p.key}>{p.name} ({p.key})</option>)}
                </select>
              </Field>
              <Field label="Import into PlanCrest project"><ProjectSelect value={target} onChange={setTarget} /></Field>
            </div>
            <Field label="Custom JQL (optional)"><input className="pc-input pc-mono" value={jql} onChange={(e) => setJql(e.target.value)} placeholder='assignee = currentUser() AND statusCategory != Done' /></Field>
            <div><Button variant="primary" icon={Download} loading={importing} disabled={!key && !jql} onClick={importAll}>Import issues as tasks</Button></div>
          </div>
        )}
      </Card>

      {(key || jql) && (
        <Card pad={false} flush>
          <CardHead icon={ExternalLink} title="Matching issues" pad />
          {issues.loading ? (
            <div style={{ padding: 16 }}><Skeleton h={140} /></div>
          ) : issues.error ? (
            <div style={{ padding: 16 }}><ErrorLine error={issues.error} /></div>
          ) : !issues.data?.issues.length ? (
            <EmptyState icon={ExternalLink} title="No issues match" />
          ) : (
            <div className="pc-table-wrap">
              <table className="pc-table">
                <thead><tr><th>Issue</th><th>Status</th><th>Priority</th><th>Assignee</th><th className="r" /></tr></thead>
                <tbody>
                  {issues.data.issues.map((i) => (
                    <tr key={i.id}>
                      <td><span className="pc-mono pc-dim">{i.key}</span> {i.summary}</td>
                      <td><Badge tone={i.statusCategory === "done" ? "green" : i.statusCategory === "indeterminate" ? "blue" : ""}>{i.status}</Badge></td>
                      <td className="pc-muted">{i.priority || "–"}</td>
                      <td className="pc-muted">{i.assignee || "Unassigned"}</td>
                      <td className="r"><a className="pc-btn ghost icon sm" href={i.url} target="_blank" rel="noreferrer" aria-label={`Open ${i.key} in Jira`}><ExternalLink size={13} /></a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <p className="pc-dim" style={{ margin: 0, fontSize: 12 }}><Lock size={11} style={{ display: "inline" }} /> To push a PlanCrest task to Jira, open the task and use "Send to…".</p>
    </div>
  );
}

// ── Trello ──────────────────────────────────────────────────────────────────

export function TrelloPanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const boards = useAsync(() => run("boards", {}, { silent: true }), [connector._id]);
  const [boardId, setBoardId] = useState("");
  const [listId, setListId] = useState("");
  const [target, setTarget] = useState("");
  const [importing, setImporting] = useState(false);
  const lists = useAsync(() => (boardId ? run("lists", { boardId }, { silent: true }) : Promise.resolve(null)), [boardId]);

  const importAll = async () => {
    if (!target) return toast.error("Choose the PlanCrest project to import into");
    setImporting(true);
    try {
      const r = await run("import_cards", { boardId, listId: listId || undefined, projectId: target });
      toast.success(`Imported ${r.created} card${r.created === 1 ? "" : "s"}${r.skipped ? `, skipped ${r.skipped} already imported` : ""}`);
    } catch {
      /* toast already shown */
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card>
        <CardHead icon={Download} title="Import from Trello" />
        {boards.loading ? (
          <Skeleton h={120} />
        ) : boards.error ? (
          <ErrorLine error={boards.error} />
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="pc-grid pc-cols-2">
              <Field label="Trello board">
                <select className="pc-select" value={boardId} onChange={(e) => { setBoardId(e.target.value); setListId(""); }}>
                  <option value="">Choose a board</option>
                  {boards.data.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="List (optional)">
                <select className="pc-select" value={listId} onChange={(e) => setListId(e.target.value)} disabled={!boardId}>
                  <option value="">All lists</option>
                  {lists.data?.lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Import into PlanCrest project"><ProjectSelect value={target} onChange={setTarget} /></Field>
            <div><Button variant="primary" icon={Download} loading={importing} disabled={!boardId} onClick={importAll}>Import cards as tasks</Button></div>
          </div>
        )}
      </Card>
      <p className="pc-dim" style={{ margin: 0, fontSize: 12 }}>Imported cards are not duplicated if you import again. To push a PlanCrest task to a Trello list, open the task and use "Send to…".</p>
    </div>
  );
}
