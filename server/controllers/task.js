import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import Subtask from "../models/subtask.js";
import Label from "../models/label.js";
import ChatThread from "../models/chatThread.js";
import Project from "../models/project.js";
import Column from "../models/column.js";
import { sendSimpleEmail } from "../utils/mailService.js";
import { updateLastSelectedTask } from "../utils/lastSelected.js";

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
      dueDate,
      assignees,
      labels,
    } = req.body;
    const { projectId } = req.params;
    const userId = req.auth._id;
    const project = req.project; // Already fetched by middleware

    // Validation
    if (!title || !columnId) {
      return res.status(400).json({ error: "Title and column are required" });
    }

    // Get column to verify it exists and get board
    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Get latest task number for this project
    const latestTask = await Task.findOne({ project: projectId })
      .sort({ taskNumber: -1 })
      .limit(1);

    const taskNumber = latestTask ? latestTask.taskNumber + 1 : 1;
    const taskKey = `${project.key}-${taskNumber}`;

    // Create task
    const task = new Task({
      title,
      description,
      project: projectId,
      board: boardId || column.board,
      column: columnId,
      taskNumber,
      taskKey,
      priority: priority || "medium",
      status: column.type || "todo",
      dueDate,
      labels: labels || [],
      createdBy: userId,
    });

    await task.save();

    // Create chat thread for task
    const chatThread = new ChatThread({
      task: task._id,
      project: projectId,
      title: `Discussion: ${title}`,
      participants: [userId],
      createdBy: userId,
    });
    await chatThread.save();

    task.chatThread = chatThread._id;
    await task.save();

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

      // TODO: Send notifications to assignees
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
      data: tasks,
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

    task.lastEditedBy = userId;
    await task.save();

    await task.populate([
      { path: "createdBy", select: "name email avatar" },
      { path: "column", select: "name color" },
      { path: "labels" },
    ]);

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
 * Update task status
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, columnId } = req.body;

    if (!status || !columnId) {
      return res.status(400).json({ error: "Status and column ID are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.status = status;
    task.column = columnId;
    await task.save();

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: { status, column: columnId },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
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
    const { title, description, assignee, dueDate } = req.body;
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
      position,
      createdBy: userId,
    });

    await subtask.save();

    if (assignee) {
      await subtask.populate("assignee", "name email avatar");
    }

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
    const { title, description, isCompleted, assignee, dueDate } = req.body;
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
};

