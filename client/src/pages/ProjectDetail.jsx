import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity, AlertTriangle, CalendarRange, FolderKanban, LayoutGrid, List, Plus, Settings, Users, Zap } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import Layout from "../components/common-afterauth/Layout";
import KanbanBoard from "../components/board/KanbanBoard";
import TaskTable from "../components/board/TaskTable";
import ActivityFeed from "../components/activity/ActivityFeed";
import MembersTab from "../components/project/MembersTab";
import AutomationsTab from "../components/project/AutomationsTab";
import TimelineView from "../components/board/TimelineView";
import SettingsTab from "../components/project/SettingsTab";
import { projectService } from "../services/projectService";
import { taskService } from "../services";
import { maskId, unmaskId } from "../utils/idMasker";
import { Badge, Banner, Button, Card, EmptyState, KpiStrip, PRIORITY_META, PageHead, Progress, SearchBox, Seg, Skeleton, STATUS_META, Tabs, num } from "../components/ui";

const PROJECT_STATUS = { active: ["Active", "green"], on_hold: ["On hold", "amber"], completed: ["Completed", "blue"], archived: ["Archived", ""] };

const ProjectDetail = () => {
  const { workspaceMembers } = useWorkspace();
  const { maskedId } = useParams();
  const projectId = unmaskId(maskedId);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "board";

  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("board");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");

  const canManage = project?.userRole === "owner" || project?.userRole === "admin";
  const setTab = (value) => setParams(value === "board" ? {} : { tab: value }, { replace: true });

  const loadProject = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([projectService.getProject(projectId), projectService.getProjectStats(projectId)]);
      setProject(p.data);
      setStats(s.data);
    } catch (e) {
      setError(e?.error || "This project doesn't exist or you don't have access to it.");
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await taskService.getProjectTasks(projectId);
      setTasks(res.data || []);
    } catch (e) {
      toast.error(e?.error || "Couldn't load tasks");
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([loadProject(), loadTasks()]).finally(() => setLoading(false));
  }, [loadProject, loadTasks]);

  useEffect(() => {
    if (tab !== "activity" || activity) return;
    projectService.getProjectActivity(projectId, "30d").then((r) => setActivity(r.data || [])).catch(() => setActivity([]));
  }, [tab, activity, projectId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) => t.status !== "cancelled" && (priority === "all" || t.priority === priority) && (!q || `${t.title} ${t.taskKey || ""}`.toLowerCase().includes(q))
    );
  }, [tasks, query, priority]);

  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    const previous = tasks;
    setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await taskService.updateTaskStatus(task._id, status);
      toast.success(`Moved to ${STATUS_META[status].label}`, { duration: 1800 });
      projectService.getProjectStats(projectId).then((r) => setStats(r.data)).catch(() => {});
    } catch (e) {
      setTasks(previous);
      toast.error(e?.error || "Couldn't move the task");
    }
  };

  const openTask = (t) => navigate(`/project/${maskId(projectId)}/task/${maskId(t._id)}`);
  const newTask = () => window.dispatchEvent(new CustomEvent("pc:modal", { detail: { name: "task", projectId } }));

  if (error) {
    return (
      <Layout>
        <div className="pc-page narrow">
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={() => navigate("/projects")}>Back to projects</Button>}>{error}</Banner>
        </div>
      </Layout>
    );
  }

  if (loading && !project) {
    return (
      <Layout>
        <div className="pc-page">
          <Skeleton h={56} w="40%" />
          <Skeleton h={78} />
          <Skeleton h={300} />
        </div>
      </Layout>
    );
  }

  const [statusLabel, statusTone] = PROJECT_STATUS[project.status] || PROJECT_STATUS.active;
  const color = project.color || "#2563eb";

  return (
    <Layout>
      <div className="pc-page">
        <PageHead
          crumbs={[{ label: "Projects", to: "/projects" }, { label: project.name }]}
          title={
            <span className="inline-flex items-center gap-3" style={{ flexWrap: "wrap" }}>
              <span className="pc-ico lg" style={{ color, background: `${color}22`, boxShadow: `inset 0 0 0 1px ${color}33` }}>
                <FolderKanban size={18} />
              </span>
              {project.name}
              <span className="pc-mono pc-dim" style={{ fontSize: 13, fontWeight: 400 }}>{project.key}</span>
              <Badge tone={statusTone}>{statusLabel}</Badge>
            </span>
          }
          sub={project.description}
        >
          <Button variant="primary" icon={Plus} onClick={newTask}>New task</Button>
        </PageHead>

        <KpiStrip
          items={[
            { label: "Tasks", value: num(stats?.totalTasks), note: `${num(stats?.inProgressTasks)} in progress`, hl: true },
            { label: "Completed", value: `${stats?.progressRate ?? 0}%`, note: `${num(stats?.completedTasks)} of ${num(stats?.totalTasks)} done` },
            { label: "Overdue", value: num(stats?.overdueTasks), note: stats?.overdueTasks ? "needs attention" : "on track", bad: stats?.overdueTasks > 0 },
            { label: "Members", value: num(stats?.totalMembers), note: project.lead?.name ? `Led by ${project.lead.name}` : "" },
          ]}
        />
        <Progress value={stats?.progressRate ?? 0} />

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "board", label: "Tasks", icon: <LayoutGrid size={14} />, count: tasks.length },
            { value: "members", label: "Members", icon: <Users size={14} /> },
            { value: "activity", label: "Activity", icon: <Activity size={14} /> },
            { value: "automations", label: "Automations", icon: <Zap size={14} /> },
            ...(canManage ? [{ value: "settings", label: "Settings", icon: <Settings size={14} /> }] : []),
          ]}
        />

        {tab === "board" && (
          <>
            <div className="pc-toolbar">
              <SearchBox value={query} onChange={setQuery} placeholder="Search tasks" />
              <select className="pc-select" style={{ width: "auto" }} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
                <option value="all">Any priority</option>
                {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <span style={{ flex: 1 }} />
              <Seg value={view} onChange={setView} options={[{ value: "board", label: "Board", icon: <LayoutGrid size={13} /> }, { value: "list", label: "List", icon: <List size={13} /> }, { value: "timeline", label: "Timeline", icon: <CalendarRange size={13} /> }]} />
            </div>
            {tasks.length === 0 ? (
              <Card>
                <EmptyState icon={FolderKanban} title="No tasks in this project yet" action={<Button variant="primary" icon={Plus} onClick={newTask}>Add the first task</Button>}>
                  Capture work as tasks, then drag them across the board as they progress.
                </EmptyState>
              </Card>
            ) : view === "board" ? (
              <KanbanBoard tasks={visible} onMove={changeStatus} onOpen={openTask} />
            ) : view === "timeline" ? (
              <TimelineView tasks={visible} onOpen={openTask} />
            ) : (
              <Card pad={false} flush>
                <TaskTable tasks={visible} onOpen={openTask} onStatus={changeStatus} />
              </Card>
            )}
          </>
        )}

        {tab === "members" && <MembersTab project={project} canManage={canManage} />}

        {tab === "activity" && (
          <Card>
            {activity === null ? <Skeleton h={160} /> : activity.length === 0 ? <EmptyState icon={Activity} title="No recent activity">Changes to tasks and members in the last 30 days appear here.</EmptyState> : <ActivityFeed items={activity} />}
          </Card>
        )}

        {tab === "automations" && (
          <AutomationsTab project={project} members={workspaceMembers.map((m) => m.user).filter(Boolean)} canManage={canManage} onProjectChanged={loadProject} />
        )}

        {tab === "settings" && canManage && (
          <SettingsTab project={project} onSaved={loadProject} onArchived={() => navigate("/projects", { replace: true })} />
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetail;
