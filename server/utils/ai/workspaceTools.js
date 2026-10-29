import mongoose from "mongoose";
import Task from "../../models/task.js";
import TaskAssignment from "../../models/taskAssignment.js";
import Subtask from "../../models/subtask.js";
import { canCreateTask } from "../../middlewares/permissions.js";
import { createTaskRecord, findDefaultColumn } from "../taskFactory.js";
import { getAccessibleProjects as getProjectsFor } from "../projectAccess.js";

const OPEN_STATUSES = ["backlog", "todo", "in_progress", "in_review", "blocked"];
const MAX_TASKS = 50;

export const getAccessibleProjects = (ctx) => getProjectsFor(ctx);

const formatTask = (task, projectsById, assigneesByTask) => ({
  id: task._id.toString(),
  key: task.taskKey,
  title: task.title,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
  project: projectsById.get(task.project.toString())?.name,
  assignees: assigneesByTask.get(task._id.toString()) || [],
});

const loadAssignees = async (taskIds) => {
  const assignments = await TaskAssignment.find({ task: { $in: taskIds }, status: "active" })
    .populate("user", "name")
    .lean();
  const byTask = new Map();
  for (const a of assignments) {
    const key = a.task.toString();
    if (!byTask.has(key)) byTask.set(key, []);
    if (a.user?.name) byTask.get(key).push(a.user.name);
  }
  return byTask;
};

/** Find tasks the user can access, with optional filters. */
export const findTasks = async (ctx, filters = {}) => {
  const projects = await getAccessibleProjects(ctx);
  const projectsById = new Map(projects.map((p) => [p._id.toString(), p]));
  let projectIds = projects.map((p) => p._id);

  if (filters.projectId) {
    if (!projectsById.has(filters.projectId)) return { error: "Project not found or not accessible" };
    projectIds = [new mongoose.Types.ObjectId(filters.projectId)];
  }

  const query = { project: { $in: projectIds }, isArchived: { $ne: true } };
  if (filters.status) query.status = filters.status;
  else if (!filters.includeDone) query.status = { $in: OPEN_STATUSES };

  if (filters.assignedToMe) {
    query._id = {
      $in: await TaskAssignment.find({ user: ctx.userId, status: "active" }).distinct("task"),
    };
  }
  if (filters.overdue) {
    query.dueDate = { $lt: new Date() };
  } else if (filters.dueWithinDays) {
    query.dueDate = { $lte: new Date(Date.now() + filters.dueWithinDays * 86400000) };
  }

  const tasks = await Task.find(query)
    .sort({ dueDate: 1, priority: -1 })
    .limit(MAX_TASKS)
    .lean();
  const assignees = await loadAssignees(tasks.map((t) => t._id));
  return { tasks: tasks.map((t) => formatTask(t, projectsById, assignees)) };
};

/** Load one task the user can access, by id or key (e.g. WEB-12). */
const findAccessibleTask = async (ctx, idOrKey) => {
  const projects = await getAccessibleProjects(ctx);
  const projectIds = projects.map((p) => p._id);
  const query = mongoose.isValidObjectId(idOrKey)
    ? { _id: idOrKey }
    : { taskKey: String(idOrKey).toUpperCase() };
  const task = await Task.findOne({ ...query, project: { $in: projectIds } }).lean();
  return { task, projects };
};

/**
 * Tool definitions given to Claude. Every executor runs with the requesting
 * user's permissions; Claude never sees data the user couldn't open in the UI.
 */
export const TOOL_DEFINITIONS = [
  {
    name: "list_projects",
    description:
      "List the projects in the current workspace that the user can access, with their open task counts.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "find_tasks",
    description:
      "Search tasks the user can access. By default only open (not done/cancelled) tasks are returned. Returns at most 50 tasks sorted by due date.",
    input_schema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Limit to one project (id from list_projects)" },
        status: {
          type: "string",
          enum: ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"],
        },
        includeDone: { type: "boolean", description: "Include done and cancelled tasks" },
        assignedToMe: { type: "boolean", description: "Only tasks assigned to the current user" },
        overdue: { type: "boolean", description: "Only tasks whose due date has passed" },
        dueWithinDays: { type: "integer", minimum: 1, maximum: 365 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_task",
    description: "Get full details of one task, including description and subtasks.",
    input_schema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Task id or key such as WEB-12" },
      },
      required: ["task"],
      additionalProperties: false,
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task in a project. Only do this when the user explicitly asks for a task to be created.",
    input_schema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Project id from list_projects" },
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        dueDate: { type: "string", description: "Due date as YYYY-MM-DD" },
      },
      required: ["projectId", "title"],
      additionalProperties: false,
    },
  },
];

const executors = {
  async list_projects(ctx) {
    const projects = await getAccessibleProjects(ctx);
    const counts = await Task.aggregate([
      {
        $match: {
          project: { $in: projects.map((p) => p._id) },
          isArchived: { $ne: true },
          status: { $in: OPEN_STATUSES },
        },
      },
      { $group: { _id: "$project", open: { $sum: 1 } } },
    ]);
    const openById = new Map(counts.map((c) => [c._id.toString(), c.open]));
    return {
      projects: projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        key: p.key,
        openTasks: openById.get(p._id.toString()) || 0,
      })),
    };
  },

  async find_tasks(ctx, input) {
    return findTasks(ctx, input);
  },

  async get_task(ctx, input) {
    const { task, projects } = await findAccessibleTask(ctx, input.task);
    if (!task) return { error: "Task not found or not accessible" };
    const projectsById = new Map(projects.map((p) => [p._id.toString(), p]));
    const assignees = await loadAssignees([task._id]);
    const subtasks = await Subtask.find({ task: task._id }).sort({ position: 1 }).lean();
    return {
      ...formatTask(task, projectsById, assignees),
      description: task.description || "",
      subtasks: subtasks.map((s) => ({ title: s.title, done: Boolean(s.isCompleted) })),
    };
  },

  async create_task(ctx, input) {
    const projects = await getAccessibleProjects(ctx);
    const project = projects.find((p) => p._id.toString() === input.projectId);
    if (!project) return { error: "Project not found or not accessible" };

    // Apply the same rule as POST /projects/:projectId/tasks
    const allowed = await new Promise((resolve) => {
      const req = {
        auth: { _id: ctx.userId },
        workspace: ctx.workspace,
        workspaceMember: ctx.workspaceMember,
        isWorkspaceOwner: ctx.isWorkspaceOwner,
        projectMember: null,
      };
      const res = { status: () => ({ json: () => resolve(false) }) };
      canCreateTask(req, res, () => resolve(true));
    });
    if (!allowed) return { error: "You don't have permission to create tasks in this project" };

    const column = await findDefaultColumn(project._id);
    if (!column) return { error: "This project has no board to add tasks to" };

    const dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
    const task = await createTaskRecord({
      project,
      column,
      userId: ctx.userId,
      title: input.title.slice(0, 200),
      description: input.description,
      priority: input.priority,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : undefined,
    });
    ctx.actions.push({
      type: "task_created",
      taskId: task._id.toString(),
      taskKey: task.taskKey,
      title: task.title,
      projectId: project._id.toString(),
    });
    return { created: { id: task._id.toString(), key: task.taskKey, title: task.title } };
  },
};

export const runTool = async (ctx, name, input) => {
  const executor = executors[name];
  if (!executor) return { error: `Unknown tool: ${name}` };
  try {
    return await executor(ctx, input || {});
  } catch (error) {
    console.error(`AI tool ${name} failed:`, error);
    return { error: "The tool failed to run" };
  }
};
