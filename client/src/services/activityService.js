import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Activity Service
 * Handles all activity log and notification API calls
 */
export const activityService = {
  // Get workspace activity
  getWorkspaceActivity: async (workspaceId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/activity${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project activity
  getProjectActivity: async (projectId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/activity${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get task activity
  getTaskActivity: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/activity`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's notifications
  getNotifications: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/notifications${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/read-all`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default activityService;

