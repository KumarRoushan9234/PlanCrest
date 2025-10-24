import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
axios.defaults.withCredentials = true;

/**
 * Notification Service
 * Handles all notification-related API calls
 */
export const notificationService = {
  // Get user notifications with pagination and filters
  getNotifications: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/notifications${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/read-all`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get notification settings
  getNotificationSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/settings`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update notification settings
  updateNotificationSettings: async (settings) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/settings`, settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default notificationService;

