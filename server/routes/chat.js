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
} from "../controllers/chat/index.js";

import { requireSignin, handleAuthError } from "../middlewares/index.js";
import sseManager from "../utils/sseManager.js";
import jwt from "jsonwebtoken";

// SSE endpoint for real-time updates
// Note: SSE requires special auth handling since it's a long-lived connection
router.get(
  "/workspaces/:workspaceId/events",
  async (req, res, next) => {
    // Handle auth for SSE - check token from query, header, or cookie
    // EventSource can't send cookies, so we check query param first
    const token = req.query.token || req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = { _id: decoded._id };
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
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
      if (
        data.workspaceId === workspaceId &&
        (data.userId === userId || data.channelMembers?.includes(userId))
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
  },
  handleAuthError
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

