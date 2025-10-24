import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotificationHandler,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notifications.js";
import { requireAuth } from "../middlewares/index.js";

const router = express.Router();

console.log("🔔 Initializing notification routes");

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @access  Private
 */
router.get("/notifications", getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get("/notifications/unread-count", getUnreadCount);

/**
 * @route   GET /api/notifications/settings
 * @desc    Get user notification settings
 * @access  Private
 */
router.get("/notifications/settings", getNotificationSettings);

/**
 * @route   PUT /api/notifications/settings
 * @desc    Update user notification settings
 * @access  Private
 */
router.put("/notifications/settings", updateNotificationSettings);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/notifications/read-all", markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
router.put("/notifications/:id/read", markAsRead);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification (admin/system use)
 * @access  Private
 */
router.post("/notifications", createNotificationHandler);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete("/notifications/:id", deleteNotification);

console.log("✅ Notification routes initialized successfully");

export default router;

