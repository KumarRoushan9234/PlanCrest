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


