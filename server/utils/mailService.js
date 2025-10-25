import nodemailer from "nodemailer";

// Function to send email using project mail configuration
export async function sendEmail(
  to,
  subject,
  message,
  mailConfig,
  options = {}
) {
  try {
    if (
      !mailConfig ||
      !mailConfig.email ||
      !mailConfig.appPassword ||
      !mailConfig.service
    ) {
      throw new Error("Mail configuration is incomplete");
    }

    let transporterConfig;

    switch (mailConfig.service.toLowerCase()) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: mailConfig.email,
            pass: mailConfig.appPassword,
          },
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: mailConfig.email,
            pass: mailConfig.appPassword,
          },
        };
        break;

      case "yahoo":
        transporterConfig = {
          service: "yahoo",
          auth: {
            user: mailConfig.email,
            pass: mailConfig.appPassword,
          },
        };
        break;

      case "zoho":
        transporterConfig = {
          host: "smtp.zoho.in",
          port: 587,
          secure: false,
          auth: {
            user: mailConfig.email,
            pass: mailConfig.appPassword,
          },
        };
        break;

      default:
        throw new Error(`Unsupported email service: ${mailConfig.service}`);
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection configuration
    await transporter.verify();

    // Prepare email content
    const emailOptions = {
      from: mailConfig.email,
      to: to,
      subject: subject,
      text: message,
      ...options, // Allow overriding any options
    };

    // Add HTML content if not provided
    if (!emailOptions.html && options.html === undefined) {
      // Default HTML template - can be overridden
      emailOptions.html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="color: #666; line-height: 1.6;">${message}</p>
        </div>
      </div>`;
    }

    // Send email
    const info = await transporter.sendMail(emailOptions);

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to send email",
    };
  }
}

// Function to send test email
export async function sendTestEmail(to, mailConfig) {
  const subject = "TaskFlow - Email Configuration Test";
  const message = `This is a test email to verify that your email configuration is working correctly. If you received this email, your mail settings have been configured successfully and you can now send notifications to your team members.`;

  // Custom HTML template for test emails
  const testEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">TaskFlow Test Email</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">Email Configuration Test</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <p style="margin: 0; color: #1976d2; font-weight: 500;">
          ✅ Your email configuration is working correctly!
        </p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This is a test email from TaskFlow Project Management
      </p>
    </div>
  </div>`;

  return await sendEmail(to, subject, message, mailConfig, {
    html: testEmailHtml,
  });
}

// Function to send task assignment email
export async function sendTaskAssignmentEmail(
  to,
  taskTitle,
  assignedBy,
  mailConfig,
  taskUrl = null
) {
  const subject = `Task Assigned: ${taskTitle}`;
  const message = `${assignedBy} has assigned you a new task: ${taskTitle}`;

  const taskEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">TaskFlow - New Task Assignment</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">New Task Assigned</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
        <strong>${assignedBy}</strong> has assigned you a new task:
      </p>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">${taskTitle}</h3>
      </div>
      ${taskUrl ? `<p style="text-align: center; margin: 20px 0;">
        <a href="${taskUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a>
      </p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This email was sent from TaskFlow Project Management
      </p>
    </div>
  </div>`;

  return await sendEmail(to, subject, message, mailConfig, {
    html: taskEmailHtml,
  });
}

// Function to send project invitation email
export async function sendProjectInvitationEmail(
  to,
  projectName,
  invitedBy,
  mailConfig,
  projectUrl = null
) {
  const subject = `Project Invitation: ${projectName}`;
  const message = `${invitedBy} has invited you to join the project: ${projectName}`;

  const projectEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">TaskFlow - Project Invitation</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">You're Invited to a Project</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
        <strong>${invitedBy}</strong> has invited you to join the project:
      </p>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">${projectName}</h3>
      </div>
      ${projectUrl ? `<p style="text-align: center; margin: 20px 0;">
        <a href="${projectUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Project</a>
      </p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This email was sent from TaskFlow Project Management
      </p>
    </div>
  </div>`;

  return await sendEmail(to, subject, message, mailConfig, {
    html: projectEmailHtml,
  });
}

// Function to send workspace invitation email
export async function sendWorkspaceInvitationEmail(
  to,
  workspaceName,
  invitedBy,
  mailConfig,
  invitationUrl = null
) {
  const subject = `Workspace Invitation: ${workspaceName}`;
  const message = `${invitedBy} has invited you to join the workspace: ${workspaceName}`;

  const workspaceEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">TaskFlow - Workspace Invitation</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">You're Invited to a Workspace</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
        <strong>${invitedBy}</strong> has invited you to join the workspace:
      </p>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">${workspaceName}</h3>
      </div>
      ${invitationUrl ? `<p style="text-align: center; margin: 20px 0;">
        <a href="${invitationUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
      </p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This email was sent from TaskFlow Project Management
      </p>
    </div>
  </div>`;

  return await sendEmail(to, subject, message, mailConfig, {
    html: workspaceEmailHtml,
  });
}

// Function to send notification email
export async function sendNotificationEmail(
  to,
  notificationTitle,
  notificationMessage,
  mailConfig,
  actionUrl = null
) {
  const subject = `TaskFlow Notification: ${notificationTitle}`;
  const message = notificationMessage;

  const notificationEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">TaskFlow Notification</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">${notificationTitle}</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
      ${actionUrl ? `<p style="text-align: center; margin: 20px 0;">
        <a href="${actionUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
      </p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This email was sent from TaskFlow Project Management
      </p>
    </div>
  </div>`;

  return await sendEmail(to, subject, message, mailConfig, {
    html: notificationEmailHtml,
  });
}

// Function to send custom email with full control over HTML
export async function sendCustomEmail(
  to,
  subject,
  message,
  mailConfig,
  customHtml = null
) {
  const options = {};

  if (customHtml) {
    options.html = customHtml;
  }

  return await sendEmail(to, subject, message, mailConfig, options);
}

// Simple email sender using environment variables
export async function sendSimpleEmail({ to, subject, html, text }) {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing: EMAIL_USER and EMAIL_PASS must be set");
      return { 
        success: false, 
        error: "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables." 
      };
    }

    console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE}`);
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`📧 Email Pass: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-3) : 'NOT SET'}`);

    let transporterConfig;

    switch (process.env.EMAIL_SERVICE) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "zoho":
        transporterConfig = {
          host: "smtp.zoho.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        };
        break;

      default:
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection before sending
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.messageId);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending simple email:", error.message);
    return { success: false, error: error.message };
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    console.log("🧪 Testing email configuration...");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing");
      return { success: false, error: "Email configuration missing" };
    }

    let transporterConfig;

    switch (process.env.EMAIL_SERVICE) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "zoho":
        transporterConfig = {
          host: "smtp.zoho.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        };
        break;

      default:
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Test connection
    await transporter.verify();
    console.log("✅ Email configuration is valid!");
    return { success: true };
  } catch (error) {
    console.error("❌ Email configuration test failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Export all functions as default
export default {
  sendEmail,
  sendTestEmail,
  sendTaskAssignmentEmail,
  sendProjectInvitationEmail,
  sendWorkspaceInvitationEmail,
  sendNotificationEmail,
  sendCustomEmail,
  sendSimpleEmail,
  testEmailConfig,
};