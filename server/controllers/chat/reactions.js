import ChatMessage from "../../models/chatMessage.js";
import { formatMessageForResponse } from "../../utils/messageHelpers.js";

/**
 * Add reaction to message
 */
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.auth._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required",
      });
    }

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Initialize reactions array if it doesn't exist
    if (!message.reactions) {
      message.reactions = [];
    }

    let reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      // Check if user already reacted
      const userReacted = reaction.users?.some(
        (u) => u.toString() === userId.toString()
      );

      if (userReacted) {
        // Remove reaction (toggle off)
        reaction.users = reaction.users.filter(
          (u) => u.toString() !== userId.toString()
        );
        reaction.count = Math.max(0, reaction.count - 1);

        // Remove reaction if count is 0
        if (reaction.count === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Add reaction (toggle on)
        if (!reaction.users) {
          reaction.users = [];
        }
        reaction.users.push(userId);
        reaction.count += 1;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1,
      });
    }

    await message.save();
    const formattedMessage = await formatMessageForResponse(message);

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add reaction",
      error: error.message,
    });
  }
};

/**
 * Remove reaction from message
 */
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.auth._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required",
      });
    }

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      // Remove user from reaction
      reaction.users = reaction.users.filter(
        (u) => u.toString() !== userId.toString()
      );
      reaction.count -= 1;

      // Remove reaction if no users left
      if (reaction.count === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }
    }

    await message.save();
    const formattedMessage = await formatMessageForResponse(message);

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove reaction",
      error: error.message,
    });
  }
};

/**
 * Get message reactions
 */
export const getMessageReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId)
      .populate("reactions.users", "name avatar");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.json({
      success: true,
      data: message.reactions || [],
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reactions",
      error: error.message,
    });
  }
};

