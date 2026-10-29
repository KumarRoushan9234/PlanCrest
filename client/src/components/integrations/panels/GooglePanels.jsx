import { useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Download, ExternalLink, FileText, FolderPlus, Image as ImageIcon, Inbox, Link2, Mail, Plus, Search, Send, Table, Video } from "lucide-react";
import { integrationsApi } from "../../../services/integrationsApi";
import { Badge, Button, Card, CardHead, CopyButton, EmptyState, Field, Seg, Skeleton, Tabs, formatDate } from "../../ui";
import { ErrorLine, ProjectSelect, ReconnectBanner, fmtDateTime, useAsync, useConnectorActions } from "../panelKit";

// ── Google Calendar ─────────────────────────────────────────────────────────

export function GoogleCalendarPanel({ connector, onChanged, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const [selected, setSelected] = useState(connector.settings.options?.calendarId || "primary");
  const [importing, setImporting] = useState(false);
  const calendars = useAsync(() => run("calendars", {}, { silent: true }), [connector._id]);
  const events = useAsync(() => run("events", { calendarId: selected, days: 30 }, { silent: true }), [connector._id, selected]);

  const choose = async (id) => {
    setSelected(id);
    await run("set_calendar", { calendarId: id }).catch(() => {});
    onChanged();
  };

  const importNow = async () => {
    setImporting(true);
    try {
      const r = await run("import_events", { calendarId: selected, days: 60 });
      toast.success(`Imported ${r.created} new, updated ${r.updated}`);
    } catch {
      /* toast already shown */
    } finally {
      setImporting(false);
    }
  };

  const setting = async (settings) => {
    await integrationsApi.update(connector._id, { settings }).catch((e) => toast.error(e.error));
    onChanged();
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card>
        <CardHead icon={CalendarDays} title="Calendar">
          <Button size="sm" icon={Download} loading={importing} onClick={importNow}>Import next 60 days</Button>
        </CardHead>
        <Field label="Google calendar to sync with" hint="Imported events appear in your PlanCrest calendar. New PlanCrest events can be pushed here.">
          <select className="pc-select" value={selected} onChange={(e) => choose(e.target.value)} disabled={calendars.loading}>
            {(calendars.data?.calendars || [{ id: "primary", name: "Primary calendar" }]).map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.primary ? " (primary)" : ""}</option>
            ))}
          </select>
        </Field>
        <div className="pc-divider" />
        <div style={{ display: "grid", gap: 10 }}>
          <label className="pc-check">
            <input type="checkbox" checked={connector.settings.autoSync !== false} onChange={(e) => setting({ autoSync: e.target.checked })} />
            Automatically push new PlanCrest events to Google
          </label>
          <Field label="Direction">
            <Seg value={connector.settings.syncDirection || "bidirectional"} onChange={(v) => setting({ syncDirection: v })} options={[{ value: "bidirectional", label: "Both ways" }, { value: "import", label: "Import only" }, { value: "export", label: "Export only" }]} />
          </Field>
        </div>
      </Card>

      <Card pad={false} flush>
        <CardHead icon={CalendarDays} title="Coming up in Google" pad />
        {events.loading ? (
          <div style={{ padding: 16 }}><Skeleton h={120} /></div>
        ) : events.error ? (
          <div style={{ padding: 16 }}><ErrorLine error={events.error} /></div>
        ) : !events.data?.events.length ? (
          <EmptyState icon={CalendarDays} title="Nothing in the next 30 days">Events from this calendar will be listed here.</EmptyState>
        ) : (
          <ul className="pc-list" style={{ padding: "0 8px 8px" }}>
            {events.data.events.map((e) => (
              <li key={e.id} className="pc-row" style={{ cursor: "default" }}>
                <span className="grow">
                  <b>{e.title}</b>
                  <small>{e.allDay ? `${formatDate(e.start)} · all day` : fmtDateTime(e.start)}{e.location ? ` · ${e.location}` : ""}</small>
                </span>
                {e.meetLink && <a className="pc-btn sm" href={e.meetLink} target="_blank" rel="noreferrer"><Video size={12} /> Join</a>}
                <a className="pc-btn ghost icon sm" href={e.link} target="_blank" rel="noreferrer" aria-label="Open in Google Calendar"><ExternalLink size={13} /></a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ── Google Drive ────────────────────────────────────────────────────────────

const fileIcon = (mime = "") => (mime.startsWith("image/") ? ImageIcon : mime.includes("spreadsheet") ? Table : FileText);

export function GoogleDrivePanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [projectId, setProjectId] = useState("");
  const [busyId, setBusyId] = useState(null);
  const files = useAsync(() => run("files", { q: term }, { silent: true }), [connector._id, term]);

  const link = async (file) => {
    setBusyId(file.id);
    try {
      const r = await run("link_file", { fileId: file.id, projectId: projectId || undefined });
      toast.success(r.linked ? `Added “${file.name}” to Documents` : "Already in Documents");
    } catch {
      /* toast already shown */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card pad={false} flush>
        <CardHead icon={FileText} title="Your Drive" pad />
        <form className="pc-toolbar" style={{ padding: "0 16px 12px" }} onSubmit={(e) => { e.preventDefault(); setTerm(q); }}>
          <label className="pc-search" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name" />
          </label>
          <ProjectSelect value={projectId} onChange={setProjectId} placeholder="Workspace-wide" />
        </form>
        {files.loading ? (
          <div style={{ padding: 16 }}><Skeleton h={180} /></div>
        ) : files.error ? (
          <div style={{ padding: 16 }}><ErrorLine error={files.error} /></div>
        ) : !files.data?.files.length ? (
          <EmptyState icon={FileText} title="No files found">Try another search.</EmptyState>
        ) : (
          <div className="pc-table-wrap">
            <table className="pc-table">
              <thead><tr><th>Name</th><th>Owner</th><th>Modified</th><th className="r" /></tr></thead>
              <tbody>
                {files.data.files.map((f) => {
                  const Icon = fileIcon(f.mimeType);
                  return (
                    <tr key={f.id}>
                      <td><span className="inline-flex items-center gap-2"><Icon size={15} className="pc-dim" />{f.name}</span></td>
                      <td className="pc-muted">{f.owners?.[0]?.displayName}</td>
                      <td className="pc-dim">{formatDate(f.modifiedTime, { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="r" style={{ whiteSpace: "nowrap" }}>
                        <Button size="sm" icon={FolderPlus} loading={busyId === f.id} onClick={() => link(f)}>Add to Documents</Button>{" "}
                        <a className="pc-btn ghost icon sm" href={f.webViewLink} target="_blank" rel="noreferrer" aria-label={`Open ${f.name} in Drive`}><ExternalLink size={13} /></a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Google Meet ─────────────────────────────────────────────────────────────

const localInput = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function GoogleMeetPanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const soon = new Date(Math.ceil(Date.now() / 1800000) * 1800000);
  const [form, setForm] = useState({ title: "", start: localInput(soon), end: localInput(new Date(soon.getTime() + 1800000)), attendees: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (instant) => {
    setBusy(true);
    try {
      const r = await run("create_meeting", {
        title: form.title || (instant ? "Quick meeting" : "Meeting"),
        startDate: new Date(form.start).toISOString(),
        endDate: new Date(form.end).toISOString(),
        attendees: form.attendees.split(/[,;\s]+/).filter(Boolean),
        description: form.description,
        instant,
      });
      setResult(r);
      toast.success("Meeting created");
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Card>
        <CardHead icon={Video} title="Create a meeting">
          <Button size="sm" icon={Video} loading={busy} onClick={() => create(true)}>Start instant meeting</Button>
        </CardHead>
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Title"><input className="pc-input" value={form.title} onChange={set("title")} placeholder="Weekly sync" /></Field>
          <div className="pc-grid pc-cols-2">
            <Field label="Starts"><input type="datetime-local" className="pc-input" value={form.start} onChange={set("start")} /></Field>
            <Field label="Ends"><input type="datetime-local" className="pc-input" value={form.end} onChange={set("end")} /></Field>
          </div>
          <Field label="Invite by email" hint="Separate addresses with commas. Google sends the invitations."><input className="pc-input" value={form.attendees} onChange={set("attendees")} placeholder="priya@company.com, sam@company.com" /></Field>
          <Field label="Description"><textarea className="pc-textarea" value={form.description} onChange={set("description")} /></Field>
          <div><Button variant="primary" icon={Plus} loading={busy} onClick={() => create(false)}>Schedule meeting</Button></div>
        </div>
      </Card>
      {result && (
        <Card glow>
          <CardHead icon={Link2} title="Meeting ready" tone="green" />
          <p className="pc-muted" style={{ margin: "0 0 12px" }}>It's on your Google Calendar and in PlanCrest's calendar.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <code className="pc-mono" style={{ padding: "6px 10px", border: "1px solid var(--line-2)", borderRadius: 6 }}>{result.meetLink}</code>
            <CopyButton text={result.meetLink} label="Copy link" />
            <a className="pc-btn primary sm" href={result.meetLink} target="_blank" rel="noreferrer"><Video size={13} /> Join</a>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Gmail ───────────────────────────────────────────────────────────────────

export function GmailPanel({ connector, onReconnect }) {
  const { run, needsReconnect } = useConnectorActions(connector);
  const [tab, setTab] = useState("inbox");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("in:inbox");
  const [taskFor, setTaskFor] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [mail, setMail] = useState({ to: "", cc: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const inbox = useAsync(() => run("messages", { q: term, max: 20 }, { silent: true }), [connector._id, term]);

  const createTask = async () => {
    if (!projectId) return toast.error("Choose a project");
    try {
      const r = await run("create_task", { messageId: taskFor, projectId });
      toast.success(r.created ? `Created ${r.tasks[0]?.taskKey}` : "A task for this email already exists");
      setTaskFor(null);
    } catch {
      /* toast already shown */
    }
  };

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await run("send", mail);
      toast.success("Email sent");
      setMail({ to: "", cc: "", subject: "", body: "" });
    } catch {
      /* toast already shown */
    } finally {
      setSending(false);
    }
  };

  const sender = (from) => from.replace(/<.*>/, "").replace(/"/g, "").trim() || from;

  return (
    <div className="pc-stack">
      <ReconnectBanner show={needsReconnect} onReconnect={onReconnect} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "inbox", label: "Inbox", icon: <Inbox size={14} /> }, { value: "compose", label: "Compose", icon: <Mail size={14} /> }]} />

      {tab === "inbox" ? (
        <Card pad={false} flush>
          <form className="pc-toolbar" style={{ padding: 12 }} onSubmit={(e) => { e.preventDefault(); setTerm(q || "in:inbox"); }}>
            <label className="pc-search" style={{ flex: 1 }}>
              <Search size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail, e.g. from:priya is:unread" />
            </label>
            <Button type="submit">Search</Button>
          </form>
          {inbox.loading ? (
            <div style={{ padding: 16 }}><Skeleton h={200} /></div>
          ) : inbox.error ? (
            <div style={{ padding: 16 }}><ErrorLine error={inbox.error} /></div>
          ) : !inbox.data?.messages.length ? (
            <EmptyState icon={Inbox} title="No messages">Nothing matches that search.</EmptyState>
          ) : (
            <ul className="pc-list">
              {inbox.data.messages.map((m) => (
                <li key={m.id} className="pc-row" style={{ cursor: "default", padding: "10px 16px", borderTop: "1px solid var(--line)", borderRadius: 0, alignItems: "flex-start" }}>
                  {m.unread && <span className="pc-dot" style={{ background: "var(--link)", marginTop: 6 }} />}
                  <span className="grow">
                    <b style={{ whiteSpace: "normal" }}>{sender(m.from)}</b>
                    <b style={{ fontWeight: 400, whiteSpace: "normal" }}>{m.subject}</b>
                    <small style={{ whiteSpace: "normal" }}>{m.snippet}</small>
                  </span>
                  {taskFor === m.id ? (
                    <span style={{ display: "flex", gap: 6 }}>
                      <ProjectSelect value={projectId} onChange={setProjectId} />
                      <Button size="sm" variant="primary" onClick={createTask}>Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => setTaskFor(null)}>Cancel</Button>
                    </span>
                  ) : (
                    <Button size="sm" icon={Plus} onClick={() => setTaskFor(m.id)}>Create task</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card>
          <form onSubmit={send} style={{ display: "grid", gap: 14 }}>
            <div className="pc-grid pc-cols-2">
              <Field label="To"><input className="pc-input" value={mail.to} onChange={(e) => setMail((m) => ({ ...m, to: e.target.value }))} placeholder="name@company.com" required /></Field>
              <Field label="Cc"><input className="pc-input" value={mail.cc} onChange={(e) => setMail((m) => ({ ...m, cc: e.target.value }))} /></Field>
            </div>
            <Field label="Subject"><input className="pc-input" value={mail.subject} onChange={(e) => setMail((m) => ({ ...m, subject: e.target.value }))} /></Field>
            <Field label="Message"><textarea className="pc-textarea" style={{ minHeight: 160 }} value={mail.body} onChange={(e) => setMail((m) => ({ ...m, body: e.target.value }))} required /></Field>
            <div><Button type="submit" variant="primary" icon={Send} loading={sending}>Send</Button> <Badge>Sent from {connector.account?.email}</Badge></div>
          </form>
        </Card>
      )}
    </div>
  );
}
