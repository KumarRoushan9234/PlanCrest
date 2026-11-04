import axios from 'axios';

import { API_BASE_URL } from "../config/api";
axios.defaults.withCredentials = true;

/**
 * Calendar Service
 * Handles all calendar-related API calls
 */
export const calendarService = {
  // Get calendar events for a workspace
  getWorkspaceEvents: async (workspaceId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `${API_BASE_URL}/workspaces/${workspaceId}/calendar/events${queryParams ? `?${queryParams}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create calendar event
  createEvent: async (workspaceId, eventData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/workspaces/${workspaceId}/calendar/events`,
        eventData,
        {
          timeout: 10000, // 10 second timeout (event creation should be fast now)
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update calendar event
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/calendar/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete calendar event
  deleteEvent: async (eventId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get event attendees
  getEventAttendees: async (eventId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/events/${eventId}/attendees`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add event attendee
  addAttendee: async (eventId, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/events/${eventId}/attendees`, {
        userId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove event attendee
  removeAttendee: async (eventId, userId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/calendar/events/${eventId}/attendees/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update RSVP response
  updateRSVP: async (eventId, response) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/calendar/events/${eventId}/response`, {
        response,
      });
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Respond to event invitation (accept/decline/tentative) with sync
  respondToEvent: async (workspaceId, eventId, response) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/workspaces/${workspaceId}/calendar/events/${eventId}/response`,
        { response }
      );
      return res.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get calendar integrations
  getIntegrations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/integrations`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Connect Google Calendar
  connectGoogleCalendar: async (authCode) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/integrations/google`, {
        authCode,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Connect Outlook Calendar
  connectOutlookCalendar: async (authCode) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/integrations/outlook`, {
        authCode,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Sync external calendar
  syncCalendar: async (integrationId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/sync`, { integrationId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check availability
  checkAvailability: async (workspaceId, startDate, endDate, userIds = []) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/availability`, {
        workspaceId,
        startDate,
        endDate,
        userIds,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Find meeting time
  findMeetingTime: async (workspaceId, duration, userIds, dateRange) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/find-time`, {
        workspaceId,
        duration,
        userIds,
        dateRange,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export calendar
  exportCalendar: async (workspaceId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `${API_BASE_URL}/workspaces/${workspaceId}/calendar/export${queryParams ? `?${queryParams}` : ''}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get shared calendars
  getSharedCalendars: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/shared`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Share calendar
  shareCalendar: async (calendarId, userId, permissions) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/share`, {
        calendarId,
        userId,
        permissions,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unshare calendar
  unshareCalendar: async (shareId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/calendar/unshare/${shareId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default calendarService;

