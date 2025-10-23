import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Layout } from "../../components/common-afterauth";
import { TaskSidebar } from "../../components/sidebar";
import { AuthLoader } from "../../components/loaders";
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("primary"); // primary, other, cleared
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock inbox data
  const primaryItems = [
    {
      id: 1,
      type: "task",
      title: "Design new landing page",
      description:
        "Create a modern, responsive landing page for the new product",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedBy: "John Doe",
      project: "Website Redesign",
      status: "pending",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 2,
      type: "comment",
      title: "New comment on API Development",
      description:
        "Jane Smith commented: 'Great progress! Let's discuss the authentication flow.'",
      priority: "medium",
      project: "API Development",
      status: "unread",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 3,
      type: "task",
      title: "Fix responsive layout issues",
      description: "Resolve mobile responsiveness problems on the dashboard",
      priority: "high",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignedBy: "Sarah Wilson",
      project: "Website Redesign",
      status: "urgent",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 4,
      type: "meeting",
      title: "Team standup meeting",
      description: "Daily standup with the development team",
      priority: "medium",
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      project: "General",
      status: "scheduled",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      id: 5,
      type: "document",
      title: "Project requirements updated",
      description: "New requirements document has been uploaded for review",
      priority: "low",
      project: "Mobile App",
      status: "new",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];

  const otherItems = [
    {
      id: 6,
      type: "notification",
      title: "System maintenance scheduled",
      description:
        "Platform will be under maintenance on Saturday from 2 AM to 4 AM",
      priority: "low",
      status: "info",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 7,
      type: "announcement",
      title: "New team member joined",
      description: "Welcome Alex Brown to the development team!",
      priority: "low",
      status: "announcement",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 8,
      type: "update",
      title: "Platform update available",
      description:
        "New features have been added. Check the changelog for details.",
      priority: "low",
      status: "update",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  const clearedItems = [
    {
      id: 9,
      type: "task",
      title: "Write API documentation",
      description: "Document all API endpoints with examples",
      priority: "low",
      completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      project: "API Development",
      status: "completed",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 10,
      type: "task",
      title: "Update user profile section",
      description: "Implement new user profile design",
      priority: "medium",
      completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      project: "Website Redesign",
      status: "completed",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 11,
      type: "task",
      title: "Database migration",
      description: "Migrate user data to new schema",
      priority: "high",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      project: "Backend",
      status: "overdue",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ];

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
                      if (item.type === "task") {
                        setSelectedTask(item);
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
