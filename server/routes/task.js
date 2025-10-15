import express from "express";
const router = express.Router();

import {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  updateTaskPosition,
  deleteTask,
  assignTask,
  getTaskAssignments,
  unassignTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createLabel,
  getProjectLabels,
  updateLabel,
  deleteLabel,
} from "../controllers/task.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import {
  requireProjectAccess,
  canCreateTask,
  canEditTask,
} from "../middlewares/permissions.js";

// Task CRUD
router.post(
  "/projects/:projectId/tasks",
  requireSignin,
  requireProjectAccess,
  canCreateTask,
  createTask,
  handleAuthError
);
router.get(
  "/projects/:projectId/tasks",
  requireSignin,
  requireProjectAccess,
  getProjectTasks,
  handleAuthError
);
router.get(
  "/tasks/:taskId",
  requireSignin,
  getTask,
  handleAuthError
);
router.put(
  "/tasks/:taskId",
  requireSignin,
  updateTask,
  handleAuthError
);
router.put(
  "/tasks/:taskId/status",
  requireSignin,
  updateTaskStatus,
  handleAuthError
);
router.put(
  "/tasks/:taskId/position",
  requireSignin,
  updateTaskPosition,
  handleAuthError
);
router.delete(
  "/tasks/:taskId",
  requireSignin,
  deleteTask,
  handleAuthError
);

// Task Assignments
router.post(
  "/tasks/:taskId/assignments",
  requireSignin,
  assignTask,
  handleAuthError
);
router.get(
  "/tasks/:taskId/assignments",
  requireSignin,
  getTaskAssignments,
  handleAuthError
);
router.delete(
  "/assignments/:assignmentId",
  requireSignin,
  unassignTask,
  handleAuthError
);

// Subtasks
router.post(
  "/tasks/:taskId/subtasks",
  requireSignin,
  createSubtask,
  handleAuthError
);
router.put(
  "/subtasks/:subtaskId",
  requireSignin,
  updateSubtask,
  handleAuthError
);
router.delete(
  "/subtasks/:subtaskId",
  requireSignin,
  deleteSubtask,
  handleAuthError
);

// Labels
router.post(
  "/projects/:projectId/labels",
  requireSignin,
  requireProjectAccess,
  createLabel,
  handleAuthError
);
router.get(
  "/projects/:projectId/labels",
  requireSignin,
  requireProjectAccess,
  getProjectLabels,
  handleAuthError
);
router.put(
  "/labels/:labelId",
  requireSignin,
  updateLabel,
  handleAuthError
);
router.delete(
  "/labels/:labelId",
  requireSignin,
  deleteLabel,
  handleAuthError
);

// Error handler
router.use(handleAuthError);

export default router;

