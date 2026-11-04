import Task from "../models/task.js";
import Column from "../models/column.js";
import Board from "../models/board.js";
import ChatThread from "../models/chatThread.js";

/**
 * Pick the column new tasks land in when none is given: the "todo" column
 * of the project's default board, falling back to its first column.
 */
export const findDefaultColumn = async (projectId) => {
  const board =
    (await Board.findOne({ project: projectId, isDefault: true })) ||
    (await Board.findOne({ project: projectId }).sort({ createdAt: 1 }));
  if (!board) return null;
  return (
    (await Column.findOne({ board: board._id, type: "todo" })) ||
    (await Column.findOne({ board: board._id }).sort({ position: 1 }))
  );
};

/**
 * Create a task with its sequential key (e.g. WEB-12) and discussion thread.
 * Callers are responsible for permission checks.
 */
export const createTaskRecord = async ({
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
}) => {
  const latestTask = await Task.findOne({ project: project._id })
    .sort({ taskNumber: -1 })
    .limit(1);
  const taskNumber = latestTask ? latestTask.taskNumber + 1 : 1;

  const task = new Task({
    title,
    description,
    project: project._id,
    board: boardId || column.board,
    column: column._id,
    taskNumber,
    taskKey: `${project.key}-${taskNumber}`,
    priority: priority || "medium",
    status: status || "todo",
    dueDate,
    labels: labels || [],
    createdBy: userId,
  });
  await task.save();

  const chatThread = await ChatThread.create({
    task: task._id,
    project: project._id,
    title: `Discussion: ${title}`,
    participants: [userId],
    createdBy: userId,
  });
  task.chatThread = chatThread._id;
  await task.save();

  return task;
};
