import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ExternalLink, Send } from "lucide-react";
import { integrationsApi } from "../../services/integrationsApi";
import { Button, Field, Modal, Skeleton } from "../ui";
import ProviderIcon from "./ProviderIcon";
import { useAsync, useConnectorActions } from "./panelKit";

const TARGETS = ["github", "jira", "trello"];

function Destination({ provider, connector, task, onDone }) {
  const { run } = useConnectorActions(connector);
  const [choice, setChoice] = useState({});
  const [issueType, setIssueType] = useState("Task");
  const [busy, setBusy] = useState(false);

  const repos = useAsync(() => (provider === "github" ? run("repos", {}, { silent: true }) : Promise.resolve(null)), [provider]);
  const projects = useAsync(() => (provider === "jira" ? run("projects", {}, { silent: true }) : Promise.resolve(null)), [provider]);
  const boards = useAsync(() => (provider === "trello" ? run("boards", {}, { silent: true }) : Promise.resolve(null)), [provider]);
  const lists = useAsync(() => (provider === "trello" && choice.board ? run("lists", { boardId: choice.board }, { silent: true }) : Promise.resolve(null)), [choice.board]);

  const send = async () => {
    setBusy(true);
    try {
      let result;
      if (provider === "github") result = await run("create_issue", { repo: choice.repo, taskId: task._id });
      if (provider === "jira") result = await run("create_issue", { projectKey: choice.project, taskId: task._id, issueType });
      if (provider === "trello") result = await run("create_card", { listId: choice.list, taskId: task._id });
      toast.success("Sent");
      onDone(result?.url);
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const ready = (provider === "github" && choice.repo) || (provider === "jira" && choice.project) || (provider === "trello" && choice.list);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {provider === "github" && (
        <Field label="Repository">
          {repos.loading ? <Skeleton h={34} /> : (
            <select className="pc-select" value={choice.repo || ""} onChange={(e) => setChoice({ repo: e.target.value })}>
              <option value="">Choose a repository</option>
              {repos.data?.repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
            </select>
          )}
        </Field>
      )}
      {provider === "jira" && (
        <>
          <Field label="Jira project">
            {projects.loading ? <Skeleton h={34} /> : (
              <select className="pc-select" value={choice.project || ""} onChange={(e) => setChoice({ project: e.target.value })}>
                <option value="">Choose a project</option>
                {projects.data?.projects.map((p) => <option key={p.id} value={p.key}>{p.name} ({p.key})</option>)}
              </select>
            )}
          </Field>
          <Field label="Issue type"><input className="pc-input" value={issueType} onChange={(e) => setIssueType(e.target.value)} /></Field>
        </>
      )}
      {provider === "trello" && (
        <>
          <Field label="Board">
            {boards.loading ? <Skeleton h={34} /> : (
              <select className="pc-select" value={choice.board || ""} onChange={(e) => setChoice({ board: e.target.value })}>
                <option value="">Choose a board</option>
                {boards.data?.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="List">
            <select className="pc-select" value={choice.list || ""} onChange={(e) => setChoice((c) => ({ ...c, list: e.target.value }))} disabled={!choice.board}>
              <option value="">Choose a list</option>
              {lists.data?.lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
        </>
      )}
      <div><Button variant="primary" icon={Send} loading={busy} disabled={!ready} onClick={send}>Send task</Button></div>
    </div>
  );
}

/** Push a PlanCrest task out to GitHub, Jira or Trello. */
export default function SendToModal({ open, onClose, task, workspaceId, onSent }) {
  const [catalog, setCatalog] = useState(null);
  const [provider, setProvider] = useState("");

  useEffect(() => {
    if (!open || !workspaceId) return;
    setProvider("");
    integrationsApi.catalog(workspaceId).then(setCatalog).catch(() => setCatalog({ providers: [] }));
  }, [open, workspaceId]);

  const available = (catalog?.providers || []).filter((p) => TARGETS.includes(p.id) && p.connections.length);
  const active = available.find((p) => p.id === provider);

  return (
    <Modal open={open} onClose={onClose} title="Send task to…">
      {!catalog ? (
        <Skeleton h={80} />
      ) : available.length === 0 ? (
        <p className="pc-muted" style={{ margin: 0 }}>
          Connect GitHub, Jira or Trello first, then you can send tasks there. <Link to="/integrations" onClick={onClose} className="pc-link">Open integrations</Link>
        </p>
      ) : (
        <>
          <div className="pc-chips">
            {available.map((p) => (
              <button key={p.id} className={`pc-chip ${provider === p.id ? "on" : ""}`} onClick={() => setProvider(p.id)}>
                <ProviderIcon id={p.id} size={18} /> {p.name}
              </button>
            ))}
          </div>
          {active && (
            <Destination
              key={active.id}
              provider={active.id}
              connector={active.connections[0]}
              task={task}
              onDone={(url) => {
                onSent?.();
                if (url) window.open(url, "_blank", "noopener");
                onClose();
              }}
            />
          )}
          {!active && <p className="pc-dim" style={{ margin: 0, fontSize: 12.5 }}><ExternalLink size={11} style={{ display: "inline" }} /> Pick a destination above.</p>}
        </>
      )}
    </Modal>
  );
}
