import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import Project from "../models/project.js";
import CalendarEvent from "../models/calendarEvent.js";
import TimeEntry from "../models/timeEntry.js";
import WorkspaceMember from "../models/workspaceMember.js";

/**
 * Calculate task metrics for a workspace or project
 */
export const calculateTaskMetrics = async ({ workspaceId, projectId, startDate, endDate }) => {
  try {
    console.log(`\n📊 Calculating task metrics`);
    console.log(`🏢 Workspace: ${workspaceId || "N/A"}`);
    console.log(`📂 Project: ${projectId || "N/A"}`);
    
    const query = {
      isArchived: false,
    };
    
    if (projectId) {
      query.project = projectId;
    } else if (workspaceId) {
      const projects = await Project.find({ workspace: workspaceId }).select("_id");
      query.project = { $in: projects.map((p) => p._id) };
    }
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const tasks = await Task.find(query);
    
    console.log(`📊 Found ${tasks.length} tasks`);
    
    // Calculate metrics
    const metrics = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      completed: 0,
      inProgress: 0,
      todo: 0,
      overdue: 0,
      completionRate: 0,
      averageCompletionTime: 0,
    };
    
    const now = new Date();
    let totalCompletionTime = 0;
    let completedCount = 0;
    
    tasks.forEach((task) => {
      // By status
      metrics.byStatus[task.status] = (metrics.byStatus[task.status] || 0) + 1;
      
      // By priority
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      
      // Status counts
      if (task.status === "done" || task.status === "completed") {
        metrics.completed++;
        
        // Calculate completion time
        if (task.completedAt && task.createdAt) {
          const completionTime = task.completedAt - task.createdAt;
          totalCompletionTime += completionTime;
          completedCount++;
        }
      } else if (task.status === "in-progress" || task.status === "in_progress") {
        metrics.inProgress++;
      } else if (task.status === "todo" || task.status === "backlog") {
        metrics.todo++;
      }
      
      // Overdue tasks
      if (task.dueDate && task.dueDate < now && task.status !== "done" && task.status !== "completed") {
        metrics.overdue++;
      }
    });
    
    // Calculate rates
    metrics.completionRate = tasks.length > 0 ? (metrics.completed / tasks.length) * 100 : 0;
    metrics.averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : 0;
    
    console.log(`✅ Task metrics calculated`);
    console.log(`   Total: ${metrics.total}, Completed: ${metrics.completed}, Overdue: ${metrics.overdue}`);
    
    return metrics;
  } catch (error) {
    console.error("❌ Error calculating task metrics:", error.message);
    throw error;
  }
};

/**
 * Calculate team performance metrics
 */
export const calculateTeamPerformance = async ({ workspaceId, startDate, endDate }) => {
  try {
    console.log(`\n👥 Calculating team performance for workspace: ${workspaceId}`);
    
    const members = await WorkspaceMember.find({
      workspace: workspaceId,
      status: "active",
    }).populate("user", "name email");
    
    console.log(`📊 Found ${members.length} active team members`);
    
    const performance = await Promise.all(
      members.map(async (member) => {
        const userId = member.user._id;
        
        // Get tasks assigned to this user
        const assignments = await TaskAssignment.find({
          user: userId,
          role: "assignee",
        }).populate({
          path: "task",
          match: {
            isArchived: false,
            ...(startDate && endDate
              ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
              : {}),
          },
        });
        
        const tasks = assignments.map((a) => a.task).filter(Boolean);
        
        const completedTasks = tasks.filter(
          (t) => t.status === "done" || t.status === "completed"
        );
        
        const overdueTasks = tasks.filter(
          (t) =>
            t.dueDate &&
            t.dueDate < new Date() &&
            t.status !== "done" &&
            t.status !== "completed"
        );
        
        // Get time entries
        const timeEntries = await TimeEntry.find({
          user: userId,
          ...(startDate && endDate
            ? { startTime: { $gte: new Date(startDate), $lte: new Date(endDate) } }
            : {}),
        });
        
        const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;
        
        return {
          user: {
            id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
          },
          metrics: {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            overdueTasks: overdueTasks.length,
            completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
            hoursLogged: totalHours,
            averageHoursPerTask: completedTasks.length > 0 ? totalHours / completedTasks.length : 0,
          },
        };
      })
    );
    
    console.log(`✅ Team performance calculated for ${performance.length} members`);
    return performance;
  } catch (error) {
    console.error("❌ Error calculating team performance:", error.message);
    throw error;
  }
};

/**
 * Generate burnup chart data
 */
export const generateBurnupData = async ({ projectId, startDate, endDate }) => {
  try {
    console.log(`\n📈 Generating burnup chart data for project: ${projectId}`);
    
    const tasks = await Task.find({
      project: projectId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      isArchived: false,
    }).sort({ createdAt: 1 });
    
    console.log(`📊 Found ${tasks.length} tasks in date range`);
    
    const dataPoints = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate daily data points
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      
      const totalTasks = tasks.filter((t) => t.createdAt <= currentDate).length;
      
      const completedTasks = tasks.filter(
        (t) =>
          t.completedAt &&
          t.completedAt <= currentDate &&
          (t.status === "done" || t.status === "completed")
      ).length;
      
      dataPoints.push({
        date: currentDate.toISOString().split("T")[0],
        total: totalTasks,
        completed: completedTasks,
        remaining: totalTasks - completedTasks,
      });
    }
    
    console.log(`✅ Generated ${dataPoints.length} data points for burnup chart`);
    return dataPoints;
  } catch (error) {
    console.error("❌ Error generating burnup data:", error.message);
    throw error;
  }
};

/**
 * Generate velocity chart data (tasks completed per time period)
 */
export const generateVelocityData = async ({ projectId, startDate, endDate, period = "week" }) => {
  try {
    console.log(`\n🚀 Generating velocity data for project: ${projectId}`);
    console.log(`📅 Period: ${period}`);
    
    const tasks = await Task.find({
      project: projectId,
      completedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $in: ["done", "completed"] },
      isArchived: false,
    }).sort({ completedAt: 1 });
    
    console.log(`📊 Found ${tasks.length} completed tasks`);
    
    const velocityData = {};
    
    tasks.forEach((task) => {
      const date = new Date(task.completedAt);
      let periodKey;
      
      switch (period) {
        case "day":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          periodKey = date.toISOString().split("T")[0];
      }
      
      if (!velocityData[periodKey]) {
        velocityData[periodKey] = {
          period: periodKey,
          tasksCompleted: 0,
          totalHours: 0,
        };
      }
      
      velocityData[periodKey].tasksCompleted++;
      if (task.actualHours) {
        velocityData[periodKey].totalHours += task.actualHours;
      }
    });
    
    const dataPoints = Object.values(velocityData).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
    
    console.log(`✅ Generated ${dataPoints.length} velocity data points`);
    return dataPoints;
  } catch (error) {
    console.error("❌ Error generating velocity data:", error.message);
    throw error;
  }
};

/**
 * Calculate time tracking metrics
 */
export const calculateTimeTracking = async ({ workspaceId, projectId, userId, startDate, endDate }) => {
  try {
    console.log(`\n⏱️ Calculating time tracking metrics`);
    
    const query = {};
    
    if (userId) {
      query.user = userId;
    }
    
    if (projectId) {
      const tasks = await Task.find({ project: projectId }).select("_id");
      query.task = { $in: tasks.map((t) => t._id) };
    }
    
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const timeEntries = await TimeEntry.find(query).populate("user task");
    
    console.log(`📊 Found ${timeEntries.length} time entries`);
    
    const metrics = {
      totalEntries: timeEntries.length,
      totalMinutes: 0,
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      byUser: {},
      byTask: {},
      byDate: {},
    };
    
    timeEntries.forEach((entry) => {
      const minutes = entry.duration || 0;
      const hours = minutes / 60;
      
      metrics.totalMinutes += minutes;
      metrics.totalHours += hours;
      
      if (entry.isBillable) {
        metrics.billableHours += hours;
      } else {
        metrics.nonBillableHours += hours;
      }
      
      // By user
      const userId = entry.user._id.toString();
      if (!metrics.byUser[userId]) {
        metrics.byUser[userId] = {
          userName: entry.user.name,
          hours: 0,
          entries: 0,
        };
      }
      metrics.byUser[userId].hours += hours;
      metrics.byUser[userId].entries++;
      
      // By task
      if (entry.task) {
        const taskId = entry.task._id.toString();
        if (!metrics.byTask[taskId]) {
          metrics.byTask[taskId] = {
            taskTitle: entry.task.title,
            hours: 0,
            entries: 0,
          };
        }
        metrics.byTask[taskId].hours += hours;
        metrics.byTask[taskId].entries++;
      }
      
      // By date
      const date = entry.startTime.toISOString().split("T")[0];
      if (!metrics.byDate[date]) {
        metrics.byDate[date] = 0;
      }
      metrics.byDate[date] += hours;
    });
    
    console.log(`✅ Time tracking metrics calculated`);
    console.log(`   Total hours: ${metrics.totalHours.toFixed(2)}, Entries: ${metrics.totalEntries}`);
    
    return metrics;
  } catch (error) {
    console.error("❌ Error calculating time tracking:", error.message);
    throw error;
  }
};

/**
 * Calculate calendar metrics
 */
export const calculateCalendarMetrics = async ({ workspaceId, startDate, endDate }) => {
  try {
    console.log(`\n📅 Calculating calendar metrics for workspace: ${workspaceId}`);
    
    const events = await CalendarEvent.find({
      workspace: workspaceId,
      startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      isArchived: false,
    });
    
    console.log(`📊 Found ${events.length} calendar events`);
    
    const metrics = {
      totalEvents: events.length,
      byCategory: {},
      byStatus: {},
      totalMeetingHours: 0,
      averageAttendees: 0,
      recurringEvents: 0,
      cancelledEvents: 0,
    };
    
    let totalAttendees = 0;
    
    events.forEach((event) => {
      // By category
      metrics.byCategory[event.category] = (metrics.byCategory[event.category] || 0) + 1;
      
      // By status
      metrics.byStatus[event.status] = (metrics.byStatus[event.status] || 0) + 1;
      
      // Duration
      const duration = (event.endDate - event.startDate) / (1000 * 60 * 60);
      metrics.totalMeetingHours += duration;
      
      // Attendees
      totalAttendees += event.attendees.length;
      
      // Recurring
      if (event.recurring?.enabled) {
        metrics.recurringEvents++;
      }
      
      // Cancelled
      if (event.status === "cancelled") {
        metrics.cancelledEvents++;
      }
    });
    
    metrics.averageAttendees = events.length > 0 ? totalAttendees / events.length : 0;
    
    console.log(`✅ Calendar metrics calculated`);
    console.log(`   Total events: ${metrics.totalEvents}, Meeting hours: ${metrics.totalMeetingHours.toFixed(2)}`);
    
    return metrics;
  } catch (error) {
    console.error("❌ Error calculating calendar metrics:", error.message);
    throw error;
  }
};

/**
 * Calculate event metrics
 */
export const calculateEventMetrics = async (eventId) => {
  try {
    console.log(`\n📊 Calculating metrics for event: ${eventId}`);
    
    const event = await CalendarEvent.findById(eventId).populate("attendees.user");
    
    if (!event) {
      throw new Error("Event not found");
    }
    
    const metrics = {
      totalAttendees: event.attendees.length,
      responses: {
        accepted: 0,
        declined: 0,
        tentative: 0,
        pending: 0,
      },
      responseRate: 0,
      duration: 0,
    };
    
    event.attendees.forEach((attendee) => {
      metrics.responses[attendee.response]++;
    });
    
    const responded = metrics.responses.accepted + metrics.responses.declined + metrics.responses.tentative;
    metrics.responseRate = metrics.totalAttendees > 0 ? (responded / metrics.totalAttendees) * 100 : 0;
    metrics.duration = (event.endDate - event.startDate) / (1000 * 60); // minutes
    
    console.log(`✅ Event metrics calculated`);
    return metrics;
  } catch (error) {
    console.error("❌ Error calculating event metrics:", error.message);
    throw error;
  }
};

/**
 * Generate comprehensive report data
 */
export const generateReportData = async ({ workspaceId, startDate, endDate }) => {
  try {
    console.log(`\n📑 Generating comprehensive report data`);
    console.log(`🏢 Workspace: ${workspaceId}`);
    console.log(`📅 Range: ${startDate} to ${endDate}`);
    
    const [taskMetrics, teamPerformance, timeTracking, calendarMetrics] = await Promise.all([
      calculateTaskMetrics({ workspaceId, startDate, endDate }),
      calculateTeamPerformance({ workspaceId, startDate, endDate }),
      calculateTimeTracking({ workspaceId, startDate, endDate }),
      calculateCalendarMetrics({ workspaceId, startDate, endDate }),
    ]);
    
    const report = {
      workspace: workspaceId,
      period: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date(),
      tasks: taskMetrics,
      team: teamPerformance,
      timeTracking,
      calendar: calendarMetrics,
      summary: {
        totalTasks: taskMetrics.total,
        completionRate: taskMetrics.completionRate,
        totalHoursLogged: timeTracking.totalHours,
        totalMeetings: calendarMetrics.totalEvents,
        teamSize: teamPerformance.length,
      },
    };
    
    console.log(`✅ Comprehensive report generated successfully`);
    return report;
  } catch (error) {
    console.error("❌ Error generating report data:", error.message);
    throw error;
  }
};

console.log("✅ Analytics helpers initialized");

export default {
  calculateTaskMetrics,
  calculateTeamPerformance,
  generateBurnupData,
  generateVelocityData,
  calculateTimeTracking,
  calculateCalendarMetrics,
  calculateEventMetrics,
  generateReportData,
};

