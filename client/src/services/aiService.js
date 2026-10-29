import axios from "axios";
import { API_BASE_URL } from "../config/api";

const request = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const aiService = {
  getStatus: () => request(axios.get(`${API_BASE_URL}/ai/status`)),

  /** messages: [{ role: "user" | "assistant", content: string }] */
  chat: (workspaceId, messages) =>
    request(axios.post(`${API_BASE_URL}/ai/workspaces/${workspaceId}/chat`, { messages })),

  planDay: (workspaceId) =>
    request(axios.post(`${API_BASE_URL}/ai/workspaces/${workspaceId}/plan-day`)),

  getUsage: (workspaceId) =>
    request(axios.get(`${API_BASE_URL}/ai/workspaces/${workspaceId}/usage`)),

  /** Without create, returns suggestions only; with create, saves them as subtasks. */
  breakdownTask: (taskId, { create = false } = {}) =>
    request(axios.post(`${API_BASE_URL}/ai/tasks/${taskId}/breakdown`, { create })),
};
