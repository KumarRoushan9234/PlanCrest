import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  MessageSquare,
  User,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Smile,
  Paperclip,
  Loader2,
} from "lucide-react";
import { projectService } from "../../services/projectService";

const ChatSidebar = ({ isOpen, onClose, task }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && task?._id) {
      fetchComments();
    }
  }, [isOpen, task?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await projectService.getTaskComments(task._id);
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      const response = await projectService.createTaskComment(task._id, {
        content: newComment.trim(),
      });
      setComments([...comments, response.data]);
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to send comment. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const response = await projectService.updateTaskComment(commentId, {
        content: editText.trim(),
      });
      setComments(
        comments.map((comment) =>
          comment._id === commentId ? response.data : comment
        )
      );
      setEditingComment(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await projectService.deleteTaskComment(commentId);
      setComments(comments.filter((comment) => comment._id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText("");
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

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
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[400px] bg-gray-950 border-l border-gray-800 shadow-2xl z-[101] flex flex-col rounded-l-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header - SMALLER */}
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Task Chat
                    </h2>
                    <p className="text-[10px] text-gray-500">
                      {task?.title || "Task Discussion"}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Messages - SMALLER */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No comments yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Start the conversation below
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment._id}
                    className="bg-gradient-to-r from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-2 hover:border-gray-700 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {editingComment === comment._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-2 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition-colors resize-none"
                          rows="2"
                          placeholder="Edit your comment..."
                        />
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            onClick={() => handleEditComment(comment._id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Save
                          </motion.button>
                          <motion.button
                            onClick={cancelEditing}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                            {comment.author?.name?.charAt(0).toUpperCase() ||
                              "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium text-white">
                                {comment.author?.name || "Unknown"}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              onClick={() => startEditing(comment)}
                              className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - SMALLER */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/50">
              <form
                onSubmit={handleSendComment}
                className="flex items-end gap-2"
              >
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 bg-black/40 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition-colors resize-none"
                    rows="2"
                    disabled={sending}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!newComment.trim() || sending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
