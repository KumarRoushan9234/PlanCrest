import express from "express";
import { requireSignin, handleAuthError } from "../middlewares/index.js";
import { requireProjectAccess, requireProjectAdmin, requireWorkspaceMember, canEditTask } from "../middlewares/permissions.js";
import { requireTaskAccess, loadTask } from "../middlewares/resourceAccess.js";
import {
  addDependency,
  createAutomation,
  createGoal,
  deleteAutomation,
  deleteGoal,
  deleteTimeEntry,
  getDependencies,
  getRunningTimer,
  getTimesheet,
  getWorkload,
  listAutomations,
  listGoals,
  listTaskTime,
  logTime,
  removeDependency,
  setCustomFieldDefs,
  setCustomFieldValues,
  setRecurrence,
  startTimer,
  stopTimer,
  updateAutomation,
  updateGoal,
} from "../controllers/productivity.js";

const router = express.Router();
const taskRead = [requireSignin, requireTaskAccess];
const taskWrite = [requireSignin, requireTaskAccess, loadTask, canEditTask];
const ws = [requireSignin, requireWorkspaceMember];
const projectAdmin = [requireSignin, requireProjectAccess, requireProjectAdmin];

// Time tracking
router.get("/tasks/:taskId/time", ...taskRead, listTaskTime);
router.post("/tasks/:taskId/time", ...taskRead, logTime);
router.post("/tasks/:taskId/time/start", ...taskRead, startTimer);
router.post("/time/stop", requireSignin, stopTimer);
router.get("/time/running", requireSignin, getRunningTimer);
router.delete("/time/:entryId", requireSignin, deleteTimeEntry);
router.get("/workspaces/:workspaceId/timesheet", ...ws, getTimesheet);

// Dependencies, repeat, custom fields
router.get("/tasks/:taskId/dependencies", ...taskRead, getDependencies);
router.post("/tasks/:taskId/dependencies", ...taskWrite, addDependency);
router.delete("/tasks/:taskId/dependencies/:otherId", ...taskWrite, removeDependency);
router.put("/tasks/:taskId/recurrence", ...taskWrite, setRecurrence);
router.put("/tasks/:taskId/custom-fields", ...taskWrite, setCustomFieldValues);
router.put("/projects/:projectId/custom-fields", ...projectAdmin, setCustomFieldDefs);

// Automations
router.get("/projects/:projectId/automations", requireSignin, requireProjectAccess, listAutomations);
router.post("/projects/:projectId/automations", ...projectAdmin, createAutomation);
router.put("/projects/:projectId/automations/:automationId", ...projectAdmin, updateAutomation);
router.delete("/projects/:projectId/automations/:automationId", ...projectAdmin, deleteAutomation);

// Goals and workload
router.get("/workspaces/:workspaceId/goals", ...ws, listGoals);
router.post("/workspaces/:workspaceId/goals", ...ws, createGoal);
router.put("/workspaces/:workspaceId/goals/:goalId", ...ws, updateGoal);
router.delete("/workspaces/:workspaceId/goals/:goalId", ...ws, deleteGoal);
router.get("/workspaces/:workspaceId/workload", ...ws, getWorkload);

router.use(handleAuthError);

export default router;
