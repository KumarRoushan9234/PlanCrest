import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import TeamNav from "../components/shell/TeamNav";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { productivityService, formatDuration } from "../services/productivityService";
import { maskId } from "../utils/idMasker";
import { Avatar, Card, EmptyState, KpiStrip, PageHead, Seg, Skeleton, formatDate } from "../components/ui";

const RANGES = { week: 7, month: 30, quarter: 90 };

export default function TimesheetPage() {
  const { user } = useAuth();
  const { currentWorkspace, workspaceMembers } = useWorkspace();
  const [range, setRange] = useState("week");
  const [who, setWho] = useState("me");
  const [data, setData] = useState(null);
  const workspaceId = currentWorkspace?._id;
  const ownerId = currentWorkspace?.owner?._id ?? currentWorkspace?.owner;
  const canSeeOthers = String(ownerId) === String(user?._id) || workspaceMembers.some((m) => m.user?._id === user?._id && m.role === "admin");

  useEffect(() => {
    if (!workspaceId) return;
    setData(null);
    const params = { from: new Date(Date.now() - RANGES[range] * 86400000).toISOString(), to: new Date().toISOString() };
    if (who !== "me") params.userId = who;
    productivityService.getTimesheet(workspaceId, params).then((r) => setData(r.data)).catch(() => setData({ entries: [], byDay: {}, totalSeconds: 0, billableSeconds: 0 }));
  }, [workspaceId, range, who]);

  const days = Object.entries(data?.byDay || {}).sort(([a], [b]) => (a < b ? -1 : 1));
  const maxDay = Math.max(1, ...days.map(([, s]) => s));

  return (
    <Layout>
      <div className="pc-page">
        <TeamNav />
        <PageHead title="Timesheet">
          {canSeeOthers && (
            <select className="pc-select" style={{ width: "auto" }} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person">
              <option value="me">Me</option>
              <option value="all">Everyone</option>
              {workspaceMembers.map((m) => m.user && <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
            </select>
          )}
          <Seg value={range} onChange={setRange} options={[{ value: "week", label: "7 days" }, { value: "month", label: "30 days" }, { value: "quarter", label: "90 days" }]} />
        </PageHead>

        {data === null ? (
          <Skeleton h={240} />
        ) : (
          <>
            <KpiStrip
              items={[
                { label: "Total tracked", value: formatDuration(data.totalSeconds), hl: true },
                { label: "Billable", value: formatDuration(data.billableSeconds) },
                { label: "Entries", value: data.entries.length },
                { label: "Daily average", value: formatDuration(data.totalSeconds / RANGES[range]) },
              ]}
            />
            {data.entries.length === 0 ? (
              <Card><EmptyState icon={Clock} title="No time tracked in this period" /></Card>
            ) : (
              <>
                <Card>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }} role="img" aria-label="Time tracked per day">
                    {days.map(([day, seconds]) => (
                      <div key={day} title={`${day}: ${formatDuration(seconds)}`} style={{ flex: 1, maxWidth: 40, height: `${Math.max(4, (seconds / maxDay) * 100)}%`, background: "var(--blue, #4d8dff)", borderRadius: 3 }} />
                    ))}
                  </div>
                </Card>
                <Card pad={false}>
                  <ul className="pc-list">
                    {data.entries.map((e) => (
                      <li key={e._id} className="pc-row" style={{ cursor: "default" }}>
                        <Avatar user={e.user} size="sm" />
                        <span className="grow">
                          {e.task ? <Link className="pc-link" to={`/project/${maskId(e.project?._id)}/task/${maskId(e.task._id)}`}><b>{e.task.taskKey}</b> {e.task.title}</Link> : <b>Deleted task</b>}
                          <small>{e.project?.name} · {e.description || (e.isManual ? "Logged manually" : "Timer")}</small>
                        </span>
                        <small>{formatDate(e.startTime, { month: "short", day: "numeric" })}</small>
                        <b style={{ minWidth: 56, textAlign: "right" }}>{formatDuration(e.duration)}</b>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
