import { Connector, User, Workspace, Project } from "../models/index.js";
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

export const googleCalendarCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }

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

    res.redirect(`${process.env.CLIENT_URL}/connectors/google-calendar?success=true`);
  } catch (error) {
    console.error("Error in Google Calendar callback:", error);
    res.redirect(`${process.env.CLIENT_URL}/connectors/google-calendar?error=true`);
  }
};

export const syncGoogleCalendar = async (req, res) => {
  try {
    const { scope, scopeId } = req.body;
    const userId = req.auth._id;

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

    const oauth2Client = createGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: connector.config.accessToken,
      refresh_token: connector.config.refreshToken,
      expiry_date: connector.config.expiryDate,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    connector.metadata.lastSync = new Date();
    connector.metadata.stats.totalSyncs += 1;
    connector.metadata.stats.lastSyncStatus = "success";
    await connector.save();

    res.json({
      success: true,
      events: response.data.items,
      syncedAt: connector.metadata.lastSync,
    });
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    res.status(500).json({ error: "Failed to sync calendar" });
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

    res.redirect(`${process.env.CLIENT_URL}/connectors/github?success=true`);
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

export const googleDriveCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    const stateData = verifyStateToken(state);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/connectors?error=invalid_state`);
    }

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

    res.redirect(`${process.env.CLIENT_URL}/connectors/google-drive?success=true`);
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


