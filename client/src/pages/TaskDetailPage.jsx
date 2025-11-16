import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  Flag,
  Tag,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Loader2,
  BarChart3,
  Activity,
} from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { projectService } from "../services/projectService";
import { unmaskId, maskId } from "../utils/idMasker";
import TaskSidebar from "../components/sidebar/TaskSidebar";
import TaskChatSidebar from "../components/sidebar/TaskChatSidebar";

const TaskDetailPage = () => {
  const { maskedTaskId, maskedProjectId } = useParams();
  const navigate = useNavigate();
  const taskId = unmaskId(maskedTaskId);
  const projectId = maskedProjectId ? unmaskId(maskedProjectId) : null;

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskSidebar, setShowTaskSidebar] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await projectService.getTask(taskId);
      setTask(response.data);
      setSubtasks(response.data.subtasks || []);

      // Fetch project details
      const projectIdToFetch = projectId || response.data.project?._id;
      if (projectIdToFetch) {
        const projectResponse = await projectService.getProject(
          projectIdToFetch
        );
        setProject(projectResponse.data);
      }

      // Fetch comments
      try {
        const commentsResponse = await projectService.getTaskComments(taskId);
        setComments(commentsResponse.data || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      alert(
        "Failed to load task. You may not have permission to view this task."
      );
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (project) {
      const maskedProjId = maskId(project._id);
      navigate(`/project/${maskedProjId}`);
    } else {
      navigate("/projects");
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTask(updatedTask);
    fetchTaskDetails(); // Refresh to get updated data
  };

  const handleTaskDelete = () => {
    if (project) {
      const maskedProjId = maskId(project._id);
      navigate(`/project/${maskedProjId}`);
    } else {
      navigate("/projects");
    }
  };

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
      case "done":
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "in_progress":
      case "in progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "todo":
      case "to-do":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      case "in_review":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "blocked":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Task Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              The task you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <button
              onClick={() => navigate("/projects")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950">
        {/* Header Section - SMALLER */}
        <div className="border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
          <div className="w-full px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChatSidebar(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowTaskSidebar(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white mb-0.5">
                      {task.title}
                    </h1>
                    <p className="text-[10px] text-gray-400">
                      Task Key:{" "}
                      <span className="font-mono text-gray-300">
                        {task.taskKey}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                  {project && (
                    <span className="text-[10px] text-gray-400">
                      Project:{" "}
                      <span className="text-gray-300">{project.name}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    Created {formatDate(task.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - SMALLER */}
        <div className="w-full px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content - 2 columns - SMALLER */}
            <div className="lg:col-span-2 space-y-4">
              {/* Description - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Description
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {task.description || "No description provided"}
                </p>
              </motion.div>

              {/* Subtasks Overview - SMALLER */}
              {subtasks && subtasks.length > 0 && (
                <motion.div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                    Subtasks ({
                      subtasks.filter((s) => s.isCompleted).length
                    } / {subtasks.length})
                  </h2>
                  <div className="space-y-1.5">
                    {subtasks.slice(0, 5).map((subtask) => (
                      <div
                        key={subtask._id}
                        className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        {subtask.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <span
                          className={`flex-1 text-xs ${
                            subtask.isCompleted
                              ? "line-through text-gray-500"
                              : "text-white"
                          }`}
                        >
                          {subtask.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getPriorityColor(
                            subtask.priority
                          )}`}
                        >
                          {subtask.priority}
                        </span>
                      </div>
                    ))}
                    {subtasks.length > 5 && (
                      <p className="text-[10px] text-gray-500 text-center pt-1.5">
                        +{subtasks.length - 5} more subtasks
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Activity/Comments Section - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Recent Activity
                </h2>
                {comments && comments.length > 0 ? (
                  <div className="space-y-2">
                    {comments.slice(0, 3).map((comment) => (
                      <div
                        key={comment._id}
                        className="p-2 bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                            {comment.author?.name?.charAt(0).toUpperCase() ||
                              "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium text-white">
                                {comment.author?.name || "Unknown"}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length > 3 && (
                      <p className="text-[10px] text-gray-500 text-center pt-1.5">
                        +{comments.length - 3} more comments
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500">
                      No comments yet. Open the sidebar to add comments.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar - 1 column - SMALLER */}
            <div className="space-y-3">
              {/* Details Card - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">
                      Due Date
                    </p>
                    <div className="flex items-center gap-1.5 text-white">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">
                      Created
                    </p>
                    <div className="flex items-center gap-1.5 text-white">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">
                      Last Updated
                    </p>
                    <div className="flex items-center gap-1.5 text-white">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  </div>
                  {task.createdBy && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">
                        Created By
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-[10px]">
                          {task.createdBy?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-xs text-white font-medium">
                          {task.createdBy?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats Card - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  Quick Stats
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <span className="text-xs text-gray-400">Subtasks</span>
                    <span className="text-xs font-bold text-white">
                      {subtasks?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <span className="text-xs text-gray-400">Comments</span>
                    <span className="text-xs font-bold text-white">
                      {comments?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <span className="text-xs text-gray-400">Completion</span>
                    <span className="text-xs font-bold text-white">
                      {subtasks?.length > 0
                        ? Math.round(
                            (subtasks.filter((s) => s.isCompleted).length /
                              subtasks.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Action Card - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-sm font-bold text-white mb-2">
                  Quick Actions
                </h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowChatSidebar(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mb-2"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-xs font-medium">Open Chat</span>
                  </button>
                  <button
                    onClick={() => setShowTaskSidebar(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-xs font-medium">Edit Task</span>
                  </button>
                  <button
                    onClick={() => {
                      const maskedProjId = maskId(project._id);
                      const maskedTskId = maskId(task._id);
                      const url = `${window.location.origin}/project/${maskedProjId}/task/${maskedTskId}`;
                      navigator.clipboard.writeText(url);
                      alert("Link copied to clipboard!");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="text-xs font-medium">Copy Link</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Sidebar */}
      {task && project && (
        <TaskSidebar
          isOpen={showTaskSidebar}
          onClose={() => setShowTaskSidebar(false)}
          task={task}
          project={project}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Chat Sidebar */}
      {task && project && (
        <TaskChatSidebar
          isOpen={showChatSidebar}
          onClose={() => setShowChatSidebar(false)}
          task={task}
        />
      )}
    </Layout>
  );
};

// Import FileText icon
import { FileText } from "lucide-react";

export default TaskDetailPage;
