import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Layout } from "../../components/common-afterauth";
import { AuthLoader } from "../../components/loaders";
import { activityService } from "../../services";
import toast from "react-hot-toast";
import {
  Activity,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  FileText,
  Upload,
  Download,
  UserPlus,
  UserMinus,
  Clock,
  Calendar,
  Filter,
  Search,
} from "lucide-react";

const ActivityPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState([]);

  // Fetch activities when workspace changes
  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchActivities();
    }
  }, [currentWorkspace, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const filters = filter !== "all" ? { type: filter } : {};
      const response = await activityService.getWorkspaceActivity(
        currentWorkspace._id,
        filters
      );

      if (response?.success && response?.data) {
        setActivities(response.data);
      } else {
        // If no activity endpoint yet, use mock data
        const mockActivities = [
          {
            _id: "activity-1",
            action: "created a new project",
            description: "Project 'Website Redesign' has been created",
            type: "project_created",
            user: {
              _id: user._id,
              name: user.name || "You",
              avatar: user.avatar,
            },
            target: "Website Redesign",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            metadata: { projectId: "proj-1" },
          },
          {
            _id: "activity-2",
            action: "completed a task",
            description: "Task 'Design homepage layout' has been completed",
            type: "task_completed",
            user: {
              _id: user._id,
              name: user.name || "You",
              avatar: user.avatar,
            },
            target: "Design homepage layout",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            metadata: { taskId: "task-1" },
          },
          {
            _id: "activity-3",
            action: "added a team member",
            description: "John Doe has been added to the project",
            type: "member_added",
            user: {
              _id: "user-2",
              name: "John Doe",
              avatar:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
            },
            target: "Website Redesign",
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            metadata: { memberId: "user-2" },
          },
        ];
        setActivities(mockActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Don't show error toast if endpoint doesn't exist yet
      if (error?.status !== 404) {
        toast.error("Failed to load activities");
      }
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  };

  // Helper to get activity icon and styling
  const getActivityStyle = (type) => {
    const typeMap = {
      task_completed: {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      },
      task_created: {
        icon: Plus,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      },
      task_updated: {
        icon: Edit,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      },
      project_created: {
        icon: Plus,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
      },
      project_updated: {
        icon: Edit,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10",
      },
      comment: {
        icon: MessageCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      file_upload: {
        icon: Upload,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
      },
      member_added: {
        icon: UserPlus,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
      },
      member_removed: {
        icon: UserMinus,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      },
      workspace_invite: {
        icon: UserPlus,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      announcement: {
        icon: MessageCircle,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
      },
    };
    return (
      typeMap[type] || {
        icon: Activity,
        color: "text-gray-500",
        bgColor: "bg-gray-500/10",
      }
    );
  };

  const filterOptions = [
    { value: "all", label: "All Activity" },
    { value: "task_created", label: "Tasks" },
    { value: "project_created", label: "Projects" },
    { value: "member_added", label: "Members" },
    { value: "comment", label: "Comments" },
  ];

  // Activities are already filtered by the API call when filter changes
  const filteredActivities = activities;

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading activity..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-6 py-6" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Top Actions */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
              {filterOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    filter === option.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Last updated: just now
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <motion.div
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {filteredActivities.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Activity Yet
                </h3>
                <p className="text-gray-400">
                  Activity logs will appear here once team members start working
                </p>
              </div>
            ) : (
              filteredActivities.map((activity, index) => {
                const style = getActivityStyle(
                  activity.type || activity.action
                );
                const IconComponent = style.icon;
                const userName =
                  activity.user?.name || activity.user || "Unknown";
                const userAvatar = activity.user?.avatar || activity.avatar;
                const timestamp = new Date(
                  activity.timestamp || activity.createdAt
                );

                return (
                  <motion.div
                    key={activity._id || activity.id || index}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center border-2 border-gray-700">
                          <span className="text-white font-medium text-sm">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-medium text-white">
                              {userName}
                            </span>
                            <span className="text-sm text-gray-400">
                              {activity.action || activity.description}
                            </span>
                            {activity.target && (
                              <span className="text-sm font-medium text-blue-400">
                                {activity.target}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatTimeAgo(timestamp)}
                          </span>
                        </div>

                        {(activity.comment || activity.details) && (
                          <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300 mt-2">
                            "{activity.comment || activity.details}"
                          </div>
                        )}
                      </div>

                      {/* Icon */}
                      <div className={`p-2 ${style.bgColor} rounded-lg`}>
                        <IconComponent className={`w-4 h-4 ${style.color}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Activity Stats Sidebar */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Today's Activity */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Today's Activity
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Tasks Completed",
                    value: "8",
                    icon: CheckCircle2,
                    color: "text-green-500",
                  },
                  {
                    label: "Comments",
                    value: "12",
                    icon: MessageCircle,
                    color: "text-blue-500",
                  },
                  {
                    label: "Files Uploaded",
                    value: "5",
                    icon: Upload,
                    color: "text-orange-500",
                  },
                  {
                    label: "Updates",
                    value: "15",
                    icon: Activity,
                    color: "text-purple-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Most Active Today
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "John Doe",
                    activities: 12,
                    avatar:
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
                  },
                  {
                    name: "Jane Smith",
                    activities: 10,
                    avatar:
                      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
                  },
                  {
                    name: "Mike Johnson",
                    activities: 8,
                    avatar:
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
                  },
                ].map((user, index) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-700"
                      />
                      <span className="text-sm text-white">{user.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {user.activities}
                      </span>
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Timeline
              </h3>
              <div className="space-y-3">
                {[
                  { time: "9:00 AM", count: 5 },
                  { time: "12:00 PM", count: 8 },
                  { time: "3:00 PM", count: 12 },
                  { time: "6:00 PM", count: 7 },
                ].map((slot) => (
                  <div key={slot.time}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{slot.time}</span>
                      <span className="text-xs font-medium text-white">
                        {slot.count} activities
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(slot.count / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ActivityPage;
