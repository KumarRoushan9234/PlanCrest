import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import chatService from "../../services/chatService";
import { useChatRealtime } from "../../hooks/useChatRealtime";
import MessageList from "../chat/messages/MessageList";
import MessageInput from "../chat/input/MessageInput";
import { EmptyState, LoadingState } from "../chat/shared";
import toast from "react-hot-toast";

/**
 * Task Chat Sidebar Component
 * Right sidebar for task thread chat
 */
const TaskChatSidebar = ({ isOpen, onClose, task }) => {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Real-time updates for task thread
  const handleNewMessage = (data) => {
    if (data.type === "new_message" && data.threadId === thread?._id) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  useChatRealtime(handleNewMessage, null, null);

  // Fetch task thread
  const fetchThread = async () => {
    if (!task?._id) return;

    try {
      setLoading(true);
      const response = await chatService.getTaskThread(task._id);
      setThread(response.data.thread);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching task thread:", error);
      toast.error("Failed to load task chat");
    } finally {
      setLoading(false);
    }
  };

  // Send message to thread
  const handleSendMessage = async (content) => {
    if (!task?._id || !content.trim()) return;

    try {
      setSending(true);
      const response = await chatService.sendThreadMessage(task._id, {
        content,
        contentFormat: "markdown",
      });
      setMessages((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle message actions
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await chatService.updateMessage(messageId, newContent);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, content: newContent, isEdited: true } : msg
        )
      );
      toast.success("Message updated");
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: "[Message deleted]", isDeleted: true }
            : msg
        )
      );
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await chatService.addReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const existingReaction = msg.reactions?.find((r) => r.emoji === emoji);
            if (existingReaction) {
              existingReaction.count += 1;
            } else {
              msg.reactions = [...(msg.reactions || []), { emoji, count: 1 }];
            }
          }
          return msg;
        })
      );
    } catch {
      toast.error("Failed to add reaction");
    }
  };

  useEffect(() => {
    if (isOpen && task?._id) {
      fetchThread();
    }
  }, [isOpen, task?._id]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

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
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[400px] bg-gray-950 border-l border-gray-800 shadow-2xl z-[101] flex flex-col overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Task Chat</h2>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
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
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingState type="skeleton" count={3} />
              ) : messages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Start the conversation below"
                />
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={user?._id}
                  loading={false}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onReact={handleReact}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-800 bg-gray-900/50">
              <MessageInput
                onSend={handleSendMessage}
                placeholder="Type your message..."
                disabled={sending}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskChatSidebar;

