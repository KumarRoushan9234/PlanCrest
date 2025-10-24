import CalendarEvent from "../models/calendarEvent.js";
import CalendarIntegration from "../models/calendarIntegration.js";
import CalendarShare from "../models/calendarShare.js";
import {
  generateRecurringEvents,
  calculateEventConflicts,
  updateEventAttendees,
  exportCalendarData,
  syncGoogleCalendar,
  syncOutlookCalendar,
  getUserAvailability,
  findOptimalMeetingTime,
} from "../utils/calendarHelpers.js";
import { sendCalendarEventEmail } from "../utils/emailTemplates.js";
import { createCalendarNotification } from "../utils/notificationHelpers.js";

/**
 * Get calendar events for a workspace
 * GET /api/workspaces/:workspaceId/calendar/events
 */
export const getCalendarEvents = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { startDate, endDate, category, status, projectId } = req.query;
    const userId = req.auth._id;

    console.log(`\n📅 Fetching calendar events for workspace: ${workspaceId}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    const query = {
      workspace: workspaceId,
      isArchived: false,
    };

    // Date range filter
    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Project filter
    if (projectId) {
      query.project = projectId;
    }

    const events = await CalendarEvent.find(query)
      .populate("createdBy", "name email")
      .populate("attendees.user", "name email avatar")
      .populate("project", "name key")
      .sort({ startDate: 1 });

    console.log(`✅ Found ${events.length} calendar events`);

    // Generate recurring event instances if date range is provided
    let allEvents = events;
    if (startDate && endDate) {
      allEvents = events.flatMap((event) =>
        generateRecurringEvents(event, new Date(startDate), new Date(endDate))
      );
    }

    res.json({
      success: true,
      data: allEvents,
      count: allEvents.length,
    });
  } catch (error) {
    console.error("❌ Error fetching calendar events:", error.message);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
};

/**
 * Create calendar event
 * POST /api/workspaces/:workspaceId/calendar/events
 */
export const createCalendarEvent = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.auth._id;
    const eventData = req.body;

    console.log(`\n📅 Creating calendar event: ${eventData.title}`);
    console.log(`🏢 Workspace: ${workspaceId}`);

    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create event
    const event = new CalendarEvent({
      ...eventData,
      workspace: workspaceId,
      createdBy: userId,
    });

    await event.save();

    console.log(`✅ Calendar event created with ID: ${event._id}`);

    // Populate for response
    await event.populate("createdBy attendees.user project");

    // Send notifications to attendees
    if (event.attendees && event.attendees.length > 0) {
      console.log(`📧 Sending event notifications to ${event.attendees.length} attendees`);

      for (const attendee of event.attendees) {
        try {
          // Send email
          const Workspace = (await import("../models/workspace.js")).default;
          const workspace = await Workspace.findById(workspaceId);

          await sendCalendarEventEmail({
            event,
            workspace,
            attendee: attendee.user,
            creator: event.createdBy,
          });

          // Create in-app notification
          await createCalendarNotification({
            event,
            recipient: attendee.user._id,
            sender: userId,
            type: "event_created",
            workspace: workspaceId,
          });
        } catch (notifError) {
          console.error(`⚠️ Failed to notify ${attendee.user.email}:`, notifError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error creating calendar event:", error.message);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
};

/**
 * Update calendar event
 * PUT /api/calendar/events/:eventId
 */
export const updateCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth._id;
    const updates = req.body;

    console.log(`\n📅 Updating calendar event: ${eventId}`);

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      console.log(`⚠️ Event not found`);
      return res.status(404).json({ error: "Event not found" });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "_id" && key !== "workspace") {
        event[key] = updates[key];
      }
    });

    event.lastEditedBy = userId;
    await event.save();

    console.log(`✅ Calendar event updated successfully`);

    await event.populate("createdBy attendees.user project");

    // Notify attendees of changes
    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        try {
          await createCalendarNotification({
            event,
            recipient: attendee.user._id,
            sender: userId,
            type: "event_updated",
            workspace: event.workspace,
            customMessage: `Event updated: ${event.title}`,
          });
        } catch (error) {
          console.error(`⚠️ Failed to notify attendee:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error updating calendar event:", error.message);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
};

/**
 * Delete calendar event
 * DELETE /api/calendar/events/:eventId
 */
export const deleteCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth._id;

    console.log(`\n🗑️ Deleting calendar event: ${eventId}`);

    const event = await CalendarEvent.findById(eventId).populate("attendees.user");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Notify attendees of cancellation
    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        try {
          await createCalendarNotification({
            event,
            recipient: attendee.user._id,
            sender: userId,
            type: "event_cancelled",
            workspace: event.workspace,
            customMessage: `Event cancelled: ${event.title}`,
          });
        } catch (error) {
          console.error(`⚠️ Failed to notify attendee:`, error.message);
        }
      }
    }

    await CalendarEvent.findByIdAndDelete(eventId);

    console.log(`✅ Calendar event deleted successfully`);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting calendar event:", error.message);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
};

/**
 * Get event attendees
 * GET /api/calendar/events/:eventId/attendees
 */
export const getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`\n👥 Fetching attendees for event: ${eventId}`);

    const event = await CalendarEvent.findById(eventId).populate("attendees.user", "name email avatar");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    console.log(`✅ Found ${event.attendees.length} attendees`);

    res.json({
      success: true,
      data: event.attendees,
    });
  } catch (error) {
    console.error("❌ Error fetching event attendees:", error.message);
    res.status(500).json({ error: "Failed to fetch event attendees" });
  }
};

/**
 * Add event attendee
 * POST /api/calendar/events/:eventId/attendees
 */
export const addEventAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId: attendeeUserId } = req.body;
    const userId = req.auth._id;

    console.log(`\n➕ Adding attendee to event: ${eventId}`);
    console.log(`👤 Attendee: ${attendeeUserId}`);

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already an attendee
    const existing = event.attendees.find((a) => a.user.toString() === attendeeUserId);
    if (existing) {
      return res.status(400).json({ error: "User is already an attendee" });
    }

    // Add attendee
    event.attendees.push({
      user: attendeeUserId,
      response: "pending",
    });

    await event.save();
    await event.populate("createdBy attendees.user");

    console.log(`✅ Attendee added successfully`);

    // Notify the new attendee
    try {
      const Workspace = (await import("../models/workspace.js")).default;
      const User = (await import("../models/user.js")).default;

      const [workspace, attendee] = await Promise.all([
        Workspace.findById(event.workspace),
        User.findById(attendeeUserId),
      ]);

      await sendCalendarEventEmail({
        event,
        workspace,
        attendee,
        creator: event.createdBy,
      });

      await createCalendarNotification({
        event,
        recipient: attendeeUserId,
        sender: userId,
        type: "event_created",
        workspace: event.workspace,
      });
    } catch (error) {
      console.error(`⚠️ Failed to notify new attendee:`, error.message);
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error adding event attendee:", error.message);
    res.status(500).json({ error: "Failed to add event attendee" });
  }
};

/**
 * Remove event attendee
 * DELETE /api/calendar/events/:eventId/attendees/:userId
 */
export const removeEventAttendee = async (req, res) => {
  try {
    const { eventId, userId: attendeeUserId } = req.params;

    console.log(`\n➖ Removing attendee from event: ${eventId}`);

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Remove attendee
    event.attendees = event.attendees.filter((a) => a.user.toString() !== attendeeUserId);

    await event.save();

    console.log(`✅ Attendee removed successfully`);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error removing event attendee:", error.message);
    res.status(500).json({ error: "Failed to remove event attendee" });
  }
};

/**
 * Update attendee response
 * PUT /api/calendar/events/:eventId/response
 */
export const updateAttendeeResponse = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { response } = req.body;
    const userId = req.auth._id;

    console.log(`\n✅ Updating attendee response for event: ${eventId}`);
    console.log(`📝 Response: ${response}`);

    if (!["accepted", "declined", "tentative"].includes(response)) {
      return res.status(400).json({ error: "Invalid response" });
    }

    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Find and update attendee response
    const attendee = event.attendees.find((a) => a.user.toString() === userId.toString());

    if (!attendee) {
      return res.status(400).json({ error: "You are not an attendee of this event" });
    }

    attendee.response = response;
    attendee.responseAt = new Date();

    await event.save();

    console.log(`✅ Attendee response updated successfully`);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error updating attendee response:", error.message);
    res.status(500).json({ error: "Failed to update attendee response" });
  }
};

/**
 * Get calendar integrations
 * GET /api/calendar/integrations
 */
export const getCalendarIntegrations = async (req, res) => {
  try {
    const userId = req.auth._id;

    console.log(`\n🔗 Fetching calendar integrations for user: ${userId}`);

    const integrations = await CalendarIntegration.find({
      user: userId,
      isActive: true,
    }).select("-accessToken -refreshToken"); // Don't expose tokens

    console.log(`✅ Found ${integrations.length} calendar integrations`);

    res.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error("❌ Error fetching calendar integrations:", error.message);
    res.status(500).json({ error: "Failed to fetch calendar integrations" });
  }
};

/**
 * Connect Google Calendar
 * POST /api/calendar/integrations/google
 */
export const connectGoogleCalendar = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { accessToken, refreshToken, expiresIn, calendarId } = req.body;

    console.log(`\n🔗 Connecting Google Calendar for user: ${userId}`);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const integration = new CalendarIntegration({
      user: userId,
      provider: "google",
      accessToken,
      refreshToken,
      expiresAt,
      calendarId,
      isVerified: true,
    });

    await integration.save();

    console.log(`✅ Google Calendar connected successfully`);

    res.status(201).json({
      success: true,
      data: {
        ...integration.toObject(),
        accessToken: undefined,
        refreshToken: undefined,
      },
    });
  } catch (error) {
    console.error("❌ Error connecting Google Calendar:", error.message);
    res.status(500).json({ error: "Failed to connect Google Calendar" });
  }
};

/**
 * Connect Outlook Calendar
 * POST /api/calendar/integrations/outlook
 */
export const connectOutlookCalendar = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { accessToken, refreshToken, expiresIn, calendarId } = req.body;

    console.log(`\n🔗 Connecting Outlook Calendar for user: ${userId}`);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const integration = new CalendarIntegration({
      user: userId,
      provider: "outlook",
      accessToken,
      refreshToken,
      expiresAt,
      calendarId,
      isVerified: true,
    });

    await integration.save();

    console.log(`✅ Outlook Calendar connected successfully`);

    res.status(201).json({
      success: true,
      data: {
        ...integration.toObject(),
        accessToken: undefined,
        refreshToken: undefined,
      },
    });
  } catch (error) {
    console.error("❌ Error connecting Outlook Calendar:", error.message);
    res.status(500).json({ error: "Failed to connect Outlook Calendar" });
  }
};

/**
 * Sync external calendar
 * POST /api/calendar/sync
 */
export const syncExternalCalendar = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { provider, workspaceId } = req.body;

    console.log(`\n🔄 Syncing ${provider} calendar for user: ${userId}`);

    let result;
    if (provider === "google") {
      result = await syncGoogleCalendar(userId, workspaceId);
    } else if (provider === "outlook") {
      result = await syncOutlookCalendar(userId, workspaceId);
    } else {
      return res.status(400).json({ error: "Invalid provider" });
    }

    console.log(`✅ Calendar sync completed`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error syncing external calendar:", error.message);
    res.status(500).json({ error: "Failed to sync external calendar" });
  }
};

/**
 * Get user availability
 * GET /api/calendar/availability
 */
export const checkUserAvailability = async (req, res) => {
  try {
    const { userId, workspaceId, startDate, endDate } = req.query;

    console.log(`\n📊 Checking user availability`);
    console.log(`👤 User: ${userId}`);
    console.log(`📅 Range: ${startDate} to ${endDate}`);

    const availability = await getUserAvailability(userId, workspaceId, startDate, endDate);

    console.log(`✅ Availability checked successfully`);

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("❌ Error checking user availability:", error.message);
    res.status(500).json({ error: "Failed to check user availability" });
  }
};

/**
 * Find optimal meeting time
 * POST /api/calendar/find-time
 */
export const findMeetingTime = async (req, res) => {
  try {
    const { userIds, workspaceId, duration, startDate, endDate } = req.body;

    console.log(`\n🔍 Finding optimal meeting time`);
    console.log(`👥 Users: ${userIds.length}`);
    console.log(`⏱️ Duration: ${duration} minutes`);

    const slots = await findOptimalMeetingTime(userIds, workspaceId, duration, startDate, endDate);

    console.log(`✅ Found ${slots.length} available time slots`);

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("❌ Error finding meeting time:", error.message);
    res.status(500).json({ error: "Failed to find meeting time" });
  }
};

/**
 * Export calendar data
 * GET /api/workspaces/:workspaceId/calendar/export
 */
export const exportCalendar = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { startDate, endDate } = req.query;

    console.log(`\n📤 Exporting calendar for workspace: ${workspaceId}`);

    const icsData = await exportCalendarData(workspaceId, startDate, endDate);

    console.log(`✅ Calendar exported successfully`);

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", "attachment; filename=calendar.ics");
    res.send(icsData);
  } catch (error) {
    console.error("❌ Error exporting calendar:", error.message);
    res.status(500).json({ error: "Failed to export calendar" });
  }
};

console.log("✅ Calendar controller initialized");

export default {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getEventAttendees,
  addEventAttendee,
  removeEventAttendee,
  updateAttendeeResponse,
  getCalendarIntegrations,
  connectGoogleCalendar,
  connectOutlookCalendar,
  syncExternalCalendar,
  checkUserAvailability,
  findMeetingTime,
  exportCalendar,
};

