import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Ban, CircleDot, Download, ExternalLink, GitBranch, GitPullRequest, Lock, Play, RefreshCw, Search, Unlink, Webhook, Workflow } from "lucide-react";
import { integrationsApi } from "../../../services/integrationsApi";
import { useProject } from "../../../contexts/ProjectContext";
import { Badge, Button, Card, CardHead, EmptyState, Field, Skeleton, Tabs, formatDate, timeAgo } from "../../ui";
import { ErrorLine, ProjectSelect, ReconnectBanner, fmtDuration, useAsync, useConnectorActions } from "../panelKit";

const RepoSelect = ({ repos, value, onChange, placeholder = "Choose a repository" }) => (
  <select className="pc-select" style={{ maxWidth: 320 }} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Repository">
    <option value="">{placeholder}</option>
    {repos.map((r) => (
      <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
    ))}
  </select>
);

// ── Repositories tab ────────────────────────────────────────────────────────

function Repositories({ run, repos, reload }) {
  const { projects } = useProject();
  const [q, setQ] = useState("");
  const [choice, setChoice] = useState({});
  const list = repos.filter((r) => !q || r.fullName.toLowerCase().includes(q.toLowerCase()));
  const projectName = (id) => projects.find((p) => p._id === id)?.name;

  const link = async (repo) => {
    const projectId = choice[repo.fullName];
    if (!projectId) return toast.error("Choose a project to link this repository to");
    try {
      await run("link_repo", { fullName: repo.fullName, projectId });
      toast.success(`Linked ${repo.name}`);
      reload();
    } catch {
      /* toast already shown */
    }
  };

  const unlink = async (repo) => {
    await run("unlink_repo", { fullName: repo.fullName }).catch(() => {});
    reload();
  };

  return (
    <Card pad={false} flush>
      <CardHead icon={GitBranch} title="Repositories" pad>
        <label className="pc-search"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" /></label>
      </CardHead>
      {list.length === 0 ? (
        <EmptyState icon={GitBranch} title="No repositories found" />
      ) : (
        <ul className="pc-list">
          {list.map((r) => (
            <li key={r.fullName} className="pc-row" style={{ cursor: "default", padding: "10px 16px", borderTop: "1px solid var(--line)", borderRadius: 0 }}>
              <span className="grow">
                <b>{r.fullName} {r.private && <Lock size={11} style={{ display: "inline" }} />}</b>
                <small style={{ whiteSpace: "normal" }}>{[r.language, `${r.openIssues} open issues`, r.pushedAt && `pushed ${timeAgo(r.pushedAt)}`].filter(Boolean).join(" · ")}</small>
              </span>
              {r.linkedProject ? (
                <>
                  <Badge tone="green">Linked to {projectName(r.linkedProject) || "a project"}</Badge>
                  <Button size="sm" variant="ghost" icon={Unlink} onClick={() => unlink(r)}>Unlink</Button>
                </>
              ) : (
                <>
                  <ProjectSelect value={choice[r.fullName]} onChange={(v) => setChoice((c) => ({ ...c, [r.fullName]: v }))} />
                  <Button size="sm" variant="primary" onClick={() => link(r)}>Link</Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── Issues & pull requests tab ──────────────────────────────────────────────

function IssuesAndPulls({ run, repos }) {
  const linked = repos.filter((r) => r.linkedProject);
  const [repo, setRepo] = useState(linked[0]?.fullName || "");
  const [view, setView] = useState("issues");
  const [importing, setImporting] = useState(false);
  const data = useAsync(() => (repo ? run(view === "issues" ? "issues" : "pulls", { repo }, { silent: true }) : Promise.resolve(null)), [repo, view]);

  const importAll = async () => {
    setImporting(true);
    try {
      const r = await run("import_issues", { repo });
      toast.success(`Imported ${r.created} issue${r.created === 1 ? "" : "s"}${r.skipped ? `, skipped ${r.skipped} already imported` : ""}`);
      data.reload();
    } catch {
      /* toast already shown */
    } finally {
      setImporting(false);
    }
  };

  if (!linked.length) {
    return <Card><EmptyState icon={GitBranch} title="Link a repository first" /></Card>;
  }

  return (
    <Card pad={false} flush>
      <div className="pc-toolbar" style={{ padding: 12 }}>
        <RepoSelect repos={linked} value={repo} onChange={setRepo} />
        <div className="pc-seg">
          <button className={view === "issues" ? "on" : ""} onClick={() => setView("issues")}><CircleDot size={13} /> Issues</button>
          <button className={view === "pulls" ? "on" : ""} onClick={() => setView("pulls")}><GitPullRequest size={13} /> Pull requests</button>
        </div>
        <span style={{ flex: 1 }} />
        {view === "issues" && <Button variant="primary" size="sm" icon={Download} loading={importing} onClick={importAll} disabled={!repo}>Import open issues as tasks</Button>}
      </div>
      {data.loading ? (
        <div style={{ padding: 16 }}><Skeleton h={160} /></div>
      ) : data.error ? (
        <div style={{ padding: 16 }}><ErrorLine error={data.error} /></div>
      ) : view === "issues" ? (
        !data.data?.issues.length ? (
          <EmptyState icon={CircleDot} title="No open issues" />
        ) : (
          <div className="pc-table-wrap">
            <table className="pc-table">
              <thead><tr><th>Issue</th><th>Labels</th><th>Assignee</th><th>Opened</th><th className="r" /></tr></thead>
              <tbody>
                {data.data.issues.map((i) => (
                  <tr key={i.number}>
                    <td><span className="pc-mono pc-dim">#{i.number}</span> {i.title} {i.imported && <Badge tone="green">In PlanCrest</Badge>}</td>
                    <td>{i.labels.slice(0, 3).map((l) => <Badge key={l.name} className="mr-1">{l.name}</Badge>)}</td>
                    <td className="pc-muted">{i.assignee || "–"}</td>
                    <td className="pc-dim">{timeAgo(i.createdAt)}</td>
                    <td className="r"><a className="pc-btn ghost icon sm" href={i.url} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><ExternalLink size={13} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : !data.data?.pulls.length ? (
        <EmptyState icon={GitPullRequest} title="No open pull requests" />
      ) : (
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead><tr><th>Pull request</th><th>Branch</th><th>Author</th><th>Tasks</th><th>Updated</th><th className="r" /></tr></thead>
            <tbody>
              {data.data.pulls.map((p) => (
                <tr key={p.number}>
                  <td><span className="pc-mono pc-dim">#{p.number}</span> {p.title} {p.draft && <Badge>Draft</Badge>}</td>
                  <td className="pc-mono pc-muted">{p.branch}</td>
                  <td className="pc-muted">{p.author}</td>
                  <td>{p.taskKeys.length ? p.taskKeys.map((k) => <Badge key={k} tone="blue" className="mr-1">{k}</Badge>) : <span className="pc-dim">None</span>}</td>
                  <td className="pc-dim">{timeAgo(p.updatedAt)}</td>
                  <td className="r"><a className="pc-btn ghost icon sm" href={p.url} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><ExternalLink size={13} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Activity & automation tab ───────────────────────────────────────────────

function Automation({ connector, run, repos, onChanged }) {
  const linked = repos.filter((r) => r.linkedProject);
  const [repo, setRepo] = useState(linked[0]?.fullName || "");
  const [hooking, setHooking] = useState(false);
  const events = useAsync(() => run("events", {}, { silent: true }), [connector._id]);
  const sync = connector.settings.taskSync || {};

  const toggle = async (key, value) => {
    await integrationsApi.update(connector._id, { settings: { taskSync: { [key]: value } } }).catch((e) => toast.error(e.error));
    onChanged();
  };

  const enableWebhook = async () => {
    setHooking(true);
    try {
      const r = await run("setup_webhook", { repo });
      toast.success(r.publiclyReachable ? "Webhook enabled" : "Webhook created, but GitHub can't reach localhost. Set API_PUBLIC_URL to a public address.");
      onChanged();
      events.reload();
    } catch {
      /* toast already shown */
    } finally {
      setHooking(false);
    }
  };

  return (
    <div className="pc-stack">
      <Card>
        <CardHead icon={Webhook} title="Automation" />
        <div style={{ display: "grid", gap: 10 }}>
          <label className="pc-check"><input type="checkbox" checked={Boolean(sync.autoCreateFromIssues)} onChange={(e) => toggle("autoCreateFromIssues", e.target.checked)} /> Create a task whenever a new issue is opened</label>
          <label className="pc-check"><input type="checkbox" checked={sync.autoLinkPRs !== false} onChange={(e) => toggle("autoLinkPRs", e.target.checked)} /> Link pull requests to tasks mentioned by key (like WEB-12) in the title or branch</label>
          <label className="pc-check"><input type="checkbox" checked={Boolean(sync.autoCloseOnMerge)} onChange={(e) => toggle("autoCloseOnMerge", e.target.checked)} /> Mark a task done when its pull request is merged</label>
        </div>
        <div className="pc-divider" />
        <Field label="Live webhooks">
          <div className="pc-toolbar">
            <RepoSelect repos={linked} value={repo} onChange={setRepo} />
            <Button icon={Webhook} loading={hooking} disabled={!repo} onClick={enableWebhook}>Enable webhook</Button>
            {connector.settings.webhookActive && <Badge tone="green">Active</Badge>}
          </div>
        </Field>
      </Card>

      <Card pad={false} flush>
        <CardHead icon={Activity} title="Recent GitHub activity" pad>
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={events.reload} aria-label="Refresh" />
        </CardHead>
        {events.loading ? (
          <div style={{ padding: 16 }}><Skeleton h={100} /></div>
        ) : !events.data?.events.length ? (
          <EmptyState icon={Activity} title="No activity yet" />
        ) : (
          <ul className="pc-list" style={{ padding: "0 8px 8px" }}>
            {events.data.events.map((e) => (
              <li key={e._id} className="pc-row" style={{ cursor: "default" }}>
                <span className="grow"><b style={{ whiteSpace: "normal" }}>{e.title}</b><small>{e.type} · {timeAgo(e.createdAt)}</small></span>
                {e.url && <a className="pc-btn ghost icon sm" href={e.url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink size={13} /></a>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function GitHubPanel({ connector, onChanged, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const [tab, setTab] = useState("repos");
  const repos = useAsync(() => run("repos", {}, { silent: true }), [connector._id]);

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "repos", label: "Repositories", icon: <GitBranch size={14} /> }, { value: "issues", label: "Issues & PRs", icon: <GitPullRequest size={14} /> }, { value: "auto", label: "Activity & automation", icon: <Activity size={14} /> }]} />
      {repos.loading ? (
        <Skeleton h={260} />
      ) : repos.error ? (
        <ErrorLine error={repos.error} />
      ) : tab === "repos" ? (
        <Repositories run={run} repos={repos.data.repos} reload={() => { repos.reload(); onChanged(); }} />
      ) : tab === "issues" ? (
        <IssuesAndPulls run={run} repos={repos.data.repos} />
      ) : (
        <Automation connector={connector} run={run} repos={repos.data.repos} onChanged={onChanged} />
      )}
    </div>
  );
}

// ── GitHub Actions ──────────────────────────────────────────────────────────

const runStatus = (r) => {
  if (r.status !== "completed") return { label: r.status === "queued" ? "Queued" : "Running", tone: "blue" };
  return { success: { label: "Passed", tone: "green" }, failure: { label: "Failed", tone: "red" }, cancelled: { label: "Cancelled", tone: "" }, skipped: { label: "Skipped", tone: "" } }[r.conclusion] || { label: r.conclusion || "Done", tone: "" };
};

export function ActionsPanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const repos = useAsync(() => run("repos", {}, { silent: true }), [connector._id]);
  const [repo, setRepo] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [busyRun, setBusyRun] = useState(null);

  const ordered = useMemo(() => [...(repos.data?.repos || [])].sort((a, b) => Number(Boolean(b.linkedProject)) - Number(Boolean(a.linkedProject))), [repos.data]);
  useEffect(() => {
    if (!repo && ordered.length) setRepo(ordered[0].fullName);
  }, [ordered, repo]);

  const workflows = useAsync(() => (repo ? run("workflows", { repo }, { silent: true }) : Promise.resolve(null)), [repo]);
  const runs = useAsync(() => (repo ? run("workflow_runs", { repo, workflowId: workflowId || undefined }, { silent: true }) : Promise.resolve(null)), [repo, workflowId]);

  // Poll while something is running
  const active = runs.data?.runs.some((r) => r.status !== "completed");
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => runs.reload(), 12000);
    return () => clearInterval(id);
  }, [active, runs]);

  const act = async (r, action, label, params = {}) => {
    setBusyRun(r.id);
    try {
      await run(action, { repo, runId: r.id, ...params });
      toast.success(label);
      setTimeout(runs.reload, 1500);
    } catch {
      /* toast already shown */
    } finally {
      setBusyRun(null);
    }
  };

  const dispatch = async () => {
    try {
      const wf = workflows.data.workflows.find((w) => String(w.id) === String(workflowId));
      await run("dispatch_workflow", { repo, workflowId, ref: repos.data.repos.find((x) => x.fullName === repo)?.defaultBranch });
      toast.success(`Started ${wf?.name}`);
      setTimeout(runs.reload, 2500);
    } catch {
      /* toast already shown */
    }
  };

  const counts = useMemo(() => {
    const list = runs.data?.runs || [];
    return { passed: list.filter((r) => r.conclusion === "success").length, failed: list.filter((r) => r.conclusion === "failure").length };
  }, [runs.data]);

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card pad={false} flush>
        <div className="pc-toolbar" style={{ padding: 12 }}>
          <RepoSelect repos={ordered} value={repo} onChange={(v) => { setRepo(v); setWorkflowId(""); }} />
          <select className="pc-select" style={{ width: "auto", maxWidth: 260 }} value={workflowId} onChange={(e) => setWorkflowId(e.target.value)} aria-label="Workflow">
            <option value="">All workflows</option>
            {workflows.data?.workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <Button icon={RefreshCw} onClick={runs.reload} aria-label="Refresh" />
          <span style={{ flex: 1 }} />
          {runs.data && <span className="pc-muted" style={{ fontSize: 12 }}>Last {runs.data.runs.length}: <b style={{ color: "var(--green-t)" }}>{counts.passed} passed</b>, <b style={{ color: "var(--red-t)" }}>{counts.failed} failed</b></span>}
          <Button variant="primary" icon={Play} disabled={!workflowId} onClick={dispatch} title={workflowId ? "Run this workflow on the default branch" : "Pick a workflow to run it"}>Run workflow</Button>
        </div>

        {runs.loading && !runs.data ? (
          <div style={{ padding: 16 }}><Skeleton h={200} /></div>
        ) : runs.error ? (
          <div style={{ padding: 16 }}><ErrorLine error={runs.error} /></div>
        ) : !runs.data?.runs.length ? (
          <EmptyState icon={Workflow} title="No workflow runs">This repository hasn't run any GitHub Actions workflows{workflowId ? " for this workflow" : ""} yet.</EmptyState>
        ) : (
          <div className="pc-table-wrap">
            <table className="pc-table">
              <thead><tr><th>Status</th><th>Workflow</th><th>Branch</th><th>Triggered by</th><th>Duration</th><th>When</th><th className="r" /></tr></thead>
              <tbody>
                {runs.data.runs.map((r) => {
                  const s = runStatus(r);
                  return (
                    <tr key={r.id}>
                      <td><span className={`pc-status ${s.tone === "green" ? "ok" : s.tone === "red" ? "bad" : s.tone === "blue" ? "warn" : "idle"}`}>{s.label}</span></td>
                      <td><b style={{ fontWeight: 500 }}>{r.name}</b> <span className="pc-dim">#{r.number}</span><span className="pc-dim" style={{ display: "block", fontSize: 12, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</span></td>
                      <td className="pc-mono pc-muted">{r.branch}</td>
                      <td className="pc-muted">{r.actor} <span className="pc-dim">({r.event})</span></td>
                      <td className="pc-tabular pc-muted">{fmtDuration(r.durationMs)}</td>
                      <td className="pc-dim">{timeAgo(r.createdAt)}</td>
                      <td className="r" style={{ whiteSpace: "nowrap" }}>
                        {r.status === "completed" && r.conclusion === "failure" && <Button size="sm" loading={busyRun === r.id} onClick={() => act(r, "rerun_run", "Re-running failed jobs", { failedOnly: true })}>Re-run failed</Button>}{" "}
                        {r.status === "completed" && r.conclusion !== "failure" && <Button size="sm" variant="ghost" icon={RefreshCw} loading={busyRun === r.id} onClick={() => act(r, "rerun_run", "Re-running")} aria-label="Re-run" />}
                        {r.status !== "completed" && <Button size="sm" variant="danger" icon={Ban} loading={busyRun === r.id} onClick={() => act(r, "cancel_run", "Cancelling")}>Cancel</Button>}{" "}
                        <a className="pc-btn ghost icon sm" href={r.url} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><ExternalLink size={13} /></a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="pc-dim" style={{ margin: 0, fontSize: 12 }}>Enable the webhook in GitHub → Activity & automation to get a notification in PlanCrest whenever a build fails. Updated {formatDate(new Date())}.</p>
    </div>
  );
}
