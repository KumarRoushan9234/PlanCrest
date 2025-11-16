import React, { useState, useEffect, useMemo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Layout } from "../../components/common-afterauth";
import { TaskSidebar } from "../../components/sidebar";
import { AuthLoader } from "../../components/loaders";
import { activityService, taskService } from "../../services";
import { projectService } from "../../services/projectService";
import notificationService from "../../services/notificationService";
import toast from "react-hot-toast";
import {
  Inbox,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
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
  Search,
  Filter,
  GitBranch,
  Code,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const OverviewPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("primary"); // primary, other, cleared
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({
    sources: [],
    priorities: [],
    unreadOnly: false,
  });

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchOverviewData();
    }
  }, [currentWorkspace]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Fetch comprehensive overview data from backend
      const overviewResponse = await projectService.getWorkspaceOverview(
        currentWorkspace._id
      );

      if (overviewResponse?.success && overviewResponse?.data) {
        const overview = overviewResponse.data;

        // Set tasks from overview data
        const allTasks = [
          ...overview.tasks.assigned,
          ...overview.tasks.overdue,
          ...overview.tasks.dueSoon,
          ...overview.tasks.completed,
        ];
        setMyTasks(allTasks);

        // Set notifications from overview data
        const allNotifications = [
          ...overview.notifications.unread,
          ...overview.notifications.read,
        ];
        setNotifications(allNotifications);

        console.log("✅ Overview data loaded:", {
          tasks: allTasks.length,
          notifications: allNotifications.length,
          activities: overview.activities.length,
          stats: overview.stats,
        });

        setActivities(overview.activities || []);
      } else {
        // Fallback to individual API calls if overview endpoint fails
        console.log(
          "📊 Overview endpoint not available, using fallback methods"
        );

        // Fetch user's assigned tasks
        const tasksResponse = await taskService.getWorkspaceTasks(
          currentWorkspace._id
        );
        if (tasksResponse?.success && tasksResponse?.data) {
          // Filter tasks assigned to current user
          const userTasks = tasksResponse.data.filter((task) => {
            return (
              task.assignedTo?.some(
                (a) => a.toString() === user._id || a._id === user._id
              ) ||
              task.createdBy?.toString() === user._id ||
              task.assignedTo?.some(
                (assignment) =>
                  assignment.user?.toString() === user._id ||
                  assignment.user?._id === user._id
              )
            );
          });
          setMyTasks(userTasks);
        } else {
          // If no tasks, create some demo data
          const demoTasks = [
            {
              _id: "demo-1",
              title: "Welcome to PlanCrest!",
              description:
                "This is your personal inbox. Tasks and notifications will appear here.",
              status: "todo",
              priority: "medium",
              createdAt: new Date().toISOString(),
              project: { name: "Getting Started", _id: "demo-project" },
              assignedTo: [{ user: user._id }],
            },
            {
              _id: "demo-2",
              title: "Create your first project",
              description: "Start by creating a project to organize your work.",
              status: "todo",
              priority: "high",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              project: { name: "Getting Started", _id: "demo-project" },
              assignedTo: [{ user: user._id }],
            },
          ];
          setMyTasks(demoTasks);
        }

        // Try to fetch notifications
        try {
          const notificationsResponse = await activityService.getNotifications({
            limit: 20,
          });
          if (notificationsResponse?.success && notificationsResponse?.data) {
            setNotifications(notificationsResponse.data);
          } else {
            // Demo notifications
            const demoNotifications = [
              {
                _id: "demo-notif-1",
                title: "Welcome to your workspace!",
                message:
                  "You've successfully joined the workspace. Start collaborating with your team.",
                type: "workspace_invite",
                isRead: false,
                priority: "high",
                source: "system",
                createdAt: new Date().toISOString(),
              },
              {
                _id: "demo-notif-2",
                title: "Getting started guide",
                message:
                  "Check out our quick start guide to make the most of PlanCrest.",
                type: "announcement",
                isRead: true,
                priority: "normal",
                source: "system",
                createdAt: new Date(Date.now() - 3600000).toISOString(),
              },
            ];
            setNotifications(demoNotifications);
          }
        } catch (error) {
          console.log("Notifications not available, using demo data", error);
          const demoNotifications = [
            {
              _id: "demo-notif-1",
              title: "Welcome to your workspace!",
              message:
                "You've successfully joined the workspace. Start collaborating with your team.",
              type: "workspace_invite",
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "demo-notif-2",
              title: "Getting started guide",
              message:
                "Check out our quick start guide to make the most of PlanCrest.",
              type: "announcement",
              isRead: true,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
          ];
          setNotifications(demoNotifications);
        }

        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      // Don't show error toast for overview - it's not critical

      // Set demo data as fallback
      const demoTasks = [
        {
          _id: "demo-1",
          title: "Welcome to PlanCrest!",
          description:
            "This is your personal inbox. Tasks and notifications will appear here.",
          status: "todo",
          priority: "medium",
          createdAt: new Date().toISOString(),
          project: { name: "Getting Started", _id: "demo-project" },
          assignedTo: [{ user: user._id }],
        },
        {
          _id: "demo-2",
          title: "Create your first project",
          description: "Start by creating a project to organize your work.",
          status: "todo",
          priority: "high",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          project: { name: "Getting Started", _id: "demo-project" },
          assignedTo: [{ user: user._id }],
        },
      ];

      const demoNotifications = [
        {
          _id: "demo-notif-1",
          title: "Welcome to your workspace!",
          message:
            "You've successfully joined the workspace. Start collaborating with your team.",
          type: "workspace_invite",
          isRead: false,
          priority: "high",
          source: "system",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "demo-notif-2",
          title: "Getting started guide",
          message:
            "Check out our quick start guide to make the most of PlanCrest.",
          type: "announcement",
          isRead: true,
          priority: "normal",
          source: "system",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      setMyTasks(demoTasks);
      setNotifications(demoNotifications);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilterValue = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const clearFilters = () => {
    setFilters({ sources: [], priorities: [], unreadOnly: false });
    setSearchQuery("");
  };

  const handleMarkNotificationAsRead = async (item) => {
    if (item.type !== "notification" || item.status === "read") return;
    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          (notification._id || notification.id) === item.id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error(error.error || "Failed to mark notification as read");
    }
  };

  const aggregatedItems = useMemo(() => {
    const items = [];
    const soonThreshold = Date.now() + 2 * 24 * 60 * 60 * 1000;

    myTasks.forEach((task) => {
      const isCompleted = task.status === "done" || task.status === "completed";
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      let priority = task.priority || "medium";
      if (!isCompleted && dueDate && dueDate.getTime() < Date.now()) {
        priority = "high";
      }

      const category = isCompleted
        ? "cleared"
        : priority === "high" || (dueDate && dueDate.getTime() <= soonThreshold)
        ? "primary"
        : "other";

      items.push({
        id: task._id,
        type: "task",
        source: "task",
        title: task.title,
        description: task.description,
        priority,
        status: isCompleted ? "completed" : "active",
        timestamp: new Date(task.createdAt),
        dueDate,
        project: task.project?.name || "Unknown Project",
        metadata: {
          projectId: task.project?._id || task.project,
        },
        category,
        taskData: task,
      });
    });

    notifications.forEach((notification) => {
      const priority = notification.priority || "normal";
      const source = notification.source || "system";
      const isRead = notification.isRead || notification.status === "read";

      let category = "other";
      if (!isRead) {
        category =
          priority === "critical" || priority === "high"
            ? "primary"
            : "primary";
      }
      if (
        notification.type === "task_completed" ||
        notification.type === "task_closed"
      ) {
        category = "cleared";
      }

      items.push({
        id: notification._id || notification.id,
        type: "notification",
        source,
        title: notification.title || "Notification",
        description: notification.message || notification.description,
        priority,
        status: isRead ? "read" : "unread",
        timestamp: new Date(notification.createdAt || notification.timestamp),
        metadata: notification.metadata,
        link: notification.link,
        category,
        raw: notification,
      });
    });

    activities.forEach((activity) => {
      items.push({
        id: activity._id || activity.id || Math.random().toString(36),
        type: "activity",
        source: "activity",
        title: activity.description || activity.action || "Workspace update",
        description: activity.metadata?.targetName || "",
        priority: "low",
        status: "info",
        timestamp: new Date(activity.timestamp),
        metadata: activity.metadata,
        category: "other",
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [myTasks, notifications, activities]);

  const uniqueSources = useMemo(() => {
    const set = new Set();
    aggregatedItems.forEach((item) => {
      if (item.source) {
        set.add(item.source);
      }
    });
    return Array.from(set);
  }, [aggregatedItems]);

  const uniquePriorities = useMemo(() => {
    const set = new Set();
    aggregatedItems.forEach((item) => {
      if (item.priority) {
        set.add(item.priority);
      }
    });
    return Array.from(set);
  }, [aggregatedItems]);

  const filteredItems = useMemo(() => {
    return aggregatedItems.filter((item) => {
      if (
        filters.unreadOnly &&
        item.type === "notification" &&
        item.status === "read"
      ) {
        return false;
      }

      if (filters.sources.length && item.source) {
        if (!filters.sources.includes(item.source)) {
          return false;
        }
      }

      if (filters.priorities.length) {
        const priority = item.priority || "normal";
        if (!filters.priorities.includes(priority)) {
          return false;
        }
      }

      if (searchQuery) {
        const haystack = `${item.title || ""} ${
          item.description || ""
        }`.toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [aggregatedItems, filters, searchQuery]);

  const primaryItems = filteredItems.filter(
    (item) => item.category === "primary"
  );
  const otherItems = filteredItems.filter((item) => item.category === "other");
  const clearedItems = filteredItems.filter(
    (item) => item.category === "cleared"
  );

  const hasActiveFilters =
    filters.sources.length > 0 ||
    filters.priorities.length > 0 ||
    filters.unreadOnly ||
    !!searchQuery;

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

  const getPriorityColor = (priority = "normal") => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-400 bg-gray-600/10 border-gray-700";
    }
  };

  const getTypeIcon = (item) => {
    if (item.type === "task") return <Target className="w-4 h-4" />;
    if (item.type === "notification") {
      if (item.source === "github")
        return <FaGithub className="w-4 h-4 text-purple-400" />;
      if (item.source === "calendar") return <Calendar className="w-4 h-4" />;
      if (item.source === "activity") return <Activity className="w-4 h-4" />;
      return <AlertCircle className="w-4 h-4" />;
    }
    if (item.type === "activity") return <Activity className="w-4 h-4" />;
    return <Inbox className="w-4 h-4" />;
  };

  const formatTimeAgo = (value) => {
    if (!value) return "moments ago";
    const timestamp =
      value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (!timestamp) return "moments ago";

    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
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
        <Motion.div
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
              <Motion.button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    unreadOnly: !prev.unreadOnly,
                  }))
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mr-3 ${
                  filters.unreadOnly
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <Filter className="w-4 h-4" />
                {filters.unreadOnly ? "Unread only" : "All items"}
              </Motion.button>
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
                <Motion.button
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
                </Motion.button>
              ))}
            </div>
          </div>
        </Motion.div>

        {(uniqueSources.length > 0 || uniquePriorities.length > 0) && (
          <div className="px-6 py-3 border-b border-gray-900 flex flex-wrap items-center gap-3">
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Sources
                </span>
                {uniqueSources.map((source) => {
                  const active = filters.sources.includes(source);
                  return (
                    <button
                      key={source}
                      onClick={() => toggleFilterValue("sources", source)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        active
                          ? "border-purple-500 text-purple-300 bg-purple-500/10"
                          : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      {source}
                    </button>
                  );
                })}
              </div>
            )}

            {uniquePriorities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Priority
                </span>
                {uniquePriorities.map((priority) => {
                  const active = filters.priorities.includes(priority);
                  return (
                    <button
                      key={priority}
                      onClick={() => toggleFilterValue("priorities", priority)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        active
                          ? "border-blue-500 text-blue-300 bg-blue-500/10"
                          : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-gray-500 hover:text-gray-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Inbox Content */}
        <div className="h-[calc(100vh-140px)] overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeTab}
              className="space-y-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getItemsByTab().length === 0 ? (
                <Motion.div
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
                </Motion.div>
              ) : (
                getItemsByTab().map((item, index) => (
                  <Motion.div
                    key={`${item.id}-${item.type}-${index}`}
                    className="group bg-gray-900/50 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all duration-200 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      if (item.type === "task" && item.taskData) {
                        // Ensure project is properly set for TaskSidebar
                        const taskWithProject = {
                          ...item.taskData,
                          project: item.taskData.project || {
                            _id: item.taskData.project,
                          },
                        };
                        setSelectedTask(taskWithProject);
                        setIsTaskSidebarOpen(true);
                      } else if (item.type === "notification" && item.link) {
                        // Navigate to notification link (e.g., chat channel)
                        navigate(item.link);
                        // Mark notification as read
                        if (item.raw && !item.raw.isRead) {
                          handleMarkNotificationAsRead(item);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                          {getTypeIcon(item)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-wrap gap-2">
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
                            {item.source && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border border-gray-700 text-gray-400">
                                {item.source}
                              </span>
                            )}
                            {item.type === "notification" &&
                              item.status === "unread" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] text-yellow-300 border border-yellow-500/40">
                                  Unread
                                </span>
                              )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {item.type === "task" ? (
                              <>
                                <Motion.button
                                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Motion.button>
                                <Motion.button
                                  className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Motion.button>
                                <Motion.button
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <X className="w-4 h-4" />
                                </Motion.button>
                              </>
                            ) : item.type === "notification" &&
                              item.status === "unread" ? (
                              <Motion.button
                                className="px-2 py-1 text-[11px] text-blue-300 border border-blue-500/40 rounded hover:bg-blue-500/10"
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkNotificationAsRead(item);
                                }}
                              >
                                Mark read
                              </Motion.button>
                            ) : null}
                            <Motion.button
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Motion.button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {item.project && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{item.project}</span>
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {item.completedDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed{" "}
                              {new Date(
                                item.completedDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {item.metadata?.repository && (
                            <span className="flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              {item.metadata.repository}
                            </span>
                          )}
                          {item.metadata?.actor && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {item.metadata.actor}
                            </span>
                          )}
                          <div className="ml-auto text-xs text-gray-500">
                            {formatTimeAgo(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Motion.div>
                ))
              )}
            </Motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => {
          setIsTaskSidebarOpen(false);
          setSelectedTask(null);
          // Refresh overview data
          fetchOverviewData();
        }}
        task={selectedTask}
        project={selectedTask?.project}
        onUpdate={(updatedTask) => {
          setSelectedTask(updatedTask);
          // Update local task list
          setMyTasks((prevTasks) =>
            prevTasks.map((task) =>
              task._id === updatedTask._id ? updatedTask : task
            )
          );
        }}
        onDelete={() => {
          setIsTaskSidebarOpen(false);
          setSelectedTask(null);
          // Refresh overview data
          fetchOverviewData();
        }}
      />
    </Layout>
  );
};

export default OverviewPage;
