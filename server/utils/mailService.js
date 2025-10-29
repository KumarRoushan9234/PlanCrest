import nodemailer from "nodemailer";

/**
 * Create email transporter based on service configuration
 */
const createTransporter = (config) => {
  let transporterConfig;

  switch (config.service?.toLowerCase()) {
    case "gmail":
      transporterConfig = {
        service: "gmail",
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
        pool: true, // Use pooled connections
        maxConnections: 5,
        maxMessages: 100,
      };
      break;

    case "outlook":
      transporterConfig = {
        service: "hotmail",
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
        pool: true,
        maxConnections: 5,
      };
      break;

    case "yahoo":
      transporterConfig = {
        service: "yahoo",
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
        pool: true,
        maxConnections: 5,
      };
      break;

    case "zoho":
      transporterConfig = {
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      };
      break;

    default:
      throw new Error(`Unsupported email service: ${config.service}`);
  }

  return nodemailer.createTransport(transporterConfig);
};

/**
 * Function to send email using project mail configuration
 */
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

    // Create transporter
    const transporter = createTransporter(mailConfig);

    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError.message);
      throw new Error(`Email configuration error: ${verifyError.message}`);
    }

    // Prepare email content
    const emailOptions = {
      from: {
        name: mailConfig.senderName || "PlanCrest",
        address: mailConfig.email,
      },
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
          <p style="color: #666; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
        </div>
      </div>`;
    }

    // Send email
    const info = await transporter.sendMail(emailOptions);

    console.log("✅ Email sent successfully!");
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);
    console.log("📧 Message ID:", info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("📧 Failed to send to:", to);
    console.error("📧 Subject:", subject);
    
    return {
      success: false,
      error: error.message,
      message: "Failed to send email",
    };
  }
}

/**
 * Function to send test email
 */
export async function sendTestEmail(to, mailConfig) {
  const subject = "PlanCrest - Email Configuration Test";
  const message = `This is a test email to verify that your email configuration is working correctly. If you received this email, your mail settings have been configured successfully and you can now send notifications to your team members.`;

  // Custom HTML template for test emails
  const testEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">PlanCrest Test Email</h1>
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
        This is a test email from PlanCrest Project Management
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
      <h1 style="color: white; margin: 0;">PlanCrest - New Task Assignment</h1>
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
        This email was sent from PlanCrest Project Management
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
      <h1 style="color: white; margin: 0;">PlanCrest - Project Invitation</h1>
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
        This email was sent from PlanCrest Project Management
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
      <h1 style="color: white; margin: 0;">PlanCrest - Workspace Invitation</h1>
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
        This email was sent from PlanCrest Project Management
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
  const subject = `PlanCrest Notification: ${notificationTitle}`;
  const message = notificationMessage;

  const notificationEmailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">PlanCrest Notification</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px;">${notificationTitle}</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
      ${actionUrl ? `<p style="text-align: center; margin: 20px 0;">
        <a href="${actionUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
      </p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        This email was sent from PlanCrest Project Management
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

/**
 * Simple email sender using environment variables
 * Optimized for Gmail with better error handling and connection pooling
 */
export async function sendSimpleEmail({ to, subject, html, text, attachments = [] }) {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing: EMAIL_USER and EMAIL_PASS must be set");
      return { 
        success: false, 
        error: "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables." 
      };
    }

    console.log(`📧 Preparing to send email...`);
    console.log(`📧 Service: ${process.env.EMAIL_SERVICE || 'gmail (default)'}`);
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    let transporterConfig;
    const emailService = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();

    switch (emailService) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true, // Use connection pooling
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000, // Send 1 email per second max
          rateLimit: 1,
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 5,
        };
        break;

      case "yahoo":
        transporterConfig = {
          service: "yahoo",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 5,
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
          },
        };
        break;

      default:
        // Default to Gmail if service is unknown
        console.log("⚠️ Unknown email service, defaulting to Gmail");
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 5,
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection before sending with timeout
    try {
      // Add 10 second timeout for verification
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email verification timeout after 10 seconds')), 10000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log("✅ Email transporter verified successfully");
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError.message);
      // Don't throw - allow sending to continue, but log the error
      console.warn("⚠️ Continuing with email send despite verification failure");
    }

    const mailOptions = {
      from: {
        name: process.env.EMAIL_SENDER_NAME || "PlanCrest",
        address: process.env.EMAIL_USER,
      },
      to,
      subject,
      html,
      text,
      attachments,
    };

    // Add timeout for sending email (30 seconds max)
    const sendPromise = transporter.sendMail(mailOptions);
    const sendTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([sendPromise, sendTimeoutPromise]);
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", result.messageId);
    console.log("📧 Response:", result.response);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("📧 Stack trace:", error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 * Verifies that the email service is properly configured
 */
export async function testEmailConfig() {
  try {
    console.log("🧪 Testing email configuration...");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing");
      return { 
        success: false, 
        error: "EMAIL_USER and EMAIL_PASS environment variables are required" 
      };
    }

    let transporterConfig;
    const emailService = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();

    switch (emailService) {
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

      case "yahoo":
        transporterConfig = {
          service: "yahoo",
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
          },
        };
        break;

      default:
        console.log("⚠️ Unknown email service, defaulting to Gmail");
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
    console.log(`📧 Service: ${emailService}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER}`);
    
    return { 
      success: true,
      service: emailService,
      email: process.env.EMAIL_USER
    };
  } catch (error) {
    console.error("❌ Email configuration test failed:", error.message);
    return { 
      success: false, 
      error: error.message,
      details: "Please check your EMAIL_USER and EMAIL_PASS credentials and ensure less secure app access is enabled for Gmail."
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to, userName) {
  const subject = "Welcome to PlanCrest!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to PlanCrest!</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining PlanCrest! We're excited to have you on board.
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          PlanCrest is your complete project management solution. Here's what you can do:
        </p>
        <ul style="color: #666; line-height: 2;">
          <li>Create and manage workspaces</li>
          <li>Organize projects and tasks</li>
          <li>Collaborate with your team</li>
          <li>Track progress with analytics</li>
          <li>Integrate with your favorite tools</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Get Started</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          This email was sent from PlanCrest Project Management
        </p>
      </div>
    </div>
  `;
  const text = `Welcome to PlanCrest, ${userName}! Thank you for joining us. Start managing your projects at ${process.env.CLIENT_URL || 'http://localhost:5173'}`;

  return await sendSimpleEmail({ to, subject, html, text });
}

/**
 * Send email to workspace owner/admin when someone accepts invitation
 */
export async function sendInvitationAcceptedNotification(to, workspaceName, newMemberName, newMemberEmail) {
  const subject = `${newMemberName} joined ${workspaceName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">New Team Member!</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Great News!</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${newMemberName}</strong> (${newMemberEmail}) has accepted your invitation and joined <strong>${workspaceName}</strong>.
        </p>
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
          <p style="margin: 0; color: #1976d2; font-weight: 500;">
            🎉 Your team is growing!
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/workspace" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Workspace</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          This email was sent from PlanCrest Project Management
        </p>
      </div>
    </div>
  `;
  const text = `${newMemberName} (${newMemberEmail}) has joined ${workspaceName}.`;

  return await sendSimpleEmail({ to, subject, html, text });
}

/**
 * Send email when a new project is created
 */
export async function sendProjectCreatedNotification(to, projectName, workspaceName, creatorName) {
  const subject = `New Project Created: ${projectName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">New Project Created</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Project: ${projectName}</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${creatorName}</strong> has created a new project in <strong>${workspaceName}</strong>.
        </p>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 10px 0;">${projectName}</h3>
          <p style="color: #666; margin: 0;">Workspace: ${workspaceName}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Project</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          This email was sent from PlanCrest Project Management
        </p>
      </div>
    </div>
  `;
  const text = `${creatorName} has created a new project "${projectName}" in ${workspaceName}.`;

  return await sendSimpleEmail({ to, subject, html, text });
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
  sendWelcomeEmail,
  sendInvitationAcceptedNotification,
  sendProjectCreatedNotification,
};