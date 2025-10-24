import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendSimpleEmail } from "./mailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read HTML template file
 */
const readTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
    console.log(`📄 Reading email template: ${templateName}`);
    return fs.readFileSync(templatePath, "utf8");
  } catch (error) {
    console.error(`❌ Error reading template ${templateName}:`, error.message);
    throw new Error(`Template ${templateName} not found`);
  }
};

/**
 * Replace placeholders in template with actual values
 */
const replacePlaceholders = (template, data) => {
  console.log("🔄 Replacing placeholders in template");
  let result = template;
  
  Object.keys(data).forEach((key) => {
    const value = data[key] || "";
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  });
  
  // Handle conditional sections
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
    return data[key] ? content : "";
  });
  
  console.log("✅ Placeholders replaced successfully");
  return result;
};

/**
 * Get priority color based on priority level
 */
const getPriorityColor = (priority) => {
  const colors = {
    high: "#dc3545",
    medium: "#ffc107",
    low: "#28a745",
  };
  return colors[priority] || "#6c757d";
};

/**
 * Format date for email display
 */
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time for email display
 */
const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate time remaining until deadline
 */
const getTimeRemaining = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  
  if (diff < 0) return "Overdue";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return "Less than an hour";
};

/**
 * Send project created email to workspace members
 */
export const sendProjectCreatedEmail = async ({ project, workspace, creator, members }) => {
  try {
    console.log(`\n📧 Sending project created emails for: ${project.name}`);
    console.log(`📊 Total recipients: ${members.length}`);
    
    const template = readTemplate("project-created");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailPromises = members.map(async (member) => {
      const emailData = {
        memberName: member.user?.name || member.name || "Team Member",
        projectName: project.name,
        projectKey: project.key,
        projectDescription: project.description || "No description provided",
        createdBy: creator.name,
        workspaceName: workspace.name,
        projectUrl: `${appUrl}/workspaces/${workspace._id}/projects/${project._id}`,
        year: new Date().getFullYear(),
      };
      
      const html = replacePlaceholders(template, emailData);
      
      console.log(`  ✉️  Sending to: ${member.user?.email || member.email}`);
      
      return sendSimpleEmail({
        to: member.user?.email || member.email,
        subject: `🎉 New Project Created: ${project.name}`,
        html,
      });
    });
    
    await Promise.all(emailPromises);
    console.log(`✅ Project created emails sent successfully to ${members.length} members`);
  } catch (error) {
    console.error("❌ Error sending project created emails:", error.message);
    throw error;
  }
};

/**
 * Send task assigned email to assigned users
 */
export const sendTaskAssignedEmail = async ({ task, project, workspace, assignedBy, assignee }) => {
  try {
    console.log(`\n📧 Sending task assigned email`);
    console.log(`📌 Task: ${task.title}`);
    console.log(`👤 Assignee: ${assignee.name} (${assignee.email})`);
    
    const template = readTemplate("task-assigned");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      assigneeName: assignee.name,
      assignedBy: assignedBy.name,
      projectName: project.name,
      taskTitle: task.title,
      taskDescription: task.description || "No description provided",
      taskKey: task.taskKey,
      priority: task.priority || "medium",
      priorityColor: getPriorityColor(task.priority),
      dueDate: task.dueDate ? formatDate(task.dueDate) : null,
      status: task.status,
      workspaceName: workspace.name,
      taskUrl: `${appUrl}/workspaces/${workspace._id}/projects/${project._id}/tasks/${task._id}`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: assignee.email,
      subject: `✅ New Task Assigned: ${task.title}`,
      html,
    });
    
    console.log(`✅ Task assigned email sent successfully to ${assignee.email}`);
  } catch (error) {
    console.error("❌ Error sending task assigned email:", error.message);
    throw error;
  }
};

/**
 * Send workspace invitation email
 */
export const sendWorkspaceInvitationEmail = async ({ workspace, invitedBy, inviteeEmail, role, token, expiresIn }) => {
  try {
    console.log(`\n📧 Sending workspace invitation email`);
    console.log(`🏢 Workspace: ${workspace.name}`);
    console.log(`📧 Invitee: ${inviteeEmail}`);
    console.log(`👤 Role: ${role}`);
    
    const template = readTemplate("workspace-invitation");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      workspaceName: workspace.name,
      workspaceDescription: workspace.description || "",
      invitedBy: invitedBy.name,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      inviteeEmail,
      acceptUrl: `${appUrl}/invitations/${token}?action=accept`,
      declineUrl: `${appUrl}/invitations/${token}?action=decline`,
      expiresIn: expiresIn || 7,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: inviteeEmail,
      subject: `🎊 You're Invited to Join ${workspace.name} on PlanCrest`,
      html,
    });
    
    console.log(`✅ Workspace invitation sent successfully to ${inviteeEmail}`);
  } catch (error) {
    console.error("❌ Error sending workspace invitation email:", error.message);
    throw error;
  }
};

/**
 * Send invitation accepted email to workspace owner
 */
export const sendInvitationAcceptedEmail = async ({ workspace, owner, newMember, role }) => {
  try {
    console.log(`\n📧 Sending invitation accepted email to workspace owner`);
    console.log(`👤 Owner: ${owner.name} (${owner.email})`);
    console.log(`✅ New member: ${newMember.name}`);
    
    const template = readTemplate("invitation-accepted");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      ownerName: owner.name,
      memberName: newMember.name,
      memberEmail: newMember.email,
      workspaceName: workspace.name,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      joinedDate: formatDate(new Date()),
      workspaceUrl: `${appUrl}/workspaces/${workspace._id}`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: owner.email,
      subject: `🎉 ${newMember.name} Accepted Your Invitation to ${workspace.name}`,
      html,
    });
    
    console.log(`✅ Invitation accepted email sent successfully to ${owner.email}`);
  } catch (error) {
    console.error("❌ Error sending invitation accepted email:", error.message);
    throw error;
  }
};

/**
 * Send task deadline reminder email
 */
export const sendTaskDeadlineReminder = async ({ task, project, workspace, assignee }) => {
  try {
    console.log(`\n📧 Sending task deadline reminder`);
    console.log(`📌 Task: ${task.title}`);
    console.log(`⏰ Due: ${task.dueDate}`);
    console.log(`👤 Assignee: ${assignee.name} (${assignee.email})`);
    
    const template = readTemplate("task-deadline-reminder");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      assigneeName: assignee.name,
      taskTitle: task.title,
      taskDescription: task.description || "No description provided",
      taskKey: task.taskKey,
      projectName: project.name,
      dueDate: formatDate(task.dueDate),
      dueDateFormatted: formatDate(task.dueDate),
      timeRemaining: getTimeRemaining(task.dueDate),
      status: task.status,
      workspaceName: workspace.name,
      taskUrl: `${appUrl}/workspaces/${workspace._id}/projects/${project._id}/tasks/${task._id}`,
      notificationSettingsUrl: `${appUrl}/settings/notifications`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: assignee.email,
      subject: `⏰ Task Deadline Reminder: ${task.title}`,
      html,
    });
    
    console.log(`✅ Task deadline reminder sent successfully to ${assignee.email}`);
  } catch (error) {
    console.error("❌ Error sending task deadline reminder:", error.message);
    throw error;
  }
};

/**
 * Send task completed email
 */
export const sendTaskCompletedEmail = async ({ task, project, workspace, completedBy, recipient }) => {
  try {
    console.log(`\n📧 Sending task completed email`);
    console.log(`📌 Task: ${task.title}`);
    console.log(`✅ Completed by: ${completedBy.name}`);
    console.log(`👤 Recipient: ${recipient.name} (${recipient.email})`);
    
    const template = readTemplate("task-completed");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      recipientName: recipient.name,
      completedBy: completedBy.name,
      taskTitle: task.title,
      taskKey: task.taskKey,
      projectName: project.name,
      completedDate: formatDate(task.completedAt || new Date()),
      workspaceName: workspace.name,
      taskUrl: `${appUrl}/workspaces/${workspace._id}/projects/${project._id}/tasks/${task._id}`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: recipient.email,
      subject: `✅ Task Completed: ${task.title}`,
      html,
    });
    
    console.log(`✅ Task completed email sent successfully to ${recipient.email}`);
  } catch (error) {
    console.error("❌ Error sending task completed email:", error.message);
    throw error;
  }
};

/**
 * Send calendar event email
 */
export const sendCalendarEventEmail = async ({ event, workspace, attendee, creator }) => {
  try {
    console.log(`\n📧 Sending calendar event email`);
    console.log(`📅 Event: ${event.title}`);
    console.log(`👤 Attendee: ${attendee.name} (${attendee.email})`);
    
    const template = readTemplate("calendar-event-created");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const attendeesList = event.attendees
      ?.map((a) => a.user?.name || a.name)
      .join(", ");
    
    const emailData = {
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDescription: event.description || "",
      createdBy: creator.name,
      startDate: formatDate(event.startDate),
      startTime: formatTime(event.startDate),
      endTime: formatTime(event.endDate),
      timezone: event.timezone || "UTC",
      location: event.location || null,
      meetingLink: event.meetingLink || null,
      attendees: attendeesList,
      recurring: event.recurring?.enabled,
      recurringPattern: event.recurring?.frequency || "",
      eventUrl: `${appUrl}/workspaces/${workspace._id}/calendar/events/${event._id}`,
      calendarUrl: `${appUrl}/workspaces/${workspace._id}/calendar`,
      notificationSettingsUrl: `${appUrl}/settings/notifications`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: attendee.email,
      subject: `📅 New Event: ${event.title}`,
      html,
    });
    
    console.log(`✅ Calendar event email sent successfully to ${attendee.email}`);
  } catch (error) {
    console.error("❌ Error sending calendar event email:", error.message);
    throw error;
  }
};

/**
 * Send event reminder email
 */
export const sendEventReminderEmail = async ({ event, workspace, attendee }) => {
  try {
    console.log(`\n📧 Sending event reminder`);
    console.log(`📅 Event: ${event.title}`);
    console.log(`👤 Attendee: ${attendee.name} (${attendee.email})`);
    
    // Use the same template as calendar-event-created for reminders
    const template = readTemplate("calendar-event-created");
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    
    const emailData = {
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDescription: event.description || "",
      createdBy: "Event Reminder",
      startDate: formatDate(event.startDate),
      startTime: formatTime(event.startDate),
      endTime: formatTime(event.endDate),
      timezone: event.timezone || "UTC",
      location: event.location || null,
      meetingLink: event.meetingLink || null,
      eventUrl: `${appUrl}/workspaces/${workspace._id}/calendar/events/${event._id}`,
      calendarUrl: `${appUrl}/workspaces/${workspace._id}/calendar`,
      notificationSettingsUrl: `${appUrl}/settings/notifications`,
      year: new Date().getFullYear(),
    };
    
    const html = replacePlaceholders(template, emailData);
    
    await sendSimpleEmail({
      to: attendee.email,
      subject: `⏰ Reminder: ${event.title} - Starting Soon`,
      html,
    });
    
    console.log(`✅ Event reminder sent successfully to ${attendee.email}`);
  } catch (error) {
    console.error("❌ Error sending event reminder:", error.message);
    throw error;
  }
};

/**
 * Send activity notification email
 */
export const sendActivityNotification = async ({ activity, user, workspace }) => {
  try {
    console.log(`\n📧 Sending activity notification`);
    console.log(`📊 Activity: ${activity.action}`);
    console.log(`👤 User: ${user.name} (${user.email})`);
    
    // For now, use a simple text email for activity notifications
    // Can create a dedicated template later
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const activityUrl = `${appUrl}/workspaces/${workspace._id}/activity`;
    
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Activity in ${workspace.name}</h2>
        <p>Hi ${user.name},</p>
        <p>A new activity was recorded:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p><strong>Action:</strong> ${activity.action}</p>
          <p><strong>Type:</strong> ${activity.targetType}</p>
          <p><strong>By:</strong> ${activity.actor?.name || "System"}</p>
        </div>
        <p><a href="${activityUrl}">View Activity Log</a></p>
      </div>
    `;
    
    await sendSimpleEmail({
      to: user.email,
      subject: `📊 New Activity in ${workspace.name}`,
      html,
    });
    
    console.log(`✅ Activity notification sent successfully to ${user.email}`);
  } catch (error) {
    console.error("❌ Error sending activity notification:", error.message);
    throw error;
  }
};

console.log("✅ Email templates utility initialized");

export default {
  sendProjectCreatedEmail,
  sendTaskAssignedEmail,
  sendWorkspaceInvitationEmail,
  sendInvitationAcceptedEmail,
  sendTaskDeadlineReminder,
  sendTaskCompletedEmail,
  sendCalendarEventEmail,
  sendEventReminderEmail,
  sendActivityNotification,
};

