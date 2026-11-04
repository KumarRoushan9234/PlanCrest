import Automation from "../models/automation.js";
import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import Comment from "../models/comment.js";
import Notification from "../models/notification.js";
import Column from "../models/column.js";
import Project from "../models/project.js";
import { createTaskRecord, findDefaultColumn } from "./taskFactory.js";

const STATUS_COLUMN_TYPE = { backlog: "backlog", todo: "todo", in_progress: "in_progress", in_review: "review", done: "done" };
const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"];
const PRIORITIES = ["low", "medium", "high"];

const nextDate = (from, { frequency, interval = 1 }) => {
  const d = new Date(from);
  if (frequency === "daily") d.setDate(d.getDate() + interval);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7 * interval);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + interval);
  return d;
};

const applyAction = async (action, task, actorId, project) => {
  switch (action.type) {
    case "set_status": {
      if (!STATUSES.includes(action.value) || task.status === action.value) return;
      task.status = action.value;
      task.completedAt = action.value === "done" ? new Date() : null;
      const type = STATUS_COLUMN_TYPE[action.value];
      const column = type && (await Column.findOne({ board: task.board, type }));
      if (column) task.column = column._id;
      return;
    }
    case "set_priority":
      if (PRIORITIES.includes(action.value)) task.priority = action.value;
      return;
    case "add_tag":
      if (action.value && !task.tags.includes(action.value)) task.tags.push(action.value);
      return;
    case "assign_user":
      if (!action.value) return;
      await TaskAssignment.updateOne(
        { task: task._id, user: action.value, role: "assignee" },
        { $set: { status: "active", project: task.project, assignedBy: actorId } },
        { upsert: true }
      );
      return;
    case "add_comment":
      if (!action.value) return;
      await Comment.create({
        content: action.value,
        commentOn: { model: "Task", id: task._id },
        project: task.project,
        author: actorId,
        authorModel: "User",
      });
      return;
    case "notify_user":
      if (!action.value) return;
      await Notification.create({
        recipient: action.value,
        recipientModel: "User",
        sender: actorId,
        senderModel: "User",
        type: "task_updated",
        title: `Automation: ${task.taskKey}`,
        message: `${task.title} was updated by an automation in ${project.name}.`,
        project: project._id,
        workspace: project.workspace,
      });
      return;
    default:
  }
};

/**
 * Run a project's matching automations for a task event.
 * event: { type, value?: string }. Never throws; automations must not break the request.
 */
export const runAutomations = async (taskId, event, actorId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) return;
    const rules = await Automation.find({ project: task.project, enabled: true, "trigger.type": event.type });
    const matching = rules.filter((r) => !r.trigger.value || r.trigger.value === event.value);
    if (!matching.length) return;
    const project = await Project.findById(task.project).select("name workspace");

    for (const rule of matching) {
      for (const action of rule.actions) {
        await applyAction(action, task, actorId, project).catch((e) => console.error("Automation action failed:", e.message));
      }
      rule.runCount += 1;
      rule.lastRunAt = new Date();
      await rule.save();
    }
    await task.save();
  } catch (error) {
    console.error("Automation run failed:", error.message);
  }
};

/** When a recurring task is completed, clone it with the next due date. */
export const spawnRecurrence = async (taskId, actorId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task || !task.recurrence || task.recurrence.frequency === "none" || task.status !== "done") return null;
    const project = await Project.findById(task.project);
    const column = await findDefaultColumn(project._id);
    if (!column) return null;

    const base = task.dueDate || new Date();
    const created = await createTaskRecord({
      project,
      column,
      userId: actorId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "todo",
      dueDate: nextDate(base, task.recurrence),
      labels: task.labels,
    });
    created.recurrence = task.recurrence;
    created.tags = task.tags;
    created.customFields = task.customFields;
    await created.save();
    // The finished occurrence stops recurring so only the new one carries on
    task.recurrence = { frequency: "none", interval: 1 };
    await task.save();
    return created;
  } catch (error) {
    console.error("Recurrence failed:", error.message);
    return null;
  }
};
