import ChatChannel from "../models/chatChannel.js";
import ChatMessage from "../models/chatMessage.js";

/**
 * Chat Helper Functions
 * Utility functions for chat operations
 */

/**
 * Validate if user has access to channel
 * @param {string} userId - User ID
 * @param {Object} channel - Channel object
 * @returns {boolean} - True if user has access
 */
export const validateChannelAccess = async (userId, channel) => {
  if (!channel) return false;

  // Public channels are accessible to all workspace members
  if (channel.type === "public") return true;

  // Check if user is a member
  const isMember = channel.members.some(
    (member) => member.toString() === userId.toString()
  );

  // Check if user is a participant (for DMs)
  const isParticipant = channel.participants?.some(
    (participant) => participant.toString() === userId.toString()
  );

  // Check if user created the channel
  const isCreator = channel.createdBy.toString() === userId.toString();

  return isMember || isParticipant || isCreator;
};

/**
 * Update channel's last message metadata
 * @param {string} channelId - Channel ID
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID who sent the message
 */
export const updateChannelLastMessage = async (channelId, messageId, userId) => {
  try {
    await ChatChannel.findByIdAndUpdate(channelId, {
      lastMessageAt: new Date(),
      lastMessageBy: userId,
    });
  } catch (error) {
    console.error("Error updating channel last message:", error);
  }
};

/**
 * Increment unread counts for all channel members except sender
 * @param {string} channelId - Channel ID
 * @param {string} senderId - Sender's user ID
 */
export const incrementUnreadCounts = async (channelId, senderId) => {
  try {
    const channel = await ChatChannel.findById(channelId);
    if (!channel) return;

    // Get all unique members and participants
    const allUsers = new Set();
    
    // Add members
    channel.members.forEach((member) => {
      if (member.toString() !== senderId.toString()) {
        allUsers.add(member.toString());
      }
    });

    // Add participants (for DMs)
    if (channel.participants) {
      channel.participants.forEach((participant) => {
        if (participant.toString() !== senderId.toString()) {
          allUsers.add(participant.toString());
        }
      });
    }

    // Update unread counts
    allUsers.forEach((userId) => {
      const unreadData = channel.unreadCounts.find(
        (u) => u.user.toString() === userId
      );

      if (unreadData) {
        unreadData.count += 1;
      } else {
        channel.unreadCounts.push({
          user: userId,
          count: 1,
          lastReadAt: null,
        });
      }
    });

    await channel.save();
  } catch (error) {
    console.error("Error incrementing unread counts:", error);
  }
};

/**
 * Format channel response with unread count for user
 * @param {Object} channel - Channel object
 * @param {string} userId - User ID
 * @returns {Object} - Formatted channel with unread count
 */
export const formatChannelResponse = (channel, userId) => {
  const channelObj = channel.toObject ? channel.toObject() : channel;
  
  const unreadData = channelObj.unreadCounts?.find(
    (u) => u.user.toString() === userId.toString()
  );

  return {
    ...channelObj,
    unreadCount: unreadData?.count || 0,
    lastReadAt: unreadData?.lastReadAt || null,
  };
};

/**
 * Mark channel as read for user
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 */
export const markChannelAsRead = async (channelId, userId) => {
  try {
    const channel = await ChatChannel.findById(channelId);
    if (!channel) return;

    const unreadData = channel.unreadCounts.find(
      (u) => u.user.toString() === userId.toString()
    );

    if (unreadData) {
      unreadData.count = 0;
      unreadData.lastReadAt = new Date();
    } else {
      channel.unreadCounts.push({
        user: userId,
        count: 0,
        lastReadAt: new Date(),
      });
    }

    await channel.save();
  } catch (error) {
    console.error("Error marking channel as read:", error);
    throw error;
  }
};

