import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import ProjectTemplate from "../models/projectTemplate.js";
import Board from "../models/board.js";
import Column from "../models/column.js";
import Task from "../models/task.js";
import ActivityLog from "../models/activityLog.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Workspace from "../models/workspace.js";
import User from "../models/user.js";
import { updateLastSelectedProject, updateLastSelectedBoard, updateLastSelectedColumn } from "../utils/lastSelected.js";
import { sendProjectCreatedEmail } from "../utils/emailTemplates.js";
import { createDefaultChannels } from "../utils/channelHelpers.js";
import { getAccessibleProjects } from "../utils/projectAccess.js";

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
      icon: icon || "Folder",
      color: color || "#6366f1",
      privacy: privacy || "public",
      createdBy: userId,
      lead: lead || userId,
    });

    await project.save();

    // Auto-create default channels for the project
    try {
      await createDefaultChannels(project._id, workspaceId, userId);
    } catch (channelError) {
      console.error("Error creating default channels:", channelError);
      // Don't fail project creation if channels fail
    }

    // Add creator as project admin
    const projectMember = new ProjectMember({
      project: project._id,
      user: userId,
      role: "admin",
      addedBy: userId,
    });
    await projectMember.save();

    // Add workspace owner as admin if different from creator
    if (workspace.owner.toString() !== userId.toString()) {
      const ownerMember = new ProjectMember({
        project: project._id,
        user: workspace.owner,
        role: "admin",
        addedBy: userId,
      });
      await ownerMember.save();
    }

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

    // Send email notification to all workspace members about new project
    console.log(`\n📧 Sending project created emails to workspace members`);
    try {
      const workspaceMembers = await WorkspaceMember.find({
        workspace: workspaceId,
        status: "active",
      }).populate("user", "name email");

      const creator = await User.findById(userId);
      
      if (workspaceMembers.length > 0) {
        await sendProjectCreatedEmail({
          project,
          workspace: { _id: workspaceId, name: workspace.name },
          creator,
          members: workspaceMembers,
        });
        console.log(`✅ Project created emails sent to ${workspaceMembers.length} workspace members`);
      }
    } catch (emailError) {
      console.error(`⚠️ Failed to send project created emails:`, emailError.message);
      console.log(`📧 Email service is currently unavailable. Project creation will continue without email notifications.`);
      // Don't fail the request if email fails
    }

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
    const userId = req.auth._id;
    const OPEN = ["backlog", "todo", "in_progress", "in_review", "blocked"];

    // Same visibility rules as requireProjectAccess: owners/admins see all,
    // everyone else sees projects they belong to or were assigned.
    const accessible = await getAccessibleProjects(
      {
        workspace: req.workspace,
        workspaceMember: req.workspaceMember,
        isWorkspaceOwner: req.isWorkspaceOwner,
        userId,
      },
      "_id"
    );
    const projectIds = accessible.map((p) => p._id);

    const [projects, taskStats, memberDocs] = await Promise.all([
      Project.find({ _id: { $in: projectIds } })
        .populate("lead", "name email avatar")
        .select("name key description icon color privacy status progress deadline createdAt updatedAt")
        .sort({ updatedAt: -1 }),
      Task.aggregate([
        { $match: { project: { $in: projectIds }, isArchived: { $ne: true } } },
        {
          $group: {
            _id: "$project",
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [{ $in: ["$status", OPEN] }, { $lt: ["$dueDate", new Date()] }, { $ne: ["$dueDate", null] }] },
                  1,
                  0,
                ],
              },
            },
            lastActivity: { $max: "$updatedAt" },
          },
        },
      ]),
      ProjectMember.find({ project: { $in: projectIds }, status: "active" })
        .populate("user", "name email avatar")
        .select("project user")
        .lean(),
    ]);

    const stats = new Map(taskStats.map((t) => [String(t._id), t]));
    const membersByProject = new Map();
    for (const m of memberDocs) {
      const key = String(m.project);
      if (!membersByProject.has(key)) membersByProject.set(key, []);
      if (m.user) membersByProject.get(key).push(m.user);
    }

    const data = projects.map((project) => {
      const stat = stats.get(String(project._id));
      const people = membersByProject.get(String(project._id)) || [];
      const total = stat?.total || 0;
      return {
        ...project.toObject(),
        members: people.length,
        memberPreview: people.slice(0, 5),
        taskCount: total,
        doneCount: stat?.done || 0,
        overdueCount: stat?.overdue || 0,
        progress: total ? Math.round(((stat?.done || 0) / total) * 100) : 0,
        lastActivity: stat?.lastActivity || project.updatedAt,
      };
    });

    res.json({
      success: true,
      message: "Projects fetched successfully",
      data,
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
    const project = req.project; // Already fetched by middleware

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Archive the project instead of deleting
    project.status = "archived";
    project.archivedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: "Project archived successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error archiving project:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
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
    const project = req.project;
    const currentUserId = req.auth._id;

    // Prevent removing the project creator
    if (project.createdBy && project.createdBy.toString() === userId) {
      return res.status(403).json({ 
        error: "Cannot remove the project creator" 
      });
    }

    // Prevent removing the workspace owner
    const workspace = await Workspace.findById(project.workspace);
    if (workspace && workspace.owner.toString() === userId) {
      return res.status(403).json({ 
        error: "Cannot remove the workspace owner" 
      });
    }

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

export const getProjectTemplates = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const globalTemplates = await ProjectTemplate.find({ isGlobal: true })
      .select("-__v")
      .sort({ usageCount: -1, createdAt: -1 });

    let workspaceTemplates = [];
    if (workspaceId) {
      workspaceTemplates = await ProjectTemplate.find({
        workspace: workspaceId,
        isGlobal: false,
      })
        .select("-__v")
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        global: globalTemplates,
        workspace: workspaceTemplates,
      },
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPreMadeProjects = async (req, res) => {
  try {
    const templates = await ProjectTemplate.find({ isGlobal: true })
      .select("name key description category icon color")
      .sort({ usageCount: -1 });

    const preMadeProjects = templates.map(t => ({
      name: t.name,
      key: t.key,
      description: t.description,
      icon: t.icon,
      color: t.color,
      privacy: "public",
      template: true,
    }));

    res.json({
      success: true,
      data: preMadeProjects,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Create project from template
 */
export const createProjectFromTemplate = async (req, res) => {
  try {
    const { templateId, templateKey, name, key, description, icon, color, privacy, lead } = req.body;
    const { workspaceId } = req.params;
    const userId = req.auth._id;

    let template;
    
    if (templateKey) {
      template = await ProjectTemplate.findOne({ key: templateKey.toUpperCase() });
    } else if (templateId) {
      template = await ProjectTemplate.findById(templateId);
    }

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const projectKey = key || template.key;
    const existingProject = await Project.findOne({
      workspace: workspaceId,
      key: projectKey.toUpperCase(),
    });

    if (existingProject) {
      return res.status(400).json({ error: "Project key already exists in this workspace" });
    }

    const project = new Project({
      name: name || template.name,
      key: projectKey.toUpperCase(),
      description: description || template.description,
      icon: icon || template.icon,
      color: color || template.color,
      privacy: privacy || "public",
      workspace: workspaceId,
      createdBy: userId,
      lead: lead || userId,
      templateUsed: template._id,
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

    // Add workspace owner as admin if different from creator
    const workspace = await Workspace.findById(workspaceId);
    if (workspace && workspace.owner.toString() !== userId.toString()) {
      const ownerMember = new ProjectMember({
        project: project._id,
        user: workspace.owner,
        role: "admin",
        addedBy: userId,
      });
      await ownerMember.save();
    }

    const board = new Board({
      name: "Main Board",
      project: project._id,
      isDefault: true,
      createdBy: userId,
    });
    await board.save();

    const columns = await Promise.all(
      template.defaultColumns.map((col) =>
        new Column({
          name: col.name,
          board: board._id,
          project: project._id,
          position: col.position,
          color: col.color,
          limit: col.limit,
        }).save()
      )
    );

    if (template.defaultTasks && template.defaultTasks.length > 0) {
      // Get the next task number for this project
      const lastTask = await Task.findOne({ project: project._id }).sort({ taskNumber: -1 });
      let nextTaskNumber = lastTask ? lastTask.taskNumber + 1 : 1;

      await Promise.all(
        template.defaultTasks.map(async (task, index) => {
          const taskNumber = nextTaskNumber + index;
          const taskKey = `${project.key}-${taskNumber}`;
          
          return new Task({
            title: task.title,
            description: task.description,
            column: columns[task.columnIndex]?._id,
            board: board._id,
            project: project._id,
            priority: task.priority,
            position: task.position,
            taskNumber: taskNumber,
            taskKey: taskKey,
            createdBy: userId,
          }).save();
        })
      );
    }

    await ProjectTemplate.findByIdAndUpdate(template._id, {
      $inc: { usageCount: 1 },
    });

    await updateLastSelectedProject(userId, {
      id: project._id,
      name: project.name,
      workspaceId: workspaceId,
    });

    res.status(201).json({
      success: true,
      data: {
        ...project.toObject(),
        defaultBoard: board._id,
      },
    });
  } catch (error) {
    console.error("Error creating project from template:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProjectSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { settings } = req.body;
    const project = req.project;

    if (!settings) {
      return res.status(400).json({ error: "Settings are required" });
    }

    project.settings = { ...project.settings, ...settings };
    await project.save();

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error updating project settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createWorkspaceTemplate = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, key, description, category, icon, color, defaultColumns, defaultTasks } = req.body;
    const userId = req.auth._id;

    if (!name || !key || !category) {
      return res.status(400).json({ error: "Name, key, and category are required" });
    }

    const existingTemplate = await ProjectTemplate.findOne({
      key: key.toUpperCase(),
    });

    if (existingTemplate) {
      return res.status(400).json({ error: "Template key already exists" });
    }

    const template = new ProjectTemplate({
      name,
      key: key.toUpperCase(),
      description,
      category,
      icon: icon || "Folder",
      color: color || "#6366f1",
      isGlobal: false,
      workspace: workspaceId,
      defaultColumns: defaultColumns || [],
      defaultTasks: defaultTasks || [],
      createdBy: userId,
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error creating workspace template:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userIds } = req.body;
    const project = req.project;
    const userId = req.auth._id;
    const { workspaceId } = req.params;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs array is required" });
    }

    // First check if all users are workspace members
    const workspaceMembers = await WorkspaceMember.find({
      workspace: project.workspace,
      user: { $in: userIds },
      status: "active",
    });

    if (workspaceMembers.length !== userIds.length) {
      return res.status(400).json({
        error: "Some users are not members of this workspace",
      });
    }

    // Check which users are already active project members
    const existingMembers = await ProjectMember.find({
      project: projectId,
      user: { $in: userIds },
      status: { $ne: "removed" },
    }).select("user");

    const existingUserIds = existingMembers.map((m) => m.user.toString());
    
    // Find users who were previously removed
    const removedMembers = await ProjectMember.find({
      project: projectId,
      user: { $in: userIds },
      status: "removed",
    });

    // Reactivate removed members
    for (const removedMember of removedMembers) {
      removedMember.status = "active";
      removedMember.addedBy = userId;
      await removedMember.save();
    }

    // Find truly new users
    const allExistingUserIds = [...existingUserIds, ...removedMembers.map(m => m.user.toString())];
    const newUserIds = userIds.filter(
      (id) => !allExistingUserIds.includes(id.toString())
    );

    // If all users are already members, return success
    if (newUserIds.length === 0 && removedMembers.length === 0) {
      return res.status(200).json({
        message: "All users are already members of this project",
        members: existingMembers,
      });
    }

    // Insert truly new members
    let newMembers = [];
    if (newUserIds.length > 0) {
      newMembers = await ProjectMember.insertMany(
        newUserIds.map((uid) => ({
          project: projectId,
          user: uid,
          role: "member",
          addedBy: userId,
        }))
      );
    }

    // Get all member IDs to populate (new + reactivated)
    const allMemberIds = [
      ...newMembers.map((m) => m._id),
      ...removedMembers.map((m) => m._id)
    ];

    const populatedMembers = await ProjectMember.find({
      _id: { $in: allMemberIds },
    }).populate("user", "name email profilePicture");

    res.status(201).json({
      success: true,
      message: removedMembers.length > 0 
        ? `${newUserIds.length} new member(s) added, ${removedMembers.length} member(s) reactivated` 
        : `${newUserIds.length} member(s) added`,
      data: populatedMembers,
    });
  } catch (error) {
    console.error("Error adding project members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get project activity
export const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeRange = "7d", limit = 100 } = req.query;

    const days = { "24h": 1, "7d": 7, "30d": 30 }[timeRange];
    const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);

    // Activity on the project itself and on any of its tasks
    const taskIds = await Task.find({ project: projectId }).distinct("_id");
    const activities = await ActivityLog.find({
      createdAt: { $gte: since },
      $or: [{ project: projectId }, { target: projectId }, { target: { $in: taskIds } }],
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 300))
      .populate("actor", "name email avatar")
      .lean();

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error("Error fetching project activity:", error);
    res.status(500).json({ error: "Failed to fetch project activity" });
  }
};

// Get project statistics
export const getProjectStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const OPEN = ["backlog", "todo", "in_progress", "in_review", "blocked"];

    const tasks = await Task.find({ project: projectId, isArchived: { $ne: true } })
      .select("status dueDate")
      .lean();
    const now = new Date();
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const overdueTasks = tasks.filter((t) => OPEN.includes(t.status) && t.dueDate && t.dueDate < now).length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const totalMembers = await ProjectMember.countDocuments({ project: projectId, status: "active" });

    res.json({
      success: true,
      data: {
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        progressRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
        totalMembers,
      },
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ error: "Failed to fetch project stats" });
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
  addProjectMembers,
  getProjectBoards,
  createBoard,
  getBoardColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  getProjectTemplates,
  getPreMadeProjects,
  createProjectFromTemplate,
  updateProjectSettings,
  createWorkspaceTemplate,
  getProjectActivity,
  getProjectStats,
};

