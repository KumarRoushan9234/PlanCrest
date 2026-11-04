import CalendarEvent from "../models/calendarEvent.js";
import CalendarShare from "../models/calendarShare.js";
import {
  generateRecurringEvents,
  calculateEventConflicts,
  updateEventAttendees,
  exportCalendarData,
  getUserAvailability,
  findOptimalMeetingTime,
} from "../utils/calendarHelpers.js";
import { sendCalendarEventEmail } from "../utils/emailTemplates.js";
import { createCalendarNotification } from "../utils/notificationHelpers.js";
import { addAcceptedEventToGoogle, deleteEventFromGoogle, syncEventUpdateToGoogle, syncNewEventToGoogle } from "../integrations/calendarSync.js";

const EDITABLE_EVENT_FIELDS = [
  "title",
  "description",
  "startDate",
  "endDate",
  "allDay",
  "timezone",
  "location",
  "meetingLink",
  "recurring",
  "status",
  "category",
  "priority",
  "attendees",
  "reminders",
  "project",
  "task",
  "color",
];

/** Event creators and workspace owners/admins may modify an event. */
const canManageEvent = (req, event) => {
  const creatorId = (event.createdBy?._id || event.createdBy)?.toString();
  return (
    creatorId === req.auth._id.toString() ||
    req.isWorkspaceOwner ||
    req.workspaceMember?.role === "admin"
  );
};

/**
 * Get calendar events for a workspace
 * GET /api/workspaces/:workspaceId/calendar/events
 */
export const getCalendarEvents = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { startDate, endDate, category, status, projectId } = req.query;
    const userId = req.auth._id;

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

    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create event from an allowlist (never trust client-supplied ownership/sync fields)
    const event = new CalendarEvent({
      ...Object.fromEntries(EDITABLE_EVENT_FIELDS.filter((k) => eventData[k] !== undefined).map((k) => [k, eventData[k]])),
      workspace: workspaceId,
      createdBy: userId,
    });

    await event.save();

    // Populate for response
    await event.populate("createdBy attendees.user project task");

    // Schedule reminder if requested (30 mins before)
    if (eventData.sendReminder && event.attendees && event.attendees.length > 0) {
      try {
        const reminderTime = new Date(event.startDate).getTime() - 30 * 60 * 1000; // 30 mins before
        const now = Date.now();
        
        if (reminderTime > now) {
          // Store reminder info in event metadata
          event.metadata = {
            ...event.metadata,
            reminderScheduled: true,
            reminderTime: new Date(reminderTime),
          };
          await event.save();
          
          // In a production app, you would use a job queue (like Bull or Agenda)
          // For now, we'll use setTimeout (note: this won't persist across server restarts)
          const timeoutDelay = reminderTime - now;
          if (timeoutDelay < 2147483647) { // Max setTimeout value
            setTimeout(async () => {
              await sendEventReminders(event._id);
            }, timeoutDelay);
          }
        }
      } catch (reminderError) {
        // Silent fail
      }
    }

    // Push to the user's Google Calendar when asked to (or when auto-sync is on). Never blocks the response.
    syncNewEventToGoogle(event._id, userId, { force: Boolean(eventData.syncToGoogleCalendar), invite: Boolean(eventData.sendInvitations) });

    // Send event response immediately
    res.status(201).json({
      success: true,
      data: event,
    });

    // Send notifications to attendees if requested (non-blocking)
    if (eventData.sendInvitations && event.attendees && event.attendees.length > 0) {
      // Send notifications asynchronously without awaiting
      setImmediate(async () => {
        try {
          const Workspace = (await import("../models/workspace.js")).default;
          const workspace = await Workspace.findById(workspaceId);

          for (const attendee of event.attendees) {
            try {
              // Send email invitation (don't await)
              sendCalendarEventEmail({
                event,
                workspace,
                attendee: attendee.user,
                creator: event.createdBy,
                eventLink: `${process.env.CLIENT_URL}/calendar?event=${event._id}`,
              }).catch(() => {
                // Silent fail
              });

              // Create in-app notification
              await createCalendarNotification({
                event,
                recipient: attendee.user._id,
                sender: userId,
                type: "event_invitation",
                workspace: workspaceId,
              });
            } catch (notifError) {
              // Silent fail
            }
          }
        } catch (error) {
          // Silent fail
        }
      });
    }
  } catch (error) {
    console.error("❌ Error creating calendar event:", error.message);
    res.status(500).json({ error: "Failed to create calendar event", message: error.message });
  }
};

// Helper function to send event reminders
async function sendEventReminders(eventId) {
  try {
    const event = await CalendarEvent.findById(eventId).populate("attendees.user createdBy");
    
    if (!event) {
      return;
    }

    const { sendSimpleEmail } = await import("../utils/mailService.js");
    
    for (const attendee of event.attendees) {
      try {
        const timeUntilEvent = Math.floor((new Date(event.startDate) - new Date()) / 60000); // minutes
        
        await sendSimpleEmail({
          to: attendee.user.email,
          subject: `Reminder: ${event.title} starts in ${timeUntilEvent} minutes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">⏰ Event Reminder</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">${event.title}</h2>
                <p style="color: #666; line-height: 1.6;">
                  This is a reminder that your event starts in <strong>${timeUntilEvent} minutes</strong>.
                </p>
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(event.startDate).toLocaleString()}</p>
                  ${event.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>` : ''}
                  ${event.meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${event.meetingLink}" style="color: #667eea;">${event.meetingLink}</a></p>` : ''}
                  ${event.description ? `<p style="margin-top: 15px; color: #666;">${event.description}</p>` : ''}
                </div>
                <a href="${process.env.CLIENT_URL}/calendar?event=${event._id}" 
                   style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                  View in Calendar
                </a>
              </div>
            </div>
          `,
          text: `Reminder: ${event.title} starts in ${timeUntilEvent} minutes. Time: ${new Date(event.startDate).toLocaleString()}${event.meetingLink ? `. Meeting Link: ${event.meetingLink}` : ''}`
        });
      } catch (error) {
        // Silent fail
      }
    }
  } catch (error) {
    // Silent fail
  }
}

/**
 * Update event attendee response (accept/decline/tentative)
 * PATCH /api/workspaces/:workspaceId/calendar/events/:eventId/response
 */
export const updateEventResponse = async (req, res) => {
  try {
    const { workspaceId, eventId } = req.params;
    const { response } = req.body; // "accepted", "declined", "tentative"
    const userId = req.auth._id;

    console.log(`\n📅 Updating event response for event: ${eventId}`);
    console.log(`👤 User: ${userId}, Response: ${response}`);

    if (!["accepted", "declined", "tentative"].includes(response)) {
      return res.status(400).json({ error: "Invalid response value" });
    }

    const event = await CalendarEvent.findOne({
      _id: eventId,
      workspace: workspaceId,
    }).populate("createdBy attendees.user");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Find the attendee
    const attendeeIndex = event.attendees.findIndex(
      (a) => a.user._id.toString() === userId
    );

    if (attendeeIndex === -1) {
      return res.status(403).json({ error: "You are not an attendee of this event" });
    }

    // Update response
    event.attendees[attendeeIndex].response = response;
    event.attendees[attendeeIndex].responseAt = new Date();
    await event.save();
    // If accepted, put a copy on the attendee's own Google calendar (when they've connected one)
    if (response === "accepted") addAcceptedEventToGoogle(event._id, userId);


    // Notify event creator about response
    try {
      const { sendSimpleEmail } = await import("../utils/mailService.js");
      const attendee = event.attendees[attendeeIndex];
      const responseEmoji = response === "accepted" ? "✅" : response === "declined" ? "❌" : "❓";

      await sendSimpleEmail({
        to: event.createdBy.email,
        subject: `${responseEmoji} ${attendee.user.name} ${response} your event: ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${responseEmoji} Event Response</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <p style="color: #666; line-height: 1.6;">
                <strong>${attendee.user.name}</strong> has <strong>${response}</strong> your event invitation.
              </p>
              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${event.title}</h3>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(event.startDate).toLocaleString()}</p>
              </div>
              <a href="${process.env.CLIENT_URL}/calendar?event=${event._id}" 
                 style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
                View Event
              </a>
            </div>
          </div>
        `,
        text: `${attendee.user.name} has ${response} your event: ${event.title}. View at: ${process.env.CLIENT_URL}/calendar?event=${event._id}`
      });
    } catch (notifError) {
      // Silent fail
    }

    await event.populate("createdBy attendees.user project task");

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("❌ Error updating event response:", error.message);
    res.status(500).json({ error: "Failed to update event response" });
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


    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!canManageEvent(req, event)) {
      return res
        .status(403)
        .json({ error: "Only the event creator or an admin can edit this event" });
    }

    // Update only user-editable fields
    EDITABLE_EVENT_FIELDS.forEach((key) => {
      if (updates[key] !== undefined) {
        event[key] = updates[key];
      }
    });

    event.lastEditedBy = userId;
    await event.save();
    syncEventUpdateToGoogle(event._id, userId);


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


    const event = await CalendarEvent.findById(eventId).populate("attendees.user");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!canManageEvent(req, event)) {
      return res
        .status(403)
        .json({ error: "Only the event creator or an admin can delete this event" });
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
    deleteEventFromGoogle(event, userId);

    await CalendarEvent.findByIdAndDelete(eventId);


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


    const event = await CalendarEvent.findById(eventId).populate("attendees.user", "name email avatar");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }


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


    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!canManageEvent(req, event)) {
      return res.status(403).json({ error: "Only the event creator or an admin can add attendees" });
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
      // Silent fail
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


    const event = await CalendarEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const removingSelf = attendeeUserId === req.auth._id.toString();
    if (!removingSelf && !canManageEvent(req, event)) {
      return res.status(403).json({ error: "Only the event creator or an admin can remove attendees" });
    }

    // Remove attendee
    event.attendees = event.attendees.filter((a) => a.user.toString() !== attendeeUserId);

    await event.save();


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


    if (!["accepted", "declined", "tentative"].includes(response)) {
      return res.status(400).json({ error: "Invalid response" });
    }

    const event = await CalendarEvent.findById(eventId).populate("createdBy attendees.user");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Find and update attendee response
    const attendee = event.attendees.find((a) => a.user._id.toString() === userId.toString());

    if (!attendee) {
      return res.status(400).json({ error: "You are not an attendee of this event" });
    }

    attendee.response = response;
    attendee.responseAt = new Date();

    await event.save();
    // If accepted, put a copy on the attendee's own Google calendar (when they've connected one)
    if (response === "accepted") addAcceptedEventToGoogle(event._id, userId);


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
 * Get user availability
 * GET /api/calendar/availability
 */
export const checkUserAvailability = async (req, res) => {
  try {
    const { userId, workspaceId, startDate, endDate } = req.query;


    const availability = await getUserAvailability(userId, workspaceId, startDate, endDate);


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


    const slots = await findOptimalMeetingTime(userIds, workspaceId, duration, startDate, endDate);


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


    // Default to a window around today so a plain download works
    const from = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const to = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 86400000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ error: "startDate and endDate must be valid dates" });
    }
    const icsData = await exportCalendarData(workspaceId, from, to);


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
  updateEventResponse,
  checkUserAvailability,
  findMeetingTime,
  exportCalendar,
};

