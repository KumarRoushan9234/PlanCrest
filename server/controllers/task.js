import Task from "../models/task.js";
import ActivityLog from "../models/activityLog.js";
import { isScopeAdmin } from "../middlewares/resourceAccess.js";
import { createTaskRecord, findDefaultColumn } from "../utils/taskFactory.js";
import { withTaskExtras } from "../utils/taskQueries.js";
import TaskAssignment from "../models/taskAssignment.js";
import Subtask from "../models/subtask.js";
import Label from "../models/label.js";
import ChatThread from "../models/chatThread.js";
import Project from "../models/project.js";
import Column from "../models/column.js";
import Workspace from "../models/workspace.js";
import User from "../models/user.js";
import Comment from "../models/comment.js";
import Attachment from "../models/attachment.js";
import { sendSimpleEmail } from "../utils/mailService.js";
import { sendTaskAssignedEmail, sendTaskCompletedEmail } from "../utils/emailTemplates.js";
import { notifyTaskAssignees } from "../utils/notificationHelpers.js";
import { updateLastSelectedTask } from "../utils/lastSelected.js";
import { logActivity, logTaskActivity } from "../utils/activityLogger.js";
import { runAutomations, spawnRecurrence } from "../utils/automationEngine.js";

const STATUS_TO_COLUMN_TYPE = {
  backlog: "backlog",
  todo: "todo",
  in_progress: "in_progress",
  in_review: "review",
  done: "done",
};

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      boardId,
      columnId,
      priority,
      status,
      dueDate,
      assignees,
      labels,
    } = req.body;
    const { projectId } = req.params;
    const userId = req.auth._id;
    const project = req.project; // Already fetched by middleware

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Use the requested column, or the project board's "To Do" column by default
    const column = columnId ? await Column.findById(columnId) : await findDefaultColumn(projectId);
    if (!column || column.project?.toString() !== projectId.toString()) {
      return res.status(404).json({ error: "Column not found" });
    }

    const task = await createTaskRecord({
      project,
      column,
      userId,
      title,
      description,
      priority,
      status,
      dueDate,
      labels,
      boardId,
    });
    logTaskActivity({ task, actorId: userId, action: "created" });

    // Add assignees if provided
    if (assignees && assignees.length > 0) {
      const assignmentPromises = assignees.map(assigneeId =>
        new TaskAssignment({
          task: task._id,
          user: assigneeId,
          project: projectId,
          assignedBy: userId,
          role: "assignee",
        }).save()
      );

      await Promise.all(assignmentPromises);
      // Send emails to assignees (non-blocking)
      try {
        const [projectDoc, creatorUser, workspaceDoc] = await Promise.all([
          Project.findById(projectId),
          User.findById(userId),
          Workspace.findById((await Project.findById(projectId)).workspace),
        ]);

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const taskUrl = `${clientUrl}/projects/${projectDoc?._id}/tasks/${task._id}`;

        for (const assigneeId of assignees) {
          const assigneeUser = await User.findById(assigneeId);
          if (!assigneeUser?.email) continue;

          sendTaskAssignedEmail({
            task,
            project: projectDoc,
            workspace: workspaceDoc,
            assignedBy: creatorUser,
            assignee: assigneeUser,
          }).catch((e) => {
            console.error("⚠️ Failed to send task created/assigned email:", e.message);
          });
        }
      } catch (emailErr) {
        console.error("⚠️ Error preparing task assignment emails:", emailErr.message);
      }
    }

    // Update user's last selected task
    await updateLastSelectedTask(userId, {
      id: task._id,
      title: task.title,
      projectId: projectId,
      workspaceId: project.workspace,
    });

    // Populate task data for response
    await task.populate([
      { path: "createdBy", select: "name email avatar" },
      { path: "labels" },
    ]);

    runAutomations(task._id, { type: "task_created" }, userId);
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

/**
 * Get all tasks in a project
 */
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { boardId, columnId, status, priority, assignee } = req.query;

    // Build filter
    const filter = { project: projectId, isArchived: false };
    if (boardId) filter.board = boardId;
    if (columnId) filter.column = columnId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    let tasks = await Task.find(filter)
      .populate("createdBy", "name email avatar")
      .populate("column", "name color")
      .populate("labels")
      .sort({ position: 1, createdAt: -1 });

    // Filter by assignee if provided
    if (assignee) {
      const taskIds = tasks.map(t => t._id);
      const assignments = await TaskAssignment.find({
        task: { $in: taskIds },
        user: assignee,
        status: "active",
      });
      const assignedTaskIds = new Set(assignments.map(a => a.task.toString()));
      tasks = tasks.filter(t => assignedTaskIds.has(t._id.toString()));
    }

    res.json({
      success: true,
      message: "Tasks fetched successfully",
      data: await withTaskExtras(tasks),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

/**
 * Get task details
 */
export const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("project", "name key")
      .populate("board", "name")
      .populate("column", "name color")
      .populate("createdBy", "name email avatar")
      .populate("lastEditedBy", "name email avatar")
      .populate("labels")
      .populate("linkedDocs");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get assignments
    const assignments = await TaskAssignment.find({
      task: taskId,
      status: "active",
    }).populate("user", "name email avatar");

    // Get subtasks
    const subtasks = await Subtask.find({
      task: taskId,
    })
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("completedBy", "name email avatar")
      .sort({ position: 1 });

    // Update user's last selected task
    await updateLastSelectedTask(req.auth._id, {
      id: task._id,
      title: task.title,
      projectId: task.project._id,
      workspaceId: task.project.workspace,
    });

    res.json({
      success: true,
      message: "Task fetched successfully",
      data: {
        ...task.toObject(),
        assignments,
        subtasks,
      },
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

/**
 * Update task
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      column,
      priority,
      status,
      dueDate,
      startDate,
      estimatedTime,
      labels,
    } = req.body;
    const userId = req.auth._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Store task for permission check
    req.task = task;
    const priorBefore = { priority: task.priority, status: task.status };

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (column) task.column = column;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (startDate !== undefined) task.startDate = startDate;
    if (estimatedTime) task.estimatedTime = estimatedTime;
    if (labels) task.labels = labels;

    const priorityChanged = priority && priority !== priorBefore.priority;
    const statusChanged = status && status !== priorBefore.status;
    task.lastEditedBy = userId;
    await task.save();
    if (priorityChanged) runAutomations(task._id, { type: "priority_changed", value: priority }, userId);
    if (statusChanged) {
      runAutomations(task._id, { type: "status_changed", value: status }, userId);
      if (status === "done") spawnRecurrence(task._id, userId);
    }

    await task.populate([
      { path: "createdBy", select: "name email avatar" },
      { path: "column", select: "name color" },
      { path: "labels" },
    ]);

    logTaskActivity({ task, actorId: userId, action: "updated", changes: { fields: Object.keys(req.body || {}) } });
    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

/**
 * Update task position (for drag & drop)
 */
export const updateTaskPosition = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { position, columnId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (position !== undefined) task.position = position;
    if (columnId) task.column = columnId;
    
    await task.save();

    res.json({
      success: true,
      message: "Task position updated successfully",
      data: { position, column: columnId },
    });
  } catch (error) {
    console.error("Error updating task position:", error);
    res.status(500).json({ error: "Failed to update task position" });
  }
};

/**
 * Delete task (archive)
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.isArchived = true;
    task.archivedAt = new Date();
    await task.save();

    logTaskActivity({ task, actorId: req.auth._id, action: "archived" });
    res.json({
      success: true,
      message: "Task archived successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

/**
 * Activity timeline for one task
 * GET /api/tasks/:taskId/activity
 */
export const getTaskActivity = async (req, res) => {
  try {
    const items = await ActivityLog.find({ target: req.params.taskId, targetType: "Task" })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name email avatar")
      .lean();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching task activity:", error);
    res.status(500).json({ error: "Failed to fetch task activity" });
  }
};

/**
 * Assign user to task
 */
export const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId: assigneeId, role } = req.body;
    const userId = req.auth._id;

    if (!assigneeId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if already assigned with this role
    const existingAssignment = await TaskAssignment.findOne({
      task: taskId,
      user: assigneeId,
      role: role || "assignee",
      status: "active",
    });

    if (existingAssignment) {
      return res.status(400).json({ error: "User already assigned to this task with this role" });
    }

    const assignment = new TaskAssignment({
      task: taskId,
      user: assigneeId,
      project: task.project,
      assignedBy: userId,
      role: role || "assignee",
    });

    await assignment.save();
    await assignment.populate("user", "name email avatar");

    // Send email notification to assigned user
    console.log(`\n📧 Sending task assigned email`);
    try {
      const [project, assignedBy, assignedUser, workspace] = await Promise.all([
        Project.findById(task.project).populate("workspace"),
        User.findById(userId),
        User.findById(assigneeId),
        Workspace.findById((await Project.findById(task.project)).workspace),
      ]);

      if (project && assignedBy && assignedUser && workspace) {
        await sendTaskAssignedEmail({
          task,
          project,
          workspace,
          assignedBy,
          assignee: assignedUser,
        });
        console.log(`✅ Task assigned email sent to ${assignedUser.email}`);
      }
    } catch (emailError) {
      console.error(`⚠️ Failed to send task assigned email:`, emailError.message);
      // Don't fail the request if email fails
    }

    logTaskActivity({ task, actorId: userId, action: "assigned", metadata: { assignee: assignment.user?.name } });
    runAutomations(task._id, { type: "task_assigned" }, userId);
    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ error: "Failed to assign task" });
  }
};

/**
 * Get task assignments
 */
export const getTaskAssignments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const assignments = await TaskAssignment.find({
      task: taskId,
      status: "active",
    }).populate("user", "name email avatar");

    res.json({
      success: true,
      message: "Task assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching task assignments:", error);
    res.status(500).json({ error: "Failed to fetch task assignments" });
  }
};

/**
 * Unassign user from task
 */
export const unassignTask = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await TaskAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    assignment.status = "removed";
    await assignment.save();

    res.json({
      success: true,
      message: "Task unassigned successfully",
    });
  } catch (error) {
    console.error("Error unassigning task:", error);
    res.status(500).json({ error: "Failed to unassign task" });
  }
};

/**
 * Create subtask
 */
export const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignee, dueDate, priority } = req.body;
    const userId = req.auth._id;

    if (!title) {
      return res.status(400).json({ error: "Subtask title is required" });
    }

    // Get max position
    const lastSubtask = await Subtask.findOne({ task: taskId }).sort({ position: -1 });
    const position = lastSubtask ? lastSubtask.position + 1 : 0;

    const subtask = new Subtask({
      task: taskId,
      title,
      description,
      assignee,
      dueDate,
      priority: priority || "medium",
      position,
      createdBy: userId,
    });

    await subtask.save();

    // Populate all relevant fields
    await subtask.populate([
      { path: "assignee", select: "name email avatar" },
      { path: "createdBy", select: "name email avatar" },
      { path: "completedBy", select: "name email avatar" },
    ]);

    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } catch (error) {
    console.error("Error creating subtask:", error);
    res.status(500).json({ error: "Failed to create subtask" });
  }
};

/**
 * Update subtask
 */
export const updateSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, description, isCompleted, assignee, dueDate, priority } = req.body;
    const userId = req.auth._id;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    // Update fields
    if (title) subtask.title = title;
    if (description !== undefined) subtask.description = description;
    if (assignee !== undefined) subtask.assignee = assignee;
    if (dueDate !== undefined) subtask.dueDate = dueDate;
    if (priority !== undefined) subtask.priority = priority;
    
    if (isCompleted !== undefined) {
      subtask.isCompleted = isCompleted;
      if (isCompleted) {
        subtask.completedAt = new Date();
        subtask.completedBy = userId;
      } else {
        subtask.completedAt = null;
        subtask.completedBy = null;
      }
    }

    await subtask.save();

    // Populate all relevant fields
    await subtask.populate([
      { path: "assignee", select: "name email avatar" },
      { path: "createdBy", select: "name email avatar" },
      { path: "completedBy", select: "name email avatar" },
    ]);

    res.json({
      success: true,
      message: "Subtask updated successfully",
      data: subtask,
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
    res.status(500).json({ error: "Failed to update subtask" });
  }
};

/**
 * Delete subtask
 */
export const deleteSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    await Subtask.deleteOne({ _id: subtaskId });

    res.json({
      success: true,
      message: "Subtask deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    res.status(500).json({ error: "Failed to delete subtask" });
  }
};

/**
 * Create label
 */
export const createLabel = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const { projectId } = req.params;
    const userId = req.auth._id;

    if (!name || !color) {
      return res.status(400).json({ error: "Label name and color are required" });
    }

    // Check if label already exists
    const existingLabel = await Label.findOne({
      project: projectId,
      name: name,
    });

    if (existingLabel) {
      return res.status(400).json({ error: "Label with this name already exists" });
    }

    const label = new Label({
      name,
      color,
      description,
      project: projectId,
      createdBy: userId,
    });

    await label.save();

    res.status(201).json({
      success: true,
      message: "Label created successfully",
      data: label,
    });
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ error: "Failed to create label" });
  }
};

/**
 * Get project labels
 */
export const getProjectLabels = async (req, res) => {
  try {
    const { projectId } = req.params;

    const labels = await Label.find({ project: projectId });

    res.json({
      success: true,
      message: "Labels fetched successfully",
      data: labels,
    });
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ error: "Failed to fetch labels" });
  }
};

/**
 * Update label
 */
export const updateLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color, description } = req.body;

    const label = await Label.findById(labelId);
    if (!label) {
      return res.status(404).json({ error: "Label not found" });
    }

    // Update fields
    if (name) label.name = name;
    if (color) label.color = color;
    if (description !== undefined) label.description = description;

    await label.save();

    res.json({
      success: true,
      message: "Label updated successfully",
      data: label,
    });
  } catch (error) {
    console.error("Error updating label:", error);
    res.status(500).json({ error: "Failed to update label" });
  }
};

/**
 * Delete label
 */
export const deleteLabel = async (req, res) => {
  try {
    const { labelId } = req.params;

    const label = await Label.findById(labelId);
    if (!label) {
      return res.status(404).json({ error: "Label not found" });
    }

    // Remove label from all tasks
    await Task.updateMany(
      { labels: labelId },
      { $pull: { labels: labelId } }
    );

    await Label.deleteOne({ _id: labelId });

    res.json({
      success: true,
      message: "Label deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting label:", error);
    res.status(500).json({ error: "Failed to delete label" });
  }
};


/**
 * Create a comment on a task
 */
export async function createTaskComment(req, res) {
  try {
    const { taskId } = req.params;
    const { content, mentions } = req.body;
    const userId = req.auth._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = new Comment({
      content: content.trim(),
      commentOn: {
        model: "Task",
        id: taskId,
      },
      project: task.project._id,
      author: userId,
      authorModel: "User",
      mentions: mentions || [],
    });

    await comment.save();
    await comment.populate("author", "name email avatar");

    logTaskActivity({ task, actorId: userId, action: "commented" });
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
}

/**
 * Get all comments for a task
 */
export async function getTaskComments(req, res) {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({
      "commentOn.model": "Task",
      "commentOn.id": taskId,
      isDeleted: false,
    })
      .populate("author", "name email avatar")
      .populate("mentions", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
}

/**
 * Update a comment
 */
export async function updateTaskComment(req, res) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.auth._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate("author", "name email avatar");

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
}

/**
 * Delete a comment
 */
export async function deleteTaskComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.auth._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
}

/**
 * Create an attachment for a task
 */
export async function createTaskAttachment(req, res) {
  try {
    const { taskId } = req.params;
    const { filename, originalName, mimeType, size, url, thumbnailUrl } = req.body;
    const userId = req.auth._id;

    if (!filename || !originalName || !mimeType || !size || !url) {
      return res.status(400).json({ error: "Missing required attachment fields" });
    }

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const project = await Project.findById(task.project._id);
    const attachment = new Attachment({
      filename,
      originalName,
      mimeType,
      size,
      url,
      thumbnailUrl,
      attachedTo: {
        model: "Task",
        id: taskId,
      },
      project: task.project._id,
      workspace: project.workspace,
      uploadedBy: userId,
    });

    await attachment.save();
    await attachment.populate("uploadedBy", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Attachment created successfully",
      data: attachment,
    });
  } catch (error) {
    console.error("Error creating attachment:", error);
    res.status(500).json({ error: "Failed to create attachment" });
  }
}

/**
 * Get all attachments for a task
 */
export async function getTaskAttachments(req, res) {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.find({
      "attachedTo.model": "Task",
      "attachedTo.id": taskId,
      isDeleted: false,
    })
      .populate("uploadedBy", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Attachments fetched successfully",
      data: attachments,
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
}

/**
 * Delete an attachment
 */
export async function deleteTaskAttachment(req, res) {
  try {
    const { attachmentId } = req.params;
    const userId = req.auth._id;

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Check if user is the uploader or has permission
    if (attachment.uploadedBy.toString() !== userId.toString() && !isScopeAdmin(req)) {
      return res.status(403).json({ error: "You can only delete your own attachments" });
    }

    attachment.isDeleted = true;
    attachment.deletedAt = new Date();
    await attachment.save();

    res.json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
}

/**
 * Upload a file attachment (for future implementation with multer)
 * This function will be used when multer is installed and configured
 */
export async function uploadTaskAttachment(req, res) {
  try {
    const { taskId } = req.params;
    const userId = req.auth._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const project = await Project.findById(task.project._id);
    
    // Create attachment record
    const attachment = new Attachment({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`, // Adjust based on your file serving setup
      attachedTo: {
        model: "Task",
        id: taskId,
      },
      project: task.project._id,
      workspace: project.workspace,
      uploadedBy: userId,
    });

    await attachment.save();
    await attachment.populate("uploadedBy", "name email avatar");

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: attachment,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
}

/**
 * Update task status (for drag-and-drop)
 * PUT /api/tasks/:taskId/status
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, columnId } = req.body;
    const userId = req.auth._id;

    console.log(`\n📋 Updating task status: ${taskId} to ${status}`);

    // Find the task
    const task = await Task.findById(taskId)
      .populate('project', 'name workspace')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Access was already verified by requireTaskAccess / canEditTask
    const project = await Project.findById(task.project._id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // A task can't be finished while tasks it is waiting on are still open
    if (status === 'done' && task.status !== 'done' && !req.body.force && task.blockedBy?.length) {
      const open = await Task.find({ _id: { $in: task.blockedBy }, status: { $nin: ['done', 'cancelled'] } }).select('taskKey title').lean();
      if (open.length) {
        return res.status(409).json({
          error: `Waiting on ${open.map((t) => t.taskKey).join(', ')} before this can be completed.`,
          code: 'BLOCKED_BY_DEPENDENCY',
          blockedBy: open,
        });
      }
    }

    // Update task status
    const oldStatus = task.status;
    task.status = status;
    // Don't update column if columnId is a status string (like "in_progress")
    // Only update if it's a valid ObjectId
    if (columnId && columnId.length === 24 && /^[0-9a-fA-F]{24}$/.test(columnId)) {
      task.column = columnId;
    } else if (status !== oldStatus && STATUS_TO_COLUMN_TYPE[status]) {
      // Keep the board in sync: move the card to the matching column of its board
      const target = await Column.findOne({ board: task.board, type: STATUS_TO_COLUMN_TYPE[status] });
      if (target) task.column = target._id;
    }

    // Set completion date if status is done
    if (status === 'done') {
      task.completedAt = new Date();
    } else if (oldStatus === 'done') {
      // If moving from done back to active, clear completion date
      task.completedAt = null;
    }

    await task.save();

    // Log activity
    try {
      await logActivity({
        workspace: project.workspace,
        project: project._id,
        targetName: task.title,
        actor: userId,
        actorModel: 'User',
        target: taskId,
        targetType: 'Task',
        action: oldStatus !== status && status === 'done' ? 'completed' : 'moved',
        changes: {
          status: { from: oldStatus, to: status }
        },
        metadata: {
          taskTitle: task.title,
          projectName: project.name
        }
      });
    } catch (activityError) {
      console.log('Activity logging failed:', activityError.message);
    }

    // Send notifications to assignees if status changed significantly
    if (oldStatus !== status) {
      try {
        const assignments = await TaskAssignment.find({ task: taskId })
          .populate('user', 'name email');
        
        for (const assignment of assignments) {
          if (assignment.user._id.toString() !== userId.toString()) {
            // Send notification to other assignees
            const Notification = (await import('../models/notification.js')).default;
            await Notification.create({
              recipient: assignment.user._id,
              recipientModel: 'User',
              sender: userId,
              senderModel: 'User',
              type: 'task_updated',
              title: `Task status updated`,
              message: `"${task.title}" status changed from ${oldStatus} to ${status}`,
              workspace: project.workspace,
              project: task.project._id,
              relatedTo: {
                model: 'Task',
                id: taskId
              }
            });
          }
        }
      } catch (notificationError) {
        console.log('Notification sending failed:', notificationError.message);
      }
    }

    console.log(`✅ Task status updated successfully`);
    if (oldStatus !== status) {
      runAutomations(task._id, { type: 'status_changed', value: status }, userId);
      if (status === 'done') spawnRecurrence(task._id, userId);
    }

    res.json({
      success: true,
      data: task,
      message: `Task status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
}

export default {
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
  // Comments
  createTaskComment,
  getTaskComments,
  updateTaskComment,
  deleteTaskComment,
  // Attachments
  createTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
  uploadTaskAttachment,
};

