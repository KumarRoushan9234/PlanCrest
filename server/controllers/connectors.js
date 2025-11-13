import {
  Connector,
  User,
  Workspace,
  Project,
  WorkspaceMember,
  ProjectMember,
  Notification,
} from "../models/index.js";
import CalendarEvent from "../models/calendarEvent.js";
import axios from "axios";
import { google } from "googleapis";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { createNotification } from "../utils/notificationHelpers.js";
import { sendSimpleEmail } from "../utils/mailService.js";

// ==================== HELPER FUNCTIONS ====================

const generateStateToken = (userId, scope, scopeId, type) => {
  const state = {
    userId,
    scope,
    scopeId,
    type,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  return Buffer.from(JSON.stringify(state)).toString("base64");
};

const verifyStateToken = (stateToken) => {
  try {
    const decoded = JSON.parse(Buffer.from(stateToken, "base64").toString());
    if (Date.now() - decoded.timestamp > 600000) return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

const createGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

const getGoogleScopes = (connectorType) => {
  const scopeMap = {
    google_calendar: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    google_meet: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    gmail: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    google_drive: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  };
  return scopeMap[connectorType] || [];
};

const checkConnectorPermissions = async (userId, scope, scopeId) => {
  if (scope === "personal") return true;

  if (scope === "workspace") {
    const workspace = await Workspace.findById(scopeId).populate("members");
    const member = workspace?.members?.find(
      (m) => m.user.toString() === userId.toString()
    );
    return member && (member.role === "admin" || member.role === "owner");
  }

  if (scope === "project") {
    const project = await Project.findById(scopeId).populate("members");
    const member = project?.members?.find(
      (m) => m.user.toString() === userId.toString()
    );
    return member && (member.role === "admin" || member.role === "owner");
  }

  return false;
};

const GITHUB_NOTIFICATION_TYPES = {
  pullRequest: "github_pull_request",
  commit: "github_commit",
  issue: "github_issue",
  push: "github_push",
};

const PRIORITY_ROLE_MAP = {
  critical: { workspace: ["owner", "admin"], project: ["admin"] },
  high: { workspace: ["owner", "admin"], project: ["admin", "member"] },
  normal: { workspace: ["owner", "admin", "employee"], project: ["admin", "member"] },
  low: { workspace: ["owner", "admin", "employee"], project: ["admin", "member", "viewer"] },
};

const fetchWorkspaceRecipients = async (workspaceId, roles = []) => {
  if (!workspaceId) return [];

  const query = { workspace: workspaceId, status: "active" };
  if (roles.length) {
    query.role = { $in: roles };
  }

  const members = await WorkspaceMember.find(query).populate("user", "name email");
  return members
    .filter((member) => member.user && member.user.email)
    .map((member) => ({
      userId: member.user._id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
    }));
};

const fetchProjectRecipients = async (projectId, roles = []) => {
  if (!projectId) return [];

  const query = { project: projectId, status: "active" };
  if (roles.length) {
    query.role = { $in: roles };
  }

  const members = await ProjectMember.find(query).populate("user", "name email");
  return members
    .filter((member) => member.user && member.user.email)
    .map((member) => ({
      userId: member.user._id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
    }));
};

const dedupeRecipients = (recipients) => {
  const map = new Map();
  recipients.forEach((recipient) => {
    if (!recipient?.userId) return;
    const key = recipient.userId.toString();
    if (!map.has(key)) {
      map.set(key, recipient);
    }
  });
  return Array.from(map.values());
};

const resolveGitHubRecipients = async ({
  scope,
  userId,
  workspaceId,
  projectId,
  priority = "normal",
}) => {
  const roleConfig = PRIORITY_ROLE_MAP[priority] || PRIORITY_ROLE_MAP.normal;
  const recipients = [];

  if (workspaceId) {
    recipients.push(...(await fetchWorkspaceRecipients(workspaceId, roleConfig.workspace || [])));
  }

  if (projectId) {
    recipients.push(...(await fetchProjectRecipients(projectId, roleConfig.project || [])));
  }

  if (!workspaceId && !projectId) {
    const user = await User.findById(userId).select("name email");
    if (user?.email) {
      recipients.push({
        userId: user._id,
        email: user.email,
        name: user.name,
        role: "owner",
      });
    }
  }

  return dedupeRecipients(recipients);
};

const buildGitHubEmail = ({ title, message, link, metadata }) => {
  const repository = metadata?.repository ? `<p style="color:#6b7280;">Repository: <strong>${metadata.repository}</strong></p>` : "";
  const actor = metadata?.actor ? `<p style="color:#6b7280;">Actor: <strong>${metadata.actor}</strong></p>` : "";
  const branch = metadata?.branch ? `<p style="color:#6b7280;">Branch: <strong>${metadata.branch}</strong></p>` : "";
  const additional = metadata?.details
    ? `<p style="color:#6b7280;">${metadata.details}</p>`
    : "";
  const button = link
    ? `<p style="margin-top:16px;"><a href="${link}" style="background:#111827;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;">View on GitHub</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; padding: 16px; color: #111827;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      <p style="color:#374151; line-height:1.6;">${message}</p>
      ${repository}
      ${actor}
      ${branch}
      ${additional}
      ${button}
    </div>
  `;
};

const dispatchGitHubNotifications = async ({
  scope,
  userId,
  workspaceId,
  projectId,
  notification,
  priority = "normal",
  sendEmail = true,
}) => {
  const recipients = await resolveGitHubRecipients({
    scope,
    userId,
    workspaceId,
    projectId,
    priority,
  });

  if (!recipients.length) {
    return [];
  }

  const emailSubject = notification.emailSubject || notification.title;
  const emailBody =
    notification.emailBody ||
    buildGitHubEmail({
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
    });
  const emailText =
    notification.emailText ||
    `${notification.title}\n${notification.message || ""}\n${notification.link || ""}`.trim();

  const createdNotifications = [];
  const emailPromises = [];

  for (const recipient of recipients) {
    if (
      notification.externalId &&
      (await Notification.findOne({
        externalId: notification.externalId,
        recipient: recipient.userId,
      }))
    ) {
      continue;
    }

    const payload = {
      recipient: recipient.userId,
      recipientModel: "User",
      sender: notification.sender || userId,
      senderModel: "User",
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      workspace: workspaceId,
      project: projectId,
      priority,
      source: notification.source || "github",
      externalId: notification.externalId,
      relatedTo: notification.relatedTo,
      metadata: {
        ...(notification.metadata || {}),
        recipientRole: recipient.role,
      },
    };

    const created = await createNotification(payload);
    createdNotifications.push(created);

    if (sendEmail && recipient.email) {
      emailPromises.push(
        sendSimpleEmail({
          to: recipient.email,
          subject: emailSubject,
          html: emailBody,
          text: emailText,
        }).catch((err) => {
          console.error("Error sending GitHub notification email:", err.message);
        })
      );
    }
  }

  if (emailPromises.length) {
    await Promise.all(emailPromises);
  }

  return createdNotifications;
};

const canManageWorkspaceIntegration = async (workspaceId, userId) => {
  if (!workspaceId) return true;

  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
    status: "active",
  }).select("role");

  return membership && (membership.role === "owner" || membership.role === "admin");
};

const canManageProjectIntegration = async (projectId, userId) => {
  if (!projectId) return true;

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: "active",
  }).select("role");

  return membership && membership.role === "admin";
};

// Unified Google OAuth callback handler
export const unifiedGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }

    console.log(`📍 Unified Google callback - Type: ${stateData.type}`);

    // Route to the appropriate handler based on connector type
    switch (stateData.type) {
      case "google_calendar":
        return await googleCalendarCallbackHandler(req, res, code, stateData);
      case "google_drive":
        return await googleDriveCallbackHandler(req, res, code, stateData);
      case "google_meet":
        return await googleMeetCallbackHandler(req, res, code, stateData);
      case "gmail":
        return await gmailCallbackHandler(req, res, code, stateData);
      default:
        console.error(`Unknown connector type: ${stateData.type}`);
        return res.redirect(`${process.env.CLIENT_URL}/connectors?error=unknown_type`);
    }
  } catch (error) {
    console.error("Error in unified Google callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors?error=true`);
  }
};

const sendOAuthSuccessResponse = (res, redirectPath) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #0a0a0b;
          color: #fff;
        }
        .container {
          text-align: center;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          margin-bottom: 10px;
        }
        p {
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>Successfully Connected!</h1>
        <p>You can close this window now.</p>
      </div>
      <script>
        // Close popup and notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth-success', redirectPath: '${redirectPath}' }, '*');
          setTimeout(() => window.close(), 500);
        } else {
          // Fallback: redirect if not opened as popup
          setTimeout(() => window.location.href = '${process.env.CLIENT_URL}${redirectPath}', 2000);
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
};

// ==================== GENERAL CONNECTOR ENDPOINTS ====================

export const getAllConnectors = async (req, res) => {
  try {
    const { scope, scopeId } = req.query;
    const userId = req.auth._id;

    const query = { user: userId, status: "active" };

    if (scope) {
      query.scope = scope;
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      } else if (scope === "project" && scopeId) {
        query.project = scopeId;
      } else if (scope === "personal") {
        query.$or = [
          { workspace: { $exists: false } },
          { workspace: null },
          { project: { $exists: false } },
          { project: null },
        ];
      }
    }

    const connectors = await Connector.find(query)
      .select("-config.accessToken -config.refreshToken -config.apiKey")
      .sort("-createdAt");

    res.json({ success: true, connectors });
  } catch (error) {
    console.error("Error fetching connectors:", error);
    res.status(500).json({ error: "Failed to fetch connectors" });
  }
};

export const getConnectorById = async (req, res) => {
  try {
    const { connectorId } = req.params;
    const userId = req.auth._id;

    const connector = await Connector.findOne({
      _id: connectorId,
      user: userId,
    }).select("-config.accessToken -config.refreshToken -config.apiKey");

    if (!connector) {
      return res.status(404).json({ error: "Connector not found" });
    }

    res.json({ success: true, connector });
  } catch (error) {
    console.error("Error fetching connector:", error);
    res.status(500).json({ error: "Failed to fetch connector" });
  }
};

export const deleteConnector = async (req, res) => {
  try {
    const { connectorId } = req.params;
    const userId = req.auth._id;

    const connector = await Connector.findOne({
      _id: connectorId,
      user: userId,
    });

    if (!connector) {
      return res.status(404).json({ error: "Connector not found" });
    }

    connector.status = "disconnected";
    await connector.save();

    res.json({ success: true, message: "Connector disconnected" });
  } catch (error) {
    console.error("Error deleting connector:", error);
    res.status(500).json({ error: "Failed to delete connector" });
  }
};

// ==================== GOOGLE CALENDAR ====================

export const connectGoogleCalendar = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    if (!["personal", "workspace", "project"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }

    const hasPermission = await checkConnectorPermissions(userId, scope, scopeId);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const oauth2Client = createGoogleOAuthClient();
    const state = generateStateToken(userId, scope, scopeId, "google_calendar");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: getGoogleScopes("google_calendar"),
      state,
      prompt: "consent",
    });

    res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error initiating Google Calendar OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

// Handler function for Google Calendar OAuth callback
const googleCalendarCallbackHandler = async (req, res, code, stateData) => {
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const connectorData = {
    user: stateData.userId,
    type: "google_calendar",
    scope: stateData.scope,
    name: "Google Calendar",
    status: "active",
    config: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: userInfo.email,
      scopes: getGoogleScopes("google_calendar"),
    },
      metadata: {
        connectedAt: new Date(),
        lastSync: new Date(),
        userInfo: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
        stats: {
          totalSyncs: 0,
          lastSyncStatus: "success",
          errorCount: 0,
        },
      },
      settings: {
        autoSync: true,
        syncDirection: "bidirectional",
        notifications: true,
      },
    };

    if (stateData.scope === "workspace") {
      connectorData.workspace = stateData.scopeId;
    } else if (stateData.scope === "project") {
      connectorData.project = stateData.scopeId;
    }

    const existingConnector = await Connector.findOne({
      user: stateData.userId,
      type: "google_calendar",
      scope: stateData.scope,
      status: "active",
    });

    if (existingConnector) {
      await Connector.findByIdAndUpdate(existingConnector._id, connectorData, { new: true });
    } else {
      await Connector.create(connectorData);
    }

    // Fire-and-forget email to workspace admins/owner
    (async () => {
      try {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const wsId = connectorData.workspace;
        if (!wsId) return;
        const ws = await Workspace.findById(wsId);
        const members = await (await import("../models/workspaceMember.js")).default
          .find({ workspace: wsId, status: "active" })
          .populate("user", "name email");
        const recipients = members
          .filter((m) => ["owner", "admin"].includes(m.role))
          .map((m) => m.user?.email)
          .filter(Boolean);
        const subject = `New Integration Connected: Google Calendar`;
        const html = `
          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
            <h2 style=\"color:#333;\">Integration Connected</h2>
            <p>Google Calendar has been connected to workspace <strong>${ws?.name}</strong>.</p>
            <p><a href=\"${clientUrl}/connectors\" style=\"background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;\">View Integrations</a></p>
          </div>`;
        const { sendSimpleEmail } = await import("../utils/mailService.js");
        await Promise.all(
          recipients.map((to) =>
            sendSimpleEmail({
              to,
              subject,
              html,
              text: `Google Calendar connected to ${ws?.name}. View: ${clientUrl}/connectors`,
            })
          )
        );
      } catch (_) {}
    })();

  sendOAuthSuccessResponse(res, '/connectors/google-calendar');
};

// Export for backward compatibility
export const googleCalendarCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }
    await googleCalendarCallbackHandler(req, res, code, stateData);
  } catch (error) {
    console.error("Error in Google Calendar callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/google-calendar?error=true`);
  }
};

export const syncGoogleCalendar = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    console.log(`🔄 Starting Google Calendar sync for user: ${userId}`);

    const query = {
      user: userId,
      type: "google_calendar",
      scope,
      status: "active",
    };

    if (scope === "workspace") query.workspace = scopeId;
    if (scope === "project") query.project = scopeId;

    const connector = await Connector.findOne(query);

    if (!connector) {
      return res.status(404).json({ error: "Connector not found" });
    }

    // Determine workspace ID
    let workspaceId;
    if (scope === "workspace") {
      workspaceId = scopeId;
    } else if (scope === "project") {
      // For project scope, get workspace from project
      const project = await Project.findById(scopeId).select("workspace");
      if (!project || !project.workspace) {
        return res.status(400).json({ error: "Project workspace not found" });
      }
      workspaceId = project.workspace;
    } else {
      // For personal scope, get user's first workspace
      const workspace = await Workspace.findOne({ 
        members: { $elemMatch: { user: userId } } 
      }).select("_id");
      
      if (!workspace) {
        return res.status(400).json({ 
          error: "No workspace found. Please create or join a workspace first to sync calendar events." 
        });
      }
      workspaceId = workspace._id;
    }

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required for calendar sync" });
    }

    const oauth2Client = createGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: connector.config.accessToken,
      refresh_token: connector.config.refreshToken,
      expiry_date: connector.config.expiryDate,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // STEP 1: Fetch events from Google Calendar
    console.log("📥 Fetching events from Google Calendar...");
    const googleResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const googleEvents = googleResponse.data.items || [];
    console.log(`✅ Found ${googleEvents.length} events in Google Calendar`);

    // STEP 2: Sync Google Calendar events to PlanCrest
    let importedCount = 0;
    let updatedCount = 0;

    for (const gEvent of googleEvents) {
      try {
        // Check if event already exists
        const existing = await CalendarEvent.findOne({
          externalCalendarId: gEvent.id,
          externalProvider: "google",
          workspace: workspaceId,
        });

        const eventData = {
          title: gEvent.summary || "Untitled Event",
          description: gEvent.description || "",
          startDate: gEvent.start?.dateTime || gEvent.start?.date,
          endDate: gEvent.end?.dateTime || gEvent.end?.date,
          location: gEvent.location || "",
          category: "meeting",
          externalCalendarId: gEvent.id,
          externalProvider: "google",
          syncStatus: "synced",
          lastSyncedAt: new Date(),
          workspace: workspaceId,
          createdBy: userId,
          color: "#4285f4", // Google blue
        };

        if (existing) {
          // Update existing event
          await CalendarEvent.findByIdAndUpdate(existing._id, eventData);
          updatedCount++;
        } else {
          // Create new event
          await CalendarEvent.create(eventData);
          importedCount++;
        }
      } catch (eventError) {
        console.error(`❌ Error syncing event ${gEvent.id}:`, eventError.message);
      }
    }

    // STEP 3: Push PlanCrest events to Google Calendar (that aren't already synced)
    console.log("📤 Pushing PlanCrest events to Google Calendar...");
    const planCrestEvents = await CalendarEvent.find({
      workspace: workspaceId,
      syncStatus: "not_synced",
      externalProvider: { $ne: "google" },
      startDate: { $gte: new Date() },
    }).limit(50);

    let exportedCount = 0;

    for (const pEvent of planCrestEvents) {
      try {
        const googleEventData = {
          summary: pEvent.title,
          description: pEvent.description || "",
          location: pEvent.location || "",
          start: {
            dateTime: pEvent.startDate.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: pEvent.endDate.toISOString(),
            timeZone: "UTC",
          },
        };

        const createdEvent = await calendar.events.insert({
          calendarId: "primary",
          resource: googleEventData,
        });

        // Update PlanCrest event with Google Calendar ID
        pEvent.externalCalendarId = createdEvent.data.id;
        pEvent.externalProvider = "google";
        pEvent.syncStatus = "synced";
        pEvent.lastSyncedAt = new Date();
        await pEvent.save();

        exportedCount++;
      } catch (eventError) {
        console.error(`❌ Error exporting event ${pEvent._id}:`, eventError.message);
        pEvent.syncStatus = "failed";
        pEvent.syncError = eventError.message;
        await pEvent.save();
      }
    }

    // Update connector stats
    connector.metadata.lastSync = new Date();
    connector.metadata.stats.totalSyncs += 1;
    connector.metadata.stats.lastSyncStatus = "success";
    await connector.save();

    console.log(`✅ Sync complete: ${importedCount} imported, ${updatedCount} updated, ${exportedCount} exported`);

    res.json({
      success: true,
      stats: {
        imported: importedCount,
        updated: updatedCount,
        exported: exportedCount,
        total: googleEvents.length,
      },
      syncedAt: connector.metadata.lastSync,
    });
  } catch (error) {
    console.error("❌ Error syncing Google Calendar:", error);
    
    // Try to update connector with error status
    try {
      const connector = await Connector.findOne({
        user: req.auth._id,
        type: "google_calendar",
        status: "active",
      });
      if (connector) {
        connector.metadata.stats.lastSyncStatus = "error";
        connector.metadata.stats.errorCount = (connector.metadata.stats.errorCount || 0) + 1;
        await connector.save();
      }
    } catch (updateError) {
      console.error("Failed to update connector error status:", updateError);
    }

    res.status(500).json({ 
      error: "Failed to sync calendar",
      message: error.message 
    });
  }
};

// ==================== GITHUB ====================

export const connectGitHub = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    if (!["personal", "workspace", "project"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }

    // For project scope, require personal GitHub to be connected first
    if (scope === "project") {
      const personalConnector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });

      if (!personalConnector) {
        return res.status(400).json({ 
          error: "Please connect your personal GitHub account first. Project repositories are linked from your personal GitHub account." 
        });
      }

      const allowed = await canManageProjectIntegration(scopeId, userId);
      if (!allowed) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // For project scope, we don't need to connect a new account
      // Just return success - repositories will be selected from personal account
      return res.json({ 
        success: true, 
        message: "Use your personal GitHub account to link repositories to this project",
        usesPersonalAccount: true
      });
    }

    if (scope === "workspace") {
      const allowed = await canManageWorkspaceIntegration(scopeId, userId);
      if (!allowed) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
    }

    const state = generateStateToken(userId, scope, scopeId, "github");

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=repo,user,read:org&state=${state}`;

    res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

export const githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    const octokit = new Octokit({ auth: accessToken });
    const { data: userInfo } = await octokit.users.getAuthenticated();

    const connectorData = {
      user: stateData.userId,
      type: "github",
      scope: stateData.scope,
      name: "GitHub",
      status: "active",
      config: {
        accessToken,
        username: userInfo.login,
      },
      metadata: {
        connectedAt: new Date(),
        lastSync: new Date(),
        userInfo: {
          username: userInfo.login,
          name: userInfo.name,
          email: userInfo.email,
          avatar: userInfo.avatar_url,
        },
        stats: {
          totalSyncs: 0,
          lastSyncStatus: "success",
          errorCount: 0,
        },
      },
    };

    if (stateData.scope === "workspace") {
      connectorData.workspace = stateData.scopeId;
    } else if (stateData.scope === "project") {
      connectorData.project = stateData.scopeId;
    }

    const existingConnectorQuery = {
      user: stateData.userId,
      type: "github",
      scope: stateData.scope,
      status: "active",
    };

    if (stateData.scope === "workspace" && stateData.scopeId) {
      existingConnectorQuery.workspace = stateData.scopeId;
    } else if (stateData.scope === "project" && stateData.scopeId) {
      existingConnectorQuery.project = stateData.scopeId;
    }

    const existingConnector = await Connector.findOne(existingConnectorQuery);

    let connectorRecord;
    if (existingConnector) {
      connectorRecord = await Connector.findByIdAndUpdate(
        existingConnector._id,
        connectorData,
        { new: true }
      );
    } else {
      connectorRecord = await Connector.create(connectorData);
    }

    try {
      const workspaceId = connectorRecord.workspace;
      const projectId = connectorRecord.project;
      const workspaceName = workspaceId
        ? (await Workspace.findById(workspaceId).select("name"))?.name
        : undefined;
      const projectName = projectId
        ? (await Project.findById(projectId).select("name"))?.name
        : undefined;

      await dispatchGitHubNotifications({
        scope: stateData.scope,
        userId: stateData.userId,
        workspaceId,
        projectId,
        priority: "normal",
        notification: {
          type: "integration_connected",
          title: "GitHub integration connected",
          message: `${userInfo.login || "A teammate"} connected GitHub${
            workspaceName ? ` to workspace ${workspaceName}` : ""
          }${projectName ? ` for project ${projectName}` : ""}.`,
          link: "https://github.com",
          source: "github",
          externalId: `github:connector:${connectorRecord._id}:connected`,
          relatedTo: {
            model: "Connector",
            id: connectorRecord._id,
          },
          metadata: {
            provider: "github",
            username: userInfo.login,
            repository: null,
          },
        },
      });
    } catch (notificationError) {
      console.error("Failed to publish GitHub connection notification:", notificationError);
    }

    sendOAuthSuccessResponse(res, '/connectors/github');
  } catch (error) {
    console.error("Error in GitHub callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/github?error=true`);
  }
};

export const getGitHubRepositories = async (req, res) => {
  try {
    const { scope, scopeId } = req.query;
    const userId = req.auth._id;

    let connector;

    // For project scope, always use personal GitHub connector
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });

      if (!connector) {
        return res.status(404).json({ 
          error: "Personal GitHub account not connected. Please connect your personal GitHub account first." 
        });
      }
    } else {
      // For personal and workspace, use the specific connector
      const query = {
        user: userId,
        type: "github",
        status: "active",
      };

      if (scope) {
        query.scope = scope;
      }
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }

      connector = await Connector.findOne(query);

      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    
    try {
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
      });

      const repositories = repos.map((repo) => ({
        id: repo.id,
        nodeId: repo.node_id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        visibility: repo.visibility,
        description: repo.description,
        defaultBranch: repo.default_branch,
        owner: repo.owner?.login,
        htmlUrl: repo.html_url,
        sshUrl: repo.ssh_url,
        pushedAt: repo.pushed_at,
        updatedAt: repo.updated_at,
        language: repo.language,
        permissions: repo.permissions,
        topics: repo.topics,
        size: repo.size,
      }));

      res.json({
        success: true,
        repositories,
        linkedResources: connector.linkedResources || [],
      });
    } catch (apiError) {
      // Handle GitHub API authentication errors
      if (apiError.status === 401 || apiError.message?.includes("Bad credentials")) {
        console.error("GitHub authentication failed - token may be expired or invalid");
        
        // Mark connector as needing re-authentication
        try {
          connector.status = "error";
          connector.metadata = connector.metadata || {};
          connector.metadata.lastError = "Authentication failed. Please reconnect your GitHub account.";
          connector.metadata.lastErrorAt = new Date();
          await connector.save();
        } catch (saveError) {
          console.error("Error updating connector status:", saveError);
        }
        
        return res.status(401).json({ 
          error: "GitHub authentication failed. Please reconnect your GitHub account.",
          requiresReconnect: true
        });
      }
      
      throw apiError; // Re-throw other errors
    }
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
};

export const linkGitHubRepository = async (req, res) => {
  try {
    const userId = req.auth._id;
    const {
      scope,
      scopeId,
      repository,
      workspaceId: targetWorkspaceId,
      projectId: targetProjectId,
    } = req.body;

    if (!repository?.id || !repository?.fullName) {
      return res.status(400).json({ error: "Repository information is required" });
    }

    // For project scope, always use personal GitHub connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });

      if (!connector) {
        return res.status(404).json({ 
          error: "Personal GitHub account not connected. Please connect your personal GitHub account first." 
        });
      }
    } else {
      const connectorQuery = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };

      if (scope === "workspace" && scopeId) {
        connectorQuery.workspace = scopeId;
      }

      connector = await Connector.findOne(connectorQuery);
      if (!connector) {
        return res.status(404).json({ error: "GitHub connector not found" });
      }
    }

    const currentUser = await User.findById(userId).select("name email");

    let workspaceId = connector.workspace ? connector.workspace.toString() : null;
    let projectId = connector.project ? connector.project.toString() : null;

    if (scope === "personal") {
      workspaceId = targetWorkspaceId || workspaceId;
      projectId = targetProjectId || projectId;
    } else if (scope === "workspace") {
      workspaceId = scopeId || workspaceId;
      projectId = targetProjectId || projectId;
    } else if (scope === "project") {
      projectId = scopeId || projectId;
    }

    if (projectId && !workspaceId) {
      const project = await Project.findById(projectId).select("workspace");
      workspaceId = project?.workspace?.toString() || workspaceId;
    }

    if (workspaceId) {
      const allowed = await canManageWorkspaceIntegration(workspaceId, userId);
      if (!allowed) {
        return res.status(403).json({ error: "You do not have permission to link repositories for this workspace" });
      }
    }

    if (projectId) {
      const allowed = await canManageProjectIntegration(projectId, userId);
      if (!allowed) {
        return res.status(403).json({ error: "You do not have permission to link repositories for this project" });
      }
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });

    const [owner, repoName] = repository.fullName.split("/");
    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo: repoName,
    });

    const repositoryId = repoInfo.id.toString();

    connector.linkedResources = connector.linkedResources || [];
    const alreadyLinked = connector.linkedResources.find(
      (linked) =>
        linked.repositoryId === repositoryId &&
        (workspaceId ? linked.workspace?.toString() === workspaceId.toString() : true) &&
        (projectId ? linked.project?.toString() === projectId.toString() : true)
    );

    if (alreadyLinked) {
      return res.json({
        success: true,
        message: "Repository already linked",
        linkedResource: alreadyLinked,
      });
    }

    // For project scope, ensure only one repository is linked
    if (projectId) {
      const existingProjectRepo = connector.linkedResources.find(
        (linked) => linked.project?.toString() === projectId.toString()
      );
      if (existingProjectRepo) {
        return res.status(400).json({
          error: "A project can only have one linked repository. Please unlink the existing repository first.",
        });
      }
    }

    const linkedResource = {
      repositoryId,
      repositoryNodeId: repoInfo.node_id,
      repositoryName: repoInfo.name,
      repositoryFullName: repoInfo.full_name,
      defaultBranch: repoInfo.default_branch,
      scope: connector.scope,
      workspace: workspaceId,
      project: projectId,
      visibility: repoInfo.visibility,
      permissions: repoInfo.permissions,
      topics: repoInfo.topics,
      connectedBy: userId,
      connectedAt: new Date(),
    };

    connector.linkedResources.push(linkedResource);
    await connector.save();

    try {
      const workspaceName = workspaceId
        ? (await Workspace.findById(workspaceId).select("name"))?.name
        : undefined;
      const projectName = projectId
        ? (await Project.findById(projectId).select("name"))?.name
        : undefined;

      await dispatchGitHubNotifications({
        scope: connector.scope,
        userId,
        workspaceId,
        projectId,
        priority: "high",
        notification: {
          type: "integration_event",
          title: `Linked repository: ${repoInfo.full_name}`,
          message: `${currentUser?.name || "A teammate"} linked ${repoInfo.full_name}${
            projectName ? ` to project ${projectName}` : workspaceName ? ` to workspace ${workspaceName}` : ""
          }.`,
          link: repoInfo.html_url,
          source: "github",
          externalId: `github:repo:${repositoryId}:link:${workspaceId || "personal"}:${projectId || "none"}`,
          relatedTo: {
            model: "Connector",
            id: connector._id,
          },
          metadata: {
            repository: repoInfo.full_name,
            actor: currentUser?.name || currentUser?.email,
            branch: repoInfo.default_branch,
            visibility: repoInfo.visibility,
          },
        },
      });
    } catch (notifyError) {
      console.error("Failed to send repository linkage notification:", notifyError);
    }

    const sanitizedConnector = connector.toObject();
    if (sanitizedConnector.config) {
      delete sanitizedConnector.config.accessToken;
      delete sanitizedConnector.config.refreshToken;
      delete sanitizedConnector.config.apiKey;
    }

    res.json({
      success: true,
      message: "Repository linked successfully",
      connector: sanitizedConnector,
      linkedResource,
    });
  } catch (error) {
    console.error("Error linking GitHub repository:", error);
    res.status(500).json({ error: "Failed to link repository" });
  }
};

export const unlinkGitHubRepository = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { connectorId, repositoryFullName, workspaceId: targetWorkspaceId, projectId: targetProjectId } = req.body;

    if (!connectorId || !repositoryFullName) {
      return res.status(400).json({ error: "Connector ID and repository full name are required" });
    }

    const connector = await Connector.findOne({
      _id: connectorId,
      user: userId,
      type: "github",
      status: "active",
    });

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    let workspaceId = targetWorkspaceId || (connector.workspace ? connector.workspace.toString() : null);
    let projectId = targetProjectId || (connector.project ? connector.project.toString() : null);

    const resourceIndex = connector.linkedResources.findIndex((resource) => {
      const matchesRepo = resource.repositoryFullName === repositoryFullName;
      const matchesWorkspace = workspaceId ? resource.workspace?.toString() === workspaceId.toString() : true;
      const matchesProject = projectId ? resource.project?.toString() === projectId.toString() : true;
      return matchesRepo && matchesWorkspace && matchesProject;
    });

    if (resourceIndex === -1) {
      return res.status(404).json({ error: "Linked repository not found" });
    }

    const [removed] = connector.linkedResources.splice(resourceIndex, 1);
    await connector.save();

    try {
      await dispatchGitHubNotifications({
        scope: connector.scope,
        userId,
        workspaceId: removed.workspace,
        projectId: removed.project,
        priority: "normal",
        notification: {
          type: "integration_event",
          title: `Repository unlinked: ${repositoryFullName}`,
          message: `${(await User.findById(userId).select("name"))?.name || "A teammate"} unlinked ${repositoryFullName}.`,
          link: `https://github.com/${repositoryFullName}`,
          source: "github",
          externalId: `github:repo:${removed.repositoryId}:unlink:${removed.workspace || "personal"}:${removed.project || "none"}`,
          relatedTo: {
            model: "Connector",
            id: connector._id,
          },
          metadata: {
            repository: repositoryFullName,
            actor: userId,
          },
        },
      });
    } catch (notifyError) {
      console.error("Failed to send repository unlink notification:", notifyError);
    }

    const sanitizedConnector = connector.toObject();
    if (sanitizedConnector.config) {
      delete sanitizedConnector.config.accessToken;
      delete sanitizedConnector.config.refreshToken;
      delete sanitizedConnector.config.apiKey;
    }

    res.json({
      success: true,
      message: "Repository unlinked successfully",
      connector: sanitizedConnector,
    });
  } catch (error) {
    console.error("Error unlinking GitHub repository:", error);
    res.status(500).json({ error: "Failed to unlink repository" });
  }
};

export const syncGitHubActivity = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, repositoryFullName, options } = req.body;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    const connectorQuery = {
      user: userId,
      type: "github",
      status: "active",
      scope: scope || "personal",
    };

    if (scope === "workspace" && scopeId) {
      connectorQuery.workspace = scopeId;
    }
    if (scope === "project" && scopeId) {
      connectorQuery.project = scopeId;
    }

    const connector = await Connector.findOne(connectorQuery);
    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    connector.linkedResources = connector.linkedResources || [];
    const linkedResourceIndex = connector.linkedResources.findIndex(
      (resource) => resource.repositoryFullName === repositoryFullName
    );

    if (linkedResourceIndex === -1) {
      return res.status(404).json({ error: "Repository is not linked to this connector" });
    }

    const linkedResource = connector.linkedResources[linkedResourceIndex];

    let workspaceId = linkedResource.workspace || connector.workspace;
    let projectId = linkedResource.project || connector.project;

    if (projectId && !workspaceId) {
      const project = await Project.findById(projectId).select("workspace");
      workspaceId = project?.workspace;
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repoName] = repositoryFullName.split("/");

    const perPage = options?.perPage ? Math.min(options.perPage, 50) : 20;
    const lastSyncedAt = linkedResource.lastSyncedAt ? new Date(linkedResource.lastSyncedAt) : null;

    const [pullsResponse, commitsResponse, issuesResponse] = await Promise.all([
      octokit.pulls.list({
        owner,
        repo: repoName,
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: perPage,
      }),
      octokit.repos.listCommits({
        owner,
        repo: repoName,
        per_page: perPage,
        sha: linkedResource.defaultBranch || undefined,
      }),
      octokit.issues.listForRepo({
        owner,
        repo: repoName,
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: perPage,
      }),
    ]);

    const filterBySyncDate = (dateString) => {
      if (!dateString) return true;
      if (!lastSyncedAt) return true;
      return new Date(dateString) > lastSyncedAt;
    };

    const newPulls = pullsResponse.data
      .filter((pull) => filterBySyncDate(pull.updated_at))
      .slice(0, 20);

    const newCommits = commitsResponse.data
      .filter((commit) => {
        const committedAt = commit.commit?.committer?.date || commit.commit?.author?.date;
        return filterBySyncDate(committedAt);
      })
      .slice(0, 30);

    const newIssues = issuesResponse.data
      .filter((issue) => !issue.pull_request)
      .filter((issue) => filterBySyncDate(issue.updated_at))
      .slice(0, 20);

    let notificationsCreated = 0;

    for (const pull of newPulls) {
      const metadata = {
        repository: repositoryFullName,
        actor: pull.user?.login,
        branch: pull.head?.ref,
        details: `PR #${pull.number} • ${pull.state}`,
        url: pull.html_url,
      };

      const created = await dispatchGitHubNotifications({
        scope: connector.scope,
        userId,
        workspaceId,
        projectId,
        priority: pull.draft ? "normal" : "high",
        notification: {
          type: GITHUB_NOTIFICATION_TYPES.pullRequest,
          title: `PR: ${pull.title}`,
          message: `${pull.user?.login || "Someone"} updated PR #${pull.number} (${pull.state})`,
          link: pull.html_url,
          source: "github",
          externalId: `github:${repositoryFullName}:pr:${pull.id}`,
          relatedTo: {
            model: "Connector",
            id: connector._id,
          },
          metadata,
        },
      });

      notificationsCreated += created.length;
    }

    for (const commit of newCommits) {
      const author =
        commit.author?.login ||
        commit.commit?.author?.name ||
        commit.commit?.committer?.name ||
        "Unknown";
      const shaShort = commit.sha?.slice(0, 7);
      const metadata = {
        repository: repositoryFullName,
        actor: author,
        branch: linkedResource.defaultBranch,
        details: commit.commit?.message,
        url: commit.html_url,
      };

      const created = await dispatchGitHubNotifications({
        scope: connector.scope,
        userId,
        workspaceId,
        projectId,
        priority: "normal",
        notification: {
          type: GITHUB_NOTIFICATION_TYPES.commit,
          title: `Commit ${shaShort} by ${author}`,
          message: `${author} pushed ${shaShort} to ${repositoryFullName}`,
          link: commit.html_url,
          source: "github",
          externalId: `github:${repositoryFullName}:commit:${commit.sha}`,
          relatedTo: {
            model: "Connector",
            id: connector._id,
          },
          metadata,
        },
      });

      notificationsCreated += created.length;
    }

    for (const issue of newIssues) {
      const metadata = {
        repository: repositoryFullName,
        actor: issue.user?.login,
        details: `Issue #${issue.number} • ${issue.state}`,
        url: issue.html_url,
      };

      const hasBugLabel = issue.labels?.some(
        (label) => typeof label === "object" && "name" in label && label.name?.toLowerCase().includes("bug")
      );

      const created = await dispatchGitHubNotifications({
        scope: connector.scope,
        userId,
        workspaceId,
        projectId,
        priority: hasBugLabel ? "high" : "normal",
        notification: {
          type: GITHUB_NOTIFICATION_TYPES.issue,
          title: `Issue: ${issue.title}`,
          message: `${issue.user?.login || "Someone"} updated issue #${issue.number} (${issue.state})`,
          link: issue.html_url,
          source: "github",
          externalId: `github:${repositoryFullName}:issue:${issue.id}`,
          relatedTo: {
            model: "Connector",
            id: connector._id,
          },
          metadata,
        },
      });

      notificationsCreated += created.length;
    }

    const syncTime = new Date();
    connector.linkedResources[linkedResourceIndex].lastSyncedAt = syncTime;
    connector.metadata = connector.metadata || {};
    connector.metadata.lastSync = syncTime;
    connector.metadata.stats = connector.metadata.stats || {};
    connector.metadata.stats.totalSyncs = (connector.metadata.stats.totalSyncs || 0) + 1;
    connector.metadata.stats.lastSyncStatus = "success";
    await connector.save();

    res.json({
      success: true,
      data: {
        repository: repositoryFullName,
        newPullRequests: newPulls.length,
        newCommits: newCommits.length,
        newIssues: newIssues.length,
        notificationsCreated,
        syncedAt: syncTime,
      },
    });
  } catch (error) {
    console.error("Error syncing GitHub activity:", error);

    if (req?.auth?._id) {
      try {
        const connector = await Connector.findOne({
          user: req.auth._id,
          type: "github",
          status: "active",
        });
        if (connector?.metadata?.stats) {
          connector.metadata.stats.lastSyncStatus = "error";
          connector.metadata.stats.errorCount = (connector.metadata.stats.errorCount || 0) + 1;
          await connector.save();
        }
      } catch (updateError) {
        console.error("Failed to update GitHub connector sync status:", updateError);
      }
    }

    res.status(500).json({ error: "Failed to sync GitHub activity", message: error.message });
  }
};

export const getGitHubActivity = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, repositoryFullName, limit = 25 } = req.query;

    const notificationTypes = [
      GITHUB_NOTIFICATION_TYPES.pullRequest,
      GITHUB_NOTIFICATION_TYPES.commit,
      GITHUB_NOTIFICATION_TYPES.issue,
      GITHUB_NOTIFICATION_TYPES.push,
      "integration_event",
      "integration_connected",
    ];

    const query = {
      recipient: userId,
      type: { $in: notificationTypes },
    };

    if (scope === "workspace" && scopeId) {
      query.workspace = scopeId;
    }
    if (scope === "project" && scopeId) {
      query.project = scopeId;
    }
    if (repositoryFullName) {
      query["metadata.repository"] = repositoryFullName;
    }

    const activities = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching GitHub activity:", error);
    res.status(500).json({ error: "Failed to fetch GitHub activity" });
  }
};

export const getGitHubRepositoryDetails = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, repositoryFullName } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    const connectorQuery = {
      user: userId,
      type: "github",
      status: "active",
    };

    if (scope) {
      connectorQuery.scope = scope;
      if (scope === "workspace" && scopeId) {
        connectorQuery.workspace = scopeId;
      } else if (scope === "project" && scopeId) {
        connectorQuery.project = scopeId;
      }
    }

    const connector = await Connector.findOne(connectorQuery);
    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repoName] = repositoryFullName.split("/");

    // Fetch repository details, collaborators, and commits in parallel
    const [repoData, collaboratorsData, commitsData] = await Promise.all([
      octokit.repos.get({ owner, repo: repoName }),
      octokit.repos.listCollaborators({ owner, repo: repoName, per_page: 100 }),
      octokit.repos.listCommits({ owner, repo: repoName, per_page: 100 }),
    ]);

    res.json({
      success: true,
      data: {
        repository: repoData.data,
        collaborators: collaboratorsData.data,
        commits: commitsData.data,
      },
    });
  } catch (error) {
    console.error("Error fetching repository details:", error);
    res.status(500).json({ error: "Failed to fetch repository details" });
  }
};

// ==================== GOOGLE DRIVE ====================

export const connectGoogleDrive = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    if (!["personal", "workspace", "project"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }

    const hasPermission = await checkConnectorPermissions(userId, scope, scopeId);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const oauth2Client = createGoogleOAuthClient();
    const state = generateStateToken(userId, scope, scopeId, "google_drive");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: getGoogleScopes("google_drive"),
      state,
      prompt: "consent",
    });

    res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error initiating Google Drive OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

// Handler function for Google Drive OAuth callback
const googleDriveCallbackHandler = async (req, res, code, stateData) => {
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const connectorData = {
    user: stateData.userId,
    type: "google_drive",
    scope: stateData.scope,
    name: "Google Drive",
    status: "active",
    config: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: userInfo.email,
    },
      metadata: {
        connectedAt: new Date(),
        lastSync: new Date(),
        userInfo: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      },
    };

    if (stateData.scope === "workspace") {
      connectorData.workspace = stateData.scopeId;
    } else if (stateData.scope === "project") {
      connectorData.project = stateData.scopeId;
    }

    const existingConnector = await Connector.findOne({
      user: stateData.userId,
      type: "google_drive",
      scope: stateData.scope,
      status: "active",
    });

    if (existingConnector) {
      await Connector.findByIdAndUpdate(existingConnector._id, connectorData, { new: true });
    } else {
      await Connector.create(connectorData);
    }

    (async () => {
      try {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const wsId = connectorData.workspace;
        if (!wsId) return;
        const ws = await Workspace.findById(wsId);
        const members = await (await import("../models/workspaceMember.js")).default
          .find({ workspace: wsId, status: "active" })
          .populate("user", "name email");
        const recipients = members
          .filter((m) => ["owner", "admin"].includes(m.role))
          .map((m) => m.user?.email)
          .filter(Boolean);
        const subject = `New Integration Connected: Google Drive`;
        const html = `
          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
            <h2 style=\"color:#333;\">Integration Connected</h2>
            <p>Google Drive has been connected to workspace <strong>${ws?.name}</strong>.</p>
            <p><a href=\"${clientUrl}/connectors\" style=\"background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;\">View Integrations</a></p>
          </div>`;
        const { sendSimpleEmail } = await import("../utils/mailService.js");
        await Promise.all(
          recipients.map((to) =>
            sendSimpleEmail({
              to,
              subject,
              html,
              text: `Google Drive connected to ${ws?.name}. View: ${clientUrl}/connectors`,
            })
          )
        );
      } catch (_) {}
    })();

  sendOAuthSuccessResponse(res, '/connectors/google-drive');
};

// Export for backward compatibility
export const googleDriveCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }
    await googleDriveCallbackHandler(req, res, code, stateData);
  } catch (error) {
    console.error("Error in Google Drive callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/google-drive?error=true`);
  }
};

export const getGoogleDriveFiles = async (req, res) => {
  try {
    const { scope, scopeId } = req.query;
    const userId = req.auth._id;

    const query = {
      user: userId,
      type: "google_drive",
      scope,
      status: "active",
    };

    if (scope === "workspace") query.workspace = scopeId;
    if (scope === "project") query.project = scopeId;

    const connector = await Connector.findOne(query);

    if (!connector) {
      return res.status(404).json({ error: "Connector not found" });
    }

    const oauth2Client = createGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: connector.config.accessToken,
      refresh_token: connector.config.refreshToken,
      expiry_date: connector.config.expiryDate,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 100,
      fields: "files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)",
      orderBy: "modifiedTime desc",
    });

    res.json({ success: true, files: response.data.files });
  } catch (error) {
    console.error("Error fetching Google Drive files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// ==================== GOOGLE MEET ====================

export const connectGoogleMeet = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    if (!["personal", "workspace", "project"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }

    const hasPermission = await checkConnectorPermissions(userId, scope, scopeId);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const oauth2Client = createGoogleOAuthClient();
    const state = generateStateToken(userId, scope, scopeId, "google_meet");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: getGoogleScopes("google_meet"),
      state,
      prompt: "consent",
    });

    res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error initiating Google Meet OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

// Handler function for Google Meet OAuth callback
const googleMeetCallbackHandler = async (req, res, code, stateData) => {
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const connectorData = {
    user: stateData.userId,
    type: "google_meet",
    scope: stateData.scope,
    name: "Google Meet",
    status: "active",
    config: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: userInfo.email,
      scopes: getGoogleScopes("google_meet"),
    },
      metadata: {
        connectedAt: new Date(),
        lastSync: new Date(),
        userInfo: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
        stats: {
          totalMeetings: 0,
          lastSyncStatus: "success",
        },
      },
    };

    if (stateData.scope === "workspace") {
      connectorData.workspace = stateData.scopeId;
    } else if (stateData.scope === "project") {
      connectorData.project = stateData.scopeId;
    }

    const existingConnector = await Connector.findOne({
      user: stateData.userId,
      type: "google_meet",
      scope: stateData.scope,
      status: "active",
    });

    if (existingConnector) {
      await Connector.findByIdAndUpdate(existingConnector._id, connectorData, { new: true });
    } else {
      await Connector.create(connectorData);
    }

  sendOAuthSuccessResponse(res, '/connectors/google-meet');
};

// Export for backward compatibility
export const googleMeetCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }
    await googleMeetCallbackHandler(req, res, code, stateData);
  } catch (error) {
    console.error("Error in Google Meet callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/google-meet?error=true`);
  }
};

// ==================== GMAIL ====================

export const connectGmail = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

    if (!["personal", "workspace", "project"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }

    const hasPermission = await checkConnectorPermissions(userId, scope, scopeId);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const oauth2Client = createGoogleOAuthClient();
    const state = generateStateToken(userId, scope, scopeId, "gmail");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: getGoogleScopes("gmail"),
      state,
      prompt: "consent",
    });

    res.json({ success: true, authUrl, state });
  } catch (error) {
    console.error("Error initiating Gmail OAuth:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
};

// Handler function for Gmail OAuth callback
const gmailCallbackHandler = async (req, res, code, stateData) => {
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const connectorData = {
    user: stateData.userId,
    type: "gmail",
    scope: stateData.scope,
    name: "Gmail",
    status: "active",
    config: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: userInfo.email,
      scopes: getGoogleScopes("gmail"),
    },
    metadata: {
      connectedAt: new Date(),
      lastSync: new Date(),
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
      stats: {
        totalEmails: 0,
        lastSyncStatus: "success",
      },
    },
  };

  if (stateData.scope === "workspace") {
    connectorData.workspace = stateData.scopeId;
  } else if (stateData.scope === "project") {
    connectorData.project = stateData.scopeId;
  }

  const existingConnector = await Connector.findOne({
    user: stateData.userId,
    type: "gmail",
    scope: stateData.scope,
    status: "active",
  });

  if (existingConnector) {
    await Connector.findByIdAndUpdate(existingConnector._id, connectorData, { new: true });
  } else {
    await Connector.create(connectorData);
  }

  sendOAuthSuccessResponse(res, '/connectors/gmail');
};

// Export for backward compatibility
export const gmailCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }
    await gmailCallbackHandler(req, res, code, stateData);
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/gmail?error=true`);
  }
};

// ==================== GOOGLE MEET LINK GENERATION ====================

export const createGoogleMeetLink = async (req, res) => {
  try {
    const { scope, scopeId, eventDetails } = req.body;
    const userId = req.auth._id;

    console.log(`🎥 Creating Google Meet link for user: ${userId}`);

    const query = {
      user: userId,
      type: "google_meet",
      scope,
      status: "active",
    };

    if (scope === "workspace") query.workspace = scopeId;
    if (scope === "project") query.project = scopeId;

    const connector = await Connector.findOne(query);

    if (!connector) {
      return res.status(404).json({ error: "Google Meet not connected" });
    }

    const oauth2Client = createGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: connector.config.accessToken,
      refresh_token: connector.config.refreshToken,
      expiry_date: connector.config.expiryDate,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create a Google Calendar event with Google Meet conferencing
    const event = {
      summary: eventDetails.title || "Meeting",
      description: eventDetails.description || "",
      start: {
        dateTime: eventDetails.startDate,
        timeZone: eventDetails.timezone || "UTC",
      },
      end: {
        dateTime: eventDetails.endDate,
        timeZone: eventDetails.timezone || "UTC",
      },
      attendees: eventDetails.attendeeEmails?.map((email) => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: "all", // Send email invitations to attendees
    });

    const meetLink = createdEvent.data.hangoutLink;
    const eventId = createdEvent.data.id;

    console.log(`✅ Google Meet link created: ${meetLink}`);

    res.json({
      success: true,
      meetLink,
      eventId,
      conferenceData: createdEvent.data.conferenceData,
    });
  } catch (error) {
    console.error("❌ Error creating Google Meet link:", error);
    res.status(500).json({
      error: "Failed to create Google Meet link",
      message: error.message,
    });
  }
};


