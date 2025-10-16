import WorkspaceMember from "../models/workspaceMember.js";
import ProjectMember from "../models/projectMember.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import User from "../models/user.js";

/**
 * Check if user is a member of the workspace and attach workspace data
 */
export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.auth._id;

    // Fetch workspace once
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if user is owner (no DB call needed for membership)
    if (workspace.owner.toString() === userId.toString()) {
      req.workspace = workspace;
      req.workspaceMember = { 
        role: "owner", 
        user: userId,
        workspace: workspaceId,
        status: "active",
        permissions: {} // Owner has all permissions
      };
      req.isWorkspaceOwner = true;
      return next();
    }

    // Check workspace membership
    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "active",
    });

    if (!member) {
      return res.status(403).json({
        error: "Access denied. You are not a member of this workspace.",
      });
    }

    // Attach data to request - reuse in subsequent operations
    req.workspace = workspace;
    req.workspaceMember = member;
    req.isWorkspaceOwner = false;
    next();
  } catch (error) {
    console.error("Error checking workspace membership:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if user is workspace owner or admin
 */
export const requireWorkspaceAdmin = async (req, res, next) => {
  try {
    // If workspace data already attached, reuse it
    if (req.workspace && req.workspaceMember) {
      if (req.isWorkspaceOwner || req.workspaceMember.role === "admin") {
        return next();
      }
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
      });
    }

    // Otherwise fetch it
    const { workspaceId } = req.params;
    const userId = req.auth._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if owner
    if (workspace.owner.toString() === userId.toString()) {
      req.workspace = workspace;
      req.isWorkspaceOwner = true;
      return next();
    }

    // Check if admin
    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "active",
    });

    if (!member || (member.role !== "admin" && member.role !== "owner")) {
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
      });
    }

    req.workspace = workspace;
    req.workspaceMember = member;
    next();
  } catch (error) {
    console.error("Error checking workspace admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if user can access project
 */
export const requireProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.auth._id;

    // Fetch project once
    const project = await Project.findById(projectId).populate('workspace');
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check workspace membership first (reuse if already fetched)
    let workspaceMember = req.workspaceMember;
    let isOwner = req.isWorkspaceOwner;

    if (!workspaceMember && !isOwner) {
      // Check if workspace owner
      if (project.workspace.owner.toString() === userId.toString()) {
        isOwner = true;
        req.isWorkspaceOwner = true;
        req.workspace = project.workspace;
      } else {
        // Check workspace membership
        workspaceMember = await WorkspaceMember.findOne({
          workspace: project.workspace._id,
          user: userId,
          status: "active",
        });

        if (!workspaceMember) {
          return res.status(403).json({
            error: "Access denied. You are not a member of this workspace.",
          });
        }
        req.workspaceMember = workspaceMember;
        req.workspace = project.workspace;
      }
    }

    // Owner and Admin can access all projects
    if (isOwner || (workspaceMember && workspaceMember.role === "admin")) {
      req.project = project;
      req.projectMember = null; // Not needed for owner/admin
      return next();
    }

    // For employees and clients, check project membership
    const projectMember = await ProjectMember.findOne({
      project: projectId,
      user: userId,
      status: "active",
    });

    // Check if project is in assigned projects
    const hasAccess = projectMember || 
      (workspaceMember.assignedProjects && 
       workspaceMember.assignedProjects.some(
         ap => ap.project.toString() === projectId.toString()
       ));

    if (!hasAccess) {
      return res.status(403).json({
        error: "Access denied. You don't have access to this project.",
      });
    }

    req.project = project;
    req.projectMember = projectMember;
    next();
  } catch (error) {
    console.error("Error checking project access:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireWorkspaceOwnerOrAdmin = async (req, res, next) => {
  try {
    if (req.isWorkspaceOwner || (req.workspaceMember && req.workspaceMember.role === "admin")) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied. Workspace owner or admin privileges required.",
    });
  } catch (error) {
    console.error("Error checking workspace owner/admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireProjectAdmin = async (req, res, next) => {
  try {
    if (req.project && (req.isWorkspaceOwner || 
        (req.workspaceMember && req.workspaceMember.role === "admin") ||
        (req.projectMember && req.projectMember.role === "admin"))) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied. Project admin privileges required.",
    });
  } catch (error) {
    console.error("Error checking project admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if user can create tasks in project
 */
export const canCreateTask = async (req, res, next) => {
  try {
    const userId = req.auth._id;

    // Owner and admin can always create tasks
    if (req.isWorkspaceOwner || 
        (req.workspaceMember && req.workspaceMember.role === "admin")) {
      return next();
    }

    // Check employee permissions
    if (req.workspaceMember && req.workspaceMember.role === "employee") {
      // Check workspace default permissions
      const canCreate = req.workspace?.settings?.employeePermissions?.canCreateTasks !== false;
      // Check project-specific permissions
      const projectCanCreate = req.projectMember?.permissions?.canCreateTasks !== false;
      
      if (canCreate && projectCanCreate) {
        return next();
      }
    }

    // Clients generally cannot create tasks unless explicitly allowed
    if (req.workspaceMember && req.workspaceMember.role === "client") {
      const canCreate = req.workspace?.settings?.clientPermissions?.canCreateTasks === true;
      if (canCreate) {
        return next();
      }
    }

    return res.status(403).json({
      error: "Access denied. You don't have permission to create tasks.",
    });
  } catch (error) {
    console.error("Error checking task creation permission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Check if user can edit task
 */
export const canEditTask = async (req, res, next) => {
  try {
    const userId = req.auth._id;
    const task = req.task; // Should be attached by controller

    // Owner and admin can always edit
    if (req.isWorkspaceOwner || 
        (req.workspaceMember && req.workspaceMember.role === "admin")) {
      return next();
    }

    // Task creator can edit
    if (task && task.createdBy.toString() === userId.toString()) {
      return next();
    }

    // Check project permissions
    if (req.projectMember?.permissions?.canEditTasks !== false) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied. You don't have permission to edit this task.",
    });
  } catch (error) {
    console.error("Error checking task edit permission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  requireProjectAccess,
  requireProjectAdmin,
  canCreateTask,
  canEditTask,
};

