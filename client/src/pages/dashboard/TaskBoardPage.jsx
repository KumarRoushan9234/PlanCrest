import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, CheckSquare, LayoutGrid, List, Plus, RefreshCw } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import KanbanBoard from "../../components/board/KanbanBoard";
import TaskTable from "../../components/board/TaskTable";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { taskService } from "../../services";
import { maskId } from "../../utils/idMasker";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  PRIORITY_META,
  PageHead,
  STATUS_META,
  SearchBox,
  Seg,
  Skeleton,
} from "../../components/ui";

const SCOPES = [
  { value: "mine", label: "Assigned to me" },
  { value: "all", label: "Everyone" },
];

const VIEWS = [
  { value: "board", label: "Board", icon: <LayoutGrid size={13} /> },
  { value: "list", label: "List", icon: <List size={13} /> },
];

const taskPath = (t) => `/project/${maskId(t.project?._id ?? t.project)}/task/${maskId(t._id)}`;

const TaskBoardPage = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState(() => localStorage.getItem("pc:workScope") || "mine");
  const [view, setView] = useState(() => localStorage.getItem("pc:workView") || "board");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [project, setProject] = useState("all");
  const [showDone, setShowDone] = useState(false);

  useEffect(() => localStorage.setItem("pc:workScope", scope), [scope]);
  useEffect(() => localStorage.setItem("pc:workView", view), [view]);

  const load = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    setError("");
    try {
      const res = await taskService.getWorkspaceTasks(currentWorkspace._id, scope === "mine" ? { assignedToMe: "true" } : {});
      setTasks(res.data || []);
    } catch (e) {
      setError(e?.error || "Couldn't load tasks.");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => t.project?._id && map.set(t.project._id, t.project));
    return [...map.values()];
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        t.status !== "cancelled" &&
        (showDone || view === "board" || t.status !== "done") &&
        (priority === "all" || t.priority === priority) &&
        (project === "all" || t.project?._id === project) &&
        (!q || `${t.title} ${t.taskKey || ""}`.toLowerCase().includes(q))
    );
  }, [tasks, query, priority, project, showDone, view]);

  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    const previous = tasks;
    setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await taskService.updateTaskStatus(task._id, status);
      toast.success(`Moved to ${STATUS_META[status].label}`, { duration: 1800 });
    } catch (e) {
      setTasks(previous);
      toast.error(e?.error || "Couldn't move the task");
    }
  };

  const open = (t) => navigate(taskPath(t));
  const newTask = () => window.dispatchEvent(new CustomEvent("pc:modal", { detail: "task" }));

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="My work" sub="Everything on your plate across projects. Drag cards to update their status.">
          <Button icon={RefreshCw} onClick={load} aria-label="Refresh" />
          <Button variant="primary" icon={Plus} onClick={newTask}>New task</Button>
        </PageHead>

        <div className="pc-toolbar">
          <SearchBox value={query} onChange={setQuery} placeholder="Search tasks" />
          <Seg value={scope} onChange={setScope} options={SCOPES} />
          <select className="pc-select" style={{ width: "auto" }} value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select className="pc-select" style={{ width: "auto" }} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
            <option value="all">Any priority</option>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {view === "list" && (
            <label className="pc-check">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed
            </label>
          )}
          <span style={{ flex: 1 }} />
          <Seg value={view} onChange={setView} options={VIEWS} />
        </div>

        {error ? (
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={load}>Retry</Button>}>{error}</Banner>
        ) : loading && tasks.length === 0 ? (
          <div className="pc-grid pc-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} h={240} />)}
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <EmptyState icon={CheckSquare} title={scope === "mine" ? "Nothing assigned to you" : "No tasks yet"} action={<Button variant="primary" icon={Plus} onClick={newTask}>Create a task</Button>}>
              {scope === "mine" ? "Tasks assigned to you will show up here. Switch to Everyone to see the whole workspace." : "Create a task to get the board moving."}
            </EmptyState>
          </Card>
        ) : view === "board" ? (
          <KanbanBoard tasks={visible} onMove={changeStatus} onOpen={open} showProject />
        ) : (
          <Card pad={false} flush>
            {visible.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No tasks match your filters" />
            ) : (
              <TaskTable tasks={visible} onOpen={open} onStatus={changeStatus} showProject />
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TaskBoardPage;
