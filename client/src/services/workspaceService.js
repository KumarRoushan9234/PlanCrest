import axios from 'axios';

import { API_BASE_URL } from "../config/api";

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000; // 60 seconds timeout for all requests

/**
 * Workspace Service
 * Handles all workspace-related API calls
 */
export const workspaceService = {
  // Everything the Overview page needs, scoped to what the user may access
  getDashboard: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/dashboard`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Aggregates for the Analytics page
  getInsights: async (workspaceId, range = 30) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/insights?range=${range}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel a pending invitation
  cancelInvitation: async (workspaceId, invitationId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new workspace
  createWorkspace: async (workspaceData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workspaces`, workspaceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all workspaces for current user
  getUserWorkspaces: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific workspace details
  getWorkspace: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update workspace
  updateWorkspace: async (workspaceId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/workspaces/${workspaceId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete/Archive workspace
  deleteWorkspace: async (workspaceId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get workspace members
  getWorkspaceMembers: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add member to workspace
  addWorkspaceMember: async (workspaceId, memberData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/members`, memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update workspace member
  updateWorkspaceMember: async (workspaceId, userId, updateData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove member from workspace
  removeWorkspaceMember: async (workspaceId, userId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/workspaces/${workspaceId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Invite user to workspace
  inviteToWorkspace: async (workspaceId, inviteData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/workspaces/${workspaceId}/invite`, 
        inviteData,
        { timeout: 15000 } // 15 second timeout for invitation requests
      );
      return response.data;
    } catch (error) {
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED') {
        throw { error: 'Request timeout. The invitation may have been created, but email sending is delayed. Please check your email configuration.' };
      }
      throw error.response?.data || error;
    }
  },

  // Get workspace invitations
  getWorkspaceInvitations: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/invitations`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Respond to invitation (accept/decline)
  respondToInvitation: async (token, action) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/invitations/${token}`, { action });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's last selected items
  getLastSelected: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/last-selected`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  acceptInvitation: async (token) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/invitations/accept/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getInvitationDetails: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/invitations/details/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default workspaceService;

