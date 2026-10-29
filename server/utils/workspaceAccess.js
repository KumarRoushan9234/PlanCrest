import mongoose from "mongoose";
import Workspace from "../models/workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";
import { getAccessibleProjects } from "./projectAccess.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Resolve a user's standing in a workspace. Owners and admins are "managers".
 * Throws HttpError (400/403/404) rather than returning null so callers can just await it.
 */
export const getWorkspaceAccess = async (workspaceId, userId) => {
  if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new HttpError(400, "A valid workspace is required");
  }
  const workspace = await Workspace.findById(workspaceId).select("owner name").lean();
  if (!workspace) throw new HttpError(404, "Workspace not found");

  const isOwner = String(workspace.owner) === String(userId);
  const member = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId, status: "active" });
  if (!isOwner && !member) throw new HttpError(403, "You don't have access to this workspace");

  const role = isOwner ? "owner" : member.role;
  return { workspace, member, role, isOwner, isManager: isOwner || role === "admin" };
};

/** Ids of the projects this user can open in the workspace. */
export const getAccessibleProjectIds = async (workspaceId, userId, access) => {
  const projects = await getAccessibleProjects(
    { workspace: { _id: workspaceId }, workspaceMember: access.member, isWorkspaceOwner: access.isOwner, userId },
    "_id"
  );
  return projects.map((p) => p._id);
};

/** Throw unless the user may use this project (and it belongs to the workspace). */
export const assertProjectAccess = async (workspaceId, projectId, userId, access) => {
  const allowed = await getAccessibleProjectIds(workspaceId, userId, access);
  if (!projectId || !allowed.some((id) => String(id) === String(projectId))) {
    throw new HttpError(403, "You don't have access to that project");
  }
};
