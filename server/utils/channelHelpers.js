import ChatChannel from "../models/chatChannel.js";
import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import WorkspaceMember from "../models/workspaceMember.js";

/**
 * Channel Helper Functions
 * Utility functions for channel operations
 */

/**
 * Create default channel for a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {string} createdBy - User ID who created the workspace
 */
export const createDefaultWorkspaceChannel = async (workspaceId, createdBy) => {
  try {
    // Check if default channel already exists
    const existing = await ChatChannel.findOne({
      workspace: workspaceId,
      category: "workspace",
      isDefault: true,
    });

    if (existing) {
      return existing;
    }

    // Get all workspace members
    const workspaceMembers = await WorkspaceMember.find({
      workspace: workspaceId,
      status: "active",
    }).select("user");

    const memberIds = workspaceMembers.map((wm) => wm.user);

    // Create default workspace channel
    const channel = new ChatChannel({
      name: "#general",
      prefix: "general",
      category: "workspace",
      type: "public",
      isDefault: true,
      description: "General workspace discussion",
      workspace: workspaceId,
      members: memberIds.length > 0 ? memberIds : [createdBy],
      createdBy,
    });

    await channel.save();
    console.log(`Created default workspace channel: #general`);
    return channel;
  } catch (error) {
    console.error("Error creating default workspace channel:", error);
    throw error;
  }
};

/**
 * Create default channel for a project
 * @param {string} projectId - Project ID
 * @param {string} workspaceId - Workspace ID
 * @param {string} createdBy - User ID who created the project
 */
export const createDefaultChannels = async (projectId, workspaceId, createdBy) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      console.error("Project not found for channel creation");
      return;
    }

    // Check if default channel already exists
    const existing = await ChatChannel.findOne({
      project: projectId,
      category: "project",
      isDefault: true,
    });

    if (existing) {
      return existing;
    }

    // Get all project members
    const projectMembers = await ProjectMember.find({
      project: projectId,
      status: "active",
    }).select("user");

    const memberIds = projectMembers.map((pm) => pm.user);

    // Create single default project channel
    const channel = new ChatChannel({
      name: `#general-${project.key}`,
      prefix: "general",
      category: "project",
      type: "public",
      isDefault: true,
      description: `General discussion for ${project.name}`,
      project: projectId,
      workspace: workspaceId,
      members: memberIds.length > 0 ? memberIds : [createdBy],
      createdBy,
    });

    await channel.save();
    console.log(`Created default project channel: #general-${project.key}`);
    return channel;
  } catch (error) {
    console.error("Error creating default channels:", error);
  }
};

/**
 * Get all members of a channel
 * @param {string} channelId - Channel ID
 * @returns {Array} - Array of user IDs
 */
export const getChannelMembers = async (channelId) => {
  try {
    const channel = await ChatChannel.findById(channelId)
      .populate("members", "_id")
      .populate("participants", "_id");

    const members = new Set();

    // Add members
    channel.members.forEach((member) => {
      members.add(member._id.toString());
    });

    // Add participants (for DMs)
    if (channel.participants) {
      channel.participants.forEach((participant) => {
        members.add(participant._id.toString());
      });
    }

    return Array.from(members);
  } catch (error) {
    console.error("Error getting channel members:", error);
    return [];
  }
};

/**
 * Add member to channel
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID to add
 */
export const addMemberToChannel = async (channelId, userId) => {
  try {
    const channel = await ChatChannel.findById(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check if user is already a member
    const isMember = channel.members.some(
      (member) => member.toString() === userId.toString()
    );

    if (!isMember) {
      channel.members.push(userId);
      await channel.save();
    }

    return channel;
  } catch (error) {
    console.error("Error adding member to channel:", error);
    throw error;
  }
};

/**
 * Remove member from channel
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID to remove
 */
export const removeMemberFromChannel = async (channelId, userId) => {
  try {
    const channel = await ChatChannel.findById(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    channel.members = channel.members.filter(
      (member) => member.toString() !== userId.toString()
    );

    // Also remove from participants if present
    if (channel.participants) {
      channel.participants = channel.participants.filter(
        (participant) => participant.toString() !== userId.toString()
      );
    }

    await channel.save();
    return channel;
  } catch (error) {
    console.error("Error removing member from channel:", error);
    throw error;
  }
};

