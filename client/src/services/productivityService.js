import axios from "axios";
import { API_BASE_URL } from "../config/api";

const call = async (promise) => {
  try {
    return (await promise).data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
const url = (path) => `${API_BASE_URL}${path}`;

/** Time tracking, dependencies, repeat, custom fields, automations, goals, workload. */
export const productivityService = {
  // Time
  getTaskTime: (taskId) => call(axios.get(url(`/tasks/${taskId}/time`))),
  startTimer: (taskId) => call(axios.post(url(`/tasks/${taskId}/time/start`))),
  stopTimer: () => call(axios.post(url("/time/stop"))),
  getRunningTimer: () => call(axios.get(url("/time/running"))),
  logTime: (taskId, body) => call(axios.post(url(`/tasks/${taskId}/time`), body)),
  deleteTime: (entryId) => call(axios.delete(url(`/time/${entryId}`))),
  getTimesheet: (workspaceId, params = {}) => call(axios.get(url(`/workspaces/${workspaceId}/timesheet`), { params })),

  // Dependencies, repeat, custom fields
  getDependencies: (taskId) => call(axios.get(url(`/tasks/${taskId}/dependencies`))),
  addDependency: (taskId, blockedBy) => call(axios.post(url(`/tasks/${taskId}/dependencies`), { blockedBy })),
  removeDependency: (taskId, otherId) => call(axios.delete(url(`/tasks/${taskId}/dependencies/${otherId}`))),
  setRecurrence: (taskId, body) => call(axios.put(url(`/tasks/${taskId}/recurrence`), body)),
  setCustomValues: (taskId, values) => call(axios.put(url(`/tasks/${taskId}/custom-fields`), { values })),
  setCustomFieldDefs: (projectId, fields) => call(axios.put(url(`/projects/${projectId}/custom-fields`), { fields })),

  // Automations
  getAutomations: (projectId) => call(axios.get(url(`/projects/${projectId}/automations`))),
  createAutomation: (projectId, body) => call(axios.post(url(`/projects/${projectId}/automations`), body)),
  updateAutomation: (projectId, id, body) => call(axios.put(url(`/projects/${projectId}/automations/${id}`), body)),
  deleteAutomation: (projectId, id) => call(axios.delete(url(`/projects/${projectId}/automations/${id}`))),

  // Goals and workload
  getGoals: (workspaceId) => call(axios.get(url(`/workspaces/${workspaceId}/goals`))),
  createGoal: (workspaceId, body) => call(axios.post(url(`/workspaces/${workspaceId}/goals`), body)),
  updateGoal: (workspaceId, id, body) => call(axios.put(url(`/workspaces/${workspaceId}/goals/${id}`), body)),
  deleteGoal: (workspaceId, id) => call(axios.delete(url(`/workspaces/${workspaceId}/goals/${id}`))),
  getWorkload: (workspaceId) => call(axios.get(url(`/workspaces/${workspaceId}/workload`))),
};

export const formatDuration = (seconds = 0) => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

export const formatClock = (seconds = 0) => {
  const s = Math.max(0, Math.round(seconds));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
