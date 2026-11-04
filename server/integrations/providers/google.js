import crypto from "crypto";
import Attachment from "../../models/attachment.js";
import CalendarEvent from "../../models/calendarEvent.js";
import { HttpError } from "../../utils/workspaceAccess.js";
import { bearer, call } from "../http.js";
import { refreshGoogleAccessToken } from "../oauth.js";
import { markError, markSynced } from "../store.js";
import { importAsTasks } from "../taskImport.js";

const CAL = "https://www.googleapis.com/calendar/v3";
const DRIVE = "https://www.googleapis.com/drive/v3";
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

/** A valid access token, refreshed automatically when it is about to expire. */
export const googleToken = async (connector, force = false) => {
  const { accessToken, refreshToken, expiryDate } = connector.config;
  if (!force && accessToken && (!expiryDate || expiryDate > Date.now() + 60_000)) return accessToken;

  if (!refreshToken) {
    await markError(connector, "Reconnect needed: no refresh token");
    throw new HttpError(424, "Google access expired. Please reconnect your account.");
  }
  try {
    const fresh = await refreshGoogleAccessToken(refreshToken);
    connector.config.accessToken = fresh.accessToken;
    connector.config.expiryDate = fresh.expiryDate;
    if (connector.status === "error") connector.status = "active";
    await connector.save();
    return fresh.accessToken;
  } catch {
    await markError(connector, "Reconnect needed: Google refused the refresh");
    throw new HttpError(424, "Google access expired. Please reconnect your account.");
  }
};

/** Call a Google API with the connector's token; retries once after a forced refresh. */
export const gcall = async (connector, config) => {
  const run = async (force) => call({ ...config, headers: { ...bearer(await googleToken(connector, force)), ...config.headers } });
  try {
    return await run(false);
  } catch (error) {
    if (error.status === 424) return run(true);
    throw error;
  }
};

// ── Calendar ────────────────────────────────────────────────────────────────

const eventTimes = (e) => {
  const allDay = Boolean(e.start?.date);
  const start = new Date(e.start?.dateTime || e.start?.date);
  let end = new Date(e.end?.dateTime || e.end?.date || start);
  // Google's all-day end date is exclusive
  if (allDay) end = new Date(end.getTime() - 1000);
  if (!(end >= start)) end = new Date(start.getTime() + 3600_000);
  return { allDay, start, end };
};

const normalizeEvent = (e) => {
  const { allDay, start, end } = eventTimes(e);
  return {
    id: e.id,
    title: e.summary || "(No title)",
    description: e.description || "",
    location: e.location || "",
    link: e.htmlLink,
    meetLink: e.hangoutLink,
    allDay,
    start,
    end,
    status: e.status,
    attendees: (e.attendees || []).map((a) => a.email),
  };
};

const toGoogleEvent = (event, attendeeEmails = []) => {
  const base = { summary: event.title, description: event.description || undefined, location: event.location || undefined };
  if (event.allDay) {
    const day = (d) => new Date(d).toISOString().slice(0, 10);
    const endExclusive = new Date(new Date(event.endDate).getTime() + 86400_000);
    return { ...base, start: { date: day(event.startDate) }, end: { date: day(endExclusive) } };
  }
  const tz = event.timezone && event.timezone !== "UTC" ? event.timezone : "UTC";
  return {
    ...base,
    start: { dateTime: new Date(event.startDate).toISOString(), timeZone: tz },
    end: { dateTime: new Date(event.endDate).toISOString(), timeZone: tz },
    attendees: attendeeEmails.map((email) => ({ email })),
  };
};

/** Create or update the Google copy of a PlanCrest event. Also used for auto-sync. */
export const pushEventToGoogle = async (connector, event, attendeeEmails = []) => {
  const calendarId = encodeURIComponent(connector.settings?.options?.calendarId || "primary");
  const body = toGoogleEvent(event, attendeeEmails);
  const updating = Boolean(event.externalCalendarId && event.externalProvider === "google");
  const url = updating ? `${CAL}/calendars/${calendarId}/events/${event.externalCalendarId}` : `${CAL}/calendars/${calendarId}/events`;
  const created = await gcall(connector, { method: updating ? "PUT" : "POST", url, data: body });

  event.externalCalendarId = created.id;
  event.externalProvider = "google";
  event.syncStatus = "synced";
  event.lastSyncedAt = new Date();
  event.syncError = undefined;
  if (created.hangoutLink && !event.meetingLink) event.meetingLink = created.hangoutLink;
  await event.save();
  return created;
};

const calendarActions = {
  async calendars(ctx) {
    const data = await gcall(ctx.connector, { url: `${CAL}/users/me/calendarList` });
    return {
      calendars: (data.items || []).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary, primary: Boolean(c.primary), color: c.backgroundColor, access: c.accessRole })),
      selected: ctx.connector.settings?.options?.calendarId || "primary",
    };
  },

  async events(ctx, { calendarId, days = 30 }) {
    const id = encodeURIComponent(calendarId || ctx.connector.settings?.options?.calendarId || "primary");
    const data = await gcall(ctx.connector, {
      url: `${CAL}/calendars/${id}/events`,
      params: {
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
        timeMin: new Date(Date.now() - 2 * 86400_000).toISOString(),
        timeMax: new Date(Date.now() + Math.min(Number(days) || 30, 180) * 86400_000).toISOString(),
      },
    });
    await markSynced(ctx.connector);
    return { events: (data.items || []).filter((e) => e.status !== "cancelled").map(normalizeEvent) };
  },

  async import_events(ctx, { calendarId, days = 60 }) {
    const { workspaceId } = await ctx.workspace();
    const { events } = await calendarActions.events(ctx, { calendarId, days });
    let created = 0;
    let updated = 0;
    for (const e of events) {
      const fields = {
        title: e.title.slice(0, 200),
        description: e.description,
        location: e.location,
        meetingLink: e.meetLink,
        startDate: e.start,
        endDate: e.end,
        allDay: e.allDay,
        externalProvider: "google",
        syncStatus: "synced",
        lastSyncedAt: new Date(),
      };
      const existing = await CalendarEvent.findOne({ workspace: workspaceId, externalCalendarId: e.id, externalProvider: "google" });
      if (existing) {
        Object.assign(existing, fields);
        await existing.save();
        updated++;
      } else {
        await CalendarEvent.create({ ...fields, workspace: workspaceId, createdBy: ctx.userId, externalCalendarId: e.id });
        created++;
      }
    }
    return { created, updated, total: events.length };
  },

  async push_event(ctx, { eventId }) {
    const { workspaceId } = await ctx.workspace();
    const event = await CalendarEvent.findOne({ _id: eventId, workspace: workspaceId }).populate("attendees.user", "email");
    if (!event) throw new HttpError(404, "Event not found");
    const emails = (event.attendees || []).map((a) => a.user?.email).filter(Boolean);
    const created = await pushEventToGoogle(ctx.connector, event, emails);
    return { id: created.id, link: created.htmlLink };
  },

  async set_calendar(ctx, { calendarId }) {
    ctx.connector.settings.options = { ...(ctx.connector.settings.options || {}), calendarId };
    ctx.connector.markModified("settings.options");
    await ctx.connector.save();
    return { selected: calendarId };
  },
};

// ── Drive ───────────────────────────────────────────────────────────────────

const driveActions = {
  async files(ctx, { q, pageToken }) {
    const clauses = ["trashed = false"];
    if (q?.trim()) clauses.push(`name contains '${q.trim().replace(/['\\]/g, "\\$&")}'`);
    const data = await gcall(ctx.connector, {
      url: `${DRIVE}/files`,
      params: {
        q: clauses.join(" and "),
        pageSize: 30,
        pageToken: pageToken || undefined,
        orderBy: "modifiedTime desc",
        fields: "nextPageToken, files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size,owners(displayName),thumbnailLink)",
      },
    });
    await markSynced(ctx.connector);
    return { files: data.files || [], nextPageToken: data.nextPageToken || null };
  },

  async link_file(ctx, { fileId, projectId }) {
    const { workspaceId } = await ctx.workspace();
    if (projectId) await ctx.project(projectId);
    const file = await gcall(ctx.connector, {
      url: `${DRIVE}/files/${encodeURIComponent(fileId)}`,
      params: { fields: "id,name,mimeType,webViewLink,size,thumbnailLink" },
    });
    const publicId = `drive:${file.id}`;
    const existing = await Attachment.findOne({ workspace: workspaceId, publicId, isDeleted: { $ne: true } });
    if (existing) return { linked: false, document: existing };

    const document = await Attachment.create({
      filename: file.name,
      originalName: file.name,
      mimeType: file.mimeType,
      size: Number(file.size) || 0,
      url: file.webViewLink,
      thumbnailUrl: file.thumbnailLink,
      provider: "google_drive",
      publicId,
      resourceType: "raw",
      attachedTo: { model: "Document", id: workspaceId },
      project: projectId || null,
      workspace: workspaceId,
      uploadedBy: ctx.userId,
    });
    return { linked: true, document };
  },
};

// ── Meet ────────────────────────────────────────────────────────────────────

const meetActions = {
  async create_meeting(ctx, { title, startDate, endDate, attendees = [], description, instant = false }) {
    const { workspaceId } = await ctx.workspace();
    const start = instant ? new Date() : new Date(startDate);
    const end = instant ? new Date(start.getTime() + 30 * 60_000) : new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new HttpError(400, "Choose a valid start and end time");
    }
    const emails = (attendees || []).map((a) => String(a).trim()).filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));

    const created = await gcall(ctx.connector, {
      method: "POST",
      url: `${CAL}/calendars/primary/events`,
      params: { conferenceDataVersion: 1, sendUpdates: emails.length ? "all" : "none" },
      data: {
        summary: title || "Meeting",
        description: description || undefined,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: emails.map((email) => ({ email })),
        conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      },
    });

    const meetLink = created.hangoutLink || created.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri;
    const event = await CalendarEvent.create({
      title: title || "Meeting",
      description,
      startDate: start,
      endDate: end,
      workspace: workspaceId,
      createdBy: ctx.userId,
      meetingLink: meetLink,
      externalCalendarId: created.id,
      externalProvider: "google",
      syncStatus: "synced",
      lastSyncedAt: new Date(),
    });
    return { meetLink, calendarLink: created.htmlLink, eventId: event._id };
  },
};

// ── Gmail ───────────────────────────────────────────────────────────────────

const header = (message, name) => message.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

const sanitizeHeader = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();

const base64url = (input) => Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const gmailActions = {
  async messages(ctx, { q, max = 15 }) {
    const list = await gcall(ctx.connector, { url: `${GMAIL}/messages`, params: { maxResults: Math.min(Number(max) || 15, 30), q: q || "in:inbox" } });
    const messages = await Promise.all(
      (list.messages || []).map(async ({ id }) => {
        const m = await gcall(ctx.connector, {
          url: `${GMAIL}/messages/${id}`,
          params: { format: "metadata", metadataHeaders: ["From", "Subject", "Date"] },
          paramsSerializer: { indexes: null },
        });
        return { id: m.id, threadId: m.threadId, from: header(m, "From"), subject: header(m, "Subject") || "(no subject)", date: header(m, "Date"), snippet: m.snippet, unread: (m.labelIds || []).includes("UNREAD") };
      })
    );
    await markSynced(ctx.connector);
    return { messages };
  },

  async send(ctx, { to, cc, subject, body }) {
    const recipients = String(to || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!recipients.length || recipients.some((r) => !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(r))) {
      throw new HttpError(400, "Enter at least one valid recipient email address");
    }
    if (!body?.trim()) throw new HttpError(400, "The message is empty");

    const lines = [
      `To: ${recipients.map(sanitizeHeader).join(", ")}`,
      cc ? `Cc: ${sanitizeHeader(cc)}` : null,
      `Subject: =?UTF-8?B?${Buffer.from(sanitizeHeader(subject) || "(no subject)", "utf8").toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].filter((l) => l !== null);

    const sent = await gcall(ctx.connector, { method: "POST", url: `${GMAIL}/messages/send`, data: { raw: base64url(lines.join("\r\n")) } });
    return { id: sent.id };
  },

  async create_task(ctx, { messageId, projectId }) {
    await ctx.project(projectId);
    const m = await gcall(ctx.connector, { url: `${GMAIL}/messages/${messageId}`, params: { format: "metadata", metadataHeaders: ["From", "Subject"], paramsSerializer: { indexes: null } } });
    const subject = header(m, "Subject") || "(no subject)";
    return importAsTasks({
      userId: ctx.userId,
      projectId,
      provider: "gmail",
      items: [
        {
          externalId: m.id,
          title: subject,
          description: `From: ${header(m, "From")}\n\n${m.snippet || ""}`,
          url: `https://mail.google.com/mail/u/0/#all/${m.id}`,
        },
      ],
    });
  },
};

export const actionsFor = (providerId) =>
  ({
    google_calendar: calendarActions,
    google_drive: driveActions,
    google_meet: meetActions,
    gmail: gmailActions,
  })[providerId];
