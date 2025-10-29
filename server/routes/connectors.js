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

router.get(
  "/connectors/google-drive/files",
  requireSignin,
  getGoogleDriveFiles,
  handleAuthError
);

console.log("✅ Connector routes initialized successfully");

export default router;


