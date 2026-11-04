import Notification from "../models/notification.js";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  createNotification,
} from "../utils/notificationHelpers.js";

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { page = 1, limit = 20, isRead, type } = req.query;

    console.log(`\n📬 Fetching notifications for user: ${userId}`);
    console.log(`📄 Page: ${page}, Limit: ${limit}`);

    const query = { recipient: userId };

    // Filter by read status
    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    console.log(`✅ Found ${notifications.length} notifications (${total} total)`);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user notifications:", error.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    console.log(`\n👁️ Marking notification as read: ${id}`);

    // Verify notification belongs to user
    const notification = await Notification.findOne({ _id: id, recipient: userId });

    if (!notification) {
      console.log(`⚠️ Notification not found or unauthorized`);
      return res.status(404).json({ error: "Notification not found" });
    }

    const updatedNotification = await markNotificationAsRead(id);

    console.log(`✅ Notification marked as read successfully`);

    res.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error.message);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.auth._id;

    console.log(`\n👁️ Marking all notifications as read for user: ${userId}`);

    const count = await markAllNotificationsAsRead(userId);

    console.log(`✅ Marked ${count} notifications as read`);

    res.json({
      success: true,
      data: { count },
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error.message);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.auth._id;
    const count = await getUnreadNotificationCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

/**
 * Create a notification (admin/system use)
 * POST /api/notifications
 */
export const createNotificationHandler = async (req, res) => {
  try {
    const { recipient, type, title, message, link, relatedTo, workspace, project } = req.body;
    const sender = req.auth._id;

    console.log(`\n📬 Creating notification`);
    console.log(`📌 Type: ${type}`);
    console.log(`👤 Recipient: ${recipient}`);

    if (!recipient || !type || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const notificationData = {
      recipient,
      recipientModel: "User",
      sender,
      senderModel: "User",
      type,
      title: title || "Notification",
      message,
      link,
      relatedTo,
      workspace,
      project,
    };

    const notification = await createNotification(notificationData);

    console.log(`✅ Notification created with ID: ${notification._id}`);

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    console.log(`\n🗑️ Deleting notification: ${id}`);

    // Verify notification belongs to user
    const notification = await Notification.findOne({ _id: id, recipient: userId });

    if (!notification) {
      console.log(`⚠️ Notification not found or unauthorized`);
      return res.status(404).json({ error: "Notification not found" });
    }

    await Notification.findByIdAndDelete(id);

    console.log(`✅ Notification deleted successfully`);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting notification:", error.message);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

/**
 * Get notification settings for user
 * GET /api/notifications/settings
 */
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.auth._id;

    console.log(`\n⚙️ Getting notification settings for user: ${userId}`);

    const User = (await import("../models/user.js")).default;
    const user = await User.findById(userId).select("notificationSettings");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Default settings if not set
    const defaultSettings = {
      email: {
        taskAssigned: true,
        taskCompleted: true,
        projectInvite: true,
        workspaceInvite: true,
        deadlineReminder: true,
        eventReminder: true,
      },
      push: {
        taskAssigned: true,
        taskCompleted: false,
        projectInvite: true,
        workspaceInvite: true,
        deadlineReminder: true,
        eventReminder: true,
      },
      inApp: {
        taskAssigned: true,
        taskCompleted: true,
        projectInvite: true,
        workspaceInvite: true,
        deadlineReminder: true,
        eventReminder: true,
        chatMessage: true,
        mention: true,
      },
    };

    const settings = user.notificationSettings || defaultSettings;

    console.log(`✅ Notification settings retrieved`);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("❌ Error getting notification settings:", error.message);
    res.status(500).json({ error: "Failed to get notification settings" });
  }
};

/**
 * Update notification settings
 * PUT /api/notifications/settings
 */
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { email, push, inApp } = req.body;

    console.log(`\n⚙️ Updating notification settings for user: ${userId}`);

    const User = (await import("../models/user.js")).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update settings
    user.notificationSettings = {
      email: email || user.notificationSettings?.email,
      push: push || user.notificationSettings?.push,
      inApp: inApp || user.notificationSettings?.inApp,
    };

    await user.save();

    console.log(`✅ Notification settings updated successfully`);

    res.json({
      success: true,
      data: user.notificationSettings,
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating notification settings:", error.message);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
};

console.log("✅ Notification controller initialized");

export default {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotificationHandler,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
};

