import ChatMessage from "../models/chatMessage.js";

/**
 * Message Helper Functions
 * Utility functions for message operations
 */

/**
 * Parse @mentions from message content
 * @param {string} content - Message content
 * @returns {Array} - Array of mentioned user IDs (extracted from @username format)
 */
export const parseMentions = (content) => {
  // This is a placeholder - actual implementation would need user lookup
  // For now, we'll extract @mentions pattern
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // This would be username, needs to be converted to user ID
  }

  return mentions;
};

/**
 * Parse #task mentions from message content
 * @param {string} content - Message content
 * @returns {Array} - Array of task keys (extracted from #TASK-123 format)
 */
export const parseTaskMentions = (content) => {
  const taskRegex = /#([A-Z]+-\d+)/g;
  const tasks = [];
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push(match[1]); // Task key like "PROJ-123"
  }

  return tasks;
};

/**
 * Format message for response with populated fields
 * @param {Object} message - Message object
 * @returns {Object} - Formatted message
 */
export const formatMessageForResponse = async (message) => {
  try {
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate("sender", "name email avatar status lastActive")
      .populate("parentMessage", "content sender")
      .populate("mentions", "name email avatar")
      .populate("taskMentions", "title taskKey")
      .populate("linkedTask", "title taskKey")
      .populate("reactions.users", "name avatar");

    return populatedMessage;
  } catch (error) {
    console.error("Error formatting message:", error);
    return message;
  }
};

/**
 * Check if user can edit message (within 5 minutes)
 * @param {Object} message - Message object
 * @param {string} userId - User ID
 * @returns {boolean} - True if user can edit
 */
export const canEditMessage = (message, userId) => {
  // Check ownership
  if (message.sender.toString() !== userId.toString()) {
    return false;
  }

  // Check time limit (5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const messageTime = message.createdAt || message.timestamp;

  return new Date(messageTime) >= fiveMinutesAgo;
};

/**
 * Generate message link
 * @param {string} workspaceId - Workspace ID
 * @param {string} channelId - Channel ID
 * @param {string} messageId - Message ID
 * @returns {string} - Message link
 */
export const generateMessageLink = (workspaceId, channelId, messageId) => {
  // In production, this would be the actual app URL
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${baseUrl}/chat?channel=${channelId}&message=${messageId}`;
};

