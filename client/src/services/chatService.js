import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Get auth headers - uses cookies for auth
 */
const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  };
};

/**
 * Get token from cookie or localStorage
 */
const getToken = () => {
  // Try localStorage first
  const localToken = localStorage.getItem("token");
  if (localToken) return localToken;
  
  // Try to get from cookies
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return value;
    }
  }
  return null;
};

/**
 * Chat Service
 * API methods for chat operations
 */
export const chatService = {
  // ==================== Channels ====================

  /**
   * Get all channels for a workspace
   */
  getWorkspaceChannels: async (workspaceId) => {
    const response = await axios.get(
      `${API_URL}/chat/workspaces/${workspaceId}/channels`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Get single channel details
   */
  getChannel: async (channelId) => {
    const response = await axios.get(
      `${API_URL}/chat/channels/${channelId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Create new channel
   */
  createChannel: async (workspaceId, channelData) => {
    const response = await axios.post(
      `${API_URL}/chat/workspaces/${workspaceId}/channels`,
      channelData,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Update channel
   */
  updateChannel: async (channelId, channelData) => {
    const response = await axios.patch(
      `${API_URL}/chat/channels/${channelId}`,
      channelData,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Delete channel
   */
  deleteChannel: async (channelId) => {
    const response = await axios.delete(
      `${API_URL}/chat/channels/${channelId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Update last selected channel
   */
  updateLastSelectedChannel: async (channelId) => {
    const response = await axios.put(
      `${API_URL}/chat/channels/${channelId}/last-selected`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Add member to channel
   */
  addMember: async (channelId, userId) => {
    const response = await axios.post(
      `${API_URL}/chat/channels/${channelId}/members`,
      { userId },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Remove member from channel
   */
  removeMember: async (channelId, userId) => {
    const response = await axios.delete(
      `${API_URL}/chat/channels/${channelId}/members`,
      {
        ...getAuthHeaders(),
        data: { userId },
      }
    );
    return response.data;
  },

  // ==================== Direct Messages ====================

  /**
   * Get or create direct message channel
   */
  getOrCreateDM: async (workspaceId, userId) => {
    const response = await axios.post(
      `${API_URL}/chat/workspaces/${workspaceId}/direct-messages`,
      { userId },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Get or create direct message channel (alias)
   */
  getOrCreateDirectMessage: async (workspaceId, userId) => {
    const response = await axios.post(
      `${API_URL}/chat/workspaces/${workspaceId}/direct-messages`,
      { userId },
      getAuthHeaders()
    );
    return response.data;
  },

  // ==================== Messages ====================

  /**
   * Get messages for a channel
   */
  getChannelMessages: async (channelId, params = {}) => {
    const response = await axios.get(
      `${API_URL}/chat/channels/${channelId}/messages`,
      {
        ...getAuthHeaders(),
        params,
      }
    );
    return response.data;
  },

  /**
   * Send message
   */
  sendMessage: async (channelId, messageData) => {
    const response = await axios.post(
      `${API_URL}/chat/channels/${channelId}/messages`,
      messageData,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Update message
   */
  updateMessage: async (messageId, content) => {
    const response = await axios.patch(
      `${API_URL}/chat/messages/${messageId}`,
      { content },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Delete message
   */
  deleteMessage: async (messageId) => {
    const response = await axios.delete(
      `${API_URL}/chat/messages/${messageId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Pin message
   */
  pinMessage: async (messageId) => {
    const response = await axios.post(
      `${API_URL}/chat/messages/${messageId}/pin`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Mark channel as read
   */
  markAsRead: async (channelId) => {
    const response = await axios.post(
      `${API_URL}/chat/channels/${channelId}/read`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  // ==================== Reactions ====================

  /**
   * Add reaction to message
   */
  addReaction: async (messageId, emoji) => {
    const response = await axios.post(
      `${API_URL}/chat/messages/${messageId}/reactions`,
      { emoji },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Remove reaction from message
   */
  removeReaction: async (messageId, emoji) => {
    const response = await axios.delete(
      `${API_URL}/chat/messages/${messageId}/reactions`,
      {
        ...getAuthHeaders(),
        data: { emoji },
      }
    );
    return response.data;
  },

  /**
   * Get message reactions
   */
  getMessageReactions: async (messageId) => {
    const response = await axios.get(
      `${API_URL}/chat/messages/${messageId}/reactions`,
      getAuthHeaders()
    );
    return response.data;
  },

  // ==================== Search ====================

  /**
   * Search messages
   */
  searchMessages: async (workspaceId, searchParams) => {
    const response = await axios.get(
      `${API_URL}/chat/workspaces/${workspaceId}/messages/search`,
      {
        ...getAuthHeaders(),
        params: searchParams,
      }
    );
    return response.data;
  },

  /**
   * Search channels
   */
  searchChannels: async (workspaceId, query) => {
    const response = await axios.get(
      `${API_URL}/chat/workspaces/${workspaceId}/channels/search`,
      {
        ...getAuthHeaders(),
        params: { query },
      }
    );
    return response.data;
  },

  // ==================== Task Threads ====================

  /**
   * Get task thread
   */
  getTaskThread: async (taskId) => {
    const response = await axios.get(
      `${API_URL}/chat/tasks/${taskId}/thread`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Send message to task thread
   */
  sendThreadMessage: async (taskId, messageData) => {
    const response = await axios.post(
      `${API_URL}/chat/tasks/${taskId}/thread/messages`,
      messageData,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Get thread messages
   */
  getThreadMessages: async (taskId, params = {}) => {
    const response = await axios.get(
      `${API_URL}/chat/tasks/${taskId}/thread/messages`,
      {
        ...getAuthHeaders(),
        params,
      }
    );
    return response.data;
  },

  // ==================== Typing Indicators ====================

  /**
   * Send typing indicator
   */
  sendTypingIndicator: async (channelId) => {
    const response = await axios.post(
      `${API_URL}/chat/channels/${channelId}/typing`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },
};

export default chatService;

