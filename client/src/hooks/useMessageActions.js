import { useState, useCallback } from "react";
import chatService from "../services/chatService";
import toast from "react-hot-toast";

/**
 * Hook for managing message actions
 */
export const useMessageActions = () => {
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit message
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      setActionLoading(true);
      const response = await chatService.updateMessage(messageId, newContent);
      toast.success("Message updated");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update message");
      throw error;
    } finally {
      setActionLoading(false);
      setEditingMessage(null);
      setEditContent("");
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      setActionLoading(true);
      await chatService.deleteMessage(messageId);
      toast.success("Message deleted");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Pin message
  const pinMessage = useCallback(async (messageId) => {
    try {
      setActionLoading(true);
      const response = await chatService.pinMessage(messageId);
      toast.success("Message pinned");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Start editing
  const startEditing = useCallback((message) => {
    setEditingMessage(message._id);
    setEditContent(message.content);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingMessage(null);
    setEditContent("");
  }, []);

  return {
    editingMessage,
    editContent,
    setEditContent,
    actionLoading,
    editMessage,
    deleteMessage,
    pinMessage,
    startEditing,
    cancelEditing,
  };
};

