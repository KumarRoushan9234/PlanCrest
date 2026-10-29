import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, PieChart, Users } from "lucide-react";
import { Layout } from "../../components/common-afterauth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { workspaceService } from "../../services";
import { Banner, BarRows, Card, CardHead, Donut, EmptyState, KpiStrip, PRIORITY_META, PageHead, Seg, Skeleton, StackedBars, STATUS_META, num } from "../../components/ui";

const RANGES = [
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const AnalyticsPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    let alive = true;
    setData(null);
    setError("");
    workspaceService
      .getInsights(currentWorkspace._id, range)
      .then((r) => alive && setData(r.data))
      .catch((e) => alive && setError(e?.error || "Couldn't load analytics."));
    return () => {
      alive = false;
    };
  }, [currentWorkspace?._id, range]);

  const statusSegments = data
    ? Object.entries(STATUS_META)
        .filter(([k]) => k !== "cancelled" && data.status[k])
        .map(([k, v]) => ({ label: v.label, value: data.status[k], color: v.color }))
    : [];
  const totalTasks = statusSegments.reduce((a, s) => a + s.value, 0);

  const rows = data?.series.map((d) => {
    const date = new Date(d.date);
    return {
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      tooltipLabel: data.bucket === "week" ? `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      values: [d.completed, d.created],
    };
  });

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Analytics" sub="How work is flowing through your projects.">
          <Seg value={range} onChange={setRange} options={RANGES} />
        </PageHead>

        {error ? (
          <Banner tone="error" icon={AlertTriangle}>{error}</Banner>
        ) : !data ? (
          <>
            <Skeleton h={78} />
            <Skeleton h={300} />
          </>
        ) : (
          <>
            <KpiStrip
              items={[
                { label: `Completed · ${range}d`, value: num(data.kpis.completed), note: `${num(data.kpis.created)} created`, hl: true },
                { label: "Avg. cycle time", value: data.kpis.avgCycleDays == null ? "–" : `${data.kpis.avgCycleDays}d`, note: "created to done" },
                { label: "On-time rate", value: data.kpis.onTimeRate == null ? "–" : `${data.kpis.onTimeRate}%`, note: "finished by due date" },
                { label: "Overdue now", value: num(data.kpis.overdue), note: `${num(data.kpis.open)} open in total`, bad: data.kpis.overdue > 0 },
              ]}
            />

            <Card>
              <CardHead icon={BarChart3} title={data.bucket === "week" ? "Throughput by week" : "Throughput by day"} />
              <StackedBars
                data={rows}
                height={230}
                series={[
                  { key: "completed", label: "Completed", color: "#3987e5" },
                  { key: "created", label: "Created", color: "#7c5ce0" },
                ]}
                emptyText="No tasks were created or completed in this period"
              />
            </Card>

            <div className="pc-grid pc-cols-3">
              <Card>
                <CardHead icon={PieChart} title="Tasks by status" />
                {totalTasks === 0 ? (
                  <EmptyState icon={PieChart} title="No tasks yet" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <Donut segments={statusSegments} centerLabel={num(totalTasks)} centerSub="tasks" />
                    <ul className="pc-list" style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
                      {statusSegments.map((s) => (
                        <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <i className="pc-dot" style={{ background: s.color }} />
                          <span className="pc-muted">{s.label}</span>
                          <b style={{ marginLeft: "auto", paddingLeft: 12, fontVariantNumeric: "tabular-nums" }}>{s.value}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <Card>
                <CardHead icon={BarChart3} title="Open work by priority" />
                {data.kpis.open === 0 ? (
                  <EmptyState icon={BarChart3} title="Nothing open" />
                ) : (
                  <BarRows rows={["high", "medium", "low"].map((k) => ({ label: PRIORITY_META[k].label, value: data.priority[k] || 0, color: PRIORITY_META[k].color }))} />
                )}
              </Card>

              <Card>
                <CardHead icon={Users} title="Open tasks per person" />
                {data.workload.length === 0 ? (
                  <EmptyState icon={Users} title="No assignments yet">Assign tasks to see who has capacity.</EmptyState>
                ) : (
                  <BarRows rows={data.workload.map((w) => ({ label: w.name, value: w.value }))} />
                )}
              </Card>
            </div>

            <Card>
              <CardHead icon={BarChart3} title="Project progress" />
              {data.projects.length === 0 ? (
                <EmptyState icon={BarChart3} title="No projects yet" />
              ) : (
                <BarRows rows={data.projects.map((p) => ({ label: p.name, value: p.total ? Math.round((p.done / p.total) * 100) : 0, color: p.color || "#3987e5" }))} max={100} />
              )}
              <p className="pc-dim" style={{ margin: "12px 0 0", fontSize: 12 }}>Percentage of each project's tasks that are done.</p>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
