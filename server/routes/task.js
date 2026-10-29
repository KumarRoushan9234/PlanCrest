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
  createTaskComment,
  getTaskComments,
  updateTaskComment,
  deleteTaskComment,
  createTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
  getTaskActivity,
} from "../controllers/task.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import {
  requireProjectAccess,
  canCreateTask,
  canEditTask,
} from "../middlewares/permissions.js";
import {
  requireTaskAccess,
  requireSubtaskAccess,
  requireAssignmentAccess,
  requireLabelAccess,
  requireCommentAccess,
  requireAttachmentAccess,
  loadTask,
} from "../middlewares/resourceAccess.js";

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
  requireTaskAccess,
  getTask,
  handleAuthError
);
router.get(
  "/tasks/:taskId/activity",
  requireSignin,
  requireTaskAccess,
  getTaskActivity,
  handleAuthError
);
router.put(
  "/tasks/:taskId",
  requireSignin,
  requireTaskAccess,
  loadTask,
  canEditTask,
  updateTask,
  handleAuthError
);
router.put(
  "/tasks/:taskId/status",
  requireSignin,
  requireTaskAccess,
  loadTask,
  canEditTask,
  updateTaskStatus,
  handleAuthError
);
router.put(
  "/tasks/:taskId/position",
  requireSignin,
  requireTaskAccess,
  loadTask,
  canEditTask,
  updateTaskPosition,
  handleAuthError
);
router.delete(
  "/tasks/:taskId",
  requireSignin,
  requireTaskAccess,
  loadTask,
  canEditTask,
  deleteTask,
  handleAuthError
);

// Task Assignments
router.post(
  "/tasks/:taskId/assignments",
  requireSignin,
  requireTaskAccess,
  assignTask,
  handleAuthError
);
router.get(
  "/tasks/:taskId/assignments",
  requireSignin,
  requireTaskAccess,
  getTaskAssignments,
  handleAuthError
);
router.delete(
  "/assignments/:assignmentId",
  requireSignin,
  requireAssignmentAccess,
  unassignTask,
  handleAuthError
);

// Subtasks
router.post(
  "/tasks/:taskId/subtasks",
  requireSignin,
  requireTaskAccess,
  createSubtask,
  handleAuthError
);
router.put(
  "/subtasks/:subtaskId",
  requireSignin,
  requireSubtaskAccess,
  updateSubtask,
  handleAuthError
);
router.delete(
  "/subtasks/:subtaskId",
  requireSignin,
  requireSubtaskAccess,
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
  requireLabelAccess,
  updateLabel,
  handleAuthError
);
router.delete(
  "/labels/:labelId",
  requireSignin,
  requireLabelAccess,
  deleteLabel,
  handleAuthError
);

// Comments
router.post(
  "/tasks/:taskId/comments",
  requireSignin,
  requireTaskAccess,
  createTaskComment,
  handleAuthError
);
router.get(
  "/tasks/:taskId/comments",
  requireSignin,
  requireTaskAccess,
  getTaskComments,
  handleAuthError
);
router.put(
  "/comments/:commentId",
  requireSignin,
  requireCommentAccess,
  updateTaskComment,
  handleAuthError
);
router.delete(
  "/comments/:commentId",
  requireSignin,
  requireCommentAccess,
  deleteTaskComment,
  handleAuthError
);

// Attachments
router.post(
  "/tasks/:taskId/attachments",
  requireSignin,
  requireTaskAccess,
  createTaskAttachment,
  handleAuthError
);

// File upload endpoint (for future implementation with multer)
// router.post(
//   "/tasks/:taskId/attachments/upload",
//   requireSignin,
//   upload.single('file'),
//   uploadTaskAttachment,
//   handleAuthError
// );

router.get(
  "/tasks/:taskId/attachments",
  requireSignin,
  requireTaskAccess,
  getTaskAttachments,
  handleAuthError
);
router.delete(
  "/attachments/:attachmentId",
  requireSignin,
  requireAttachmentAccess,
  deleteTaskAttachment,
  handleAuthError
);

// Error handler
router.use(handleAuthError);

export default router;

