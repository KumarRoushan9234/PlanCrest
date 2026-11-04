import User from "../models/user.js";

/**
 * Update user's last selected workspace
 * @param {string} userId - User ID
 * @param {Object} workspaceData - Workspace data
 * @returns {Promise<Object>} Updated user
 */

export const updateLastSelectedWorkspace = async (userId, workspaceData) => {
  try {
    const { id, name } = workspaceData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.workspace": {
            id,
            name,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected workspace:", error);
    throw error;
  }
};

/**
 * Update user's last selected project
 * @param {string} userId - User ID
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Updated user
 */
export const updateLastSelectedProject = async (userId, projectData) => {
  try {
    const { id, name, workspaceId } = projectData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.project": {
            id,
            name,
            workspaceId,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected project:", error);
    throw error;
  }
};

/**
 * Update user's last selected task
 * @param {string} userId - User ID
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Updated user
 */
export const updateLastSelectedTask = async (userId, taskData) => {
  try {
    const { id, title, projectId, workspaceId } = taskData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.task": {
            id,
            title,
            projectId,
            workspaceId,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected task:", error);
    throw error;
  }
};

/**
 * Update user's last selected board
 * @param {string} userId - User ID
 * @param {Object} boardData - Board data
 * @returns {Promise<Object>} Updated user
 */
export const updateLastSelectedBoard = async (userId, boardData) => {
  try {
    const { id, name, projectId } = boardData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.board": {
            id,
            name,
            projectId,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected board:", error);
    throw error;
  }
};

/**
 * Update user's last selected column
 * @param {string} userId - User ID
 * @param {Object} columnData - Column data
 * @returns {Promise<Object>} Updated user
 */
export const updateLastSelectedColumn = async (userId, columnData) => {
  try {
    const { id, name, boardId, projectId } = columnData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.column": {
            id,
            name,
            boardId,
            projectId,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected column:", error);
    throw error;
  }
};

/**
 * Update user's last selected channel
 * @param {string} userId - User ID
 * @param {Object} channelData - Channel data
 * @returns {Promise<Object>} Updated user
 */
export const updateLastSelectedChannel = async (userId, channelData) => {
  try {
    const { id, name, workspaceId } = channelData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "lastSelected.channel": {
            id,
            name,
            workspaceId,
            selectedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error("Error updating last selected channel:", error);
    throw error;
  }
};

/**
 * Get user's last selected items
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's last selected items
 */
export const getLastSelectedItems = async (userId) => {
  try {
    const user = await User.findById(userId).select("lastSelected");
    return user?.lastSelected || {};
  } catch (error) {
    console.error("Error getting last selected items:", error);
    throw error;
  }
};

/**
 * Clear user's last selected items
 * @param {string} userId - User ID
 * @param {string} type - Type of item to clear (workspace, project, task, board, column, or 'all')
 * @returns {Promise<Object>} Updated user
 */
export const clearLastSelected = async (userId, type = "all") => {
  try {
    let updateQuery = {};
    
    if (type === "all") {
      updateQuery = {
        $unset: {
          "lastSelected.workspace": "",
          "lastSelected.project": "",
          "lastSelected.task": "",
          "lastSelected.board": "",
          "lastSelected.column": "",
          "lastSelected.channel": "",
        },
      };
    } else {
      updateQuery = {
        $unset: {
          [`lastSelected.${type}`]: "",
        },
      };
    }

    const user = await User.findByIdAndUpdate(userId, updateQuery, { new: true });
    return user;
  } catch (error) {
    console.error("Error clearing last selected items:", error);
    throw error;
  }
};

/**
 * Validate and clean last selected items (remove references to deleted items)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
export const validateLastSelectedItems = async (userId) => {
  try {
    const user = await User.findById(userId).populate([
      { path: "lastSelected.workspace.id", select: "_id name" },
      { path: "lastSelected.project.id", select: "_id name workspace" },
      { path: "lastSelected.task.id", select: "_id title project" },
      { path: "lastSelected.board.id", select: "_id name project" },
      { path: "lastSelected.column.id", select: "_id name board project" },
      { path: "lastSelected.channel.id", select: "_id name workspace" },
    ]);

    if (!user) return null;

    const updates = {};
    let hasUpdates = false;

    // Check workspace
    if (user.lastSelected.workspace?.id && !user.lastSelected.workspace.id._id) {
      updates["lastSelected.workspace"] = "";
      hasUpdates = true;
    }

    // Check project
    if (user.lastSelected.project?.id && !user.lastSelected.project.id._id) {
      updates["lastSelected.project"] = "";
      hasUpdates = true;
    }

    // Check task
    if (user.lastSelected.task?.id && !user.lastSelected.task.id._id) {
      updates["lastSelected.task"] = "";
      hasUpdates = true;
    }

    // Check board
    if (user.lastSelected.board?.id && !user.lastSelected.board.id._id) {
      updates["lastSelected.board"] = "";
      hasUpdates = true;
    }

    // Check column
    if (user.lastSelected.column?.id && !user.lastSelected.column.id._id) {
      updates["lastSelected.column"] = "";
      hasUpdates = true;
    }

    // Check channel
    if (user.lastSelected.channel?.id && !user.lastSelected.channel.id._id) {
      updates["lastSelected.channel"] = "";
      hasUpdates = true;
    }

    if (hasUpdates) {
      const updateQuery = { $unset: updates };
      await User.findByIdAndUpdate(userId, updateQuery);
    }

    return user;
  } catch (error) {
    console.error("Error validating last selected items:", error);
    throw error;
  }
};
