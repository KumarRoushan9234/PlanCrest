import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Users,
  Edit,
  Trash2,
  Plus,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { projectService } from "../../services/projectService";

const ActivityPanel = ({ project }) => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    if (project?._id) {
      fetchActivityData();
    }
  }, [project?._id, timeRange]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const [activityRes, statsRes] = await Promise.all([
        projectService.getProjectActivity(project._id, timeRange),
        projectService.getProjectStats(project._id),
      ]);
      setActivities(activityRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "created":
        return <Plus className="w-4 h-4 text-green-500" />;
      case "updated":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "assigned":
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case "created":
        return "bg-green-500";
      case "updated":
        return "bg-blue-500";
      case "deleted":
        return "bg-red-500";
      case "completed":
        return "bg-green-500";
      case "assigned":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Project Activity</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm font-medium">
                Tasks Completed
              </h4>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {stats.completedTasks || 0}
            </p>
            <p className="text-sm text-gray-400">
              of {stats.totalTasks || 0} total tasks
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm font-medium">
                Active Members
              </h4>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {stats.activeMembers || 0}
            </p>
            <p className="text-sm text-gray-400">contributors this week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-sm font-medium">
                Progress Rate
              </h4>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {stats.progressRate || 0}%
            </p>
            <p className="text-sm text-gray-400">completion rate</p>
          </motion.div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </h4>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No activity yet
            </h3>
            <p className="text-gray-500">
              Activity will appear here as team members work on the project
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 pb-4 border-b border-gray-700 last:border-b-0 last:pb-0"
              >
                {/* Activity Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                    activity.action
                  )}/20`}
                >
                  {getActivityIcon(activity.action)}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">
                        <span className="font-medium">
                          {activity.user?.name || "Someone"}
                        </span>{" "}
                        <span className="text-gray-400">
                          {activity.action} {activity.itemType}{" "}
                          {activity.metadata?.title && (
                            <span className="font-medium text-white">
                              "{activity.metadata.title}"
                            </span>
                          )}
                        </span>
                      </p>
                      {activity.changes &&
                        Object.keys(activity.changes).length > 0 && (
                          <p className="text-gray-500 text-xs mt-1">
                            Changes:{" "}
                            {Object.keys(activity.changes)
                              .slice(0, 3)
                              .join(", ")}
                          </p>
                        )}
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Placeholder */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Project Insights
        </h4>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-500">
            Charts and graphs will be available here to visualize project
            progress
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
