import Notification from "../models/notification.js";
import { sendSimpleEmail } from "./mailService.js";
import {
  sendTaskAssignedEmail,
  sendTaskCompletedEmail,
  sendProjectCreatedEmail,
  sendWorkspaceInvitationEmail,
  sendTaskDeadlineReminder,
  sendCalendarEventEmail,
} from "./emailTemplates.js";

/**
 * Create a notification in the database
 */
export const createNotification = async (notificationData) => {
  try {
    console.log(`\n📬 Creating notification: ${notificationData.type}`);
    console.log(`👤 Recipient: ${notificationData.recipient}`);
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log(`✅ Notification created with ID: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
    throw error;
  }
};

/**
 * Create task-related notification
 */
export const createTaskNotification = async ({
  task,
  recipient,
  sender,
  type,
  workspace,
  project,
  customMessage,
}) => {
  try {
    console.log(`\n📋 Creating task notification: ${type}`);
    console.log(`📌 Task: ${task.title || task.taskKey}`);
    
    const messages = {
      task_assigned: `You have been assigned to task: ${task.title}`,
      task_updated: `Task has been updated: ${task.title}`,
      task_completed: `Task has been completed: ${task.title}`,
      task_due: `Task is due soon: ${task.title}`,
      comment_added: `New comment on task: ${task.title}`,
      mention: `You were mentioned in task: ${task.title}`,
    };
    
    const notificationData = {
      recipient,
      recipientModel: "User",
      sender,
      senderModel: "User",
      type,
      title: `Task: ${task.title}`,
      message: customMessage || messages[type] || "Task notification",
      link: `/workspaces/${workspace}/projects/${project}/tasks/${task._id}`,
      relatedTo: {
        model: "Task",
        id: task._id,
      },
      workspace,
      project,
    };
    
    const notification = await createNotification(notificationData);
    console.log(`✅ Task notification created successfully`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating task notification:", error.message);
    throw error;
  }
};

/**
 * Create project-related notification
 */
export const createProjectNotification = async ({
  project,
  recipient,
  sender,
  type,
  workspace,
  customMessage,
}) => {
  try {
    console.log(`\n📁 Creating project notification: ${type}`);
    console.log(`📂 Project: ${project.name}`);
    
    const messages = {
      project_invite: `You have been invited to project: ${project.name}`,
      project_updated: `Project has been updated: ${project.name}`,
      document_shared: `A document has been shared in project: ${project.name}`,
      file_uploaded: `A file has been uploaded to project: ${project.name}`,
    };
    
    const notificationData = {
      recipient,
      recipientModel: "User",
      sender,
      senderModel: "User",
      type,
      title: `Project: ${project.name}`,
      message: customMessage || messages[type] || "Project notification",
      link: `/workspaces/${workspace}/projects/${project._id}`,
      relatedTo: {
        model: "Project",
        id: project._id,
      },
      workspace,
      project: project._id,
    };
    
    const notification = await createNotification(notificationData);
    console.log(`✅ Project notification created successfully`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating project notification:", error.message);
    throw error;
  }
};

/**
 * Create workspace-related notification
 */
export const createWorkspaceNotification = async ({
  workspace,
  recipient,
  sender,
  type,
  customMessage,
}) => {
  try {
    console.log(`\n🏢 Creating workspace notification: ${type}`);
    console.log(`🏢 Workspace: ${workspace.name || workspace._id}`);
    
    const messages = {
      workspace_invite: `You have been invited to workspace: ${workspace.name}`,
      workspace_updated: `Workspace has been updated: ${workspace.name}`,
    };
    
    const notificationData = {
      recipient,
      recipientModel: "User",
      sender,
      senderModel: "User",
      type,
      title: `Workspace: ${workspace.name}`,
      message: customMessage || messages[type] || "Workspace notification",
      link: `/workspaces/${workspace._id}`,
      relatedTo: {
        model: "Workspace",
        id: workspace._id,
      },
      workspace: workspace._id,
    };
    
    const notification = await createNotification(notificationData);
    console.log(`✅ Workspace notification created successfully`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating workspace notification:", error.message);
    throw error;
  }
};

/**
 * Create calendar-related notification
 */
export const createCalendarNotification = async ({
  event,
  recipient,
  sender,
  type,
  workspace,
  customMessage,
}) => {
  try {
    console.log(`\n📅 Creating calendar notification: ${type}`);
    console.log(`📅 Event: ${event.title}`);
    
    const messages = {
      event_created: `New event: ${event.title}`,
      event_updated: `Event updated: ${event.title}`,
      event_reminder: `Event reminder: ${event.title} starts soon`,
      event_cancelled: `Event cancelled: ${event.title}`,
    };
    
    const notificationData = {
      recipient,
      recipientModel: "User",
      sender,
      senderModel: "User",
      type: "chat_message", // Using existing type, can add event types to model later
      title: `Event: ${event.title}`,
      message: customMessage || messages[type] || "Calendar notification",
      link: `/workspaces/${workspace}/calendar/events/${event._id}`,
      relatedTo: {
        model: "CalendarEvent",
        id: event._id,
      },
      workspace,
    };
    
    const notification = await createNotification(notificationData);
    console.log(`✅ Calendar notification created successfully`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating calendar notification:", error.message);
    throw error;
  }
};

/**
 * Send bulk notifications to multiple users
 */
export const sendBulkNotifications = async (recipients, notificationTemplate) => {
  try {
    console.log(`\n📢 Sending bulk notifications to ${recipients.length} recipients`);
    
    const notifications = await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          ...notificationTemplate,
          recipient,
        })
      )
    );
    
    console.log(`✅ ${notifications.length} bulk notifications created successfully`);
    return notifications;
  } catch (error) {
    console.error("❌ Error sending bulk notifications:", error.message);
    throw error;
  }
};

/**
 * Schedule a notification for future delivery
 * Note: This creates the notification immediately but marks it for future processing
 */
export const scheduleNotification = async (notificationData, scheduleDate) => {
  try {
    console.log(`\n⏰ Scheduling notification for: ${scheduleDate}`);
    
    // Add scheduled metadata
    const scheduledNotification = {
      ...notificationData,
      metadata: {
        ...(notificationData.metadata || {}),
        scheduled: true,
        scheduledFor: scheduleDate,
        processed: false,
      },
    };
    
    const notification = await createNotification(scheduledNotification);
    console.log(`✅ Notification scheduled with ID: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error("❌ Error scheduling notification:", error.message);
    throw error;
  }
};

/**
 * Clean up old notifications (older than specified days)
 */
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    console.log(`\n🧹 Cleaning up notifications older than ${daysOld} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error cleaning up notifications:", error.message);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    console.log(`\n👁️ Marking notification as read: ${notificationId}`);
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    console.log(`✅ Notification marked as read`);
    return notification;
  } catch (error) {
    console.error("❌ Error marking notification as read:", error.message);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    console.log(`\n👁️ Marking all notifications as read for user: ${userId}`);
    
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
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    return result.modifiedCount;
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error.message);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    console.log(`\n📊 Getting unread notification count for user: ${userId}`);
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    
    console.log(`✅ User has ${count} unread notifications`);
    return count;
  } catch (error) {
    console.error("❌ Error getting unread notification count:", error.message);
    throw error;
  }
};

/**
 * Notify task assignees
 */
export const notifyTaskAssignees = async ({ task, project, workspace, assignedBy, assignees }) => {
  try {
    console.log(`\n📬 Notifying ${assignees.length} task assignees`);
    
    const notifications = await Promise.all(
      assignees.map(async (assignee) => {
        // Create in-app notification
        const notification = await createTaskNotification({
          task,
          recipient: assignee._id,
          sender: assignedBy._id,
          type: "task_assigned",
          workspace: workspace._id,
          project: project._id,
        });
        
        // Send email notification
        try {
          await sendTaskAssignedEmail({
            task,
            project,
            workspace,
            assignedBy,
            assignee,
          });
        } catch (emailError) {
          console.error(`⚠️ Failed to send email to ${assignee.email}:`, emailError.message);
        }
        
        return notification;
      })
    );
    
    console.log(`✅ Notified ${notifications.length} assignees successfully`);
    return notifications;
  } catch (error) {
    console.error("❌ Error notifying task assignees:", error.message);
    throw error;
  }
};

/**
 * Send task deadline reminders
 */
export const sendTaskDeadlineReminders = async () => {
  try {
    console.log(`\n⏰ Checking for tasks with upcoming deadlines`);
    
    const Task = (await import("../models/task.js")).default;
    const TaskAssignment = (await import("../models/taskAssignment.js")).default;
    const Project = (await import("../models/project.js")).default;
    const Workspace = (await import("../models/workspace.js")).default;
    const User = (await import("../models/user.js")).default;
    
    // Find tasks due in 24 hours and 1 hour
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    
    const upcomingTasks = await Task.find({
      dueDate: {
        $gte: now,
        $lte: in24Hours,
      },
      status: { $nin: ["done", "completed", "cancelled"] },
      isArchived: false,
    })
      .populate("project")
      .populate("createdBy");
    
    console.log(`📊 Found ${upcomingTasks.length} tasks with upcoming deadlines`);
    
    for (const task of upcomingTasks) {
      try {
        // Get task assignments
        const assignments = await TaskAssignment.find({
          task: task._id,
          role: "assignee",
        }).populate("user");
        
        const workspace = await Workspace.findById(task.project.workspace);
        
        // Send reminders to assignees
        for (const assignment of assignments) {
          await sendTaskDeadlineReminder({
            task,
            project: task.project,
            workspace,
            assignee: assignment.user,
          });
          
          // Create notification
          await createTaskNotification({
            task,
            recipient: assignment.user._id,
            sender: task.createdBy._id,
            type: "task_due",
            workspace: workspace._id,
            project: task.project._id,
          });
        }
        
        console.log(`✅ Sent reminders for task: ${task.title}`);
      } catch (error) {
        console.error(`❌ Error sending reminder for task ${task._id}:`, error.message);
      }
    }
    
    console.log(`✅ Deadline reminder check completed`);
  } catch (error) {
    console.error("❌ Error sending task deadline reminders:", error.message);
    throw error;
  }
};

console.log("✅ Notification helpers initialized");

export default {
  createNotification,
  createTaskNotification,
  createProjectNotification,
  createWorkspaceNotification,
  createCalendarNotification,
  sendBulkNotifications,
  scheduleNotification,
  cleanupOldNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  notifyTaskAssignees,
  sendTaskDeadlineReminders,
};

