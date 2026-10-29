import CalendarEvent from "../models/calendarEvent.js";
import Connector from "../models/connector.js";
import { gcall, pushEventToGoogle } from "./providers/google.js";

const CAL = "https://www.googleapis.com/calendar/v3";

const personalConnector = (userId) => Connector.findOne({ user: userId, type: "google_calendar", scope: "personal", status: "active" });

/** Auto-sync means "on, and not import-only". */
const wantsExport = (connector) => connector.settings?.autoSync !== false && connector.settings?.syncDirection !== "import";

const later = (fn) =>
  setImmediate(async () => {
    try {
      await fn();
    } catch (error) {
      console.error("Calendar sync failed:", error.message);
    }
  });

const markFailed = (eventId, message) => CalendarEvent.findByIdAndUpdate(eventId, { syncStatus: "failed", syncError: message }).catch(() => {});

const emailsOf = (event) => (event.attendees || []).map((a) => a.user?.email).filter(Boolean);

/** A new PlanCrest event: push it to Google if asked to, or if auto-sync is on. */
export const syncNewEventToGoogle = (eventId, userId, { force = false } = {}) =>
  later(async () => {
    const connector = await personalConnector(userId);
    if (!connector) {
      if (force) await markFailed(eventId, "Connect Google Calendar in Integrations to sync events.");
      return;
    }
    if (!force && !wantsExport(connector)) return;
    const event = await CalendarEvent.findById(eventId).populate("attendees.user", "email");
    if (!event) return;
    try {
      await pushEventToGoogle(connector, event, emailsOf(event));
    } catch (error) {
      await markFailed(eventId, error.message);
    }
  });

/** An edited event that already lives in Google gets updated there too. */
export const syncEventUpdateToGoogle = (eventId, userId) =>
  later(async () => {
    const event = await CalendarEvent.findById(eventId).populate("attendees.user", "email");
    if (!event || event.externalProvider !== "google" || !event.externalCalendarId) return;
    const connector = await personalConnector(event.createdBy);
    if (!connector || String(event.createdBy) !== String(userId) || !wantsExport(connector)) return;
    try {
      await pushEventToGoogle(connector, event, emailsOf(event));
    } catch (error) {
      await markFailed(eventId, error.message);
    }
  });

/** Deleting a synced event removes the Google copy, if the creator's connection is available. */
export const deleteEventFromGoogle = (event, userId) =>
  later(async () => {
    if (event.externalProvider !== "google" || !event.externalCalendarId || String(event.createdBy?._id ?? event.createdBy) !== String(userId)) return;
    const connector = await personalConnector(userId);
    if (!connector) return;
    const calendarId = encodeURIComponent(connector.settings?.options?.calendarId || "primary");
    await gcall(connector, { method: "DELETE", url: `${CAL}/calendars/${calendarId}/events/${event.externalCalendarId}` }).catch(() => {});
  });

/** An attendee accepted an invitation: put a copy on their own Google calendar. */
export const addAcceptedEventToGoogle = (eventId, userId) =>
  later(async () => {
    const connector = await personalConnector(userId);
    if (!connector || !wantsExport(connector)) return;
    const event = await CalendarEvent.findById(eventId).populate("createdBy", "name email");
    if (!event || String(event.createdBy?._id) === String(userId)) return; // organizers already have it
    const body = {
      summary: event.title,
      description: `${event.description || ""}\n\nOrganizer: ${event.createdBy?.name} (${event.createdBy?.email})${event.meetingLink ? `\nMeeting link: ${event.meetingLink}` : ""}`.trim(),
      location: event.location || undefined,
      start: { dateTime: new Date(event.startDate).toISOString() },
      end: { dateTime: new Date(event.endDate).toISOString() },
    };
    await gcall(connector, { method: "POST", url: `${CAL}/calendars/primary/events`, data: body });
  });
