import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Task Service
 * Handles all task-related API calls
 */
export const taskService = {
  // Get all tasks in workspace
  getWorkspaceTasks: async (workspaceId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tasks${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get tasks by project
  getProjectTasks: async (projectId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/tasks${queryParams ? `?${queryParams}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single task
  getTask: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create task
  createTask: async (projectId, taskData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Move task to different column
  moveTask: async (taskId, columnId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}/move`, { columnId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Assign user to task
  assignTask: async (taskId, userId, role = 'assignee') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/assign`, { userId, role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unassign user from task
  unassignTask: async (taskId, userId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}/assign/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get task assignments
  getTaskAssignments: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/assignments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get tasks assigned to current user
  getMyTasks: async (workspaceId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({ ...filters, assignedToMe: true }).toString();
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tasks?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get tasks by due date
  getTasksByDueDate: async (workspaceId, startDate, endDate) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tasks`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get overdue tasks
  getOverdueTasks: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tasks`, {
        params: { overdue: true }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Subtask operations
  createSubtask: async (taskId, subtaskData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/subtasks`, subtaskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateSubtask: async (taskId, subtaskId, subtaskData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}`, subtaskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Comments
  addComment: async (taskId, commentData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getComments: async (taskId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/comments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default taskService;

