import CalendarEvent from "../models/calendarEvent.js";
import { sendCalendarEventEmail, sendEventReminderEmail } from "./emailTemplates.js";
import { createCalendarNotification } from "./notificationHelpers.js";

/**
 * Generate recurring event instances
 */
export const generateRecurringEvents = (event, startDate, endDate) => {
  try {
    if (!event.recurring?.enabled) {
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
    
    return instances;
  } catch (error) {
    return [event];
  }
};

/**
 * Check for event conflicts
 */
export const calculateEventConflicts = async (event, userId, workspaceId) => {
  try {
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
    
    return conflicts;
  } catch (error) {
    throw error;
  }
};

/**
 * Send event reminders based on reminder settings
 */
export const sendEventReminders = async () => {
  try {
    const now = new Date();
    
    // Find events with pending reminders
    const eventsWithReminders = await CalendarEvent.find({
      startDate: { $gte: now },
      status: "scheduled",
      "reminders.sent": false,
    }).populate("attendees.user createdBy workspace");
    
    for (const event of eventsWithReminders) {
      for (let i = 0; i < event.reminders.length; i++) {
        const reminder = event.reminders[i];
        
        if (reminder.sent) continue;
        
        const reminderTime = new Date(event.startDate.getTime() - reminder.minutesBefore * 60 * 1000);
        
        // Check if it's time to send the reminder
        if (now >= reminderTime) {
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
              // Silent fail for individual reminder
            }
          }
          
          // Mark reminder as sent
          event.reminders[i].sent = true;
          await event.save();
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update event attendees
 */
export const updateEventAttendees = async (eventId, attendees) => {
  try {
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    event.attendees = attendees;
    await event.save();
    
    return event;
  } catch (error) {
    throw error;
  }
};

/**
 * Export calendar data to ICS format
 */
export const exportCalendarData = async (workspaceId, startDate, endDate) => {
  try {
    const events = await CalendarEvent.find({
      workspace: workspaceId,
      startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $ne: "cancelled" },
      isArchived: false,
    }).populate("createdBy attendees.user");
    
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
      if (event.createdBy) {
        icsContent.push(`ORGANIZER:CN=${event.createdBy.name}:MAILTO:${event.createdBy.email}`);
      }
      
      for (const attendee of event.attendees) {
        if (!attendee.user) continue;
        icsContent.push(
          `ATTENDEE;CN=${attendee.user.name};PARTSTAT=${(attendee.response || "needs-action").toUpperCase()}:MAILTO:${attendee.user.email}`
        );
      }
      
      icsContent.push("END:VEVENT");
    }
    
    icsContent.push("END:VCALENDAR");
    
    const icsString = icsContent.join("\r\n");
    
    return icsString;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user availability for a time range
 */
export const getUserAvailability = async (userId, workspaceId, startDate, endDate) => {
  try {
    const events = await CalendarEvent.find({
      workspace: workspaceId,
      "attendees.user": userId,
      status: { $ne: "cancelled" },
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
    }).sort({ startDate: 1 });
    
    // Calculate busy time slots
    const busySlots = events.map((event) => ({
      start: event.startDate,
      end: event.endDate,
      event: event.title,
    }));
    
    return {
      busy: busySlots,
      available: busySlots.length === 0,
    };
  } catch (error) {
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
    
    return slots;
  } catch (error) {
    throw error;
  }
};

export default {
  generateRecurringEvents,
  calculateEventConflicts,
  sendEventReminders,
  updateEventAttendees,
  exportCalendarData,
  getUserAvailability,
  findOptimalMeetingTime,
};
