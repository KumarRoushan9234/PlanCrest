import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Integration Service
 * Handles all integration-related API calls
 */

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== GENERAL INTEGRATION METHODS ====================

/**
 * Get all integrations for the authenticated user
 * @param {Object} params - Query parameters
 * @param {string} params.scope - Integration scope (personal/workspace/project)
 * @param {string} params.scopeId - Scope ID (workspace or project ID)
 * @returns {Promise} - List of integrations
 */
export const getAllIntegrations = async (params = {}) => {
  try {
    const response = await api.get("/integrations", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching integrations:", error);
    throw error;
  }
};

/**
 * Get specific integration by ID
 * @param {string} id - Integration ID
 * @returns {Promise} - Integration details
 */
export const getIntegrationById = async (id) => {
  try {
    const response = await api.get(`/integrations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching integration:", error);
    throw error;
  }
};

/**
 * Delete/disconnect integration
 * @param {string} id - Integration ID
 * @returns {Promise} - Success message
 */
export const deleteIntegration = async (id) => {
  try {
    const response = await api.delete(`/integrations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting integration:", error);
    throw error;
  }
};

// ==================== GOOGLE CALENDAR ====================

/**
 * Initiate Google Calendar OAuth flow
 * @param {Object} data - Connection data
 * @param {string} data.scope - Integration scope (personal/workspace/project)
 * @param {string} data.scopeId - Scope ID (optional for personal)
 * @returns {Promise} - OAuth URL and state token
 */
export const connectGoogleCalendar = async (data) => {
  try {
    const response = await api.post("/integrations/google-calendar/connect", data);
    return response.data;
  } catch (error) {
    console.error("Error connecting Google Calendar:", error);
    throw error;
  }
};

/**
 * Get Google Calendar integration details
 * @param {Object} params - Query parameters
 * @param {string} params.scope - Integration scope
 * @param {string} params.scopeId - Scope ID
 * @returns {Promise} - Integration details
 */
export const getGoogleCalendarIntegration = async (params) => {
  try {
    const response = await api.get("/integrations/google-calendar", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching Google Calendar integration:", error);
    throw error;
  }
};

/**
 * Sync Google Calendar events
 * @param {Object} data - Sync data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - Synced events
 */
export const syncGoogleCalendar = async (data) => {
  try {
    const response = await api.post("/integrations/google-calendar/sync", data);
    return response.data;
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    throw error;
  }
};

/**
 * Disconnect Google Calendar
 * @param {Object} data - Disconnect data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - Success message
 */
export const disconnectGoogleCalendar = async (data) => {
  try {
    const response = await api.delete("/integrations/google-calendar", { data });
    return response.data;
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    throw error;
  }
};

// ==================== GOOGLE MEET ====================

/**
 * Initiate Google Meet OAuth flow
 * @param {Object} data - Connection data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - OAuth URL and state token
 */
export const connectGoogleMeet = async (data) => {
  try {
    const response = await api.post("/integrations/google-meet/connect", data);
    return response.data;
  } catch (error) {
    console.error("Error connecting Google Meet:", error);
    throw error;
  }
};

// ==================== GMAIL ====================

/**
 * Initiate Gmail OAuth flow
 * @param {Object} data - Connection data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - OAuth URL and state token
 */
export const connectGmail = async (data) => {
  try {
    const response = await api.post("/integrations/gmail/connect", data);
    return response.data;
  } catch (error) {
    console.error("Error connecting Gmail:", error);
    throw error;
  }
};

// ==================== GITHUB ====================

/**
 * Initiate GitHub OAuth flow
 * @param {Object} data - Connection data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - OAuth URL and state token
 */
export const connectGitHub = async (data) => {
  try {
    const response = await api.post("/integrations/github/connect", data);
    return response.data;
  } catch (error) {
    console.error("Error connecting GitHub:", error);
    throw error;
  }
};

/**
 * Get GitHub repositories
 * @param {Object} params - Query parameters
 * @param {string} params.scope - Integration scope
 * @param {string} params.scopeId - Scope ID
 * @returns {Promise} - List of repositories
 */
export const getGitHubRepositories = async (params) => {
  try {
    const response = await api.get("/integrations/github/repositories", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    throw error;
  }
};

// ==================== GOOGLE DRIVE ====================

/**
 * Initiate Google Drive OAuth flow
 * @param {Object} data - Connection data
 * @param {string} data.scope - Integration scope
 * @param {string} data.scopeId - Scope ID
 * @returns {Promise} - OAuth URL and state token
 */
export const connectGoogleDrive = async (data) => {
  try {
    const response = await api.post("/integrations/google-drive/connect", data);
    return response.data;
  } catch (error) {
    console.error("Error connecting Google Drive:", error);
    throw error;
  }
};

/**
 * Get Google Drive files
 * @param {Object} params - Query parameters
 * @param {string} params.scope - Integration scope
 * @param {string} params.scopeId - Scope ID
 * @returns {Promise} - List of files
 */
export const getGoogleDriveFiles = async (params) => {
  try {
    const response = await api.get("/integrations/google-drive/files", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching Google Drive files:", error);
    throw error;
  }
};

// ==================== HELPER METHODS ====================

/**
 * Open OAuth popup window
 * @param {string} url - OAuth URL
 * @param {string} title - Window title
 * @returns {Window} - Popup window reference
 */
export const openOAuthPopup = (url, title = "OAuth Authorization") => {
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );
};

/**
 * Handle OAuth redirect
 * Listens for OAuth callback and closes popup
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const handleOAuthCallback = (onSuccess, onError) => {
  const handleMessage = (event) => {
    // Verify origin
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data.type === "oauth-success") {
      onSuccess(event.data);
      window.removeEventListener("message", handleMessage);
    } else if (event.data.type === "oauth-error") {
      onError(event.data.error);
      window.removeEventListener("message", handleMessage);
    }
  };

  window.addEventListener("message", handleMessage);

  // Cleanup listener after 10 minutes
  setTimeout(() => {
    window.removeEventListener("message", handleMessage);
  }, 600000);
};

export default {
  getAllIntegrations,
  getIntegrationById,
  deleteIntegration,
  connectGoogleCalendar,
  getGoogleCalendarIntegration,
  syncGoogleCalendar,
  disconnectGoogleCalendar,
  connectGoogleMeet,
  connectGmail,
  connectGitHub,
  getGitHubRepositories,
  connectGoogleDrive,
  getGoogleDriveFiles,
  openOAuthPopup,
  handleOAuthCallback,
};

