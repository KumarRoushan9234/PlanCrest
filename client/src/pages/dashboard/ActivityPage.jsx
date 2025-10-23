import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/common-afterauth";
import LoadingSpinner from "../../components/LoadingSpinner";
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
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

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

  // Mock activity data
  const activities = [
    {
      id: 1,
      type: "task_completed",
      user: "John Doe",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      action: "completed task",
      target: "Design new landing page",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: 2,
      type: "comment",
      user: "Jane Smith",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
      action: "commented on",
      target: "API Development",
      comment: "Great progress on this! Let's review tomorrow.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: 3,
      type: "task_created",
      user: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      action: "created task",
      target: "Fix responsive layout issues",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: Plus,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: 4,
      type: "file_upload",
      user: "Sarah Wilson",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
      action: "uploaded file",
      target: "design-mockups-v2.fig",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      icon: Upload,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      id: 5,
      type: "task_updated",
      user: "Alex Brown",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
      action: "updated task",
      target: "Implement user authentication",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: Edit,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      id: 6,
      type: "member_added",
      user: "Emily Davis",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face",
      action: "added",
      target: "Tom Wilson to the team",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      icon: UserPlus,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      id: 7,
      type: "task_completed",
      user: "John Doe",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      action: "completed task",
      target: "Write API documentation",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: 8,
      type: "comment",
      user: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      action: "commented on",
      target: "Database optimization",
      comment: "I think we should also consider indexing strategies.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const filterOptions = [
    { value: "all", label: "All Activity" },
    { value: "tasks", label: "Tasks" },
    { value: "comments", label: "Comments" },
    { value: "files", label: "Files" },
    { value: "members", label: "Members" },
  ];

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    if (filter === "tasks") return activity.type.includes("task");
    if (filter === "comments") return activity.type === "comment";
    if (filter === "files") return activity.type.includes("file");
    if (filter === "members") return activity.type.includes("member");
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div
           className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0a0a0b" }}
        >
          <LoadingSpinner fullScreen text="Loading activity..." />
        </div>
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
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <img
                    src={activity.avatar}
                    alt={activity.user}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">
                          {activity.user}
                        </span>
                        <span className="text-sm text-gray-400">
                          {activity.action}
                        </span>
                        <span className="text-sm font-medium text-blue-400">
                          {activity.target}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>

                    {activity.comment && (
                      <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300 mt-2">
                        "{activity.comment}"
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`p-2 ${activity.bgColor} rounded-lg`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
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
