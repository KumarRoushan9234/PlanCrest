import { Connector, User, Workspace, Project } from "../models/index.js";
import CalendarEvent from "../models/calendarEvent.js";
import axios from "axios";
import { google } from "googleapis";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";

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

    if (scope) query.scope = scope;
    if (scope === "workspace" && scopeId) query.workspace = scopeId;
    if (scope === "project" && scopeId) query.project = scopeId;

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

    const hasPermission = await checkConnectorPermissions(userId, scope, scopeId);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
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

    const existingConnector = await Connector.findOne({
      user: stateData.userId,
      type: "github",
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
        const subject = `New Integration Connected: GitHub`;
        const html = `
          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
            <h2 style=\"color:#333;\">Integration Connected</h2>
            <p>GitHub has been connected to workspace <strong>${ws?.name}</strong>.</p>
            <p><a href=\"${clientUrl}/connectors\" style=\"background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;\">View Integrations</a></p>
          </div>`;
        const { sendSimpleEmail } = await import("../utils/mailService.js");
        await Promise.all(
          recipients.map((to) =>
            sendSimpleEmail({
              to,
              subject,
              html,
              text: `GitHub connected to ${ws?.name}. View: ${clientUrl}/connectors`,
            })
          )
        );
      } catch (_) {}
    })();

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

    const query = {
      user: userId,
      type: "github",
      scope,
      status: "active",
    };

    if (scope === "workspace") query.workspace = scopeId;
    if (scope === "project") query.project = scopeId;

    const connector = await Connector.findOne(query);

    if (!connector) {
      return res.status(404).json({ error: "Connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    res.json({ success: true, repositories: repos });
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
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


