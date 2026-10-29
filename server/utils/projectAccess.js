import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";

/**
 * Projects a user can see in a workspace. Mirrors requireProjectAccess:
 * owners and admins see every project, other members only the projects they
 * belong to or were assigned.
 *
 * @param {object} scope - { workspace, workspaceMember, isWorkspaceOwner, userId }
 *   as attached to the request by requireWorkspaceMember.
 */
export const getAccessibleProjects = async (
  { workspace, workspaceMember, isWorkspaceOwner, userId },
  select = "name key description"
) => {
  const base = { workspace: workspace._id, status: { $ne: "archived" } };
  if (isWorkspaceOwner || workspaceMember?.role === "admin") {
    return Project.find(base).select(select).lean();
  }
  const memberProjectIds = await ProjectMember.find({ user: userId, status: "active" }).distinct(
    "project"
  );
  const assigned = (workspaceMember?.assignedProjects || []).map((ap) => ap.project);
  return Project.find({ ...base, _id: { $in: [...memberProjectIds, ...assigned] } })
    .select(select)
    .lean();
};
