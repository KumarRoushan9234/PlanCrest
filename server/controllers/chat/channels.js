import ChatChannel from "../../models/chatChannel.js";
import User from "../../models/user.js";
import { validateChannelAccess, formatChannelResponse } from "../../utils/chatHelpers.js";
import { getChannelMembers } from "../../utils/channelHelpers.js";
import { updateLastSelectedChannel } from "../../utils/lastSelected.js";

/**
 * Get all channels for a workspace
 */
export const getWorkspaceChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Safety check for req.auth (expressjwt sets req.auth, not req.auth)
    if (!req.auth || !req.auth._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }
    
    const userId = req.auth._id;

    const channels = await ChatChannel.find({
      workspace: workspaceId,
      isArchived: false,
      $or: [
        { members: userId },
        { participants: userId },
        { type: "public" },
        { createdBy: userId },
      ],
    })
      .populate("members", "name email avatar status lastActive")
      .populate("participants", "name email avatar status lastActive")
      .populate("project", "name key")
      .populate("task", "title taskKey")
      .populate("lastMessageBy", "name avatar")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    // Format channels with unread counts
    const channelsWithUnread = channels.map((channel) =>
      formatChannelResponse(channel, userId)
    );

    res.json({
      success: true,
      data: channelsWithUnread,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch channels",
      error: error.message,
    });
  }
};

/**
 * Get or create direct message channel
 */
export const getOrCreateDirectMessage = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userId: otherUserId } = req.body;
    const currentUserId = req.auth._id;

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create DM with yourself",
      });
    }

    // Check if DM channel already exists
    let channel = await ChatChannel.findOne({
      workspace: workspaceId,
      category: "direct",
      participants: { $all: [currentUserId, otherUserId] },
    })
      .populate("participants", "name email avatar status lastActive")
      .populate("lastMessageBy", "name avatar");

    if (!channel) {
      // Create new DM channel
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get current user for name
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Current user not found",
        });
      }

      channel = new ChatChannel({
        name: `${currentUser.name} & ${otherUser.name}`,
        category: "direct",
        type: "direct",
        workspace: workspaceId,
        participants: [currentUserId, otherUserId],
        members: [currentUserId, otherUserId],
        createdBy: currentUserId,
      });

      await channel.save();
      await channel.populate("participants", "name email avatar status lastActive");
    }

    const formattedChannel = formatChannelResponse(channel, currentUserId);

    res.json({
      success: true,
      data: formattedChannel,
    });
  } catch (error) {
    console.error("Error creating/getting DM:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create/get DM channel",
      error: error.message,
    });
  }
};

/**
 * Create new channel
 */
export const createChannel = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, category, type, projectId, members } = req.body;
    const userId = req.auth._id;

    // Validate category
    const validCategories = ["feature", "project", "workspace"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Must be 'feature', 'project', or 'workspace'",
      });
    }

    let channelMembers = [userId]; // Always include creator

    // Handle different categories
    if (category === "project") {
      // Project channel - include all project members
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required for project channels",
        });
      }

      const ProjectMember = (await import("../../models/projectMember.js")).default;
      const projectMembers = await ProjectMember.find({
        project: projectId,
        status: "active",
      }).select("user");

      channelMembers = [
        ...new Set([
          userId,
          ...projectMembers.map((pm) => pm.user.toString()),
        ]),
      ];
    } else if (category === "workspace") {
      // Workspace channel - include all workspace members
      const WorkspaceMember = (await import("../../models/workspaceMember.js")).default;
      const workspaceMembers = await WorkspaceMember.find({
        workspace: workspaceId,
        status: "active",
      }).select("user");

      channelMembers = [
        ...new Set([
          userId,
          ...workspaceMembers.map((wm) => wm.user.toString()),
        ]),
      ];
    } else if (category === "feature") {
      // Feature/Personal channel - use selected members
      if (members && Array.isArray(members) && members.length > 0) {
        channelMembers = [...new Set([userId, ...members.map((m) => m.toString())])];
      }
    }

    const channel = new ChatChannel({
      name,
      description,
      category,
      type: type || "public",
      workspace: workspaceId,
      project: category === "project" ? projectId : null,
      members: channelMembers,
      createdBy: userId,
    });

    await channel.save();
    await channel.populate("members", "name email avatar");
    await channel.populate("createdBy", "name avatar");
    if (projectId) {
      await channel.populate("project", "name key");
    }

    const formattedChannel = formatChannelResponse(channel, userId);

    res.status(201).json({
      success: true,
      data: formattedChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create channel",
      error: error.message,
    });
  }
};

/**
 * Get single channel details
 */
export const getChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.auth._id;

    const channel = await ChatChannel.findOne({
      _id: channelId,
      $or: [
        { members: userId },
        { participants: userId },
        { type: "public" },
      ],
    })
      .populate("members", "name email avatar status lastActive")
      .populate("participants", "name email avatar status lastActive")
      .populate("project", "name key")
      .populate("task", "title taskKey")
      .populate("createdBy", "name avatar");

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const formattedChannel = formatChannelResponse(channel, userId);

    res.json({
      success: true,
      data: formattedChannel,
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch channel",
      error: error.message,
    });
  }
};

/**
 * Update channel
 */
export const updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, topic } = req.body;
    const userId = req.auth._id;

    const channel = await ChatChannel.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if user has permission (creator or member)
    const isCreator = channel.createdBy.toString() === userId.toString();
    const isMember = channel.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (!isCreator && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this channel",
      });
    }

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (topic !== undefined) channel.topic = topic;

    await channel.save();
    await channel.populate("members", "name email avatar");
    await channel.populate("createdBy", "name avatar");

    const formattedChannel = formatChannelResponse(channel, userId);

    res.json({
      success: true,
      data: formattedChannel,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update channel",
      error: error.message,
    });
  }
};

/**
 * Delete channel
 */
export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.auth._id;

    const channel = await ChatChannel.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Only creator can delete
    if (channel.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this channel",
      });
    }

    // Soft delete by archiving
    channel.isArchived = true;
    channel.archivedAt = new Date();
    await channel.save();

    res.json({
      success: true,
      message: "Channel deleted",
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete channel",
      error: error.message,
    });
  }
};

/**
 * Add member to channel
 */
export const addMember = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.auth._id;

    const channel = await ChatChannel.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check permission
    const isCreator = channel.createdBy.toString() === currentUserId.toString();
    const isMember = channel.members.some(
      (m) => m.toString() === currentUserId.toString()
    );

    if (!isCreator && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add members",
      });
    }

    // Add member
    const isAlreadyMember = channel.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (!isAlreadyMember) {
      channel.members.push(userId);
      await channel.save();
    }

    await channel.populate("members", "name email avatar");

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add member",
      error: error.message,
    });
  }
};

/**
 * Remove member from channel
 */
export const removeMember = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.auth._id;

    const channel = await ChatChannel.findById(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check permission
    const isCreator = channel.createdBy.toString() === currentUserId.toString();

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove members",
      });
    }

    channel.members = channel.members.filter(
      (m) => m.toString() !== userId.toString()
    );

    await channel.save();
    await channel.populate("members", "name email avatar");

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove member",
      error: error.message,
    });
  }
};

/**
 * Update last selected channel for user
 */
export const updateLastSelectedChannelForUser = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.auth._id;

    const channel = await ChatChannel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if user has access to channel
    const hasAccess = await validateChannelAccess(channel, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this channel",
      });
    }

    // Update last selected channel
    await updateLastSelectedChannel(userId, {
      id: channelId,
      name: channel.name,
      workspaceId: channel.workspace.toString(),
    });

    res.json({
      success: true,
      message: "Last selected channel updated",
    });
  } catch (error) {
    console.error("Error updating last selected channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update last selected channel",
      error: error.message,
    });
  }
};

