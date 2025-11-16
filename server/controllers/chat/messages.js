import ChatMessage from "../../models/chatMessage.js";
import ChatChannel from "../../models/chatChannel.js";
import { validateChannelAccess } from "../../utils/chatHelpers.js";
import {
  updateChannelLastMessage,
  incrementUnreadCounts,
  markChannelAsRead,
} from "../../utils/chatHelpers.js";
import { formatMessageForResponse, canEditMessage, generateMessageLink } from "../../utils/messageHelpers.js";
import { getChannelMembers } from "../../utils/channelHelpers.js";
import sseManager from "../../utils/sseManager.js";

/**
 * Get messages for a channel
 */
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.auth._id;
    const { page = 1, limit = 50, before } = req.query;

    // Verify user has access to channel
    const channel = await ChatChannel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const hasAccess = await validateChannelAccess(userId, channel);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this channel",
      });
    }

    // Build query
    const query = {
      channel: channelId,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .populate("sender", "name email avatar status lastActive")
      .populate("parentMessage", "content sender")
      .populate("mentions", "name email avatar")
      .populate("taskMentions", "title taskKey")
      .populate("linkedTask", "title taskKey")
      .populate("reactions.users", "name avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark messages as read
    await markChannelAsRead(channelId, userId);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * Send message
 */
export const sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const {
      content,
      contentFormat,
      parentMessageId,
      taskMentions,
      mentions,
    } = req.body;
    const userId = req.auth._id;

    // Verify channel access
    const channel = await ChatChannel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    const hasAccess = await validateChannelAccess(userId, channel);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages in this channel",
      });
    }

    // Handle attachments if provided
    let attachmentIds = [];
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      // If attachments are provided as objects with URLs (from Cloudinary), create Attachment records
      const Attachment = (await import("../../models/attachment.js")).default;
      for (const attData of req.body.attachments) {
        if (attData.url) {
          const attachment = new Attachment({
            filename: attData.filename || attData.publicId || "attachment",
            originalName: attData.filename || "attachment",
            mimeType: attData.mimeType || "application/octet-stream",
            size: attData.size || 0,
            url: attData.url,
            thumbnailUrl: attData.thumbnailUrl || attData.url,
            attachedTo: {
              model: "ChatMessage",
              id: null, // Will update after message save
            },
            workspace: channel.workspace,
            uploadedBy: userId,
          });
          await attachment.save();
          attachmentIds.push(attachment._id);
        }
      }
    }

    // Create message
    const message = new ChatMessage({
      channel: channelId,
      sender: userId,
      content: content || "",
      contentFormat: contentFormat || "plain",
      parentMessage: parentMessageId || null,
      taskMentions: taskMentions || [],
      mentions: mentions || [],
      attachments: attachmentIds,
      type: attachmentIds.length > 0 ? "file" : "text",
      messageLink: generateMessageLink(
        channel.workspace.toString(),
        channelId,
        null // Will update after save
      ),
    });

    await message.save();

    // Update attachment references with message ID
    if (attachmentIds.length > 0) {
      const Attachment = (await import("../../models/attachment.js")).default;
      await Attachment.updateMany(
        { _id: { $in: attachmentIds } },
        { $set: { "attachedTo.id": message._id } }
      );
    }

    // Update message link with actual message ID
    message.messageLink = generateMessageLink(
      channel.workspace.toString(),
      channelId,
      message._id.toString()
    );
    await message.save();

    // Update channel metadata
    await updateChannelLastMessage(channelId, message._id, userId);

    // Increment unread counts
    await incrementUnreadCounts(channelId, userId);

    // Get channel members for SSE
    const channelMembers = await getChannelMembers(channelId);

    // Emit SSE event
    const populatedMessage = await formatMessageForResponse(message);
    const messageData = populatedMessage.toObject ? populatedMessage.toObject() : populatedMessage;
    sseManager.emitMessageEvent({
      type: "new_message",
      workspaceId: channel.workspace.toString(),
      channelId: channelId,
      message: messageData,
      userId: userId.toString(),
      channelMembers: channelMembers,
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Update message
 */
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.auth._id;

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user can edit
    if (!canEditMessage(message, userId)) {
      return res.status(403).json({
        success: false,
        message: "Message can only be edited within 5 minutes by the sender",
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    const formattedMessage = await formatMessageForResponse(message);

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update message",
      error: error.message,
    });
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.auth._id;

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check ownership
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "[Message deleted]";

    await message.save();

    res.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

/**
 * Pin message
 */
export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.auth._id;

    const message = await ChatMessage.findById(messageId).populate("channel");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check channel membership
    const channel = message.channel;
    const isMember = channel.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pin messages in this channel",
      });
    }

    message.isPinned = true;
    message.pinnedBy = userId;
    await message.save();

    const formattedMessage = await formatMessageForResponse(message);

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error pinning message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pin message",
      error: error.message,
    });
  }
};

/**
 * Mark channel as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.auth._id;

    await markChannelAsRead(channelId, userId);

    res.json({
      success: true,
      message: "Channel marked as read",
    });
  } catch (error) {
    console.error("Error marking channel as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark channel as read",
      error: error.message,
    });
  }
};

