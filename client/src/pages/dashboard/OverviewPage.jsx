import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Layout } from "../../components/common-afterauth";
import { TaskSidebar } from "../../components/sidebar";
import { AuthLoader } from "../../components/loaders";
import { activityService, taskService } from "../../services";
import toast from "react-hot-toast";
import {
  Inbox,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Target,
  Archive,
  Star,
  MoreVertical,
  X,
  Eye,
  Trash2,
  Search,
} from "lucide-react";

const OverviewPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("primary"); // primary, other, cleared
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchOverviewData();
    }
  }, [currentWorkspace]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Fetch user's assigned tasks
      const tasksResponse = await taskService.getWorkspaceTasks(
        currentWorkspace._id
      );

      if (tasksResponse?.success && tasksResponse?.data) {
        // Filter tasks assigned to current user
        const userTasks = tasksResponse.data.filter((task) => {
          // Check if user is in the task's assignedTo array
          return task.assignedTo?.some(
            (a) => a.toString() === user._id || a._id === user._id
          );
        });
        setMyTasks(userTasks);
      }

      // Try to fetch notifications
      try {
        const notificationsResponse = await activityService.getNotifications({
          limit: 20,
        });
        if (notificationsResponse?.success && notificationsResponse?.data) {
          setNotifications(notificationsResponse.data);
        }
      } catch (error) {
        // If notifications endpoint doesn't exist, use empty array
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      toast.error("Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  // Transform tasks into inbox items
  const taskItems = myTasks
    .filter((task) => task.status !== "done" && task.status !== "completed")
    .map((task) => ({
      id: task._id,
      type: "task",
      title: task.title,
      description: task.description,
      priority: task.priority || "medium",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      project: task.project?.name || "Unknown Project",
      status: task.status,
      timestamp: new Date(task.createdAt),
      taskData: task, // Store full task data for sidebar
    }));

  // Transform notifications into inbox items
  const notificationItems = notifications.map((notification) => ({
    id: notification._id || notification.id,
    type: notification.type || "notification",
    title: notification.title || notification.message,
    description: notification.description || notification.details,
    priority: "low",
    status: notification.read ? "read" : "unread",
    timestamp: new Date(notification.createdAt || notification.timestamp),
  }));

  // Primary items: Urgent tasks and unread notifications
  const primaryItems = [
    ...taskItems.filter(
      (t) =>
        t.priority === "high" ||
        (t.dueDate &&
          new Date(t.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
    ),
    ...notificationItems.filter((n) => n.status === "unread"),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Other items: Lower priority tasks and read notifications
  const otherItems = [
    ...taskItems.filter(
      (t) =>
        t.priority !== "high" &&
        (!t.dueDate ||
          new Date(t.dueDate) >= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
    ),
    ...notificationItems.filter((n) => n.status === "read"),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Cleared items: Completed tasks
  const clearedItems = myTasks
    .filter((task) => task.status === "done" || task.status === "completed")
    .map((task) => ({
      id: task._id,
      type: "task",
      title: task.title,
      description: task.description,
      priority: task.priority || "medium",
      completedDate: task.completedAt ? new Date(task.completedAt) : null,
      project: task.project?.name || "Unknown Project",
      status: "completed",
      timestamp: new Date(task.createdAt),
      taskData: task,
    }))
    .sort((a, b) => b.completedDate - a.completedDate);

  const getItemsByTab = () => {
    switch (activeTab) {
      case "primary":
        return primaryItems;
      case "other":
        return otherItems;
      case "cleared":
        return clearedItems;
      default:
        return primaryItems;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "task":
        return <Target className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      case "meeting":
        return <Calendar className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "notification":
        return <AlertCircle className="w-4 h-4" />;
      case "announcement":
        return <Users className="w-4 h-4" />;
      case "update":
        return <Star className="w-4 h-4" />;
      default:
        return <Inbox className="w-4 h-4" />;
    }
  };

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

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading inbox..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full h-screen" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Tabs Header */}
        <motion.div
          className="border-b border-gray-800 px-6 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            {/* Left Side - Search Bar */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {currentWorkspace?.name || "Workspace"}
              </div>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inbox..."
                  className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-64"
                />
              </div>
            </div>

            {/* Right Side - Tab Buttons */}
            <div className="flex items-center space-x-1">
              {[
                {
                  id: "primary",
                  label: "Primary",
                  count: primaryItems.length,
                  icon: Inbox,
                },
                {
                  id: "other",
                  label: "Other",
                  count: otherItems.length,
                  icon: Star,
                },
                {
                  id: "cleared",
                  label: "Cleared",
                  count: clearedItems.length,
                  icon: Archive,
                },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Inbox Content */}
        <div className="h-[calc(100vh-140px)] overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="space-y-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getItemsByTab().length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-400 mb-2">
                    All clear!
                  </p>
                  <p className="text-sm text-gray-500">
                    No items in this section
                  </p>
                </motion.div>
              ) : (
                getItemsByTab().map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="group bg-gray-900/50 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all duration-200 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      if (item.type === "task" && item.taskData) {
                        setSelectedTask(item.taskData);
                        setIsTaskSidebarOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                          {getTypeIcon(item.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-white">
                              {item.title}
                            </h3>
                            {item.priority && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                                  item.priority
                                )}`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.button
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">
                          {item.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {item.project && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{item.project}</span>
                            </div>
                          )}
                          {item.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Due{" "}
                                {new Date(item.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {item.completedDate && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                Completed{" "}
                                {new Date(
                                  item.completedDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {item.assignedBy && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>From {item.assignedBy}</span>
                            </div>
                          )}
                          <div className="ml-auto">
                            {formatTimeAgo(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => setIsTaskSidebarOpen(false)}
        task={selectedTask}
        onUpdate={(updatedTask) => setSelectedTask(updatedTask)}
        onDelete={() => setIsTaskSidebarOpen(false)}
      />
    </Layout>
  );
};

export default OverviewPage;
