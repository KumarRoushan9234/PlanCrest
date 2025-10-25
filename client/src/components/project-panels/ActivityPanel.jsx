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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - SMALLER & DARKER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Activity Feed</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Track project changes and updates
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white focus:border-blue-600 focus:outline-none transition-colors"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Activity Stats - SMALLER & DARKER */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <motion.div
            className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3"
            whileHover={{ y: -1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 uppercase font-semibold">
                Total Activities
              </span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-white">
              {stats.totalActivities || 0}
            </p>
          </motion.div>
          <motion.div
            className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3"
            whileHover={{ y: -1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 uppercase font-semibold">
                Tasks Created
              </span>
              <Plus className="w-3.5 h-3.5 text-green-400" />
            </div>
            <p className="text-lg font-bold text-white">
              {stats.tasksCreated || 0}
            </p>
          </motion.div>
          <motion.div
            className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3"
            whileHover={{ y: -1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 uppercase font-semibold">
                Active Users
              </span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-white">
              {stats.activeUsers || 0}
            </p>
          </motion.div>
        </div>
      )}

      {/* Activity List - SMALLER & DARKER */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No activities yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-r from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-all"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs truncate">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {activity.user?.name || "Unknown user"} •{" "}
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Placeholder - SMALLER & DARKER */}
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2 flex items-center gap-1.5 text-xs">
          <BarChart3 className="w-3.5 h-3.5" />
          Project Insights
        </h4>
        <div className="text-center py-6">
          <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-400 mb-1">
            Coming Soon
          </h3>
          <p className="text-[10px] text-gray-600">
            Charts and graphs will be available here to visualize project
            progress
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
