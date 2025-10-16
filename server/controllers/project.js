import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import Board from "../models/board.js";
import Column from "../models/column.js";
import WorkspaceMember from "../models/workspaceMember.js";
import { updateLastSelectedProject, updateLastSelectedBoard, updateLastSelectedColumn } from "../utils/lastSelected.js";

/**
 * Create a new project
 */
export const createProject = async (req, res) => {
  try {
    const { name, key, description, icon, color, privacy, lead } = req.body;
    const { workspaceId } = req.params;
    const userId = req.auth._id;
    const workspace = req.workspace; // Already fetched by middleware

    // Validation
    if (!name || !key) {
      return res.status(400).json({ error: "Project name and key are required" });
    }

    // Check if key already exists in workspace
    const existingProject = await Project.findOne({
      workspace: workspaceId,
      key: key.toUpperCase(),
    });

    if (existingProject) {
      return res.status(400).json({ error: "Project key already exists in this workspace" });
    }

    // Create project
    const project = new Project({
      name,
      key: key.toUpperCase(),
      description,
      workspace: workspaceId,
      icon: icon || "📁",
      color: color || "#6366f1",
      privacy: privacy || "public",
      createdBy: userId,
      lead: lead || userId,
    });

    await project.save();

    // Add creator as project admin
    const projectMember = new ProjectMember({
      project: project._id,
      user: userId,
      role: "admin",
      addedBy: userId,
    });

    await projectMember.save();

    // Create default board with columns
    const board = new Board({
      name: "Main Board",
      project: project._id,
      isDefault: true,
      createdBy: userId,
    });

    await board.save();

    // Create default columns
    const defaultColumns = [
      { name: "Backlog", type: "backlog", position: 0, color: "#94a3b8" },
      { name: "To Do", type: "todo", position: 1, color: "#3b82f6" },
      { name: "In Progress", type: "in_progress", position: 2, color: "#f59e0b" },
      { name: "In Review", type: "review", position: 3, color: "#8b5cf6" },
      { name: "Done", type: "done", position: 4, color: "#10b981" },
    ];

    const columnPromises = defaultColumns.map(col =>
      new Column({
        name: col.name,
        board: board._id,
        project: project._id,
        position: col.position,
        type: col.type,
        color: col.color,
      }).save()
    );

    await Promise.all(columnPromises);

    // Update user's last selected project
    await updateLastSelectedProject(userId, {
      id: project._id,
      name: project.name,
      workspaceId: workspaceId,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        ...project.toObject(),
        defaultBoard: board._id,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

/**
 * Get all projects in workspace
 */
export const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.auth._id;
    const isOwner = req.isWorkspaceOwner;
    const member = req.workspaceMember; // Already fetched

    let projects;

    // Owner and Admin can see all projects
    if (isOwner || (member && member.role === "admin")) {
      projects = await Project.find({
        workspace: workspaceId,
        status: { $in: ["active", "on_hold"] },
      })
        .populate("lead", "name email avatar")
        .select("name key description icon color privacy status progress createdAt");
    } else {
      // Employees and clients see only assigned projects
      const projectIds = member.assignedProjects?.map(ap => ap.project) || [];
      
      projects = await Project.find({
        _id: { $in: projectIds },
        status: { $in: ["active", "on_hold"] },
      })
        .populate("lead", "name email avatar")
        .select("name key description icon color privacy status progress createdAt");
    }

    res.json({
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

/**
 * Get project details
 */
export const getProject = async (req, res) => {
  try {
    // Project already attached by middleware - reuse it
    const project = req.project;
    const member = req.projectMember;

    // Populate additional details
    await project.populate([
      { path: "createdBy", select: "name email avatar" },
      { path: "lead", select: "name email avatar" },
    ]);

    // Update user's last selected project
    await updateLastSelectedProject(req.auth._id, {
      id: project._id,
      name: project.name,
      workspaceId: project.workspace,
    });

    // Add user's role to response
    const projectData = {
      ...project.toObject(),
      userRole: req.isWorkspaceOwner ? "owner" : 
                (req.workspaceMember?.role === "admin" ? "admin" : member?.role),
    };

    res.json({
      success: true,
      message: "Project fetched successfully",
      data: projectData,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

/**
 * Update project
 */
export const updateProject = async (req, res) => {
  try {
    const { name, description, icon, color, privacy, lead, status } = req.body;
    const project = req.project; // Already fetched

    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (icon) project.icon = icon;
    if (color) project.color = color;
    if (privacy) project.privacy = privacy;
    if (lead) project.lead = lead;
    if (status) project.status = status;

    await project.save();

    res.json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

/**
 * Delete project (archive)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = req.project; // Already fetched

    project.status = "archived";
    await project.save();

    res.json({
      success: true,
      message: "Project archived successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

/**
 * Get project members
 */
export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const members = await ProjectMember.find({
      project: projectId,
      status: "active",
    }).populate("user", "name email avatar title department");

    res.json({
      success: true,
      message: "Project members fetched successfully",
      data: members,
    });
  } catch (error) {
    console.error("Error fetching project members:", error);
    res.status(500).json({ error: "Failed to fetch project members" });
  }
};

/**
 * Add member to project
 */
export const addProjectMember = async (req, res) => {
  try {
    const { userId, role, permissions } = req.body;
    const { projectId } = req.params;
    const addedBy = req.auth._id;

    // Validation
    if (!userId || !role) {
      return res.status(400).json({ error: "User ID and role are required" });
    }

    // Check if already a member
    const existingMember = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (existingMember) {
      if (existingMember.status === "removed") {
        // Reactivate member
        existingMember.status = "active";
        existingMember.role = role;
        if (permissions) existingMember.permissions = { ...existingMember.permissions, ...permissions };
        await existingMember.save();

        return res.json({
          success: true,
          message: "Member reactivated successfully",
          data: existingMember,
        });
      }
      return res.status(400).json({ error: "User is already a project member" });
    }

    // Create project member
    const member = new ProjectMember({
      project: projectId,
      user: userId,
      role,
      permissions: permissions || {},
      addedBy,
    });

    await member.save();

    // Also update workspace member's assigned projects
    await WorkspaceMember.findOneAndUpdate(
      {
        workspace: req.project.workspace,
        user: userId,
      },
      {
        $addToSet: {
          assignedProjects: {
            project: projectId,
            assignedBy: addedBy,
            role: role,
          },
        },
      }
    );

    await member.populate("user", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add project member" });
  }
};

/**
 * Update project member
 */
export const updateProjectMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    const { projectId } = req.params;

    const member = await ProjectMember.findOne({
      project: projectId,
      user: userId,
      status: "active",
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Update fields
    if (role) member.role = role;
    if (permissions) member.permissions = { ...member.permissions, ...permissions };

    await member.save();

    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error updating project member:", error);
    res.status(500).json({ error: "Failed to update project member" });
  }
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    const member = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    member.status = "removed";
    await member.save();

    // Remove from workspace member's assigned projects
    await WorkspaceMember.findOneAndUpdate(
      {
        workspace: req.project.workspace,
        user: userId,
      },
      {
        $pull: {
          assignedProjects: { project: projectId },
        },
      }
    );

    res.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove project member" });
  }
};

/**
 * Get project boards
 */
export const getProjectBoards = async (req, res) => {
  try {
    const { projectId } = req.params;

    const boards = await Board.find({
      project: projectId,
      status: "active",
    }).populate("createdBy", "name email avatar");

    res.json({
      success: true,
      message: "Boards fetched successfully",
      data: boards,
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
};

/**
 * Create board
 */
export const createBoard = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { projectId } = req.params;
    const userId = req.auth._id;

    // Validation
    if (!name) {
      return res.status(400).json({ error: "Board name is required" });
    }

    const board = new Board({
      name,
      description,
      project: projectId,
      createdBy: userId,
    });

    await board.save();

    // Update user's last selected board
    await updateLastSelectedBoard(userId, {
      id: board._id,
      name: board.name,
      projectId: projectId,
    });

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      data: board,
    });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
};

/**
 * Get board columns
 */
export const getBoardColumns = async (req, res) => {
  try {
    const { boardId } = req.params;

    const columns = await Column.find({
      board: boardId,
    }).sort({ position: 1 });

    res.json({
      success: true,
      message: "Columns fetched successfully",
      data: columns,
    });
  } catch (error) {
    console.error("Error fetching columns:", error);
    res.status(500).json({ error: "Failed to fetch columns" });
  }
};

/**
 * Create column
 */
export const createColumn = async (req, res) => {
  try {
    const { name, type, color, position } = req.body;
    const { boardId } = req.params;

    // Validation
    if (!name) {
      return res.status(400).json({ error: "Column name is required" });
    }

    // Get board to get project
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Get max position if not provided
    let columnPosition = position;
    if (columnPosition === undefined) {
      const lastColumn = await Column.findOne({ board: boardId }).sort({ position: -1 });
      columnPosition = lastColumn ? lastColumn.position + 1 : 0;
    }

    const column = new Column({
      name,
      type: type || "custom",
      color: color || "#94a3b8",
      board: boardId,
      project: board.project,
      position: columnPosition,
    });

    await column.save();

    // Update user's last selected column
    await updateLastSelectedColumn(req.auth._id, {
      id: column._id,
      name: column.name,
      boardId: boardId,
      projectId: board.project,
    });

    res.status(201).json({
      success: true,
      message: "Column created successfully",
      data: column,
    });
  } catch (error) {
    console.error("Error creating column:", error);
    res.status(500).json({ error: "Failed to create column" });
  }
};

/**
 * Update column
 */
export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { name, color, wipLimit } = req.body;

    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Update fields
    if (name) column.name = name;
    if (color) column.color = color;
    if (wipLimit !== undefined) column.wipLimit = wipLimit;

    await column.save();

    res.json({
      success: true,
      message: "Column updated successfully",
      data: column,
    });
  } catch (error) {
    console.error("Error updating column:", error);
    res.status(500).json({ error: "Failed to update column" });
  }
};

/**
 * Delete column
 */
export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Check if column has tasks (you might want to prevent deletion)
    const Task = (await import("../models/task.js")).default;
    const taskCount = await Task.countDocuments({ column: columnId, isArchived: false });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: "Cannot delete column with tasks. Please move or delete tasks first.",
        taskCount 
      });
    }

    await Column.deleteOne({ _id: columnId });

    res.json({
      success: true,
      message: "Column deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting column:", error);
    res.status(500).json({ error: "Failed to delete column" });
  }
};

/**
 * Get pre-made project templates
 */
export const getPreMadeProjects = async (req, res) => {
  try {
    const preMadeProjects = [
      {
        name: "Web Development",
        key: "WEB",
        description: "Complete web application development project with frontend and backend components",
        icon: "🌐",
        color: "#3b82f6",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
      {
        name: "Mobile App",
        key: "MOBILE",
        description: "Mobile application development for iOS and Android platforms",
        icon: "📱",
        color: "#10b981",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: false,
          },
          automations: {
            autoAssignOnCreate: true,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
      {
        name: "Marketing Campaign",
        key: "MARKET",
        description: "Digital marketing campaign with content creation and social media management",
        icon: "📢",
        color: "#f59e0b",
        privacy: "public",
        settings: {
          defaultView: "calendar",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
      {
        name: "Product Design",
        key: "DESIGN",
        description: "UI/UX design project with user research and prototyping phases",
        icon: "🎨",
        color: "#8b5cf6",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: true,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
      {
        name: "Data Analysis",
        key: "DATA",
        description: "Data science project with collection, analysis, and visualization",
        icon: "📊",
        color: "#ef4444",
        privacy: "public",
        settings: {
          defaultView: "list",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: false,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
      {
        name: "Content Creation",
        key: "CONTENT",
        description: "Content marketing project with blog posts, videos, and social media content",
        icon: "✍️",
        color: "#06b6d4",
        privacy: "public",
        settings: {
          defaultView: "calendar",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
        template: true,
      },
    ];

    res.json({
      success: true,
      message: "Pre-made projects fetched successfully",
      data: preMadeProjects,
    });
  } catch (error) {
    console.error("Error fetching pre-made projects:", error);
    res.status(500).json({ error: "Failed to fetch pre-made projects" });
  }
};

/**
 * Create project from template
 */
export const createProjectFromTemplate = async (req, res) => {
  try {
    const { templateId, name, key, description, icon, color, privacy, lead } = req.body;
    const { workspaceId } = req.params;
    const userId = req.auth._id;
    const workspace = req.workspace;

    // Pre-made project templates
    const templates = {
      WEB: {
        name: "Web Development",
        key: "WEB",
        description: "Complete web application development project with frontend and backend components",
        icon: "🌐",
        color: "#3b82f6",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
      },
      MOBILE: {
        name: "Mobile App",
        key: "MOBILE",
        description: "Mobile application development for iOS and Android platforms",
        icon: "📱",
        color: "#10b981",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: false,
          },
          automations: {
            autoAssignOnCreate: true,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
      },
      MARKET: {
        name: "Marketing Campaign",
        key: "MARKET",
        description: "Digital marketing campaign with content creation and social media management",
        icon: "📢",
        color: "#f59e0b",
        privacy: "public",
        settings: {
          defaultView: "calendar",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
      },
      DESIGN: {
        name: "Product Design",
        key: "DESIGN",
        description: "UI/UX design project with user research and prototyping phases",
        icon: "🎨",
        color: "#8b5cf6",
        privacy: "public",
        settings: {
          defaultView: "kanban",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: true,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
      },
      DATA: {
        name: "Data Analysis",
        key: "DATA",
        description: "Data science project with collection, analysis, and visualization",
        icon: "📊",
        color: "#ef4444",
        privacy: "public",
        settings: {
          defaultView: "list",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: false,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: true,
            notifyOnTaskDue: true,
          },
        },
      },
      CONTENT: {
        name: "Content Creation",
        key: "CONTENT",
        description: "Content marketing project with blog posts, videos, and social media content",
        icon: "✍️",
        color: "#06b6d4",
        privacy: "public",
        settings: {
          defaultView: "calendar",
          features: {
            chat: true,
            documentation: true,
            timeTracking: true,
            clientPortal: true,
          },
          automations: {
            autoAssignOnCreate: false,
            autoMoveOnComplete: false,
            notifyOnTaskDue: true,
          },
        },
      },
    };

    const template = templates[templateId];
    if (!template) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    // Use provided values or fall back to template values
    const projectData = {
      name: name || template.name,
      key: key || template.key,
      description: description || template.description,
      icon: icon || template.icon,
      color: color || template.color,
      privacy: privacy || template.privacy,
      settings: template.settings,
      workspace: workspaceId,
      createdBy: userId,
      lead: lead || userId,
    };

    // Check if key already exists in workspace
    const existingProject = await Project.findOne({
      workspace: workspaceId,
      key: projectData.key.toUpperCase(),
    });

    if (existingProject) {
      return res.status(400).json({ error: "Project key already exists in this workspace" });
    }

    // Create project
    const project = new Project(projectData);
    await project.save();

    // Add creator as project admin
    const projectMember = new ProjectMember({
      project: project._id,
      user: userId,
      role: "admin",
      addedBy: userId,
    });

    await projectMember.save();

    // Create default board with columns
    const board = new Board({
      name: "Main Board",
      project: project._id,
      isDefault: true,
      createdBy: userId,
    });

    await board.save();

    // Create default columns
    const defaultColumns = [
      { name: "Backlog", type: "backlog", position: 0, color: "#94a3b8" },
      { name: "To Do", type: "todo", position: 1, color: "#3b82f6" },
      { name: "In Progress", type: "in_progress", position: 2, color: "#f59e0b" },
      { name: "In Review", type: "review", position: 3, color: "#8b5cf6" },
      { name: "Done", type: "done", position: 4, color: "#10b981" },
    ];

    const columnPromises = defaultColumns.map(col =>
      new Column({
        name: col.name,
        board: board._id,
        project: project._id,
        position: col.position,
        type: col.type,
        color: col.color,
      }).save()
    );

    await Promise.all(columnPromises);

    // Update user's last selected project
    await updateLastSelectedProject(userId, {
      id: project._id,
      name: project.name,
      workspaceId: workspaceId,
    });

    res.status(201).json({
      success: true,
      message: "Project created from template successfully",
      data: {
        ...project.toObject(),
        defaultBoard: board._id,
      },
    });
  } catch (error) {
    console.error("Error creating project from template:", error);
    res.status(500).json({ error: "Failed to create project from template" });
  }
};

export default {
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
};

