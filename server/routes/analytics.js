import express from "express";
import {
  getWorkspaceAnalytics,
  getProjectAnalytics,
  getUserPerformance,
  getTaskDistribution,
  getBurnupChartData,
  getVelocityChartData,
  getTimeTrackingAnalytics,
  getTeamPerformanceAnalytics,
  getCalendarAnalytics,
  getEventAnalytics,
  generateComprehensiveReport,
} from "../controllers/analytics.js";
import { requireAuth, requireWorkspaceAccess, requireProjectAccess } from "../middlewares/index.js";
import { requireEventAccess } from "../middlewares/resourceAccess.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Workspace from "../models/workspace.js";

const router = express.Router();

console.log("📊 Initializing analytics routes");

// All routes require authentication
router.use(requireAuth);

/**
 * A user's performance is visible to themselves and to owners/admins of a
 * workspace that user belongs to.
 */
async function requireSelfOrSharedAdmin(req, res, next) {
  try {
    const viewerId = req.auth._id.toString();
    const { userId } = req.params;
    if (viewerId === userId) return next();

    const [ownedWorkspaces, adminMemberships] = await Promise.all([
      Workspace.find({ owner: viewerId }).distinct("_id"),
      WorkspaceMember.find({ user: viewerId, role: "admin", status: "active" }).distinct(
        "workspace"
      ),
    ]);
    const managed = [...ownedWorkspaces, ...adminMemberships];
    const shared = await WorkspaceMember.exists({
      user: userId,
      workspace: { $in: managed },
      status: "active",
    });
    const ownsTargetsWorkspace = await Workspace.exists({
      owner: userId,
      _id: { $in: adminMemberships },
    });
    if (shared || ownsTargetsWorkspace) return next();
    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    next(error);
  }
}

/**
 * Workspace Analytics Routes
 */

/**
 * @route   GET /api/workspaces/:workspaceId/analytics
 * @desc    Get comprehensive workspace analytics
 * @access  Private (Workspace member)
 */
router.get("/workspaces/:workspaceId/analytics", requireWorkspaceAccess, getWorkspaceAnalytics);

/**
 * @route   GET /api/workspaces/:workspaceId/analytics/time-tracking
 * @desc    Get time tracking analytics for workspace
 * @access  Private (Workspace member)
 */
router.get(
  "/workspaces/:workspaceId/analytics/time-tracking",
  requireWorkspaceAccess,
  getTimeTrackingAnalytics
);

/**
 * @route   GET /api/workspaces/:workspaceId/analytics/team-performance
 * @desc    Get team performance analytics
 * @access  Private (Workspace member)
 */
router.get(
  "/workspaces/:workspaceId/analytics/team-performance",
  requireWorkspaceAccess,
  getTeamPerformanceAnalytics
);

/**
 * @route   GET /api/workspaces/:workspaceId/analytics/calendar
 * @desc    Get calendar analytics for workspace
 * @access  Private (Workspace member)
 */
router.get(
  "/workspaces/:workspaceId/analytics/calendar",
  requireWorkspaceAccess,
  getCalendarAnalytics
);

/**
 * @route   GET /api/workspaces/:workspaceId/reports/comprehensive
 * @desc    Generate comprehensive workspace report
 * @access  Private (Workspace member)
 */
router.get(
  "/workspaces/:workspaceId/reports/comprehensive",
  requireWorkspaceAccess,
  generateComprehensiveReport
);

/**
 * Project Analytics Routes
 */

/**
 * @route   GET /api/projects/:projectId/analytics
 * @desc    Get comprehensive project analytics
 * @access  Private (Project member)
 */
router.get("/projects/:projectId/analytics", requireProjectAccess, getProjectAnalytics);

/**
 * @route   GET /api/projects/:projectId/analytics/task-distribution
 * @desc    Get task distribution for project
 * @access  Private (Project member)
 */
router.get("/projects/:projectId/analytics/task-distribution", requireProjectAccess, getTaskDistribution);

/**
 * @route   GET /api/projects/:projectId/analytics/burnup
 * @desc    Get burnup chart data for project
 * @access  Private (Project member)
 */
router.get("/projects/:projectId/analytics/burnup", requireProjectAccess, getBurnupChartData);

/**
 * @route   GET /api/projects/:projectId/analytics/velocity
 * @desc    Get velocity chart data for project
 * @access  Private (Project member)
 */
router.get("/projects/:projectId/analytics/velocity", requireProjectAccess, getVelocityChartData);

/**
 * User Analytics Routes
 */

/**
 * @route   GET /api/users/:userId/performance
 * @desc    Get user performance analytics
 * @access  Private
 */
router.get("/users/:userId/performance", requireSelfOrSharedAdmin, getUserPerformance);

/**
 * Event Analytics Routes
 */

/**
 * @route   GET /api/calendar/events/:eventId/analytics
 * @desc    Get event analytics
 * @access  Private
 */
router.get("/calendar/events/:eventId/analytics", requireEventAccess, getEventAnalytics);

console.log("✅ Analytics routes initialized successfully");

export default router;

