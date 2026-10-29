import TaskAssignment from "../models/taskAssignment.js";
import Subtask from "../models/subtask.js";

/**
 * Turn task documents into plain objects that also carry their active
 * assignees and subtask progress, in two extra queries (not one per task).
 */
export const withTaskExtras = async (tasks) => {
  if (!tasks.length) return [];
  const ids = tasks.map((t) => t._id);

  const [assignments, subtaskStats] = await Promise.all([
    TaskAssignment.find({ task: { $in: ids }, status: "active" }).populate("user", "name email avatar").lean(),
    Subtask.aggregate([
      { $match: { task: { $in: ids } } },
      { $group: { _id: "$task", total: { $sum: 1 }, done: { $sum: { $cond: ["$isCompleted", 1, 0] } } } },
    ]),
  ]);

  const assigneesByTask = new Map();
  for (const a of assignments) {
    if (!a.user) continue;
    const key = String(a.task);
    if (!assigneesByTask.has(key)) assigneesByTask.set(key, []);
    assigneesByTask.get(key).push(a.user);
  }
  const subtasksByTask = new Map(subtaskStats.map((s) => [String(s._id), s]));

  return tasks.map((task) => {
    const plain = typeof task.toObject === "function" ? task.toObject() : task;
    const sub = subtasksByTask.get(String(plain._id));
    return {
      ...plain,
      assignees: assigneesByTask.get(String(plain._id)) || [],
      subtaskCount: sub?.total || 0,
      subtaskDone: sub?.done || 0,
    };
  });
};
