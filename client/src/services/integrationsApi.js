import axios from "axios";
import { API_BASE_URL } from "../config/api";

const unwrap = async (promise) => {
  try {
    return (await promise).data;
  } catch (error) {
    const data = error.response?.data || {};
    // Keep the HTTP status: 424 means the provider rejected our credentials (reconnect)
    throw Object.assign(new Error(data.error || data.message || error.message), {
      error: data.error || data.message || error.message,
      status: error.response?.status,
      reconnect: error.response?.status === 424,
    });
  }
};

export const integrationsApi = {
  catalog: (workspaceId) => unwrap(axios.get(`${API_BASE_URL}/integrations`, { params: { workspaceId } })).then((r) => r.data),

  connect: (providerId, workspaceId) =>
    unwrap(axios.post(`${API_BASE_URL}/integrations/${providerId}/connect`, { workspaceId })).then((r) => r.authUrl),

  connectWithCredentials: (providerId, workspaceId, fields) =>
    unwrap(axios.post(`${API_BASE_URL}/integrations/${providerId}/credentials`, { workspaceId, ...fields })).then((r) => r.data),

  update: (connectorId, body) => unwrap(axios.patch(`${API_BASE_URL}/integrations/connectors/${connectorId}`, body)).then((r) => r.data),

  disconnect: (connectorId) => unwrap(axios.delete(`${API_BASE_URL}/integrations/connectors/${connectorId}`)),

  run: (connectorId, action, params = {}) =>
    unwrap(axios.post(`${API_BASE_URL}/integrations/connectors/${connectorId}/actions/${action}`, params)).then((r) => r.data),
};
