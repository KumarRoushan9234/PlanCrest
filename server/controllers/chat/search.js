import ChatMessage from "../../models/chatMessage.js";
import ChatChannel from "../../models/chatChannel.js";
import { validateChannelAccess } from "../../utils/chatHelpers.js";

/**
 * Search messages
 */
export const searchMessages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      query,
      channelId,
      userId,
      dateFrom,
      dateTo,
      hasLinks,
      hasFiles,
    } = req.query;
    const currentUserId = req.auth._id;

    const searchQuery = {
      isDeleted: false,
    };

    // Text search
    if (query) {
      searchQuery.content = { $regex: query, $options: "i" };
    }

    // Channel filter
    if (channelId) {
      // Verify access
      const channel = await ChatChannel.findById(channelId);
      if (channel) {
        const hasAccess = await validateChannelAccess(currentUserId, channel);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to search this channel",
          });
        }
      }
      searchQuery.channel = channelId;
    } else {
      // Get all accessible channels in workspace
      const channels = await ChatChannel.find({
        workspace: workspaceId,
        $or: [
          { members: currentUserId },
          { participants: currentUserId },
          { type: "public" },
        ],
      }).select("_id");
      searchQuery.channel = { $in: channels.map((c) => c._id) };
    }

    // User filter
    if (userId) {
      searchQuery.sender = userId;
    }

    // Date range
    if (dateFrom || dateTo) {
      searchQuery.createdAt = {};
      if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
    }

    // Has links/files
    if (hasLinks === "true") {
      searchQuery.content = {
        ...searchQuery.content,
        $regex: /https?:\/\//,
      };
    }
    if (hasFiles === "true") {
      searchQuery.attachments = { $exists: true, $ne: [] };
    }

    const messages = await ChatMessage.find(searchQuery)
      .populate("sender", "name email avatar")
      .populate("channel", "name category")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search messages",
      error: error.message,
    });
  }
};

/**
 * Search channels
 */
export const searchChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { query } = req.query;
    const userId = req.auth._id;

    const searchQuery = {
      workspace: workspaceId,
      isArchived: false,
      $or: [
        { members: userId },
        { participants: userId },
        { type: "public" },
        { createdBy: userId },
      ],
    };

    if (query) {
      searchQuery.$or = [
        ...searchQuery.$or,
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const channels = await ChatChannel.find(searchQuery)
      .populate("members", "name email avatar")
      .populate("project", "name key")
      .limit(50);

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("Error searching channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search channels",
      error: error.message,
    });
  }
};

