import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Analytics Service
 * Handles all analytics and statistics API calls
 */
export const analyticsService = {
  // Get workspace analytics
  getWorkspaceAnalytics: async (workspaceId, timeRange = '30d') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/analytics`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project analytics
  getProjectAnalytics: async (projectId, timeRange = '30d') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/analytics`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get task statistics
  getTaskStatistics: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/stats/tasks`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get member performance
  getMemberPerformance: async (workspaceId, timeRange = '30d') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/stats/members`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project progress
  getProjectProgress: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/progress`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get workspace overview stats
  getWorkspaceOverview: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/overview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default analyticsService;

