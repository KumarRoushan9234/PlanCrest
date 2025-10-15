/**
 * Integration Helper Functions
 * Utilities for managing workspace and user integrations
 */

/**
 * Check if a specific integration is enabled for workspace
 */
export const isIntegrationEnabled = (workspace, integrationType) => {
  const integrations = workspace.integrations || {};
  
  switch (integrationType) {
    case "github":
      return integrations.github?.enabled || false;
    case "gitlab":
      return integrations.gitlab?.enabled || false;
    case "google_workspace":
      return integrations.googleWorkspace?.enabled || false;
    case "slack":
      return integrations.slack?.enabled || false;
    case "figma":
      return integrations.figma?.enabled || false;
    case "cloud_storage":
      return integrations.cloudStorage?.enabled || false;
    case "cicd":
      return integrations.cicd?.enabled || false;
    case "zoom":
      return integrations.communication?.zoom?.enabled || false;
    case "google_meet":
      return integrations.communication?.googleMeet?.enabled || false;
    default:
      return false;
  }
};

/**
 * Check if user has personal integration connected
 */
export const isUserIntegrationConnected = (user, integrationType) => {
  const integrations = user.integrations || {};
  
  switch (integrationType) {
    case "github":
      return integrations.github?.connected || false;
    case "gitlab":
      return integrations.gitlab?.connected || false;
    case "google":
      return integrations.google?.connected || false;
    case "slack":
      return integrations.slack?.connected || false;
    case "figma":
      return integrations.figma?.connected || false;
    case "zoom":
      return integrations.zoom?.connected || false;
    default:
      return false;
  }
};

/**
 * Get integration credentials (workspace or user level)
 */
export const getIntegrationCredentials = (workspace, user, integrationType, preferWorkspace = true) => {
  if (preferWorkspace) {
    const workspaceCreds = getWorkspaceIntegrationCredentials(workspace, integrationType);
    if (workspaceCreds) return { ...workspaceCreds, source: "workspace" };
  }
  
  const userCreds = getUserIntegrationCredentials(user, integrationType);
  if (userCreds) return { ...userCreds, source: "user" };
  
  return null;
};

/**
 * Get workspace-level integration credentials
 */
const getWorkspaceIntegrationCredentials = (workspace, integrationType) => {
  const integrations = workspace.integrations || {};
  
  switch (integrationType) {
    case "github":
      return integrations.github?.enabled ? {
        accessToken: integrations.github.accessToken,
        organizationId: integrations.github.organizationId,
      } : null;
      
    case "gitlab":
      return integrations.gitlab?.enabled ? {
        accessToken: integrations.gitlab.accessToken,
        groupId: integrations.gitlab.groupId,
      } : null;
      
    case "google":
      return integrations.googleWorkspace?.enabled ? {
        accessToken: integrations.googleWorkspace.accessToken,
        refreshToken: integrations.googleWorkspace.refreshToken,
        clientId: integrations.googleWorkspace.clientId,
        clientSecret: integrations.googleWorkspace.clientSecret,
      } : null;
      
    case "slack":
      return integrations.slack?.enabled ? {
        accessToken: integrations.slack.accessToken,
        botToken: integrations.slack.botToken,
        teamId: integrations.slack.teamId,
      } : null;
      
    case "figma":
      return integrations.figma?.enabled ? {
        accessToken: integrations.figma.accessToken,
        teamId: integrations.figma.teamId,
      } : null;
      
    default:
      return null;
  }
};

/**
 * Get user-level integration credentials
 */
const getUserIntegrationCredentials = (user, integrationType) => {
  const integrations = user.integrations || {};
  
  switch (integrationType) {
    case "github":
      return integrations.github?.connected ? {
        accessToken: integrations.github.accessToken,
        refreshToken: integrations.github.refreshToken,
        username: integrations.github.username,
      } : null;
      
    case "gitlab":
      return integrations.gitlab?.connected ? {
        accessToken: integrations.gitlab.accessToken,
        refreshToken: integrations.gitlab.refreshToken,
        username: integrations.gitlab.username,
      } : null;
      
    case "google":
      return integrations.google?.connected ? {
        accessToken: integrations.google.accessToken,
        refreshToken: integrations.google.refreshToken,
        email: integrations.google.email,
        scopes: integrations.google.scopes,
      } : null;
      
    default:
      return null;
  }
};

/**
 * Check if Google service is enabled
 */
export const isGoogleServiceEnabled = (workspace, service) => {
  const googleWorkspace = workspace.integrations?.googleWorkspace;
  if (!googleWorkspace?.enabled) return false;
  
  return googleWorkspace.services?.[service] || false;
};

/**
 * Get cloud storage configuration
 */
export const getCloudStorageConfig = (workspace) => {
  const storage = workspace.integrations?.cloudStorage;
  if (!storage?.enabled) return null;
  
  return {
    provider: storage.provider,
    bucketName: storage.bucketName,
    region: storage.region,
    accessKey: storage.accessKey,
    secretKey: storage.secretKey,
  };
};

/**
 * Get CI/CD configuration
 */
export const getCICDConfig = (workspace) => {
  const cicd = workspace.integrations?.cicd;
  if (!cicd?.enabled) return null;
  
  return {
    provider: cicd.provider,
    webhookUrl: cicd.webhookUrl,
    apiToken: cicd.apiToken,
  };
};

export default {
  isIntegrationEnabled,
  isUserIntegrationConnected,
  getIntegrationCredentials,
  isGoogleServiceEnabled,
  getCloudStorageConfig,
  getCICDConfig,
};

