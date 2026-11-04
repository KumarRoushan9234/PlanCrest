import express from "express";
import {
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
} from "../controllers/calendar.js";
import { requireAuth, requireWorkspaceAccess } from "../middlewares/index.js";
import { requireEventAccess } from "../middlewares/resourceAccess.js";

const router = express.Router();

console.log("📅 Initializing calendar routes");

// All routes require authentication
router.use(requireAuth);

/**
 * Workspace Calendar Routes
 */

/**
 * @route   GET /api/workspaces/:workspaceId/calendar/events
 * @desc    Get calendar events for workspace
 * @access  Private (Workspace member)
 */
router.get("/workspaces/:workspaceId/calendar/events", requireWorkspaceAccess, getCalendarEvents);

/**
 * @route   POST /api/workspaces/:workspaceId/calendar/events
 * @desc    Create calendar event in workspace
 * @access  Private (Workspace member)
 */
router.post("/workspaces/:workspaceId/calendar/events", requireWorkspaceAccess, createCalendarEvent);

/**
 * @route   GET /api/workspaces/:workspaceId/calendar/export
 * @desc    Export calendar to ICS format
 * @access  Private (Workspace member)
 */
router.get("/workspaces/:workspaceId/calendar/export", requireWorkspaceAccess, exportCalendar);

/**
 * Event Management Routes
 */

/**
 * @route   PUT /api/calendar/events/:eventId
 * @desc    Update calendar event
 * @access  Private
 */
router.put("/calendar/events/:eventId", requireEventAccess, updateCalendarEvent);

/**
 * @route   DELETE /api/calendar/events/:eventId
 * @desc    Delete calendar event
 * @access  Private
 */
router.delete("/calendar/events/:eventId", requireEventAccess, deleteCalendarEvent);

/**
 * @route   PUT /api/calendar/events/:eventId/response
 * @desc    Update attendee response (accept/decline/tentative)
 * @access  Private
 */
router.put("/calendar/events/:eventId/response", requireEventAccess, updateAttendeeResponse);

/**
 * @route   PATCH /api/workspaces/:workspaceId/calendar/events/:eventId/response
 * @desc    Update event attendee response (accept/decline/tentative) with sync
 * @access  Private (Workspace member)
 */
router.patch("/workspaces/:workspaceId/calendar/events/:eventId/response", requireWorkspaceAccess, updateEventResponse);

/**
 * Event Attendees Routes
 */

/**
 * @route   GET /api/calendar/events/:eventId/attendees
 * @desc    Get event attendees
 * @access  Private
 */
router.get("/calendar/events/:eventId/attendees", requireEventAccess, getEventAttendees);

/**
 * @route   POST /api/calendar/events/:eventId/attendees
 * @desc    Add attendee to event
 * @access  Private
 */
router.post("/calendar/events/:eventId/attendees", requireEventAccess, addEventAttendee);

/**
 * @route   DELETE /api/calendar/events/:eventId/attendees/:userId
 * @desc    Remove attendee from event
 * @access  Private
 */
router.delete("/calendar/events/:eventId/attendees/:userId", requireEventAccess, removeEventAttendee);


/**
 * @route   GET /api/calendar/integrations
 * @desc    Get user's calendar integrations
 * @access  Private
 */

/**
 * @route   POST /api/calendar/integrations/google
 * @desc    Connect Google Calendar
 * @access  Private
 */

/**
 * @route   POST /api/calendar/integrations/outlook
 * @desc    Connect Outlook Calendar
 * @access  Private
 */

/**
 * @route   POST /api/calendar/sync
 * @desc    Sync external calendar (Google/Outlook)
 * @access  Private
 */

/**
 * Availability & Scheduling Routes
 */

/**
 * @route   GET /api/calendar/availability
 * @desc    Check user availability for a time range
 * @access  Private
 */
router.get("/calendar/availability", checkUserAvailability);

/**
 * @route   POST /api/calendar/find-time
 * @desc    Find optimal meeting time for multiple users
 * @access  Private
 */
router.post("/calendar/find-time", findMeetingTime);

console.log("✅ Calendar routes initialized successfully");

export default router;

