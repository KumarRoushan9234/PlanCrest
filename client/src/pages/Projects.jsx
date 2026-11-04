import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bug, Building, Database, FolderKanban, Folder, Globe, LayoutGrid, Lightbulb, List, Map, Megaphone, Palette, PenTool, Plus, Rocket, Smartphone, Target, Wrench, Zap } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useProject } from "../contexts/ProjectContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { maskId } from "../utils/idMasker";
import { AvatarStack, Badge, Button, Card, EmptyState, PageHead, Progress, SearchBox, Seg, Skeleton, timeAgo } from "../components/ui";

const ICONS = { Folder, Globe, Smartphone, Palette, PenTool, Megaphone, Wrench, Rocket, Lightbulb, Target, Building, Database, Bug, Map, Zap };

const STATUS = {
  active: { label: "Active", tone: "green" },
  on_hold: { label: "On hold", tone: "amber" },
  completed: { label: "Completed", tone: "blue" },
  archived: { label: "Archived", tone: "" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

function ProjectMark({ project, size = 36 }) {
  const Icon = ICONS[project.icon] || FolderKanban;
  const color = project.color || "#2563eb";
  return (
    <span className="pc-ico" style={{ width: size, height: size, borderRadius: 9, color, background: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}33` }}>
      <Icon size={size * 0.5} />
    </span>
  );
}

function ProjectCard({ project, onOpen }) {
  const status = STATUS[project.status] || STATUS.active;
  return (
    <button className="pc-card pad hover text-left" style={{ display: "grid", gap: 14, cursor: "pointer", font: "inherit", color: "inherit", textAlign: "left" }} onClick={onOpen}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <ProjectMark project={project} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</b>
            <span className="pc-mono pc-dim">{project.key}</span>
          </div>
          <p className="pc-muted" style={{ margin: "3px 0 0", fontSize: 12.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 36 }}>
            {project.description || "No description yet."}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sub)" }}>
          <span>{project.doneCount ?? 0} of {project.taskCount ?? 0} tasks done</span>
          <span className="pc-tabular">{project.progress ?? 0}%</span>
        </div>
        <Progress value={project.progress ?? 0} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <AvatarStack users={project.memberPreview || []} max={4} />
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12 }}>
          {project.overdueCount > 0 && <Badge tone="red">{project.overdueCount} overdue</Badge>}
          <span className="pc-dim">{timeAgo(project.lastActivity)}</span>
        </span>
      </div>
    </button>
  );
}

function ProjectRow({ project, onOpen }) {
  const status = STATUS[project.status] || STATUS.active;
  return (
    <tr className="click" onClick={onOpen}>
      <td>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <ProjectMark project={project} size={30} />
          <span>
            <b style={{ fontWeight: 500 }}>{project.name}</b> <span className="pc-mono pc-dim">{project.key}</span>
          </span>
        </span>
      </td>
      <td><Badge tone={status.tone}>{status.label}</Badge></td>
      <td style={{ minWidth: 160 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Progress value={project.progress ?? 0} />
          <span className="pc-dim" style={{ fontSize: 11.5 }}>{project.doneCount ?? 0}/{project.taskCount ?? 0} done</span>
        </div>
      </td>
      <td>{project.overdueCount > 0 ? <Badge tone="red">{project.overdueCount} overdue</Badge> : <span className="pc-dim">None</span>}</td>
      <td><AvatarStack users={project.memberPreview || []} max={4} /></td>
      <td className="r pc-dim">{timeAgo(project.lastActivity)}</td>
    </tr>
  );
}

const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchWorkspaceProjects } = useProject();
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState(() => localStorage.getItem("pc:projectsView") || "grid");

  useEffect(() => {
    if (currentWorkspace?._id) fetchWorkspaceProjects();
  }, [currentWorkspace?._id, fetchWorkspaceProjects]);

  useEffect(() => {
    localStorage.setItem("pc:projectsView", view);
  }, [view]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => (status === "all" || p.status === status) && (!q || `${p.name} ${p.key} ${p.description || ""}`.toLowerCase().includes(q)));
  }, [projects, query, status]);

  const open = (p) => navigate(`/project/${maskId(p._id)}`);
  const create = () => window.dispatchEvent(new CustomEvent("pc:modal", { detail: "project" }));

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Projects">
          <Button variant="primary" icon={Plus} onClick={create}>New project</Button>
        </PageHead>

        <div className="pc-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search projects" className="" />
          <Seg value={status} onChange={setStatus} options={FILTERS} />
          <span className="grow" style={{ flex: 1 }} />
          <Seg
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Grid", icon: <LayoutGrid size={13} /> },
              { value: "list", label: "List", icon: <List size={13} /> },
            ]}
          />
        </div>

        {loading && projects.length === 0 ? (
          <div className="pc-grid pc-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} h={170} />)}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <EmptyState icon={FolderKanban} title="No projects yet" action={<Button variant="primary" icon={Plus} onClick={create}>Create your first project</Button>}>
              Projects hold your boards, tasks and conversations. Start from scratch or pick a template.
            </EmptyState>
          </Card>
        ) : list.length === 0 ? (
          <Card>
            <EmptyState icon={AlertTriangle} title="No projects match" action={<Button onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button>}>
              Try a different search term or status.
            </EmptyState>
          </Card>
        ) : view === "grid" ? (
          <div className="pc-grid pc-cols-3">
            {list.map((p) => <ProjectCard key={p._id} project={p} onOpen={() => open(p)} />)}
          </div>
        ) : (
          <Card pad={false} flush>
            <div className="pc-table-wrap">
              <table className="pc-table">
                <thead>
                  <tr><th>Project</th><th>Status</th><th>Progress</th><th>Overdue</th><th>Team</th><th className="r">Activity</th></tr>
                </thead>
                <tbody>
                  {list.map((p) => <ProjectRow key={p._id} project={p} onOpen={() => open(p)} />)}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Projects;
