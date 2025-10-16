import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Project Service
 * Handles all project-related API calls
 */
export const projectService = {
  // Create a new project
  createProject: async (workspaceId, projectData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/projects`, projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create project from template
  createProjectFromTemplate: async (workspaceId, templateData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workspaces/${workspaceId}/projects/template`, templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all projects in workspace
  getWorkspaceProjects: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/projects`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific project details
  getProject: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update project
  updateProject: async (projectId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete/Archive project
  deleteProject: async (projectId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get pre-made project templates
  getPreMadeProjects: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/templates`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project members
  getProjectMembers: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add member to project
  addProjectMember: async (projectId, memberData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/members`, memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update project member
  updateProjectMember: async (projectId, userId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}/members/${userId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove member from project
  removeProjectMember: async (projectId, userId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/projects/${projectId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project boards
  getProjectBoards: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/boards`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create board
  createBoard: async (projectId, boardData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/boards`, boardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get board columns
  getBoardColumns: async (boardId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/boards/${boardId}/columns`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create column
  createColumn: async (boardId, columnData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/boards/${boardId}/columns`, columnData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update column
  updateColumn: async (columnId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/columns/${columnId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete column
  deleteColumn: async (columnId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/columns/${columnId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
