import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  Flag,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  ChevronRight,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";

const TaskSidebar = ({ isOpen, onClose, task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState({
    title: false,
    description: false,
  });
  const [editedTask, setEditedTask] = useState(task || {});
  const [activeTab, setActiveTab] = useState("details"); // details, comments, activity
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Close sidebar when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!task) return null;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "in progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "to-do":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[600px] bg-[#0a0a0b] border-l border-gray-800 shadow-2xl z-[101] flex flex-col rounded-l-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => {
                    const newStatus =
                      task.status === "completed" ? "to-do" : "completed";
                    onUpdate?.({ ...task, status: newStatus });
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                </motion.button>
                <h2 className="text-sm font-medium text-gray-400">
                  Task Details
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* More Menu */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`p-2 rounded-lg transition-colors ${
                      showMoreMenu
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </motion.button>

                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-2">
                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              // Copy link logic
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded-lg"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Copy className="w-4 h-4" />
                            <span className="font-medium">Copy link</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              // Open full logic
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded-lg"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-medium">Open full</span>
                          </motion.button>

                          <div className="my-1 border-t border-gray-800"></div>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              onDelete?.(task.id);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded-lg"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-medium">Delete task</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-800 bg-gray-900/30">
              {[
                { id: "details", label: "Details" },
                { id: "comments", label: "Comments", count: 5 },
                { id: "activity", label: "Activity" },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {tab.label}
                  {tab.count && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  {isEditing.title ? (
                    <input
                      type="text"
                      value={editedTask.title}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, title: e.target.value })
                      }
                      onBlur={() => {
                        setIsEditing({ ...isEditing, title: false });
                        onUpdate?.(editedTask);
                      }}
                      className="w-full text-xl font-bold text-white bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                  ) : (
                    <motion.h1
                      className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() =>
                        setIsEditing({ ...isEditing, title: true })
                      }
                      whileHover={{ x: 2 }}
                    >
                      {task.title}
                    </motion.h1>
                  )}
                </div>

                {/* Status and Priority */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Priority:</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Description
                    </h3>
                    <motion.button
                      onClick={() =>
                        setIsEditing({ ...isEditing, description: true })
                      }
                      className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </motion.button>
                  </div>
                  {isEditing.description ? (
                    <textarea
                      value={editedTask.description}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          description: e.target.value,
                        })
                      }
                      onBlur={() => {
                        setIsEditing({ ...isEditing, description: false });
                        onUpdate?.(editedTask);
                      }}
                      className="w-full text-sm text-gray-300 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {task.description || "No description provided"}
                    </p>
                  )}
                </div>

                {/* Task Properties */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Properties
                  </h3>

                  {/* Assignee */}
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Assignee</p>
                        <p className="text-sm text-white font-medium">
                          {task.assignee?.name ||
                            task.assignedTo ||
                            "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm text-white font-medium">
                          {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>

                  {/* Project */}
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Project</p>
                        <p className="text-sm text-white font-medium">
                          {task.project?.name || task.project || "No project"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>

                  {/* Time Estimate */}
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Time Estimate</p>
                        <p className="text-sm text-white font-medium">
                          {task.timeEstimate || "Not set"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Add to Task */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Add to Task
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Attachment</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Members</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Labels</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Checklist</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Link</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">Document</span>
                    </motion.button>
                  </div>
                </div>

                {/* Comments Section (if active tab) */}
                {activeTab === "comments" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Comments
                    </h3>

                    {/* Comment Input */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        JD
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full text-sm text-white bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px]"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                              <ImageIcon className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <motion.button
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Comment
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Existing Comments */}
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            JS
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                Jane Smith
                              </span>
                              <span className="text-xs text-gray-500">
                                2 hours ago
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              This looks great! Let's schedule a review meeting
                              for tomorrow.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Click outside to close more menu */}
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                className="fixed inset-0 z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMoreMenu(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskSidebar;
