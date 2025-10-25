import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  Send,
  Download,
  Search,
  Filter,
  Share2,
  Mail,
} from "lucide-react";
import { FaWhatsapp, FaTwitter, FaLinkedin } from "react-icons/fa";
import { projectService } from "../../services/projectService";
import { maskId } from "../../utils/idMasker";

const TaskSidebar = ({
  isOpen,
  onClose,
  task,
  project,
  onUpdate,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [taskData, setTaskData] = useState(task);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Details tab state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  // Members tab state
  const [assignees, setAssignees] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Subtasks tab state
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskSearch, setSubtaskSearch] = useState("");
  const [subtaskDateFilter, setSubtaskDateFilter] = useState("");
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  // Comments tab state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Attachments tab state
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const moreMenuRef = useRef(null);
  const shareMenuRef = useRef(null);

  // Fetch data when sidebar opens or task changes
  useEffect(() => {
    if (isOpen && task?._id && project?._id) {
      setTaskData(task);
      setEditedTitle(task.title || "");
      setEditedDescription(task.description || "");
      fetchTaskDetails();
    }
  }, [isOpen, task?._id, project?._id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTaskAssignees(),
        fetchSubtasks(),
        fetchComments(),
        fetchAttachments(),
      ]);
    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task assignees
  const fetchTaskAssignees = async () => {
    try {
      setLoadingMembers(true);
      const [assigneesRes, membersRes] = await Promise.all([
        projectService.getTaskAssignments(task._id),
        projectService.getProjectMembers(project._id),
      ]);
      setAssignees(assigneesRes.data || []);
      setProjectMembers(membersRes.data || []);
    } catch (error) {
      console.error("Error fetching assignees:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch subtasks
  const fetchSubtasks = async () => {
    try {
      setLoadingSubtasks(true);
      const response = await projectService.getTask(task._id);
      setSubtasks(response.data?.subtasks || []);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await projectService.getTaskComments(task._id);
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch attachments
  const fetchAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const response = await projectService.getTaskAttachments(task._id);
      setAttachments(response.data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleSidebarClose();
    }
  };

  const handleSidebarClose = () => {
    console.log("🔄 TaskSidebar closing - triggering refresh");
    onClose?.();
    setTimeout(() => {
      onUpdate?.(null); // Signal parent to refresh
    }, 300);
  };

  const handleUpdateTask = async (updates) => {
    try {
      setSaving(true);
      console.log("📝 Updating task with:", updates);
      const response = await projectService.updateTask(task._id, updates);
      const updatedTask = response.data;
      console.log("✅ Task updated successfully:", updatedTask);
      setTaskData(updatedTask);
      onUpdate?.(updatedTask);
      return updatedTask;
    } catch (error) {
      console.error("❌ Error updating task:", error);
      alert("Failed to update task. Please try again.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Toggle task status
  const handleToggleStatus = async () => {
    const newStatus = taskData.status === "completed" ? "todo" : "completed";
    await handleUpdateTask({ status: newStatus });
  };

  // Update title
  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== taskData.title) {
      await handleUpdateTask({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  // Update description
  const handleSaveDescription = async () => {
    if (editedDescription !== taskData.description) {
      await handleUpdateTask({ description: editedDescription });
    }
    setIsEditingDescription(false);
  };

  // Update status
  const handleStatusChange = async (e) => {
    await handleUpdateTask({ status: e.target.value });
  };

  // Update priority
  const handlePriorityChange = async (e) => {
    await handleUpdateTask({ priority: e.target.value });
  };

  // Update due date
  const handleDueDateChange = async (e) => {
    await handleUpdateTask({ dueDate: e.target.value });
  };

  // Assign member - FIXED
  const handleAssignMember = async (memberId) => {
    try {
      console.log("🔄 Assigning member:", memberId);
      const response = await projectService.assignTask(task._id, {
        userId: memberId,
        role: "assignee",
      });
      console.log("✅ Member assigned:", response);
      await fetchTaskAssignees();
    } catch (error) {
      console.error("❌ Error assigning member:", error);
      alert(error.error || error.message || "Failed to assign member");
    }
  };

  // Unassign member - FIXED
  const handleUnassignMember = async (assignmentId) => {
    try {
      await projectService.unassignTask(assignmentId);
      await fetchTaskAssignees();
    } catch (error) {
      console.error("Error unassigning member:", error);
      alert("Failed to unassign member");
    }
  };

  // Create subtask - FIXED
  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await projectService.createSubtask(task._id, {
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle("");
      await fetchSubtasks();
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert("Failed to create subtask");
    }
  };

  // Toggle subtask completion - FIXED
  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    try {
      await projectService.updateSubtask(subtaskId, {
        isCompleted: !currentStatus,
      });
      await fetchSubtasks();
    } catch (error) {
      console.error("Error toggling subtask:", error);
      alert("Failed to update subtask");
    }
  };

  // Delete subtask - FIXED
  const handleDeleteSubtask = async (subtaskId) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return;

    try {
      await projectService.deleteSubtask(subtaskId);
      await fetchSubtasks();
    } catch (error) {
      console.error("Error deleting subtask:", error);
      alert("Failed to delete subtask");
    }
  };

  // Create comment
  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      await projectService.createTaskComment(task._id, {
        content: newComment.trim(),
      });
      setNewComment("");
      await fetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to create comment");
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId) => {
    if (!editedCommentText.trim()) return;

    try {
      await projectService.updateTaskComment(commentId, {
        content: editedCommentText.trim(),
      });
      setEditingCommentId(null);
      setEditedCommentText("");
      await fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await projectService.deleteTaskComment(commentId);
      await fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      await projectService.deleteTaskAttachment(attachmentId);
      await fetchAttachments();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment");
    }
  };

  // Copy link
  const handleCopyLink = () => {
    const maskedTaskId = maskId(task._id);
    const maskedProjectId = maskId(project._id);
    const link = `${window.location.origin}/project/${maskedProjectId}/task/${maskedTaskId}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
    setShowMoreMenu(false);
  };

  // Open expanded view
  const handleOpenExpanded = () => {
    const maskedTaskId = maskId(task._id);
    const maskedProjectId = maskId(project._id);
    navigate(`/project/${maskedProjectId}/task/${maskedTaskId}`);
    setShowMoreMenu(false);
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    )
      return;

    try {
      await projectService.deleteTask(task._id);
      setShowMoreMenu(false);
      handleSidebarClose();
      onDelete?.(task._id);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  // Share functions
  const getShareLink = () => {
    const maskedTaskId = maskId(task._id);
    const maskedProjectId = maskId(project._id);
    return `${window.location.origin}/project/${maskedProjectId}/task/${maskedTaskId}`;
  };

  const handleWhatsAppShare = () => {
    const link = getShareLink();
    const text = `Check out this task: ${taskData.title}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const handleTwitterShare = () => {
    const link = getShareLink();
    const text = `Working on: ${taskData.title}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(link)}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const handleLinkedInShare = () => {
    const link = getShareLink();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        link
      )}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const handleEmailShare = () => {
    const link = getShareLink();
    const subject = `Task: ${taskData.title}`;
    const body = `Check out this task:\n\n${taskData.title}\n\n${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setShowShareMenu(false);
  };

  // Filter subtasks by search and date
  const filteredSubtasks = subtasks.filter((subtask) => {
    const matchesSearch = subtask.title
      .toLowerCase()
      .includes(subtaskSearch.toLowerCase());
    const matchesDate =
      !subtaskDateFilter ||
      new Date(subtask.createdAt).toDateString() ===
        new Date(subtaskDateFilter).toDateString();
    return matchesSearch && matchesDate;
  });

  // Group subtasks by date
  const groupedSubtasks = filteredSubtasks.reduce((groups, subtask) => {
    const date = new Date(subtask.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(subtask);
    return groups;
  }, {});

  if (!task || !project) return null;

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
      case "in_progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "todo":
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

  const formatDateTime = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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

          {/* Sidebar - SMALLER */}
          <motion.div
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[550px] bg-gradient-to-br from-gray-950 via-gray-900 to-black border-l border-gray-800 shadow-2xl z-[101] flex flex-col overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header - SMALLER */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleToggleStatus}
                  className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {taskData.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-500" />
                  )}
                </motion.button>
                <div>
                  <h2 className="text-sm font-bold text-white truncate max-w-[250px]">
                    {taskData.title}
                  </h2>
                  <p className="text-[10px] text-gray-500">
                    {taskData.taskKey || "Task Details"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Share Button - SMALLER */}
                <div className="relative" ref={shareMenuRef}>
                  <motion.button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showShareMenu
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </motion.button>

                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        className="absolute top-full right-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-[9999] overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      >
                        <div className="p-1">
                          <button
                            onClick={handleWhatsAppShare}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <FaWhatsapp className="w-3 h-3 text-green-500" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={handleTwitterShare}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <FaTwitter className="w-3 h-3 text-blue-400" />
                            <span>Twitter</span>
                          </button>
                          <button
                            onClick={handleLinkedInShare}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <FaLinkedin className="w-3 h-3 text-blue-600" />
                            <span>LinkedIn</span>
                          </button>
                          <button
                            onClick={handleEmailShare}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>Email</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* More Menu - SMALLER */}
                <div className="relative" ref={moreMenuRef}>
                  <motion.button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showMoreMenu
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </motion.button>

                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        className="absolute top-full right-0 mt-1 w-44 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-[9999] overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      >
                        <div className="p-1">
                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="font-medium">Copy link</span>
                          </button>

                          <button
                            onClick={handleOpenExpanded}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="font-medium">Open Expanded</span>
                          </button>

                          <div className="my-0.5 border-t border-gray-800"></div>

                          <button
                            onClick={handleDeleteTask}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="font-medium">Delete task</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={handleSidebarClose}
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Tabs - SMALLER */}
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-800 bg-gray-900/30">
              {[
                { id: "details", label: "Details", icon: FileText },
                {
                  id: "members",
                  label: "Members",
                  icon: Users,
                  count: assignees.length,
                },
                {
                  id: "subtasks",
                  label: "Subtasks",
                  icon: CheckCircle2,
                  count: subtasks.length,
                },
                {
                  id: "comments",
                  label: "Comments",
                  icon: MessageSquare,
                  count: comments.length,
                },
                {
                  id: "attachments",
                  label: "Attachments",
                  icon: Paperclip,
                  count: attachments.length,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-0.5 px-1 py-0.5 bg-white/20 text-white text-[9px] rounded-full font-bold">
                        {tab.count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Content - Scrollable - SMALLER */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Title - SMALLER */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                        Task Title
                      </label>
                      {isEditingTitle ? (
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onBlur={handleSaveTitle}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveTitle()
                          }
                          className="w-full text-sm font-bold text-white bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          autoFocus
                        />
                      ) : (
                        <motion.h1
                          className="text-sm font-bold text-white cursor-pointer hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-900"
                          onClick={() => setIsEditingTitle(true)}
                          whileHover={{ x: 2 }}
                        >
                          {taskData.title}
                        </motion.h1>
                      )}
                    </div>

                    {/* Status and Priority - SMALLER */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                          Status
                        </label>
                        <select
                          value={taskData.status}
                          onChange={handleStatusChange}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                          Priority
                        </label>
                        <select
                          value={taskData.priority}
                          onChange={handlePriorityChange}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date - SMALLER */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={
                          taskData.dueDate
                            ? new Date(taskData.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={handleDueDateChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    {/* Description - SMALLER */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                        Description
                      </label>
                      {isEditingDescription ? (
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          onBlur={handleSaveDescription}
                          className="w-full text-xs text-gray-300 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setIsEditingDescription(true)}
                          className="cursor-pointer hover:bg-gray-900 transition-colors px-3 py-2 rounded-lg border border-gray-800"
                        >
                          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {taskData.description ||
                              "Click to add description..."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Project Info - SMALLER */}
                    <div className="p-2.5 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                        <div>
                          <p className="text-[10px] text-gray-500">Project</p>
                          <p className="text-xs text-white font-medium">
                            {project.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* MEMBERS TAB - SMALLER */}
                {activeTab === "members" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-300">
                        Assigned ({assignees.length})
                      </h3>
                    </div>

                    {loadingMembers ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        {/* Assigned Members - SMALLER */}
                        <div className="space-y-1.5">
                          {assignees.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-3">
                              No members assigned
                            </p>
                          ) : (
                            assignees.map((assignment) => (
                              <div
                                key={assignment._id}
                                className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                    {assignment.user?.name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-white">
                                      {assignment.user?.name || "Unknown"}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {assignment.user?.email}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleUnassignMember(assignment._id)
                                  }
                                  className="px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Available Members - SMALLER */}
                        <div className="border-t border-gray-800 pt-3 mt-3">
                          <h4 className="text-[10px] font-semibold text-gray-400 mb-2">
                            Add Members
                          </h4>
                          <div className="space-y-1.5">
                            {projectMembers
                              .filter(
                                (pm) =>
                                  !assignees.some(
                                    (a) => a.user?._id === pm.user?._id
                                  )
                              )
                              .map((member) => (
                                <div
                                  key={member._id}
                                  className="flex items-center justify-between p-2 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                      {member.user?.name?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-white">
                                        {member.user?.name || "Unknown"}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {member.user?.email}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleAssignMember(member.user?._id)
                                    }
                                    className="px-2 py-1 text-[10px] text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* SUBTASKS TAB - SMALLER */}
                {activeTab === "subtasks" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Create Subtask - SMALLER */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateSubtask()
                        }
                        placeholder="Add a subtask..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <motion.button
                        onClick={handleCreateSubtask}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    {/* Search and Filter - SMALLER */}
                    <div className="flex gap-1.5">
                      <div className="flex-1 relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500" />
                        <input
                          type="text"
                          value={subtaskSearch}
                          onChange={(e) => setSubtaskSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <input
                        type="date"
                        value={subtaskDateFilter}
                        onChange={(e) => setSubtaskDateFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    {/* Subtasks List - SMALLER */}
                    {loadingSubtasks ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : Object.keys(groupedSubtasks).length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">
                        No subtasks yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(groupedSubtasks).map(([date, subs]) => (
                          <div key={date}>
                            <h4 className="text-[10px] font-semibold text-gray-500 mb-1.5">
                              {date}
                            </h4>
                            <div className="space-y-1.5">
                              {subs.map((subtask) => (
                                <div
                                  key={subtask._id}
                                  className="flex items-start gap-2 p-2 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
                                >
                                  <motion.button
                                    onClick={() =>
                                      handleToggleSubtask(
                                        subtask._id,
                                        subtask.isCompleted
                                      )
                                    }
                                    className="flex-shrink-0 mt-0.5"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {subtask.isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-gray-500" />
                                    )}
                                  </motion.button>
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className={`text-xs block ${
                                        subtask.isCompleted
                                          ? "line-through text-gray-500"
                                          : "text-white"
                                      }`}
                                    >
                                      {subtask.title}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                                      <span>
                                        By{" "}
                                        {subtask.createdBy?.name || "Unknown"}
                                      </span>
                                      {subtask.priority && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded-full ${getPriorityColor(
                                            subtask.priority
                                          )}`}
                                        >
                                          {subtask.priority}
                                        </span>
                                      )}
                                      {subtask.deadline && (
                                        <span>
                                          Due: {formatDate(subtask.deadline)}
                                        </span>
                                      )}
                                      {subtask.isCompleted &&
                                        subtask.completedBy && (
                                          <span>
                                            ✓ by {subtask.completedBy?.name}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteSubtask(subtask._id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* COMMENTS TAB - SMALLER */}
                {activeTab === "comments" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Comment Input - SMALLER */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full text-xs text-white bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[60px]"
                        />
                        <div className="flex items-center justify-end mt-1.5">
                          <motion.button
                            onClick={handleCreateComment}
                            disabled={!newComment.trim()}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Send className="w-3 h-3" />
                            Comment
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Comments List - SMALLER */}
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">
                        No comments yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {comments.map((comment) => (
                          <div
                            key={comment._id}
                            className="flex gap-2 p-2.5 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
                          >
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {comment.user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs font-medium text-white">
                                  {comment.user?.name || "Unknown"}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                              </div>
                              {editingCommentId === comment._id ? (
                                <div>
                                  <textarea
                                    value={editedCommentText}
                                    onChange={(e) =>
                                      setEditedCommentText(e.target.value)
                                    }
                                    className="w-full text-xs text-white bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[50px]"
                                    autoFocus
                                  />
                                  <div className="flex gap-1.5 mt-1.5">
                                    <button
                                      onClick={() =>
                                        handleUpdateComment(comment._id)
                                      }
                                      className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditedCommentText("");
                                      }}
                                      className="px-2 py-1 text-[10px] bg-gray-700 text-white rounded hover:bg-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditedCommentText(comment.content);
                                }}
                                className="p-1 text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ATTACHMENTS TAB - SMALLER */}
                {activeTab === "attachments" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Upload Section - SMALLER */}
                    <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center hover:border-blue-600 transition-colors cursor-pointer">
                      <Paperclip className="w-6 h-6 text-gray-500 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-400">Click to upload</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        PDF, DOC, PNG, JPG (max 10MB)
                      </p>
                    </div>

                    {/* Attachments List - SMALLER */}
                    {loadingAttachments ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : attachments.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">
                        No attachments yet
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment._id}
                            className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">
                                  {attachment.originalName}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {(attachment.size / 1024).toFixed(2)} KB •{" "}
                                  {formatDateTime(attachment.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <a
                                href={attachment.url}
                                download
                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() =>
                                  handleDeleteAttachment(attachment._id)
                                }
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Saving Indicator - SMALLER */}
            <AnimatePresence>
              {saving && (
                <motion.div
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg shadow-lg flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Saving...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Click outside to close menus */}
          <AnimatePresence>
            {(showMoreMenu || showShareMenu) && (
              <motion.div
                className="fixed inset-0 z-[99]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowShareMenu(false);
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskSidebar;
