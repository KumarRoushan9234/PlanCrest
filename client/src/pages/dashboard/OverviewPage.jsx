import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, ArrowRight, CalendarClock, Check, CheckCircle2, FolderKanban, ListChecks, Plus, Rocket, Sparkles } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { workspaceService } from "../../services";
import { maskId } from "../../utils/idMasker";
import {
  Avatar,
  Banner,
  Button,
  Card,
  CardHead,
  EmptyState,
  KpiStrip,
  PageHead,
  PRIORITY_META,
  Progress,
  Seg,
  Skeleton,
  StackedBars,
  STATUS_META,
  formatDate,
  num,
  timeAgo,
} from "../../components/ui";

const openModal = (name) => window.dispatchEvent(new CustomEvent("pc:modal", { detail: name }));

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const taskLink = (t) => `/project/${maskId(t.project?._id ?? t.project)}/task/${maskId(t._id)}`;

const dueLabel = (date) => {
  if (!date) return { text: "No date", tone: "" };
  const d = new Date(date);
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days < 0) return { text: `${-days}d overdue`, tone: "red" };
  if (days === 0) return { text: "Today", tone: "amber" };
  if (days === 1) return { text: "Tomorrow", tone: "amber" };
  if (days < 7) return { text: d.toLocaleDateString(undefined, { weekday: "short" }), tone: "" };
  return { text: formatDate(date), tone: "" };
};

function Chart({ series }) {
  const [view, setView] = useState("14");
  const rows = (view === "7" ? series.slice(-7) : series).map((d) => ({
    label: new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tooltipLabel: new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    values: [d.completed, d.created],
  }));
  return (
    <Card className="flex-1">
      <CardHead icon={ListChecks} title="Task flow">
        <Seg value={view} onChange={setView} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }]} />
      </CardHead>
      <StackedBars
        data={rows}
        series={[
          { key: "completed", label: "Completed", color: "#3987e5" },
          { key: "created", label: "Created", color: "#7c5ce0" },
        ]}
        emptyText="No task activity in this period yet"
      />
    </Card>
  );
}

function RecentActivity({ activity, onMore }) {
  return (
    <Card pad={false} flush>
      <CardHead icon={Activity} title="Recent activity" pad>
        <button className="pc-link" onClick={onMore}>View all</button>
      </CardHead>
      {activity.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" />
      ) : (
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr><th>Who</th><th>What</th><th className="r">When</th></tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a._id}>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar user={a.actor} size="sm" />
                      {a.actor?.name ?? "Someone"}
                    </span>
                  </td>
                  <td className="ellip">
                    <span className="pc-muted">{a.action} {String(a.targetType || "").toLowerCase()}</span> {a.targetName && <b style={{ fontWeight: 500 }}>“{a.targetName}”</b>}
                  </td>
                  <td className="r pc-dim">{timeAgo(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MyTasks({ tasks, navigate }) {
  return (
    <Card>
      <CardHead icon={CalendarClock} title="Up next for you">
        <button className="pc-link" onClick={() => navigate("/dashboard/tasks")}>All tasks</button>
      </CardHead>
      {tasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing assigned to you" />
      ) : (
        <ul className="pc-list" style={{ margin: "0 -8px" }}>
          {tasks.map((t) => {
            const due = dueLabel(t.dueDate);
            return (
              <li key={t._id}>
                <button className="pc-row" onClick={() => navigate(taskLink(t))}>
                  <span className="pc-dot" style={{ background: PRIORITY_META[t.priority]?.color }} title={`${PRIORITY_META[t.priority]?.label} priority`} />
                  <span className="grow">
                    <b>{t.title}</b>
                    <small>{[t.taskKey, STATUS_META[t.status]?.label].filter(Boolean).join(" · ")}</small>
                  </span>
                  <span className={`pc-badge ${due.tone}`}>{due.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ProjectsCard({ progress, navigate }) {
  return (
    <Card>
      <CardHead icon={FolderKanban} title="Projects">
        <button className="pc-link" onClick={() => navigate("/projects")}>All projects</button>
      </CardHead>
      {progress.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" action={<Button variant="primary" size="sm" icon={Plus} onClick={() => openModal("project")}>New project</Button>}>
          Projects hold your boards, tasks and discussions.
        </EmptyState>
      ) : (
        <ul className="pc-list" style={{ margin: "0 -8px" }}>
          {progress.map((p) => {
            const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <li key={p._id}>
                <button className="pc-row" onClick={() => navigate(`/project/${maskId(p._id)}`)} style={{ alignItems: "flex-start" }}>
                  <span className="pc-ws-mark" style={{ background: p.color || "#2563eb", marginTop: 2 }}>{p.key?.[0]}</span>
                  <span className="grow">
                    <b>{p.name}</b>
                    <small style={{ marginBottom: 6 }}>{p.done}/{p.total} done{p.overdue ? ` · ${p.overdue} overdue` : ""}</small>
                    <Progress value={pct} tone="" />
                  </span>
                  <span className="pc-dim pc-tabular" style={{ fontSize: 12 }}>{pct}%</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const OverviewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    try {
      setError("");
      const res = await workspaceService.getDashboard(currentWorkspace._id);
      setData(res.data);
    } catch (e) {
      setError(e?.error || "Couldn't load the overview.");
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const first = user?.name?.split(" ")[0];

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title={`${greeting()}${first ? `, ${first}` : ""}`}>
          <Button icon={Sparkles} onClick={() => navigate("/ai-mode")}>Plan my day</Button>
          <Button variant="primary" icon={Plus} onClick={() => openModal("task")}>New task</Button>
        </PageHead>

        {!currentWorkspace && !workspaceLoading ? (
          <Card>
            <EmptyState icon={FolderKanban} title="Create your first workspace" action={<Button variant="primary" onClick={() => openModal("workspace")}>Create workspace</Button>}>
              A workspace is where your team's projects, chat and documents live.
            </EmptyState>
          </Card>
        ) : error ? (
          <Banner tone="error" icon={AlertTriangle} action={<Button size="sm" onClick={load}>Retry</Button>}>{error}</Banner>
        ) : !data ? (
          <>
            <Skeleton h={78} />
            <div className="pc-split">
              <Skeleton h={340} />
              <Skeleton h={340} />
            </div>
          </>
        ) : (
          <>
            <KpiStrip
              items={[
                { label: "Open tasks", value: num(data.stats.openTasks), hl: true },
                { label: "Due this week", value: num(data.stats.dueThisWeek) },
                { label: "Overdue", value: num(data.stats.overdue), bad: data.stats.overdue > 0 },
                { label: "Completed · 7d", value: num(data.stats.completedWeek) },
              ]}
            />
            <div className="pc-split">
              <div className="pc-stack">
                <Chart series={data.series} />
                <RecentActivity activity={data.activity} onMore={() => navigate("/dashboard/activity")} />
              </div>
              <div className="pc-stack">
                <MyTasks tasks={data.myTasks} navigate={navigate} />
                <ProjectsCard progress={data.progress} navigate={navigate} />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default OverviewPage;
