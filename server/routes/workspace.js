import express from "express";
const router = express.Router();

import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
  inviteToWorkspace,
  getWorkspaceInvitations,
  respondToInvitation,
  getLastSelected,
  getInvitationDetails,
  acceptInvitation,
  getWorkspaceTasks,
  getWorkspaceActivity,
} from "../controllers/workspace.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import {
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from "../middlewares/permissions.js";

// Workspace CRUD
router.post("/workspaces", requireSignin, createWorkspace, handleAuthError);
router.get("/workspaces", requireSignin, getUserWorkspaces, handleAuthError);
router.get(
  "/workspaces/:workspaceId",
  requireSignin,
  requireWorkspaceMember,
  getWorkspace,
  handleAuthError
);
router.put(
  "/workspaces/:workspaceId",
  requireSignin,
  requireWorkspaceAdmin,
  updateWorkspace,
  handleAuthError
);
router.delete(
  "/workspaces/:workspaceId",
  requireSignin,
  requireWorkspaceAdmin,
  deleteWorkspace,
  handleAuthError
);

// Workspace Tasks and Activity
router.get(
  "/workspaces/:workspaceId/tasks",
  requireSignin,
  requireWorkspaceMember,
  getWorkspaceTasks,
  handleAuthError
);
router.get(
  "/workspaces/:workspaceId/activity",
  requireSignin,
  requireWorkspaceMember,
  getWorkspaceActivity,
  handleAuthError
);

// Workspace Members
router.get(
  "/workspaces/:workspaceId/members",
  requireSignin,
  requireWorkspaceMember,
  getWorkspaceMembers,
  handleAuthError
);
router.post(
  "/workspaces/:workspaceId/members",
  requireSignin,
  requireWorkspaceAdmin,
  addWorkspaceMember,
  handleAuthError
);
router.put(
  "/workspaces/:workspaceId/members/:userId",
  requireSignin,
  requireWorkspaceAdmin,
  updateWorkspaceMember,
  handleAuthError
);
router.delete(
  "/workspaces/:workspaceId/members/:userId",
  requireSignin,
  requireWorkspaceAdmin,
  removeWorkspaceMember,
  handleAuthError
);

// Workspace Invitations
router.post(
  "/workspaces/:workspaceId/invite",
  requireSignin,
  requireWorkspaceAdmin,
  inviteToWorkspace,
  handleAuthError
);
router.get(
  "/workspaces/:workspaceId/invitations",
  requireSignin,
  requireWorkspaceMember,
  getWorkspaceInvitations,
  handleAuthError
);
router.put(
  "/invitations/:token",
  requireSignin,
  respondToInvitation,
  handleAuthError
);

// Last Selected Items
router.get(
  "/last-selected",
  requireSignin,
  getLastSelected,
  handleAuthError
);

// Invitation routes (public endpoints)
router.get(
  "/invitations/details/:token",
  getInvitationDetails,
  handleAuthError
);

router.post(
  "/invitations/accept/:token",
  requireSignin,
  acceptInvitation,
  handleAuthError
);

// Error handler
router.use(handleAuthError);

export default router;

