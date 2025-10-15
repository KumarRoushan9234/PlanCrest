import ActivityLog from "../models/activityLog.js";

/**
 * Log activity for workspace items
 */
export const logActivity = async ({
  workspace,
  item,
  itemType,
  user,
  action,
  changes = {},
  metadata = {},
}) => {
  try {
    const activityLog = new ActivityLog({
      workspace,
      item,
      itemType,
      user,
      action,
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
  getWorkspaceActivity,
  getItemActivity,
};

