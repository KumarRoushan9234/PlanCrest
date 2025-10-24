import {
  calculateTaskMetrics,
  calculateTeamPerformance,
  generateBurnupData,
  generateVelocityData,
  calculateTimeTracking,
  calculateCalendarMetrics,
  calculateEventMetrics,
  generateReportData,
} from "../utils/analyticsHelpers.js";

/**
 * Get workspace analytics
 * GET /api/workspaces/:workspaceId/analytics
 */
export const getWorkspaceAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n📊 Fetching workspace analytics: ${workspaceId}`);
    console.log(`📅 Time range: ${timeRange}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    console.log(`📅 From: ${startDate.toISOString()}`);
    console.log(`📅 To: ${endDate.toISOString()}`);

    // Fetch all analytics data
    const [taskMetrics, teamPerformance, timeTracking, calendarMetrics] = await Promise.all([
      calculateTaskMetrics({ workspaceId, startDate, endDate }),
      calculateTeamPerformance({ workspaceId, startDate, endDate }),
      calculateTimeTracking({ workspaceId, startDate, endDate }),
      calculateCalendarMetrics({ workspaceId, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
    ]);

    const analytics = {
      timeRange: {
        start: startDate,
        end: endDate,
        days,
      },
      tasks: taskMetrics,
      team: {
        members: teamPerformance,
        totalMembers: teamPerformance.length,
        averageCompletionRate:
          teamPerformance.reduce((sum, m) => sum + m.metrics.completionRate, 0) / teamPerformance.length || 0,
        totalHoursLogged: timeTracking.totalHours,
      },
      timeTracking,
      calendar: calendarMetrics,
      summary: {
        totalTasks: taskMetrics.total,
        completedTasks: taskMetrics.completed,
        completionRate: taskMetrics.completionRate,
        teamSize: teamPerformance.length,
        totalHours: timeTracking.totalHours,
        totalMeetings: calendarMetrics.totalEvents,
      },
    };

    console.log(`✅ Workspace analytics calculated successfully`);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching workspace analytics:", error.message);
    res.status(500).json({ error: "Failed to fetch workspace analytics" });
  }
};

/**
 * Get project analytics
 * GET /api/projects/:projectId/analytics
 */
export const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n📊 Fetching project analytics: ${projectId}`);
    console.log(`📅 Time range: ${timeRange}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const [taskMetrics, timeTracking, burnupData, velocityData] = await Promise.all([
      calculateTaskMetrics({ projectId, startDate, endDate }),
      calculateTimeTracking({ projectId, startDate, endDate }),
      generateBurnupData({ projectId, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      generateVelocityData({
        projectId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: "week",
      }),
    ]);

    const analytics = {
      timeRange: {
        start: startDate,
        end: endDate,
        days,
      },
      tasks: taskMetrics,
      timeTracking,
      burnup: burnupData,
      velocity: velocityData,
      summary: {
        totalTasks: taskMetrics.total,
        completedTasks: taskMetrics.completed,
        completionRate: taskMetrics.completionRate,
        totalHours: timeTracking.totalHours,
        averageCompletionTime: taskMetrics.averageCompletionTime,
      },
    };

    console.log(`✅ Project analytics calculated successfully`);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching project analytics:", error.message);
    res.status(500).json({ error: "Failed to fetch project analytics" });
  }
};

/**
 * Get user performance analytics
 * GET /api/users/:userId/performance
 */
export const getUserPerformance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n📊 Fetching user performance: ${userId}`);
    console.log(`📅 Time range: ${timeRange}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const [taskMetrics, timeTracking] = await Promise.all([
      calculateTaskMetrics({ userId, startDate, endDate }),
      calculateTimeTracking({ userId, startDate, endDate }),
    ]);

    const performance = {
      timeRange: {
        start: startDate,
        end: endDate,
        days,
      },
      tasks: taskMetrics,
      timeTracking,
      summary: {
        totalTasks: taskMetrics.total,
        completedTasks: taskMetrics.completed,
        completionRate: taskMetrics.completionRate,
        hoursLogged: timeTracking.totalHours,
        averageHoursPerTask:
          taskMetrics.completed > 0 ? timeTracking.totalHours / taskMetrics.completed : 0,
      },
    };

    console.log(`✅ User performance calculated successfully`);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("❌ Error fetching user performance:", error.message);
    res.status(500).json({ error: "Failed to fetch user performance" });
  }
};

/**
 * Get task distribution analytics
 * GET /api/projects/:projectId/task-distribution
 */
export const getTaskDistribution = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log(`\n📊 Fetching task distribution for project: ${projectId}`);

    const Task = (await import("../models/task.js")).default;
    const TaskAssignment = (await import("../models/taskAssignment.js")).default;

    const tasks = await Task.find({ project: projectId, isArchived: false });

    const distribution = {
      byStatus: {},
      byPriority: {},
      byAssignee: {},
      unassigned: 0,
    };

    // Count by status and priority
    tasks.forEach((task) => {
      distribution.byStatus[task.status] = (distribution.byStatus[task.status] || 0) + 1;
      distribution.byPriority[task.priority] = (distribution.byPriority[task.priority] || 0) + 1;
    });

    // Count by assignee
    const assignments = await TaskAssignment.find({
      task: { $in: tasks.map((t) => t._id) },
      role: "assignee",
    }).populate("user", "name email");

    const assigneeCounts = {};
    assignments.forEach((assignment) => {
      const userId = assignment.user._id.toString();
      if (!assigneeCounts[userId]) {
        assigneeCounts[userId] = {
          user: {
            id: userId,
            name: assignment.user.name,
            email: assignment.user.email,
          },
          count: 0,
        };
      }
      assigneeCounts[userId].count++;
    });

    distribution.byAssignee = Object.values(assigneeCounts);
    distribution.unassigned = tasks.length - assignments.length;

    console.log(`✅ Task distribution calculated successfully`);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("❌ Error fetching task distribution:", error.message);
    res.status(500).json({ error: "Failed to fetch task distribution" });
  }
};

/**
 * Get burnup chart data
 * GET /api/projects/:projectId/burnup
 */
export const getBurnupChartData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeRange = "90d" } = req.query;

    console.log(`\n📈 Fetching burnup chart data for project: ${projectId}`);
    console.log(`📅 Time range: ${timeRange}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 90;
    startDate.setDate(startDate.getDate() - days);

    const burnupData = await generateBurnupData({
      projectId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    console.log(`✅ Burnup chart data generated successfully`);

    res.json({
      success: true,
      data: burnupData,
    });
  } catch (error) {
    console.error("❌ Error fetching burnup chart data:", error.message);
    res.status(500).json({ error: "Failed to fetch burnup chart data" });
  }
};

/**
 * Get velocity chart data
 * GET /api/projects/:projectId/velocity
 */
export const getVelocityChartData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeRange = "90d", period = "week" } = req.query;

    console.log(`\n🚀 Fetching velocity chart data for project: ${projectId}`);
    console.log(`📅 Time range: ${timeRange}, Period: ${period}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 90;
    startDate.setDate(startDate.getDate() - days);

    const velocityData = await generateVelocityData({
      projectId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
    });

    console.log(`✅ Velocity chart data generated successfully`);

    res.json({
      success: true,
      data: velocityData,
    });
  } catch (error) {
    console.error("❌ Error fetching velocity chart data:", error.message);
    res.status(500).json({ error: "Failed to fetch velocity chart data" });
  }
};

/**
 * Get time tracking analytics
 * GET /api/workspaces/:workspaceId/time-tracking
 */
export const getTimeTrackingAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { timeRange = "30d", userId, projectId } = req.query;

    console.log(`\n⏱️ Fetching time tracking analytics for workspace: ${workspaceId}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const timeTracking = await calculateTimeTracking({
      workspaceId,
      projectId,
      userId,
      startDate,
      endDate,
    });

    console.log(`✅ Time tracking analytics calculated successfully`);

    res.json({
      success: true,
      data: timeTracking,
    });
  } catch (error) {
    console.error("❌ Error fetching time tracking analytics:", error.message);
    res.status(500).json({ error: "Failed to fetch time tracking analytics" });
  }
};

/**
 * Get team performance analytics
 * GET /api/workspaces/:workspaceId/team-performance
 */
export const getTeamPerformanceAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n👥 Fetching team performance for workspace: ${workspaceId}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const teamPerformance = await calculateTeamPerformance({
      workspaceId,
      startDate,
      endDate,
    });

    console.log(`✅ Team performance calculated successfully`);

    res.json({
      success: true,
      data: teamPerformance,
    });
  } catch (error) {
    console.error("❌ Error fetching team performance:", error.message);
    res.status(500).json({ error: "Failed to fetch team performance" });
  }
};

/**
 * Get calendar analytics
 * GET /api/workspaces/:workspaceId/calendar-analytics
 */
export const getCalendarAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n📅 Fetching calendar analytics for workspace: ${workspaceId}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const calendarMetrics = await calculateCalendarMetrics({
      workspaceId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    console.log(`✅ Calendar analytics calculated successfully`);

    res.json({
      success: true,
      data: calendarMetrics,
    });
  } catch (error) {
    console.error("❌ Error fetching calendar analytics:", error.message);
    res.status(500).json({ error: "Failed to fetch calendar analytics" });
  }
};

/**
 * Get event analytics
 * GET /api/calendar/events/:eventId/analytics
 */
export const getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    console.log(`\n📊 Fetching event analytics: ${eventId}`);

    const eventMetrics = await calculateEventMetrics(eventId);

    console.log(`✅ Event analytics calculated successfully`);

    res.json({
      success: true,
      data: eventMetrics,
    });
  } catch (error) {
    console.error("❌ Error fetching event analytics:", error.message);
    res.status(500).json({ error: "Failed to fetch event analytics" });
  }
};

/**
 * Generate comprehensive report
 * GET /api/workspaces/:workspaceId/reports/comprehensive
 */
export const generateComprehensiveReport = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { timeRange = "30d" } = req.query;

    console.log(`\n📑 Generating comprehensive report for workspace: ${workspaceId}`);

    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(timeRange.replace("d", "")) || 30;
    startDate.setDate(startDate.getDate() - days);

    const report = await generateReportData({
      workspaceId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    console.log(`✅ Comprehensive report generated successfully`);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("❌ Error generating comprehensive report:", error.message);
    res.status(500).json({ error: "Failed to generate comprehensive report" });
  }
};

console.log("✅ Analytics controller initialized");

export default {
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
};

