import { sendSimpleEmail, sendNotificationEmail } from "./mailService.js";
import Notification from "../models/notification.js";

/**
 * Create a notification
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (notification) => {
  try {
    // Get recipient user data
    const User = (await import("../models/user.js")).default;
    const recipient = await User.findById(notification.recipient);
    
    if (!recipient) {
      console.error("Recipient not found for notification:", notification._id);
      return { success: false, error: "Recipient not found" };
    }

    // Check if user has email notifications enabled for this type
    const emailSettings = recipient.notificationSettings?.email || {};
    const notificationType = notification.type;
    
    let shouldSendEmail = false;
    
    switch (notificationType) {
      case "task_assigned":
        shouldSendEmail = emailSettings.taskAssigned;
        break;
      case "task_due":
        shouldSendEmail = emailSettings.taskDue;
        break;
      case "task_completed":
        shouldSendEmail = emailSettings.taskCompleted;
        break;
      case "comment_added":
        shouldSendEmail = emailSettings.comments;
        break;
      case "mention":
        shouldSendEmail = emailSettings.mentions;
        break;
      case "chat_message":
        shouldSendEmail = emailSettings.chatMessages;
        break;
      case "project_invite":
        shouldSendEmail = emailSettings.projectInvites;
        break;
      case "workspace_invite":
        shouldSendEmail = emailSettings.workspaceInvites;
        break;
      default:
        shouldSendEmail = true; // Default to sending
    }

    if (!shouldSendEmail) {
      console.log("Email notification disabled for user:", recipient.email);
      return { success: true, message: "Email notification disabled" };
    }

    // Use simple email service with environment variables
    const result = await sendSimpleEmail({
      to: recipient.email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TaskFlow Notification</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">${notification.title}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${notification.message}</p>
            ${notification.link ? `<p style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CLIENT_URL}${notification.link}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
            </p>` : ''}
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              This email was sent from TaskFlow Project Management
            </p>
          </div>
        </div>
      `,
      text: notification.message,
    });

    if (result.success) {
      notification.isSent = true;
      notification.sentAt = new Date();
      await notification.save();
    }

    return result;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification with email
 */
export const sendNotification = async (notificationData) => {
  try {
    // Create notification
    const notification = await createNotification(notificationData);
    
    // Send email if recipient is a User (not ClientUser)
    if (notification.recipientModel === "User") {
      await sendEmailNotification(notification);
    }
    
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, limit = 50, skip = 0) => {
  try {
    const notifications = await Notification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("sender", "name email avatar")
      .populate("workspace", "name")
      .populate("project", "name");

    return notifications;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for user
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

export default {
  createNotification,
  sendEmailNotification,
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};