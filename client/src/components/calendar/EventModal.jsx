import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Trash2, Video } from "lucide-react";
import { calendarService } from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Avatar, Badge, Button, Field, Modal } from "../ui";
import { CATEGORIES } from "./calendarUtils";

const toLocal = (value, allDay) => {
  const d = new Date(value);
  const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return allDay ? shifted.slice(0, 10) : shifted.slice(0, 16);
};

const blank = (date) => {
  const start = new Date(date);
  start.setHours(Math.max(9, new Date().getHours() + 1), 0, 0, 0);
  return { title: "", description: "", allDay: false, start: toLocal(start), end: toLocal(new Date(start.getTime() + 3600000)), location: "", meetingLink: "", project: "", category: "meeting", attendees: [], sendInvitations: false, syncToGoogleCalendar: false };
};

/** Create, edit, RSVP to and delete a calendar event. */
export default function EventModal({ open, onClose, event, initialDate, onChanged }) {
  const { user } = useAuth();
  const { currentWorkspace, workspaceMembers } = useWorkspace();
  const { projects } = useProject();
  const editing = Boolean(event?._id);
  const [form, setForm] = useState(blank(new Date()));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        allDay: Boolean(event.allDay),
        start: toLocal(event.startDate, event.allDay),
        end: toLocal(event.endDate, event.allDay),
        location: event.location || "",
        meetingLink: event.meetingLink || "",
        project: event.project?._id || "",
        category: event.category || "meeting",
        attendees: (event.attendees || []).map((a) => a.user?._id).filter(Boolean),
        sendInvitations: false,
        syncToGoogleCalendar: false,
      });
    } else {
      setForm(blank(initialDate || new Date()));
    }
  }, [open, editing, event, initialDate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const people = useMemo(() => workspaceMembers.map((m) => m.user).filter((u) => u && u._id !== user?._id), [workspaceMembers, user?._id]);
  const myRsvp = event?.attendees?.find((a) => a.user?._id === user?._id);

  const toggleAttendee = (id) => setForm((f) => ({ ...f, attendees: f.attendees.includes(id) ? f.attendees.filter((x) => x !== id) : [...f.attendees, id] }));

  const payload = () => {
    const startDate = new Date(form.allDay ? `${form.start}T00:00:00` : form.start);
    const endDate = new Date(form.allDay ? `${form.end || form.start}T23:59:59` : form.end);
    return {
      title: form.title.trim(),
      description: form.description,
      allDay: form.allDay,
      startDate,
      endDate,
      location: form.location,
      meetingLink: form.meetingLink,
      category: form.category,
      project: form.project || undefined,
      attendees: form.attendees.map((id) => ({ user: id })),
      sendInvitations: form.sendInvitations,
      syncToGoogleCalendar: form.syncToGoogleCalendar,
    };
  };

  const save = async (e) => {
    e?.preventDefault();
    const data = payload();
    if (!data.title) return toast.error("Give the event a title");
    if (!(data.endDate >= data.startDate)) return toast.error("The end can't be before the start");
    setBusy(true);
    try {
      if (editing) await calendarService.updateEvent(event._id, data);
      else await calendarService.createEvent(currentWorkspace._id, data);
      toast.success(editing ? "Event updated" : "Event created");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err?.error || "Couldn't save the event");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await calendarService.deleteEvent(event._id);
      toast.success("Event deleted");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err?.error || "Couldn't delete the event");
    }
  };

  const respond = async (response) => {
    try {
      await calendarService.respondToEvent(currentWorkspace._id, event._id, response);
      toast.success(`Marked as ${response}`);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err?.error || "Couldn't update your response");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Event" : "New event"}
      size="wide"
      footer={
        <>
          {editing && <Button variant="danger" icon={Trash2} onClick={remove} style={{ marginRight: "auto" }}>Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>{editing ? "Save changes" : "Create event"}</Button>
        </>
      }
    >
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <Field label="Title"><input className="pc-input lg" autoFocus value={form.title} onChange={set("title")} placeholder="Sprint planning" maxLength={200} /></Field>

        {myRsvp && (
          <div className="pc-banner info" style={{ gap: 10 }}>
            <span style={{ flex: 1 }}>You're invited. Your response: <b>{myRsvp.response || "pending"}</b></span>
            {["accepted", "tentative", "declined"].map((r) => <Button key={r} size="sm" onClick={() => respond(r)}>{r === "accepted" ? "Accept" : r === "declined" ? "Decline" : "Maybe"}</Button>)}
          </div>
        )}

        <label className="pc-check"><input type="checkbox" checked={form.allDay} onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked, start: toLocal(f.start, e.target.checked), end: toLocal(f.end, e.target.checked) }))} /> All day</label>
        <div className="pc-grid pc-cols-2">
          <Field label="Starts"><input type={form.allDay ? "date" : "datetime-local"} className="pc-input" value={form.start} onChange={set("start")} /></Field>
          <Field label="Ends"><input type={form.allDay ? "date" : "datetime-local"} className="pc-input" value={form.end} onChange={set("end")} /></Field>
        </div>
        <div className="pc-grid pc-cols-2">
          <Field label="Type">
            <select className="pc-select" value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Project (optional)">
            <select className="pc-select" value={form.project} onChange={set("project")}>
              <option value="">None</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="pc-grid pc-cols-2">
          <Field label="Location"><input className="pc-input" value={form.location} onChange={set("location")} placeholder="Room or address" /></Field>
          <Field label="Meeting link">
            <input className="pc-input" value={form.meetingLink} onChange={set("meetingLink")} placeholder="https://meet.google.com/…" />
          </Field>
        </div>
        <Field label="Description"><textarea className="pc-textarea" value={form.description} onChange={set("description")} /></Field>

        <Field label={`Attendees${form.attendees.length ? ` · ${form.attendees.length}` : ""}`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {people.length === 0 && <span className="pc-dim">No one else in this workspace yet.</span>}
            {people.map((p) => (
              <button type="button" key={p._id} className={`pc-chip ${form.attendees.includes(p._id) ? "on" : ""}`} onClick={() => toggleAttendee(p._id)} aria-pressed={form.attendees.includes(p._id)}>
                <Avatar user={p} size="sm" /> {p.name}
              </button>
            ))}
          </div>
        </Field>

        {!editing && (
          <div style={{ display: "grid", gap: 8 }}>
            <label className="pc-check"><input type="checkbox" checked={form.sendInvitations} onChange={set("sendInvitations")} /> Email invitations to attendees</label>
            <label className="pc-check"><input type="checkbox" checked={form.syncToGoogleCalendar} onChange={set("syncToGoogleCalendar")} /> Also add to my Google Calendar <Badge>needs the Google Calendar integration</Badge></label>
          </div>
        )}
        {editing && event.externalProvider === "google" && <Badge tone="blue"><Video size={11} /> Synced with Google Calendar</Badge>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
