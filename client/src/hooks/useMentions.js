import { useState, useCallback, useMemo } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Hook for managing mention autocomplete
 */
export const useMentions = () => {
  const { currentWorkspace } = useWorkspace();
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    };
  };

  // Fetch users for mention autocomplete
  const fetchUsers = useCallback(async (query) => {
    if (!currentWorkspace?._id || !query) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      // This would be a workspace members endpoint
      // For now, we'll use a placeholder
      const response = await axios.get(
        `${API_URL}/workspaces/${currentWorkspace._id}/members`,
        {
          ...getAuthHeaders(),
          params: { search: query },
        }
      );
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  // Fetch tasks for mention autocomplete
  const fetchTasks = useCallback(async (query) => {
    if (!currentWorkspace?._id || !query) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      // This would be a tasks search endpoint
      const response = await axios.get(
        `${API_URL}/workspaces/${currentWorkspace._id}/tasks/search`,
        {
          ...getAuthHeaders(),
          params: { search: query },
        }
      );
      setTasks(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  // Handle mention input
  const handleMentionInput = useCallback((value, cursorPosition) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    const taskMatch = textBeforeCursor.match(/#(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition - mentionMatch[1].length - 1);
      fetchUsers(mentionMatch[1]);
    } else if (taskMatch) {
      setMentionQuery(taskMatch[1]);
      setMentionPosition(cursorPosition - taskMatch[1].length - 1);
      fetchTasks(taskMatch[1]);
    } else {
      setMentionQuery("");
      setMentionPosition(null);
      setUsers([]);
      setTasks([]);
    }
  }, [fetchUsers, fetchTasks]);

  // Insert mention
  const insertMention = useCallback((text, mention, type = "user") => {
    if (!mentionPosition) return text;

    const prefix = type === "user" ? "@" : "#";
    const mentionText = `${prefix}${mention.name || mention.title || mention.taskKey}`;
    const before = text.substring(0, mentionPosition);
    const after = text.substring(mentionPosition + mentionQuery.length + 1);

    return `${before}${mentionText} ${after}`;
  }, [mentionPosition, mentionQuery]);

  return {
    mentionQuery,
    mentionPosition,
    users,
    tasks,
    loading,
    handleMentionInput,
    insertMention,
    clearMentions: () => {
      setMentionQuery("");
      setMentionPosition(null);
      setUsers([]);
      setTasks([]);
    },
  };
};

