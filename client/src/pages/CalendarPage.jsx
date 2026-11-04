import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, List, LayoutGrid, Plus, RefreshCw, Video } from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import EventModal from "../components/calendar/EventModal";
import { colorFor, dayKey, monthGrid, sameDay, startOfDay, timeLabel } from "../components/calendar/calendarUtils";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { calendarService, taskService } from "../services";
import { maskId } from "../utils/idMasker";
import { Badge, Button, Card, CardHead, EmptyState, PageHead, Seg, Skeleton } from "../components/ui";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState(() => localStorage.getItem("pc:calView") || "month");
  const [showTasks, setShowTasks] = useState(() => localStorage.getItem("pc:calTasks") !== "0");
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState({ open: false, event: null, date: null });
  const workspaceId = currentWorkspace?._id;

  useEffect(() => localStorage.setItem("pc:calView", view), [view]);
  useEffect(() => localStorage.setItem("pc:calTasks", showTasks ? "1" : "0"), [showTasks]);

  const days = useMemo(() => monthGrid(cursor), [cursor]);
  const rangeKey = `${dayKey(days[0])}_${dayKey(days[days.length - 1])}`;

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await calendarService.getWorkspaceEvents(workspaceId, { startDate: days[0].toISOString(), endDate: new Date(days[days.length - 1].getTime() + 86399000).toISOString() });
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, rangeKey]);

  useEffect(() => {
    load();
    window.addEventListener("pc:events", load);
    return () => window.removeEventListener("pc:events", load);
  }, [load]);

  useEffect(() => {
    if (!workspaceId) return;
    taskService.getWorkspaceTasks(workspaceId).then((r) => setTasks((r.data || []).filter((t) => t.dueDate && t.status !== "cancelled"))).catch(() => setTasks([]));
  }, [workspaceId]);

  const byDay = useMemo(() => {
    const map = new Map();
    const add = (key, item) => map.set(key, [...(map.get(key) || []), item]);
    for (const e of events || []) {
      // Spread multi-day events across the days they cover (within the grid)
      for (let d = startOfDay(e.startDate); d <= new Date(e.endDate); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        if (d >= days[0] && d <= days[days.length - 1]) add(dayKey(d), { kind: "event", event: e });
        if (d > days[days.length - 1]) break;
      }
    }
    if (showTasks) for (const t of tasks) add(dayKey(t.dueDate), { kind: "task", task: t });
    return map;
  }, [events, tasks, showTasks, days]);

  const itemsOn = (d) => byDay.get(dayKey(d)) || [];
  const openEvent = (event) => setModal({ open: true, event, date: null });
  const openNew = (date) => setModal({ open: true, event: null, date: date || selected });
  const openTask = (t) => navigate(`/project/${maskId(t.project?._id ?? t.project)}/task/${maskId(t._id)}`);
  const move = (delta) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const today = () => {
    const now = new Date();
    setCursor(now);
    setSelected(startOfDay(now));
  };

  const Pill = ({ item }) =>
    item.kind === "event" ? (
      <span className="pc-pill" style={{ "--c": colorFor(item.event.category) }} onClick={(e) => { e.stopPropagation(); openEvent(item.event); }} title={item.event.title}>
        {item.event.meetingLink && <Video size={10} />}
        {item.event.title}
      </span>
    ) : (
      <span className={`pc-pill task ${item.task.status === "done" ? "done" : ""}`} style={{ "--c": "var(--dim)" }} onClick={(e) => { e.stopPropagation(); openTask(item.task); }} title={`Task due: ${item.task.title}`}>
        <CheckSquare size={10} />
        {item.task.title}
      </span>
    );

  const selectedItems = itemsOn(selected);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const agendaDays = days.filter((d) => d.getMonth() === cursor.getMonth() && itemsOn(d).length);

  return (
    <Layout>
      <div className="pc-page">
        <PageHead title="Calendar">
          <Button onClick={() => navigate("/integrations/google_calendar")} icon={RefreshCw}>Google sync</Button>
          <Button variant="primary" icon={Plus} onClick={() => openNew()}>New event</Button>
        </PageHead>

        <div className="pc-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Button icon={ChevronLeft} className="icon" onClick={() => move(-1)} aria-label="Previous month" />
            <Button onClick={today}>Today</Button>
            <Button icon={ChevronRight} className="icon" onClick={() => move(1)} aria-label="Next month" />
          </div>
          <h2 style={{ margin: "0 8px", fontSize: 16, minWidth: 150 }}>{monthLabel}</h2>
          <label className="pc-check"><input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} /> Show task due dates</label>
          <span style={{ flex: 1 }} />
          <Seg value={view} onChange={setView} options={[{ value: "month", label: "Month", icon: <LayoutGrid size={13} /> }, { value: "agenda", label: "Agenda", icon: <List size={13} /> }]} />
        </div>

        <div className="pc-split">
          {events === null ? (
            <Skeleton h={520} />
          ) : view === "month" ? (
            <div className="pc-cal" role="grid" aria-label={monthLabel}>
              {DOW.map((d) => <div key={d} className="pc-cal-dow" role="columnheader">{d}</div>)}
              {days.map((d) => {
                const items = itemsOn(d);
                const isToday = sameDay(d, new Date());
                return (
                  <button key={d.toISOString()} className={`pc-cal-cell ${d.getMonth() !== cursor.getMonth() ? "out" : ""} ${sameDay(d, selected) ? "sel" : ""}`} onClick={() => setSelected(startOfDay(d))} onDoubleClick={() => openNew(d)} aria-label={d.toDateString()}>
                    <span className={`num ${isToday ? "today" : ""}`}>{d.getDate()}</span>
                    {items.slice(0, 3).map((item, i) => <Pill key={i} item={item} />)}
                    {items.length > 3 && <span className="pc-more">+{items.length - 3} more</span>}
                  </button>
                );
              })}
            </div>
          ) : agendaDays.length === 0 ? (
            <Card><EmptyState icon={CalendarDays} title="Nothing scheduled this month" action={<Button variant="primary" icon={Plus} onClick={() => openNew()}>New event</Button>}>Add an event, or import your Google calendar.</EmptyState></Card>
          ) : (
            <Card>
              <div style={{ display: "grid", gap: 18 }}>
                {agendaDays.map((d) => (
                  <section key={d.toISOString()}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sameDay(d, new Date()) ? "var(--link)" : "var(--dim)", marginBottom: 6 }}>
                      {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>{itemsOn(d).map((item, i) => <Pill key={i} item={item} />)}</div>
                  </section>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHead icon={CalendarDays} title={selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>
              <Button size="sm" icon={Plus} onClick={() => openNew(selected)}>Add</Button>
            </CardHead>
            {selectedItems.length === 0 ? (
              <p className="pc-muted" style={{ margin: 0 }}>Nothing on this day.</p>
            ) : (
              <ul className="pc-list" style={{ margin: "0 -8px" }}>
                {selectedItems.map((item, i) =>
                  item.kind === "event" ? (
                    <li key={i}>
                      <button className="pc-row" onClick={() => openEvent(item.event)}>
                        <span className="pc-dot" style={{ background: colorFor(item.event.category) }} />
                        <span className="grow"><b>{item.event.title}</b><small>{timeLabel(item.event)}{item.event.location ? ` · ${item.event.location}` : ""}</small></span>
                        {item.event.meetingLink && <Badge tone="blue"><Video size={10} /> Meet</Badge>}
                      </button>
                    </li>
                  ) : (
                    <li key={i}>
                      <button className="pc-row" onClick={() => openTask(item.task)}>
                        <CheckSquare size={14} className="pc-dim" />
                        <span className="grow"><b>{item.task.title}</b><small>Task due · {item.task.project?.name}</small></span>
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <EventModal open={modal.open} event={modal.event} initialDate={modal.date} onClose={() => setModal((m) => ({ ...m, open: false }))} onChanged={load} />
    </Layout>
  );
};

export default CalendarPage;
