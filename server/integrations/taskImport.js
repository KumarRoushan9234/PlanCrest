import Board from "../models/board.js";
import Column from "../models/column.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import { createTaskRecord } from "../utils/taskFactory.js";
import { logTaskActivity } from "../utils/activityLogger.js";

const STATUS_TO_COLUMN_TYPE = {
  backlog: "backlog",
  todo: "todo",
  in_progress: "in_progress",
  in_review: "review",
  done: "done",
};

/** Guess a PlanCrest status from a list/column/status name in another tool. */
export const guessStatus = (name = "") => {
  const n = String(name).toLowerCase();
  if (/(done|complete|closed|resolved|shipped|released)/.test(n)) return "done";
  if (/(review|qa|testing|verify)/.test(n)) return "in_review";
  if (/(progress|doing|active|started|develop)/.test(n)) return "in_progress";
  if (/(block|hold|stuck)/.test(n)) return "blocked";
  if (/(backlog|icebox|ideas|later)/.test(n)) return "backlog";
  return "todo";
};

/**
 * Create PlanCrest tasks from items in another tool, skipping ones already imported.
 * item: { externalId, key, url, title, description, status, priority, dueDate }
 */
export const importAsTasks = async ({ userId, projectId, provider, items, limit = 200 }) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const board = (await Board.findOne({ project: projectId, isDefault: true })) || (await Board.findOne({ project: projectId }));
  if (!board) throw new Error("This project has no board to import into");
  const columns = await Column.find({ board: board._id }).sort({ position: 1 });
  const columnFor = (status) =>
    columns.find((c) => c.type === STATUS_TO_COLUMN_TYPE[status]) || columns.find((c) => c.type === "todo") || columns[0];

  let created = 0;
  let skipped = 0;
  const tasks = [];

  for (const item of items.slice(0, limit)) {
    if (!item.title || !item.externalId) continue;
    const exists = await Task.exists({
      project: projectId,
      externalLinks: { $elemMatch: { provider, externalId: String(item.externalId) } },
    });
    if (exists) {
      skipped++;
      continue;
    }

    const status = item.status || "todo";
    const column = columnFor(status);
    if (!column) continue;

    const task = await createTaskRecord({
      project,
      column,
      boardId: board._id,
      userId,
      title: String(item.title).slice(0, 200),
      description: item.description ? String(item.description).slice(0, 8000) : undefined,
      priority: ["low", "medium", "high"].includes(item.priority) ? item.priority : "medium",
      status,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
    });
    task.externalLinks = [{ provider, externalId: String(item.externalId), key: item.key, url: item.url, title: item.title }];
    if (status === "done") task.completedAt = new Date();
    await task.save();

    logTaskActivity({ task, actorId: userId, action: "created", metadata: { source: provider } });
    tasks.push({ _id: task._id, taskKey: task.taskKey, title: task.title });
    created++;
  }

  return { created, skipped, tasks };
};

/** Record that a task now also exists in another tool. */
export const addExternalLink = async (taskId, link) => {
  await Task.updateOne({ _id: taskId }, { $push: { externalLinks: link } });
};
