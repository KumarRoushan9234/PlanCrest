import ActivityLog from "../models/activityLog.js";
import Project from "../models/project.js";
import { notifyTaskEvent } from "../integrations/notify.js";

/**
 * Log activity for workspace items
 */
export const logActivity = async (payload = {}) => {
  try {
    const {
      workspace,
      project,
      actor,
      actorModel,
      action,
      target,
      targetType,
      targetName,
      changes = {},
      metadata = {},
      // Legacy fields for backward compatibility
      item,
      itemType,
      user,
    } = payload;

    const resolvedTarget = target || item;
    const resolvedTargetType = targetType || itemType;
    const resolvedActor = actor || user;
    const resolvedActorModel =
      actorModel || (user ? "User" : undefined);

    if (!workspace || !resolvedActor || !resolvedActorModel || !resolvedTarget || !resolvedTargetType || !action) {
      console.error("logActivity missing required fields:", {
        workspace,
        resolvedActor,
        resolvedActorModel,
        resolvedTarget,
        resolvedTargetType,
        action,
      });
      return null;
    }

    const activityLog = new ActivityLog({
      workspace,
      project,
      actor: resolvedActor,
      actorModel: resolvedActorModel,
      action,
      target: resolvedTarget,
      targetType: resolvedTargetType,
      targetName,
      changes,
      metadata,
    });

    await activityLog.save();
    return activityLog;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error - activity logging shouldn't break the main operation
    return null;
  }
};

/**
 * Record something that happened to a task. Never throws: activity is best-effort
 * and must not break the request that triggered it.
 */
export const logTaskActivity = async ({ task, actorId, action, changes, metadata }) => {
  try {
    const projectId = task.project?._id ?? task.project;
    const project = await Project.findById(projectId).select("workspace name");
    if (!project) return null;
    notifyTaskEvent({ task, actorId, action, assignee: metadata?.assignee });
    return await logActivity({
      workspace: project.workspace,
      project: project._id,
      actor: actorId,
      actorModel: "User",
      target: task._id,
      targetType: "Task",
      targetName: task.title,
      action,
      changes,
      metadata: { projectName: project.name, taskKey: task.taskKey, ...metadata },
    });
  } catch (error) {
    console.error("Failed to log task activity:", error.message);
    return null;
  }
};

/**
 * Get activity feed for workspace
 */
export const getWorkspaceActivity = async (
  workspaceId,
  { limit = 50, skip = 0, itemType = null } = {}
) => {
  try {
    const query = { workspace: workspaceId };
    if (itemType) {
      query.itemType = itemType;
    }

    const activities = await ActivityLog.find(query)
      .populate("user", "name email picture")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return activities;
  } catch (error) {
    console.error("Error fetching workspace activity:", error);
    throw error;
  }
};

/**
 * Get activity for specific item
 */
export const getItemActivity = async (itemId, itemType) => {
  try {
    const activities = await ActivityLog.find({
      item: itemId,
      itemType,
    })
      .populate("user", "name email picture")
      .sort({ createdAt: -1 });

    return activities;
  } catch (error) {
    console.error("Error fetching item activity:", error);
    throw error;
  }
};

export default {
  logActivity,
  logTaskActivity,
  getWorkspaceActivity,
  getItemActivity,
};

