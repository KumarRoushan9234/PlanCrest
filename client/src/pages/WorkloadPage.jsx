import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { productivityService } from "../services/productivityService";
import { maskId } from "../utils/idMasker";
import { Avatar, Badge, Card, EmptyState, KpiStrip, PageHead, Skeleton, formatDate } from "../components/ui";

const CAPACITY_HOURS = 40;

export default function WorkloadPage() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    productivityService.getWorkload(currentWorkspace._id).then((r) => setData(r.data)).catch(() => setData({ people: [], unassigned: 0 }));
  }, [currentWorkspace?._id]);

  const people = data?.people || [];
  const maxOpen = Math.max(1, ...people.map((p) => p.open));

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Workload" sub="Open work per person, so you can balance the team before someone burns out." />
        {data === null ? (
          <Skeleton h={240} />
        ) : (
          <>
            <KpiStrip
              items={[
                { label: "People with work", value: people.length, hl: true },
                { label: "Open assigned tasks", value: people.reduce((s, p) => s + p.open, 0) },
                { label: "Overdue", value: people.reduce((s, p) => s + p.overdue, 0), bad: people.some((p) => p.overdue) },
                { label: "Unassigned tasks", value: data.unassigned, note: data.unassigned ? "needs an owner" : "" },
              ]}
            />
            {people.length === 0 ? (
              <Card><EmptyState icon={Gauge} title="Nothing assigned yet">Assign tasks to teammates and their load shows up here.</EmptyState></Card>
            ) : (
              <Card pad={false}>
                <ul className="pc-list">
                  {people.map((p) => {
                    const over = p.estimatedHours > CAPACITY_HOURS;
                    return (
                      <li key={p.user._id}>
                        <button className="pc-row" style={{ padding: "12px 16px" }} onClick={() => setOpen(open === p.user._id ? null : p.user._id)} aria-expanded={open === p.user._id}>
                          <Avatar user={p.user} />
                          <span className="grow"><b>{p.user.name}</b><small>{p.open} open · {p.estimatedHours ? `${Math.round(p.estimatedHours)}h estimated` : "no estimates"}</small></span>
                          <span style={{ width: 160, height: 8, borderRadius: 4, background: "var(--panel2, var(--line))", overflow: "hidden" }} aria-hidden>
                            <span style={{ display: "block", height: "100%", width: `${(p.open / maxOpen) * 100}%`, background: over || p.overdue ? "var(--red, #e5675f)" : "var(--blue, #4d8dff)" }} />
                          </span>
                          {p.overdue > 0 && <Badge tone="red">{p.overdue} overdue</Badge>}
                          {over && <Badge tone="yellow">Over {CAPACITY_HOURS}h</Badge>}
                        </button>
                        {open === p.user._id && (
                          <ul className="pc-list" style={{ padding: "0 16px 12px 56px" }}>
                            {p.tasks.map((t) => (
                              <li key={t._id}>
                                <Link className="pc-row" to={`/project/${maskId(t.project)}/task/${maskId(t._id)}`}>
                                  <span className="grow"><b>{t.taskKey}</b> <small>{t.title}</small></span>
                                  {t.dueDate && <small>{formatDate(t.dueDate, { month: "short", day: "numeric" })}</small>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
