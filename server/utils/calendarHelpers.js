import CalendarEvent from "../models/calendarEvent.js";
import CalendarIntegration from "../models/calendarIntegration.js";
import { sendCalendarEventEmail, sendEventReminderEmail } from "./emailTemplates.js";
import { createCalendarNotification } from "./notificationHelpers.js";

/**
 * Generate recurring event instances
 */
export const generateRecurringEvents = (event, startDate, endDate) => {
  try {
    console.log(`\n🔄 Generating recurring events for: ${event.title}`);
    console.log(`📅 From: ${startDate} to: ${endDate}`);
    
    if (!event.recurring?.enabled) {
      console.log(`⚠️ Event is not recurring`);
      return [event];
    }
    
    const instances = [];
    const { frequency, interval, endType, endAfterOccurrences, endDate: recurringEndDate } = event.recurring;
    
    let currentDate = new Date(event.startDate);
    const rangeEnd = new Date(endDate);
    const eventDuration = event.endDate - event.startDate;
    
    let occurrenceCount = 0;
    const maxOccurrences = endAfterOccurrences || 100; // Safety limit
    
    while (currentDate <= rangeEnd && occurrenceCount < maxOccurrences) {
      // Check end conditions
      if (endType === "after" && occurrenceCount >= endAfterOccurrences) break;
      if (endType === "onDate" && currentDate > new Date(recurringEndDate)) break;
      
      // Create instance
      const instanceStart = new Date(currentDate);
      const instanceEnd = new Date(currentDate.getTime() + eventDuration);
      
      instances.push({
        ...event.toObject(),
        startDate: instanceStart,
        endDate: instanceEnd,
        _id: `${event._id}_${occurrenceCount}`,
        originalEventId: event._id,
        occurrenceNumber: occurrenceCount,
      });
      
      // Calculate next occurrence
      switch (frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7 * interval);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }
      
      occurrenceCount++;
    }
    
    console.log(`✅ Generated ${instances.length} recurring event instances`);
    return instances;
  } catch (error) {
    console.error("❌ Error generating recurring events:", error.message);
    return [event];
  }
};

/**
 * Check for event conflicts
 */
export const calculateEventConflicts = async (event, userId, workspaceId) => {
  try {
    console.log(`\n🔍 Checking for event conflicts`);
    console.log(`👤 User: ${userId}`);
    console.log(`📅 Event: ${event.title}`);
    
    const conflicts = await CalendarEvent.find({
      workspace: workspaceId,
      "attendees.user": userId,
      status: { $ne: "cancelled" },
      _id: { $ne: event._id },
      $or: [
        // Event starts during existing event
        {
          startDate: { $lte: event.startDate },
          endDate: { $gt: event.startDate },
        },
        // Event ends during existing event
        {
          startDate: { $lt: event.endDate },
          endDate: { $gte: event.endDate },
        },
        // Event completely contains existing event
        {
          startDate: { $gte: event.startDate },
          endDate: { $lte: event.endDate },
        },
      ],
    }).populate("createdBy", "name email");
    
    console.log(`📊 Found ${conflicts.length} conflicting events`);
    return conflicts;
  } catch (error) {
    console.error("❌ Error calculating event conflicts:", error.message);
    throw error;
  }
};

/**
 * Send event reminders based on reminder settings
 */
export const sendEventReminders = async () => {
  try {
    console.log(`\n⏰ Checking for events with pending reminders`);
    
    const now = new Date();
    
    // Find events with pending reminders
    const eventsWithReminders = await CalendarEvent.find({
      startDate: { $gte: now },
      status: "scheduled",
      "reminders.sent": false,
    }).populate("attendees.user createdBy workspace");
    
    console.log(`📊 Found ${eventsWithReminders.length} events with pending reminders`);
    
    for (const event of eventsWithReminders) {
      for (let i = 0; i < event.reminders.length; i++) {
        const reminder = event.reminders[i];
        
        if (reminder.sent) continue;
        
        const reminderTime = new Date(event.startDate.getTime() - reminder.minutesBefore * 60 * 1000);
        
        // Check if it's time to send the reminder
        if (now >= reminderTime) {
          console.log(`📬 Sending reminder for event: ${event.title} (${reminder.minutesBefore} min before)`);
          
          // Send reminders to all attendees
          for (const attendee of event.attendees) {
            try {
              if (reminder.type === "email" || reminder.type === "both") {
                await sendEventReminderEmail({
                  event,
                  workspace: event.workspace,
                  attendee: attendee.user,
                });
              }
              
              if (reminder.type === "notification" || reminder.type === "both") {
                await createCalendarNotification({
                  event,
                  recipient: attendee.user._id,
                  sender: event.createdBy._id,
                  type: "event_reminder",
                  workspace: event.workspace._id,
                  customMessage: `Reminder: ${event.title} starts in ${reminder.minutesBefore} minutes`,
                });
              }
            } catch (error) {
              console.error(`⚠️ Failed to send reminder to ${attendee.user.email}:`, error.message);
            }
          }
          
          // Mark reminder as sent
          event.reminders[i].sent = true;
          await event.save();
          
          console.log(`✅ Reminder sent for event: ${event.title}`);
        }
      }
    }
    
    console.log(`✅ Event reminder check completed`);
  } catch (error) {
    console.error("❌ Error sending event reminders:", error.message);
    throw error;
  }
};

/**
 * Update event attendees
 */
export const updateEventAttendees = async (eventId, attendees) => {
  try {
    console.log(`\n👥 Updating attendees for event: ${eventId}`);
    console.log(`📊 New attendees count: ${attendees.length}`);
    
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    event.attendees = attendees;
    await event.save();
    
    console.log(`✅ Event attendees updated successfully`);
    return event;
  } catch (error) {
    console.error("❌ Error updating event attendees:", error.message);
    throw error;
  }
};

/**
 * Export calendar data to ICS format
 */
export const exportCalendarData = async (workspaceId, startDate, endDate) => {
  try {
    console.log(`\n📤 Exporting calendar data for workspace: ${workspaceId}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    const events = await CalendarEvent.find({
      workspace: workspaceId,
      startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $ne: "cancelled" },
      isArchived: false,
    }).populate("createdBy attendees.user");
    
    console.log(`📊 Found ${events.length} events to export`);
    
    // Generate ICS format
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PlanCrest//Calendar//EN",
      "CALSCALE:GREGORIAN",
    ];
    
    for (const event of events) {
      const formatDate = (date) => {
        return date
          .toISOString()
          .replace(/[-:]/g, "")
          .split(".")[0] + "Z";
      };
      
      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:${event._id}@plancrest.com`);
      icsContent.push(`DTSTAMP:${formatDate(event.createdAt)}`);
      icsContent.push(`DTSTART:${formatDate(event.startDate)}`);
      icsContent.push(`DTEND:${formatDate(event.endDate)}`);
      icsContent.push(`SUMMARY:${event.title}`);
      if (event.description) {
        icsContent.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
      }
      if (event.location) {
        icsContent.push(`LOCATION:${event.location}`);
      }
      icsContent.push(`STATUS:${event.status.toUpperCase()}`);
      icsContent.push(`ORGANIZER:CN=${event.createdBy.name}:MAILTO:${event.createdBy.email}`);
      
      for (const attendee of event.attendees) {
        icsContent.push(
          `ATTENDEE;CN=${attendee.user.name};PARTSTAT=${attendee.response.toUpperCase()}:MAILTO:${attendee.user.email}`
        );
      }
      
      icsContent.push("END:VEVENT");
    }
    
    icsContent.push("END:VCALENDAR");
    
    const icsString = icsContent.join("\r\n");
    console.log(`✅ Calendar data exported successfully`);
    
    return icsString;
  } catch (error) {
    console.error("❌ Error exporting calendar data:", error.message);
    throw error;
  }
};

/**
 * Sync Google Calendar
 * Note: This is a placeholder. Actual implementation requires Google Calendar API setup
 */
export const syncGoogleCalendar = async (userId, workspaceId) => {
  try {
    console.log(`\n🔄 Syncing Google Calendar for user: ${userId}`);
    
    const integration = await CalendarIntegration.findOne({
      user: userId,
      workspace: workspaceId,
      provider: "google",
      isActive: true,
    });
    
    if (!integration) {
      throw new Error("Google Calendar integration not found");
    }
    
    // Check if token needs refresh
    if (integration.needsRefresh()) {
      console.log("🔄 Token needs refresh");
      // TODO: Implement token refresh logic with Google OAuth
    }
    
    console.log("✅ Google Calendar sync initiated");
    console.log("⚠️ Note: Full Google Calendar API implementation pending");
    
    // Update sync status
    integration.syncStatus.lastSyncAt = new Date();
    integration.syncStatus.nextSyncAt = integration.calculateNextSync();
    await integration.save();
    
    return {
      success: true,
      message: "Google Calendar sync initiated (API implementation pending)",
    };
  } catch (error) {
    console.error("❌ Error syncing Google Calendar:", error.message);
    throw error;
  }
};

/**
 * Sync Outlook Calendar
 * Note: This is a placeholder. Actual implementation requires Microsoft Graph API setup
 */
export const syncOutlookCalendar = async (userId, workspaceId) => {
  try {
    console.log(`\n🔄 Syncing Outlook Calendar for user: ${userId}`);
    
    const integration = await CalendarIntegration.findOne({
      user: userId,
      workspace: workspaceId,
      provider: "outlook",
      isActive: true,
    });
    
    if (!integration) {
      throw new Error("Outlook Calendar integration not found");
    }
    
    // Check if token needs refresh
    if (integration.needsRefresh()) {
      console.log("🔄 Token needs refresh");
      // TODO: Implement token refresh logic with Microsoft OAuth
    }
    
    console.log("✅ Outlook Calendar sync initiated");
    console.log("⚠️ Note: Full Microsoft Graph API implementation pending");
    
    // Update sync status
    integration.syncStatus.lastSyncAt = new Date();
    integration.syncStatus.nextSyncAt = integration.calculateNextSync();
    await integration.save();
    
    return {
      success: true,
      message: "Outlook Calendar sync initiated (API implementation pending)",
    };
  } catch (error) {
    console.error("❌ Error syncing Outlook Calendar:", error.message);
    throw error;
  }
};

/**
 * Get user availability for a time range
 */
export const getUserAvailability = async (userId, workspaceId, startDate, endDate) => {
  try {
    console.log(`\n📊 Checking user availability`);
    console.log(`👤 User: ${userId}`);
    console.log(`📅 Range: ${startDate} to ${endDate}`);
    
    const events = await CalendarEvent.find({
      workspace: workspaceId,
      "attendees.user": userId,
      status: { $ne: "cancelled" },
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
    }).sort({ startDate: 1 });
    
    console.log(`📊 Found ${events.length} events in the time range`);
    
    // Calculate busy time slots
    const busySlots = events.map((event) => ({
      start: event.startDate,
      end: event.endDate,
      event: event.title,
    }));
    
    console.log(`✅ User availability calculated`);
    return {
      busy: busySlots,
      available: busySlots.length === 0,
    };
  } catch (error) {
    console.error("❌ Error getting user availability:", error.message);
    throw error;
  }
};

/**
 * Find optimal meeting time for multiple users
 */
export const findOptimalMeetingTime = async (
  userIds,
  workspaceId,
  duration,
  startDate,
  endDate
) => {
  try {
    console.log(`\n🔍 Finding optimal meeting time`);
    console.log(`👥 Users: ${userIds.length}`);
    console.log(`⏱️ Duration: ${duration} minutes`);
    
    // Get availability for all users
    const availabilities = await Promise.all(
      userIds.map((userId) => getUserAvailability(userId, workspaceId, startDate, endDate))
    );
    
    // Find common free slots
    // This is a simplified version - a production implementation would be more sophisticated
    const durationMs = duration * 60 * 1000;
    const slots = [];
    
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + durationMs);
      
      // Check if this slot is free for all users
      const isFree = availabilities.every((availability) =>
        availability.busy.every(
          (busySlot) => slotEnd <= busySlot.start || current >= busySlot.end
        )
      );
      
      if (isFree) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
        });
      }
      
      // Move to next 30-minute slot
      current.setMinutes(current.getMinutes() + 30);
    }
    
    console.log(`✅ Found ${slots.length} optimal meeting slots`);
    return slots;
  } catch (error) {
    console.error("❌ Error finding optimal meeting time:", error.message);
    throw error;
  }
};

console.log("✅ Calendar helpers initialized");

export default {
  generateRecurringEvents,
  calculateEventConflicts,
  sendEventReminders,
  updateEventAttendees,
  exportCalendarData,
  syncGoogleCalendar,
  syncOutlookCalendar,
  getUserAvailability,
  findOptimalMeetingTime,
};

