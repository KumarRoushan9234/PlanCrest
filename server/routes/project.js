import express from "express";
const router = express.Router();

import {
  createProject,
  getWorkspaceProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  getProjectBoards,
  createBoard,
  getBoardColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  getPreMadeProjects,
  createProjectFromTemplate,
} from "../controllers/project.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import {
  requireWorkspaceMember,
  requireProjectAccess,
  requireProjectAdmin,
} from "../middlewares/permissions.js";

// Project CRUD
router.post(
  "/workspaces/:workspaceId/projects",
  requireSignin,
  requireWorkspaceMember,
  createProject,
  handleAuthError
);
router.get(
  "/workspaces/:workspaceId/projects",
  requireSignin,
  requireWorkspaceMember,
  getWorkspaceProjects,
  handleAuthError
);
router.get(
  "/projects/:projectId",
  requireSignin,
  requireProjectAccess,
  getProject,
  handleAuthError
);
router.put(
  "/projects/:projectId",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  updateProject,
  handleAuthError
);
router.delete(
  "/projects/:projectId",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  deleteProject,
  handleAuthError
);

// Project Members
router.get(
  "/projects/:projectId/members",
  requireSignin,
  requireProjectAccess,
  getProjectMembers,
  handleAuthError
);
router.post(
  "/projects/:projectId/members",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  addProjectMember,
  handleAuthError
);
router.put(
  "/projects/:projectId/members/:userId",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  updateProjectMember,
  handleAuthError
);
router.delete(
  "/projects/:projectId/members/:userId",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  removeProjectMember,
  handleAuthError
);

// Boards and Columns
router.get(
  "/projects/:projectId/boards",
  requireSignin,
  requireProjectAccess,
  getProjectBoards,
  handleAuthError
);
router.post(
  "/projects/:projectId/boards",
  requireSignin,
  requireProjectAccess,
  requireProjectAdmin,
  createBoard,
  handleAuthError
);
router.get(
  "/boards/:boardId/columns",
  requireSignin,
  getBoardColumns,
  handleAuthError
);
router.post(
  "/boards/:boardId/columns",
  requireSignin,
  createColumn,
  handleAuthError
);
router.put(
  "/columns/:columnId",
  requireSignin,
  updateColumn,
  handleAuthError
);
router.delete(
  "/columns/:columnId",
  requireSignin,
  deleteColumn,
  handleAuthError
);

// Pre-made projects and templates
router.get(
  "/templates",
  requireSignin,
  getPreMadeProjects,
  handleAuthError
);
router.post(
  "/workspaces/:workspaceId/projects/template",
  requireSignin,
  requireWorkspaceMember,
  createProjectFromTemplate,
  handleAuthError
);

// Error handler
router.use(handleAuthError);

export default router;

