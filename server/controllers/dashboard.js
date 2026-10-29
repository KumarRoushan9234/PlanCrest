import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import WorkspaceMember from "../models/workspaceMember.js";
import ActivityLog from "../models/activityLog.js";
import Connector from "../models/connector.js";
import AiUsage from "../models/aiUsage.js";
import { getAccessibleProjects } from "../utils/projectAccess.js";

const DAY = 86400000;
const CHART_DAYS = 14;
const OPEN = ["backlog", "todo", "in_progress", "in_review", "blocked"];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10);

/**
 * GET /api/workspaces/:workspaceId/dashboard
 * Everything the Overview page needs in one permission-scoped call.
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.auth._id;
    const projects = await getAccessibleProjects(
      { workspace: req.workspace, workspaceMember: req.workspaceMember, isWorkspaceOwner: req.isWorkspaceOwner, userId },
      "name key color"
    );
    const projectIds = projects.map((p) => p._id);
    const projectById = new Map(projects.map((p) => [p._id.toString(), p]));

    const [tasks, mineIds, memberCount, connectors, aiUsed] = await Promise.all([
      Task.find({ project: { $in: projectIds }, isArchived: { $ne: true } })
        .select("title taskKey status priority dueDate project completedAt createdAt")
        .lean(),
      TaskAssignment.find({ user: userId, status: "active" }).distinct("task"),
      WorkspaceMember.countDocuments({ workspace: req.workspace._id, status: "active" }),
      Connector.exists({ user: userId, status: "active" }),
      AiUsage.exists({ user: userId, workspace: req.workspace._id }),
    ]);

    const mine = new Set(mineIds.map(String));
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * DAY);
    const open = tasks.filter((t) => OPEN.includes(t.status));
    const myOpen = open.filter((t) => mine.has(String(t._id)));
    const overdue = myOpen.filter((t) => t.dueDate && t.dueDate < now);
    const dueThisWeek = myOpen.filter((t) => t.dueDate && t.dueDate >= now && t.dueDate <= weekEnd);
    const doneWeek = tasks.filter((t) => t.status === "done" && t.completedAt && t.completedAt >= new Date(now.getTime() - 7 * DAY));

    // Created vs completed per day
    const days = Array.from({ length: CHART_DAYS }, (_, i) => dayKey(new Date(now.getTime() - (CHART_DAYS - 1 - i) * DAY)));
    const series = new Map(days.map((k) => [k, { date: k, created: 0, completed: 0 }]));
    for (const t of tasks) {
      const created = series.get(dayKey(t.createdAt));
      if (created) created.created++;
      if (t.completedAt) {
        const done = series.get(dayKey(t.completedAt));
        if (done) done.completed++;
      }
    }

    // Per-project progress
    const progress = projects.map((p) => {
      const mineInProject = tasks.filter((t) => String(t.project) === String(p._id));
      const done = mineInProject.filter((t) => t.status === "done").length;
      return {
        _id: p._id,
        name: p.name,
        key: p.key,
        color: p.color,
        total: mineInProject.length,
        done,
        overdue: mineInProject.filter((t) => OPEN.includes(t.status) && t.dueDate && t.dueDate < now).length,
      };
    });

    const shapeTask = (t) => ({
      _id: t._id,
      title: t.title,
      taskKey: t.taskKey,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      project: projectById.get(String(t.project)) ? { _id: t.project, name: projectById.get(String(t.project)).name, key: projectById.get(String(t.project)).key } : { _id: t.project },
    });
    const myTasks = [...myOpen]
      .sort((a, b) => (a.dueDate ? a.dueDate.getTime() : Infinity) - (b.dueDate ? b.dueDate.getTime() : Infinity))
      .slice(0, 8)
      .map(shapeTask);

    const activity = await ActivityLog.find({
      workspace: req.workspace._id,
      $or: [{ project: { $in: projectIds } }, { project: { $exists: false } }, { project: null }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("actor", "name email avatar")
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          openTasks: open.length,
          myOpen: myOpen.length,
          dueThisWeek: dueThisWeek.length,
          overdue: overdue.length,
          completedWeek: doneWeek.length,
          projects: projects.length,
        },
        series: [...series.values()],
        myTasks,
        progress,
        activity: activity.map((a) => ({
          _id: a._id,
          action: a.action,
          targetType: a.targetType,
          targetName: a.targetName,
          actor: a.actor,
          createdAt: a.createdAt,
        })),
        setup: {
          hasProject: projects.length > 0,
          hasTask: tasks.length > 0,
          hasTeammate: memberCount > 1,
          hasIntegration: Boolean(connectors),
          usedAi: Boolean(aiUsed),
        },
      },
    });
  } catch (error) {
    console.error("Error building dashboard:", error);
    res.status(500).json({ error: "Failed to load the dashboard" });
  }
};

/**
 * GET /api/workspaces/:workspaceId/insights?range=30
 * Aggregates for the Analytics page, computed from the tasks the user may see.
 */
export const getInsights = async (req, res) => {
  try {
    const range = [14, 30, 90].includes(Number(req.query.range)) ? Number(req.query.range) : 30;
    const userId = req.auth._id;
    const projects = await getAccessibleProjects(
      { workspace: req.workspace, workspaceMember: req.workspaceMember, isWorkspaceOwner: req.isWorkspaceOwner, userId },
      "name key color"
    );
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds }, isArchived: { $ne: true } })
      .select("status priority dueDate project completedAt createdAt")
      .lean();
    const assignments = await TaskAssignment.find({ task: { $in: tasks.map((t) => t._id) }, status: "active" })
      .populate("user", "name")
      .lean();

    const now = Date.now();
    const since = new Date(now - range * DAY);
    const weekly = range > 30;
    const bucketMs = (weekly ? 7 : 1) * DAY;
    const buckets = Math.ceil(range / (weekly ? 7 : 1));
    const start = startOfDay(new Date(now - (buckets - 1) * bucketMs)).getTime();
    const series = Array.from({ length: buckets }, (_, i) => ({ date: new Date(start + i * bucketMs).toISOString(), created: 0, completed: 0 }));
    const slot = (d) => Math.floor((startOfDay(d).getTime() - start) / bucketMs);

    const completed = tasks.filter((t) => t.status === "done" && t.completedAt && t.completedAt >= since);
    const created = tasks.filter((t) => t.createdAt >= since);
    for (const t of created) series[slot(t.createdAt)] && series[slot(t.createdAt)].created++;
    for (const t of completed) series[slot(t.completedAt)] && series[slot(t.completedAt)].completed++;

    const cycleDays = completed.map((t) => (t.completedAt - t.createdAt) / DAY).filter((d) => d >= 0);
    const withDue = completed.filter((t) => t.dueDate);
    const onTime = withDue.filter((t) => t.completedAt <= new Date(new Date(t.dueDate).getTime() + DAY - 1));
    const open = tasks.filter((t) => OPEN.includes(t.status));

    const countBy = (list, key) => list.reduce((acc, t) => ({ ...acc, [t[key]]: (acc[t[key]] || 0) + 1 }), {});
    const openByUser = new Map();
    for (const a of assignments) {
      const task = tasks.find((t) => String(t._id) === String(a.task));
      if (!a.user || !task || !OPEN.includes(task.status)) continue;
      const key = String(a.user._id);
      const row = openByUser.get(key) || { name: a.user.name, value: 0 };
      row.value++;
      openByUser.set(key, row);
    }

    res.json({
      success: true,
      data: {
        range,
        bucket: weekly ? "week" : "day",
        kpis: {
          created: created.length,
          completed: completed.length,
          avgCycleDays: cycleDays.length ? Math.round((cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10) / 10 : null,
          onTimeRate: withDue.length ? Math.round((onTime.length / withDue.length) * 100) : null,
          overdue: open.filter((t) => t.dueDate && t.dueDate < new Date()).length,
          open: open.length,
        },
        series,
        status: countBy(tasks.filter((t) => t.status !== "cancelled"), "status"),
        priority: countBy(open, "priority"),
        workload: [...openByUser.values()].sort((a, b) => b.value - a.value).slice(0, 8),
        projects: projects.map((p) => {
          const own = tasks.filter((t) => String(t.project) === String(p._id));
          return { _id: p._id, name: p.name, color: p.color, total: own.length, done: own.filter((t) => t.status === "done").length };
        }),
      },
    });
  } catch (error) {
    console.error("Error building insights:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
};
