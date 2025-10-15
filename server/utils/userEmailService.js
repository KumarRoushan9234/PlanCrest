import nodemailer from "nodemailer";

/**
 * Create email transporter based on user's email configuration
 * @param {Object} emailConfig - User's email configuration
 * @returns {Object} nodemailer transporter
 */
export const createTransporter = (emailConfig) => {
  if (!emailConfig || !emailConfig.isConfigured) {
    throw new Error("Email configuration not set up");
  }

  let transportConfig = {
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  };

  // Configure based on service
  switch (emailConfig.service) {
    case "gmail":
      transportConfig.service = "gmail";
      break;
    
    case "outlook":
      transportConfig.service = "outlook";
      break;
    
    case "zoho":
      transportConfig.host = "smtp.zoho.com";
      transportConfig.port = emailConfig.port || 465;
      transportConfig.secure = emailConfig.secure !== false;
      break;
    
    case "custom":
      transportConfig.host = emailConfig.host;
      transportConfig.port = emailConfig.port || 587;
      transportConfig.secure = emailConfig.secure || false;
      break;
    
    default:
      throw new Error("Unsupported email service");
  }

  return nodemailer.createTransporter(transportConfig);
};

/**
 * Send email using user's configuration
 * @param {Object} user - User object with emailConfig
 * @param {Object} mailOptions - Email options (to, subject, text, html)
 * @returns {Promise} Send result
 */
export const sendEmail = async (user, mailOptions) => {
  try {
    const transporter = createTransporter(user.emailConfig);
    
    const options = {
      from: `${user.name} <${user.emailConfig.user}>`,
      ...mailOptions,
    };

    const result = await transporter.sendMail(options);
    
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Verify email configuration
 * @param {Object} emailConfig - Email configuration to verify
 * @returns {Promise<boolean>} Verification result
 */
export const verifyEmailConfig = async (emailConfig) => {
  try {
    const transporter = createTransporter(emailConfig);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email verification failed:", error);
    return false;
  }
};

/**
 * Example: Send task assignment email
 */
export const sendTaskAssignmentEmail = async (user, task, assignedBy) => {
  const mailOptions = {
    to: user.email,
    subject: `Task Assigned: ${task.title}`,
    html: `
      <h2>New Task Assignment</h2>
      <p>Hello ${user.name},</p>
      <p>${assignedBy.name} has assigned you a new task:</p>
      <h3>${task.title}</h3>
      <p>${task.description || "No description provided"}</p>
      <p>Priority: ${task.priority}</p>
      <p>Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</p>
      <p><a href="${process.env.CLIENT_URL}/projects/${task.project}/tasks/${task._id}">View Task</a></p>
    `,
  };

  return await sendEmail(assignedBy, mailOptions);
};

/**
 * Example: Send project invitation email
 */
export const sendProjectInvitationEmail = async (invitedBy, invitedUser, project) => {
  const mailOptions = {
    to: invitedUser.email,
    subject: `Project Invitation: ${project.name}`,
    html: `
      <h2>Project Invitation</h2>
      <p>Hello ${invitedUser.name},</p>
      <p>${invitedBy.name} has invited you to join the project:</p>
      <h3>${project.name}</h3>
      <p>${project.description || ""}</p>
      <p><a href="${process.env.CLIENT_URL}/projects/${project._id}">View Project</a></p>
    `,
  };

  return await sendEmail(invitedBy, mailOptions);
};

export default {
  createTransporter,
  sendEmail,
  verifyEmailConfig,
  sendTaskAssignmentEmail,
  sendProjectInvitationEmail,
};
