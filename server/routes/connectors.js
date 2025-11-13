import express from "express";
import {
  getAllConnectors,
  getConnectorById,
  deleteConnector,
  connectGoogleCalendar,
  googleCalendarCallback,
  syncGoogleCalendar,
  connectGitHub,
  githubCallback,
  getGitHubRepositories,
  linkGitHubRepository,
  unlinkGitHubRepository,
  syncGitHubActivity,
  getGitHubActivity,
  getGitHubRepositoryDetails,
  connectGoogleDrive,
  googleDriveCallback,
  getGoogleDriveFiles,
  connectGoogleMeet,
  googleMeetCallback,
  connectGmail,
  gmailCallback,
  createGoogleMeetLink,
  unifiedGoogleCallback,
} from "../controllers/connectors.js";
import {
  getRepositoryStatistics,
  getActivityAnalytics,
  getCommitHistory,
  syncIssuesToTasks,
  linkPRToTask,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  getNotificationRules,
  getTeamInsights,
  getSecurityAlerts,
  getWorkflowRuns,
  setupWebhook,
  getWebhooks,
  deleteWebhook,
  handleGitHubWebhook,
  getPullRequestDetails,
  getIssueDetails,
  getRepositoryTree,
  getFileContent,
  getReleases,
  getBranches,
  searchRepository,
} from "../controllers/githubAdvanced.js";
import { requireSignin, handleAuthError } from "../middlewares/index.js";

const router = express.Router();

console.log("🔌 Initializing connector routes");

// ==================== GENERAL CONNECTOR ROUTES ====================

router.get(
  "/connectors",
  requireSignin,
  getAllConnectors,
  handleAuthError
);

router.get(
  "/connectors/:connectorId",
  requireSignin,
  getConnectorById,
  handleAuthError
);

router.delete(
  "/connectors/:connectorId",
  requireSignin,
  deleteConnector,
  handleAuthError
);

// ==================== GOOGLE CALENDAR ====================

router.post(
  "/connectors/google-calendar/connect",
  requireSignin,
  connectGoogleCalendar,
  handleAuthError
);

router.get(
  "/connectors/google-calendar/callback",
  googleCalendarCallback
);

// Unified Google OAuth callback (all Google integrations redirect here)
router.get(
  "/integrations/google-calendar/callback",
  unifiedGoogleCallback
);

router.post(
  "/connectors/google-calendar/sync",
  requireSignin,
  syncGoogleCalendar,
  handleAuthError
);

// ==================== GITHUB ====================

router.post(
  "/connectors/github/connect",
  requireSignin,
  connectGitHub,
  handleAuthError
);

router.get(
  "/connectors/github/callback",
  githubCallback
);

// Alias route for backward compatibility
router.get(
  "/integrations/github/callback",
  githubCallback
);

router.get(
  "/connectors/github/repositories",
  requireSignin,
  getGitHubRepositories,
  handleAuthError
);

router.post(
  "/connectors/github/link",
  requireSignin,
  linkGitHubRepository,
  handleAuthError
);

router.post(
  "/connectors/github/unlink",
  requireSignin,
  unlinkGitHubRepository,
  handleAuthError
);

router.post(
  "/connectors/github/sync",
  requireSignin,
  syncGitHubActivity,
  handleAuthError
);

router.get(
  "/connectors/github/activity",
  requireSignin,
  getGitHubActivity,
  handleAuthError
);

router.get(
  "/connectors/github/repository-details",
  requireSignin,
  getGitHubRepositoryDetails,
  handleAuthError
);

// ==================== ADVANCED GITHUB FEATURES ====================

// Repository Statistics
router.get(
  "/connectors/github/repository/statistics",
  requireSignin,
  getRepositoryStatistics,
  handleAuthError
);

// Activity Analytics
router.get(
  "/connectors/github/analytics",
  requireSignin,
  getActivityAnalytics,
  handleAuthError
);

// Commit History
router.get(
  "/connectors/github/commits",
  requireSignin,
  getCommitHistory,
  handleAuthError
);

// Task Integration
router.post(
  "/connectors/github/sync-issues-to-tasks",
  requireSignin,
  syncIssuesToTasks,
  handleAuthError
);

router.post(
  "/connectors/github/link-pr-to-task",
  requireSignin,
  linkPRToTask,
  handleAuthError
);

// Notification Rules
router.get(
  "/connectors/github/notification-rules",
  requireSignin,
  getNotificationRules,
  handleAuthError
);

router.post(
  "/connectors/github/notification-rules",
  requireSignin,
  createNotificationRule,
  handleAuthError
);

router.put(
  "/connectors/github/notification-rules",
  requireSignin,
  updateNotificationRule,
  handleAuthError
);

router.delete(
  "/connectors/github/notification-rules",
  requireSignin,
  deleteNotificationRule,
  handleAuthError
);

// Team Insights
router.get(
  "/connectors/github/team-insights",
  requireSignin,
  getTeamInsights,
  handleAuthError
);

// Security
router.get(
  "/connectors/github/security",
  requireSignin,
  getSecurityAlerts,
  handleAuthError
);

// GitHub Actions
router.get(
  "/connectors/github/workflows",
  requireSignin,
  getWorkflowRuns,
  handleAuthError
);

// Webhooks
router.post(
  "/connectors/github/webhooks",
  requireSignin,
  setupWebhook,
  handleAuthError
);

router.get(
  "/connectors/github/webhooks",
  requireSignin,
  getWebhooks,
  handleAuthError
);

router.delete(
  "/connectors/github/webhooks",
  requireSignin,
  deleteWebhook,
  handleAuthError
);

// Webhook endpoint (no auth required - uses signature verification)
router.post(
  "/webhooks/github",
  handleGitHubWebhook
);

// PR/Issue Details
router.get(
  "/connectors/github/pull-request",
  requireSignin,
  getPullRequestDetails,
  handleAuthError
);

router.get(
  "/connectors/github/issue",
  requireSignin,
  getIssueDetails,
  handleAuthError
);

// Repository Files & Tree
router.get(
  "/connectors/github/tree",
  requireSignin,
  getRepositoryTree,
  handleAuthError
);

router.get(
  "/connectors/github/file",
  requireSignin,
  getFileContent,
  handleAuthError
);

// Releases
router.get(
  "/connectors/github/releases",
  requireSignin,
  getReleases,
  handleAuthError
);

// Branches
router.get(
  "/connectors/github/branches",
  requireSignin,
  getBranches,
  handleAuthError
);

// Search
router.get(
  "/connectors/github/search",
  requireSignin,
  searchRepository,
  handleAuthError
);

// ==================== GOOGLE DRIVE ====================

router.post(
  "/connectors/google-drive/connect",
  requireSignin,
  connectGoogleDrive,
  handleAuthError
);

router.get(
  "/connectors/google-drive/callback",
  googleDriveCallback
);

// Alias route for backward compatibility
router.get(
  "/integrations/google-drive/callback",
  googleDriveCallback
);

router.get(
  "/connectors/google-drive/files",
  requireSignin,
  getGoogleDriveFiles,
  handleAuthError
);

// ==================== GOOGLE MEET ====================

router.post(
  "/connectors/google-meet/connect",
  requireSignin,
  connectGoogleMeet,
  handleAuthError
);

router.get(
  "/connectors/google-meet/callback",
  googleMeetCallback
);

// Alias route for backward compatibility
router.get(
  "/integrations/google-meet/callback",
  googleMeetCallback
);

// Create Google Meet link for events
router.post(
  "/connectors/google-meet/create-link",
  requireSignin,
  createGoogleMeetLink,
  handleAuthError
);

// ==================== GMAIL ====================

router.post(
  "/connectors/gmail/connect",
  requireSignin,
  connectGmail,
  handleAuthError
);

router.get(
  "/connectors/gmail/callback",
  gmailCallback
);

// Alias route for backward compatibility
router.get(
  "/integrations/gmail/callback",
  gmailCallback
);

console.log("✅ Connector routes initialized successfully");

export default router;


