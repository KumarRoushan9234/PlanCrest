import mongoose from "mongoose";
import Task from "../models/task.js";
import TimeEntry from "../models/timeEntry.js";
import Goal from "../models/goal.js";
import Automation from "../models/automation.js";
import Project from "../models/project.js";
import TaskAssignment from "../models/taskAssignment.js";
import { isScopeAdmin } from "../middlewares/resourceAccess.js";
import { getAccessibleProjects } from "../utils/projectAccess.js";

const fail = (res, error, message) => {
  console.error(message, error.message);
  res.status(500).json({ error: message });
};
const OPEN = ["backlog", "todo", "in_progress", "in_review", "blocked"];
const isId = (id) => mongoose.isValidObjectId(id);

/* ---------------------------------------------------------------- time tracking */

const taskContext = async (taskId) => {
  const task = await Task.findById(taskId).select("project title taskKey").populate("project", "workspace");
  return task ? { task, projectId: task.project._id, workspaceId: task.project.workspace } : null;
};

const stopRunning = async (userId) => {
  const running = await TimeEntry.find({ user: userId, isRunning: true });
  for (const entry of running) {
    entry.endTime = new Date();
    entry.duration = Math.max(0, Math.round((entry.endTime - entry.startTime) / 1000));
    entry.isRunning = false;
    await entry.save();
  }
  return running.length;
};

/** GET /tasks/:taskId/time */
export const listTaskTime = async (req, res) => {
  try {
    const entries = await TimeEntry.find({ task: req.params.taskId }).populate("user", "name avatar").sort({ startTime: -1 }).limit(200).lean();
    const now = Date.now();
    const seconds = (e) => (e.isRunning ? Math.round((now - new Date(e.startTime)) / 1000) : e.duration || 0);
    res.json({ success: true, data: { entries, totalSeconds: entries.reduce((s, e) => s + seconds(e), 0) } });
  } catch (error) {
    fail(res, error, "Failed to load time entries");
  }
};

/** POST /tasks/:taskId/time/start - one running timer per user */
export const startTimer = async (req, res) => {
  try {
    const ctx = await taskContext(req.params.taskId);
    if (!ctx) return res.status(404).json({ error: "Task not found" });
    await stopRunning(req.auth._id);
    const entry = await TimeEntry.create({
      task: ctx.task._id,
      project: ctx.projectId,
      workspace: ctx.workspaceId,
      user: req.auth._id,
      description: req.body?.description,
      startTime: new Date(),
      isRunning: true,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    fail(res, error, "Failed to start the timer");
  }
};

/** POST /time/stop - stops whatever the user is timing */
export const stopTimer = async (req, res) => {
  try {
    const stopped = await stopRunning(req.auth._id);
    res.json({ success: true, stopped });
  } catch (error) {
    fail(res, error, "Failed to stop the timer");
  }
};

/** GET /time/running - the signed-in user's running timer, if any */
export const getRunningTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({ user: req.auth._id, isRunning: true }).populate("task", "title taskKey project").lean();
    res.json({ success: true, data: entry });
  } catch (error) {
    fail(res, error, "Failed to load the running timer");
  }
};

/** POST /tasks/:taskId/time - log time manually: { minutes, date?, description?, isBillable? } */
export const logTime = async (req, res) => {
  try {
    const minutes = Number(req.body?.minutes);
    if (!(minutes > 0) || minutes > 24 * 60) return res.status(400).json({ error: "Enter between 1 minute and 24 hours" });
    const ctx = await taskContext(req.params.taskId);
    if (!ctx) return res.status(404).json({ error: "Task not found" });
    const start = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(start.getTime())) return res.status(400).json({ error: "Invalid date" });
    const entry = await TimeEntry.create({
      task: ctx.task._id,
      project: ctx.projectId,
      workspace: ctx.workspaceId,
      user: req.auth._id,
      description: req.body?.description,
      startTime: start,
      endTime: new Date(start.getTime() + minutes * 60000),
      duration: Math.round(minutes * 60),
      isManual: true,
      isBillable: req.body?.isBillable !== false,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    fail(res, error, "Failed to log time");
  }
};

/** DELETE /time/:entryId - own entries, or any entry for admins */
export const deleteTimeEntry = async (req, res) => {
  try {
    if (!isId(req.params.entryId)) return res.status(404).json({ error: "Entry not found" });
    const entry = await TimeEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    if (String(entry.user) !== String(req.auth._id)) {
      return res.status(403).json({ error: "You can only delete your own time entries" });
    }
    await entry.deleteOne();
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Failed to delete the entry");
  }
};

/** GET /workspaces/:workspaceId/timesheet?from&to&userId */
export const getTimesheet = async (req, res) => {
  try {
    const admin = isScopeAdmin(req);
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 86400000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const match = { workspace: req.workspace._id, startTime: { $gte: from, $lte: to }, isRunning: false };
    // Members only see their own time; admins can look at everyone
    if (admin && req.query.userId === "all") {
      // no user filter
    } else if (admin && isId(req.query.userId)) {
      match.user = new mongoose.Types.ObjectId(req.query.userId);
    } else {
      match.user = req.auth._id;
    }

    const entries = await TimeEntry.find(match).populate("user", "name avatar").populate("task", "title taskKey").populate("project", "name").sort({ startTime: -1 }).limit(500).lean();
    const byDay = {};
    for (const e of entries) {
      const day = new Date(e.startTime).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (e.duration || 0);
    }
    res.json({
      success: true,
      data: {
        entries,
        byDay,
        totalSeconds: entries.reduce((s, e) => s + (e.duration || 0), 0),
        billableSeconds: entries.filter((e) => e.isBillable).reduce((s, e) => s + (e.duration || 0), 0),
      },
    });
  } catch (error) {
    fail(res, error, "Failed to load the timesheet");
  }
};

/* ----------------------------------------------------------------- dependencies */

const summarize = (t) => ({ _id: t._id, title: t.title, taskKey: t.taskKey, status: t.status, dueDate: t.dueDate, project: t.project });

/** GET /tasks/:taskId/dependencies */
export const getDependencies = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).select("blockedBy").populate("blockedBy", "title taskKey status dueDate project");
    if (!task) return res.status(404).json({ error: "Task not found" });
    const blocking = await Task.find({ blockedBy: task._id }).select("title taskKey status dueDate project").lean();
    res.json({ success: true, data: { blockedBy: task.blockedBy.map(summarize), blocking: blocking.map(summarize) } });
  } catch (error) {
    fail(res, error, "Failed to load dependencies");
  }
};

/** Would making `taskId` wait on `blockerId` create a loop? */
const createsCycle = async (taskId, blockerId) => {
  const seen = new Set();
  const stack = [String(blockerId)];
  while (stack.length) {
    const id = stack.pop();
    if (id === String(taskId)) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const t = await Task.findById(id).select("blockedBy").lean();
    stack.push(...(t?.blockedBy || []).map(String));
  }
  return false;
};

/** POST /tasks/:taskId/dependencies { blockedBy } */
export const addDependency = async (req, res) => {
  try {
    const { taskId } = req.params;
    const blockerId = req.body?.blockedBy;
    if (!isId(blockerId) || String(blockerId) === String(taskId)) return res.status(400).json({ error: "Choose a different task" });
    const [task, blocker] = await Promise.all([Task.findById(taskId), Task.findById(blockerId).select("project")]);
    if (!task || !blocker) return res.status(404).json({ error: "Task not found" });
    if (String(task.project) !== String(blocker.project)) return res.status(400).json({ error: "Dependencies must be within the same project" });
    if (await createsCycle(taskId, blockerId)) return res.status(400).json({ error: "That would create a circular dependency" });
    await Task.updateOne({ _id: taskId }, { $addToSet: { blockedBy: blockerId } });
    res.status(201).json({ success: true });
  } catch (error) {
    fail(res, error, "Failed to add the dependency");
  }
};

/** DELETE /tasks/:taskId/dependencies/:otherId */
export const removeDependency = async (req, res) => {
  try {
    await Task.updateOne({ _id: req.params.taskId }, { $pull: { blockedBy: req.params.otherId } });
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Failed to remove the dependency");
  }
};

/* --------------------------------------------------- recurrence & custom fields */

/** PUT /tasks/:taskId/recurrence { frequency, interval } */
export const setRecurrence = async (req, res) => {
  try {
    const frequency = ["none", "daily", "weekly", "monthly"].includes(req.body?.frequency) ? req.body.frequency : "none";
    const interval = Math.min(365, Math.max(1, Number(req.body?.interval) || 1));
    const task = await Task.findByIdAndUpdate(req.params.taskId, { recurrence: { frequency, interval } }, { new: true }).select("recurrence");
    res.json({ success: true, data: task.recurrence });
  } catch (error) {
    fail(res, error, "Failed to save the repeat setting");
  }
};

/** PUT /projects/:projectId/custom-fields { fields: [{ key?, name, type, options? }] } */
export const setCustomFieldDefs = async (req, res) => {
  try {
    const TYPES = ["text", "number", "date", "select", "checkbox", "url"];
    const slug = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
    const fields = (Array.isArray(req.body?.fields) ? req.body.fields : [])
      .slice(0, 25)
      .map((f) => ({
        key: slug(f.key || f.name) || `field_${Math.random().toString(36).slice(2, 7)}`,
        name: String(f.name || "").trim().slice(0, 60),
        type: TYPES.includes(f.type) ? f.type : "text",
        options: f.type === "select" ? (f.options || []).map((o) => String(o).trim()).filter(Boolean).slice(0, 30) : [],
      }))
      .filter((f) => f.name);
    const project = await Project.findByIdAndUpdate(req.params.projectId, { customFieldDefs: fields }, { new: true }).select("customFieldDefs");
    res.json({ success: true, data: project.customFieldDefs });
  } catch (error) {
    fail(res, error, "Failed to save custom fields");
  }
};

/** PUT /tasks/:taskId/custom-fields { values: { key: value } } - only keys the project defines */
export const setCustomFieldValues = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!task.customFields) task.customFields = new Map();
    const project = await Project.findById(task.project).select("customFieldDefs");
    const allowed = new Map(project.customFieldDefs.map((d) => [d.key, d]));
    for (const [key, value] of Object.entries(req.body?.values || {})) {
      const def = allowed.get(key);
      if (!def) continue;
      let v = value;
      if (def.type === "number") v = value === "" || value == null ? null : Number(value);
      if (def.type === "checkbox") v = Boolean(value);
      if (def.type === "select" && value && !def.options.includes(value)) continue;
      if (typeof v === "string") v = v.slice(0, 500);
      if (v === null || v === "" || v === false) task.customFields.delete(key);
      else task.customFields.set(key, v);
    }
    await task.save();
    res.json({ success: true, data: Object.fromEntries(task.customFields || []) });
  } catch (error) {
    fail(res, error, "Failed to save custom fields");
  }
};

/* ------------------------------------------------------------------ automations */

const ACTION_TYPES = ["set_status", "set_priority", "assign_user", "add_tag", "add_comment", "notify_user"];
const TRIGGER_TYPES = ["task_created", "status_changed", "priority_changed", "task_assigned"];

const cleanRule = (body) => {
  const name = String(body?.name || "").trim().slice(0, 120);
  const trigger = body?.trigger;
  const actions = (Array.isArray(body?.actions) ? body.actions : [])
    .filter((a) => ACTION_TYPES.includes(a?.type))
    .slice(0, 5)
    .map((a) => ({ type: a.type, value: String(a.value || "").slice(0, 500) }));
  if (!name || !TRIGGER_TYPES.includes(trigger?.type) || !actions.length) return null;
  return { name, trigger: { type: trigger.type, value: String(trigger.value || "").slice(0, 50) }, actions };
};

export const listAutomations = async (req, res) => {
  try {
    res.json({ success: true, data: await Automation.find({ project: req.params.projectId }).sort({ createdAt: -1 }).lean() });
  } catch (error) {
    fail(res, error, "Failed to load automations");
  }
};

export const createAutomation = async (req, res) => {
  try {
    const rule = cleanRule(req.body);
    if (!rule) return res.status(400).json({ error: "Give the rule a name, a trigger and at least one action" });
    const created = await Automation.create({ ...rule, project: req.params.projectId, workspace: req.workspace._id, createdBy: req.auth._id });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    fail(res, error, "Failed to create the automation");
  }
};

export const updateAutomation = async (req, res) => {
  try {
    const rule = req.body?.name !== undefined || req.body?.trigger ? cleanRule(req.body) : {};
    if (rule === null) return res.status(400).json({ error: "Invalid automation" });
    const patch = { ...rule };
    if (typeof req.body?.enabled === "boolean") patch.enabled = req.body.enabled;
    const updated = await Automation.findOneAndUpdate({ _id: req.params.automationId, project: req.params.projectId }, patch, { new: true });
    if (!updated) return res.status(404).json({ error: "Automation not found" });
    res.json({ success: true, data: updated });
  } catch (error) {
    fail(res, error, "Failed to update the automation");
  }
};

export const deleteAutomation = async (req, res) => {
  try {
    await Automation.deleteOne({ _id: req.params.automationId, project: req.params.projectId });
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Failed to delete the automation");
  }
};

/* ------------------------------------------------------------------------ goals */

const withProgress = async (goal) => {
  const taskIds = goal.targets.filter((t) => t.type === "task" && t.task).map((t) => t.task);
  const tasks = taskIds.length ? await Task.find({ _id: { $in: taskIds } }).select("status title taskKey").lean() : [];
  const byId = new Map(tasks.map((t) => [String(t._id), t]));
  const targets = goal.targets.map((t) => {
    const linked = t.type === "task" ? byId.get(String(t.task)) : null;
    const ratio = t.type === "task" ? (linked?.status === "done" ? 1 : 0) : t.type === "boolean" ? (t.done ? 1 : 0) : Math.min(1, (t.current || 0) / (t.target || 1));
    return { ...t, linked, ratio };
  });
  const progress = targets.length ? Math.round((targets.reduce((s, t) => s + t.ratio, 0) / targets.length) * 100) : 0;
  return { ...goal, targets, progress };
};

const cleanTargets = (targets) =>
  (Array.isArray(targets) ? targets : [])
    .slice(0, 20)
    .map((t) => ({
      name: String(t.name || "").trim().slice(0, 200),
      type: ["number", "task", "boolean"].includes(t.type) ? t.type : "number",
      current: Number(t.current) || 0,
      target: Number(t.target) > 0 ? Number(t.target) : 100,
      unit: String(t.unit || "").slice(0, 20),
      task: isId(t.task) ? t.task : undefined,
      done: Boolean(t.done),
    }))
    .filter((t) => t.name);

export const listGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ workspace: req.workspace._id }).populate("owner", "name avatar").sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: await Promise.all(goals.map(withProgress)) });
  } catch (error) {
    fail(res, error, "Failed to load goals");
  }
};

export const createGoal = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "A goal needs a name" });
    const goal = await Goal.create({
      workspace: req.workspace._id,
      name: name.slice(0, 150),
      description: req.body?.description,
      color: req.body?.color || undefined,
      dueDate: req.body?.dueDate || undefined,
      owner: req.auth._id,
      createdBy: req.auth._id,
      targets: cleanTargets(req.body?.targets),
    });
    res.status(201).json({ success: true, data: await withProgress(goal.toObject()) });
  } catch (error) {
    fail(res, error, "Failed to create the goal");
  }
};

const loadOwnedGoal = async (req, res) => {
  if (!isId(req.params.goalId)) return res.status(404).json({ error: "Goal not found" }), null;
  const goal = await Goal.findOne({ _id: req.params.goalId, workspace: req.workspace._id });
  if (!goal) return res.status(404).json({ error: "Goal not found" }), null;
  if (String(goal.owner) !== String(req.auth._id) && !isScopeAdmin(req)) {
    return res.status(403).json({ error: "Only the goal's owner or an admin can change it" }), null;
  }
  return goal;
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await loadOwnedGoal(req, res);
    if (!goal) return;
    const { name, description, color, dueDate, targets } = req.body || {};
    if (name !== undefined) goal.name = String(name).trim().slice(0, 150) || goal.name;
    if (description !== undefined) goal.description = description;
    if (color) goal.color = color;
    if (dueDate !== undefined) goal.dueDate = dueDate || undefined;
    if (targets !== undefined) goal.targets = cleanTargets(targets);
    await goal.save();
    res.json({ success: true, data: await withProgress(goal.toObject()) });
  } catch (error) {
    fail(res, error, "Failed to update the goal");
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await loadOwnedGoal(req, res);
    if (!goal) return;
    await goal.deleteOne();
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Failed to delete the goal");
  }
};

/* --------------------------------------------------------------------- workload */

/** GET /workspaces/:workspaceId/workload - open work per person, for capacity planning */
export const getWorkload = async (req, res) => {
  try {
    const projects = await getAccessibleProjects({
      userId: req.auth._id,
      workspace: req.workspace,
      workspaceMember: req.workspaceMember,
      isWorkspaceOwner: req.isWorkspaceOwner,
    });
    const tasks = await Task.find({ project: { $in: projects.map((p) => p._id) }, status: { $in: OPEN }, isArchived: { $ne: true } })
      .select("title taskKey dueDate priority status estimatedTime project")
      .lean();
    const assignments = await TaskAssignment.find({ task: { $in: tasks.map((t) => t._id) }, status: "active", role: "assignee" })
      .populate("user", "name avatar")
      .lean();
    const taskById = new Map(tasks.map((t) => [String(t._id), t]));
    const HOURS = { hours: 1, days: 8, weeks: 40 };
    const people = new Map();
    const now = Date.now();
    for (const a of assignments) {
      const t = taskById.get(String(a.task));
      if (!t || !a.user) continue;
      const row = people.get(String(a.user._id)) || { user: a.user, open: 0, overdue: 0, estimatedHours: 0, tasks: [] };
      row.open += 1;
      if (t.dueDate && new Date(t.dueDate) < now) row.overdue += 1;
      row.estimatedHours += (t.estimatedTime?.value || 0) * (HOURS[t.estimatedTime?.unit] || 1);
      row.tasks.push({ _id: t._id, taskKey: t.taskKey, title: t.title, dueDate: t.dueDate, priority: t.priority, project: t.project });
      people.set(String(a.user._id), row);
    }
    const assigned = new Set(assignments.map((a) => String(a.task)));
    res.json({
      success: true,
      data: { people: [...people.values()].sort((a, b) => b.open - a.open), unassigned: tasks.filter((t) => !assigned.has(String(t._id))).length },
    });
  } catch (error) {
    fail(res, error, "Failed to load workload");
  }
};
