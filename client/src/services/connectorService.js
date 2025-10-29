import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

axios.defaults.withCredentials = true;

const openOAuthPopup = (url, title = "OAuth") => {
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

export const connectorService = {
  // Get all connectors
  getAllConnectors: async (scope, scopeId) => {
    try {
      const params = {};
      if (scope) params.scope = scope;
      if (scopeId) params.scopeId = scopeId;

      const response = await axios.get(`${API_BASE_URL}/connectors`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get connector by ID
  getConnectorById: async (connectorId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/connectors/${connectorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete connector
  deleteConnector: async (connectorId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/connectors/${connectorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ==================== GOOGLE CALENDAR ====================

  connectGoogleCalendar: async (scope, scopeId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/connectors/google-calendar/connect`, {
        scope,
        scopeId,
      });

      if (response.data.authUrl) {
        const popup = openOAuthPopup(response.data.authUrl, "Connect Google Calendar");

        return new Promise((resolve, reject) => {
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              resolve({ success: true });
            }
          }, 500);

          setTimeout(() => {
            clearInterval(checkPopup);
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error("OAuth timeout"));
          }, 300000); // 5 minutes timeout
        });
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  syncGoogleCalendar: async (scope, scopeId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/connectors/google-calendar/sync`, {
        scope,
        scopeId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ==================== GITHUB ====================

  connectGitHub: async (scope, scopeId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/connectors/github/connect`, {
        scope,
        scopeId,
      });

      if (response.data.authUrl) {
        const popup = openOAuthPopup(response.data.authUrl, "Connect GitHub");

        return new Promise((resolve, reject) => {
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              resolve({ success: true });
            }
          }, 500);

          setTimeout(() => {
            clearInterval(checkPopup);
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error("OAuth timeout"));
          }, 300000);
        });
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getGitHubRepositories: async (scope, scopeId) => {
    try {
      const params = { scope };
      if (scopeId) params.scopeId = scopeId;

      const response = await axios.get(`${API_BASE_URL}/connectors/github/repositories`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ==================== GOOGLE DRIVE ====================

  connectGoogleDrive: async (scope, scopeId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/connectors/google-drive/connect`, {
        scope,
        scopeId,
      });

      if (response.data.authUrl) {
        const popup = openOAuthPopup(response.data.authUrl, "Connect Google Drive");

        return new Promise((resolve, reject) => {
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              resolve({ success: true });
            }
          }, 500);

          setTimeout(() => {
            clearInterval(checkPopup);
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error("OAuth timeout"));
          }, 300000);
        });
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getGoogleDriveFiles: async (scope, scopeId) => {
    try {
      const params = { scope };
      if (scopeId) params.scopeId = scopeId;

      const response = await axios.get(`${API_BASE_URL}/connectors/google-drive/files`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default connectorService;


