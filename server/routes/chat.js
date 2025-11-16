import express from "express";
const router = express.Router();

import {
  getWorkspaceChannels,
  getOrCreateDirectMessage,
  createChannel,
  getChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  getChannelMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  pinMessage,
  markAsRead,
  addReaction,
  removeReaction,
  getMessageReactions,
  searchMessages,
  searchChannels,
  getTaskThread,
  sendThreadMessage,
  getThreadMessages,
  updateLastSelectedChannelForUser,
  sendTypingIndicator,
} from "../controllers/chat/index.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import sseManager from "../utils/sseManager.js";

// SSE endpoint for real-time updates
// Note: SSE requires special auth handling since it's a long-lived connection
// requireSignin now checks query parameters, so we can use it directly
router.get(
  "/workspaces/:workspaceId/events",
  requireSignin,
  (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.auth._id.toString();

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    // Add connection to SSE manager
    sseManager.addConnection(userId, res);

    // Listen for events
    const eventHandler = (data) => {
      // Only send events relevant to this user and workspace
      // Convert both to strings for comparison
      const dataWorkspaceId = data.workspaceId?.toString();
      const reqWorkspaceId = workspaceId?.toString();
      
      // Convert channelMembers to strings for comparison
      const memberIds = data.channelMembers?.map(m => m?.toString()) || [];
      
      if (
        dataWorkspaceId === reqWorkspaceId &&
        (data.userId?.toString() === userId || memberIds.includes(userId))
      ) {
        try {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          // Connection closed
          sseManager.removeConnection(userId, res);
        }
      }
    };

    // Listen to SSE manager events
    sseManager.on("message", eventHandler);
    sseManager.on("typing", eventHandler);
    sseManager.on("user_status", eventHandler);

    // Clean up on client disconnect
    req.on("close", () => {
      sseManager.removeListener("message", eventHandler);
      sseManager.removeListener("typing", eventHandler);
      sseManager.removeListener("user_status", eventHandler);
      sseManager.removeConnection(userId, res);
    });
  }
);

// Channel routes
router.get(
  "/workspaces/:workspaceId/channels",
  requireSignin,
  getWorkspaceChannels,
  handleAuthError
);

router.post(
  "/workspaces/:workspaceId/channels",
  requireSignin,
  createChannel,
  handleAuthError
);

router.get(
  "/channels/:channelId",
  requireSignin,
  getChannel,
  handleAuthError
);

router.put(
  "/channels/:channelId/last-selected",
  requireSignin,
  updateLastSelectedChannelForUser,
  handleAuthError
);

// Typing indicator
router.post(
  "/channels/:channelId/typing",
  requireSignin,
  sendTypingIndicator,
  handleAuthError
);

router.patch(
  "/channels/:channelId",
  requireSignin,
  updateChannel,
  handleAuthError
);

router.delete(
  "/channels/:channelId",
  requireSignin,
  deleteChannel,
  handleAuthError
);

router.post(
  "/channels/:channelId/members",
  requireSignin,
  addMember,
  handleAuthError
);

router.delete(
  "/channels/:channelId/members",
  requireSignin,
  removeMember,
  handleAuthError
);

// Direct messages
router.post(
  "/workspaces/:workspaceId/direct-messages",
  requireSignin,
  getOrCreateDirectMessage,
  handleAuthError
);

// Message routes
router.get(
  "/channels/:channelId/messages",
  requireSignin,
  getChannelMessages,
  handleAuthError
);

router.post(
  "/channels/:channelId/messages",
  requireSignin,
  sendMessage,
  handleAuthError
);

router.patch(
  "/messages/:messageId",
  requireSignin,
  updateMessage,
  handleAuthError
);

router.delete(
  "/messages/:messageId",
  requireSignin,
  deleteMessage,
  handleAuthError
);

router.post(
  "/messages/:messageId/pin",
  requireSignin,
  pinMessage,
  handleAuthError
);

router.post(
  "/messages/:messageId/reactions",
  requireSignin,
  addReaction,
  handleAuthError
);

router.delete(
  "/messages/:messageId/reactions",
  requireSignin,
  removeReaction,
  handleAuthError
);

router.get(
  "/messages/:messageId/reactions",
  requireSignin,
  getMessageReactions,
  handleAuthError
);

// Mark as read
router.post(
  "/channels/:channelId/read",
  requireSignin,
  markAsRead,
  handleAuthError
);

// Search
router.get(
  "/workspaces/:workspaceId/messages/search",
  requireSignin,
  searchMessages,
  handleAuthError
);

router.get(
  "/workspaces/:workspaceId/channels/search",
  requireSignin,
  searchChannels,
  handleAuthError
);

// Task threads
router.get(
  "/tasks/:taskId/thread",
  requireSignin,
  getTaskThread,
  handleAuthError
);

router.post(
  "/tasks/:taskId/thread/messages",
  requireSignin,
  sendThreadMessage,
  handleAuthError
);

router.get(
  "/tasks/:taskId/thread/messages",
  requireSignin,
  getThreadMessages,
  handleAuthError
);

export default router;

