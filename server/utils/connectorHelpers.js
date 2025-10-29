import { Connector } from "../models/index.js";
import { google } from "googleapis";
import { Octokit } from "@octokit/rest";

export const refreshGoogleToken = async (connector) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: connector.config.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    connector.config.accessToken = credentials.access_token;
    connector.config.expiryDate = credentials.expiry_date;
    await connector.save();

    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    connector.status = "error";
    connector.metadata.stats.errorCount += 1;
    await connector.save();
    throw error;
  }
};

export const getActiveConnector = async (userId, type, scope, scopeId) => {
  const query = {
    user: userId,
    type,
    scope,
    status: "active",
  };

  if (scope === "workspace") query.workspace = scopeId;
  if (scope === "project") query.project = scopeId;

  return await Connector.findOne(query);
};

export const validateConnectorToken = async (connector) => {
  try {
    if (connector.type.startsWith("google_")) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: connector.config.accessToken,
        refresh_token: connector.config.refreshToken,
        expiry_date: connector.config.expiryDate,
      });

      if (Date.now() >= connector.config.expiryDate) {
        return await refreshGoogleToken(connector);
      }

      return connector.config.accessToken;
    }

    if (connector.type === "github") {
      const octokit = new Octokit({ auth: connector.config.accessToken });
      await octokit.users.getAuthenticated();
      return connector.config.accessToken;
    }

    return connector.config.accessToken;
  } catch (error) {
    console.error("Error validating connector token:", error);
    connector.status = "error";
    connector.metadata.stats.errorCount += 1;
    await connector.save();
    throw error;
  }
};

export const updateConnectorSyncStatus = async (connectorId, status, error = null) => {
  try {
    const connector = await Connector.findById(connectorId);
    if (!connector) return;

    connector.metadata.lastSync = new Date();
    connector.metadata.stats.totalSyncs += 1;
    connector.metadata.stats.lastSyncStatus = status;

    if (status === "error") {
      connector.metadata.stats.errorCount += 1;
      if (error) {
        connector.status = "error";
      }
    } else {
      connector.status = "active";
    }

    await connector.save();
  } catch (error) {
    console.error("Error updating connector sync status:", error);
  }
};

export const getConnectorsByWorkspace = async (workspaceId) => {
  return await Connector.find({
    workspace: workspaceId,
    status: "active",
  }).select("-config.accessToken -config.refreshToken -config.apiKey");
};

export const getConnectorsByProject = async (projectId) => {
  return await Connector.find({
    project: projectId,
    status: "active",
  }).select("-config.accessToken -config.refreshToken -config.apiKey");
};

export const disconnectAllUserConnectors = async (userId) => {
  await Connector.updateMany(
    { user: userId, status: "active" },
    { status: "disconnected" }
  );
};

export const disconnectWorkspaceConnectors = async (workspaceId) => {
  await Connector.updateMany(
    { workspace: workspaceId, status: "active" },
    { status: "disconnected" }
  );
};

export const disconnectProjectConnectors = async (projectId) => {
  await Connector.updateMany(
    { project: projectId, status: "active" },
    { status: "disconnected" }
  );
};


