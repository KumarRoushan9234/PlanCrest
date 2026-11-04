import { EventEmitter } from "events";

/**
 * SSE Event Manager
 * Manages Server-Sent Events for real-time chat updates
 */
class SSEManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // Map of userId -> Set of response objects
  }

  /**
   * Add a new SSE connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  addConnection(userId, res) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(res);
  }

  /**
   * Remove an SSE connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  removeConnection(userId, res) {
    if (this.connections.has(userId)) {
      this.connections.get(userId).delete(res);
      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Emit message event to specific users
   * @param {Object} data - Event data
   * @param {Array<string>} userIds - Array of user IDs to notify
   */
  emitToUsers(eventType, data, userIds) {
    userIds.forEach((userId) => {
      if (this.connections.has(userId)) {
        const connections = this.connections.get(userId);
        connections.forEach((res) => {
          try {
            res.write(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`);
          } catch (error) {
            // Connection closed, remove it
            this.removeConnection(userId, res);
          }
        });
      }
    });
  }

  /**
   * Emit message event
   */
  emitMessageEvent(data) {
    this.emit("message", data);
    if (data.channelMembers) {
      this.emitToUsers("new_message", data, data.channelMembers);
    }
  }

  /**
   * Emit typing event
   */
  emitTypingEvent(data) {
    this.emit("typing", data);
    if (data.channelMembers) {
      this.emitToUsers("typing", data, data.channelMembers);
    }
  }

  /**
   * Emit user status event
   */
  emitUserStatusEvent(data) {
    this.emit("user_status", data);
    if (data.userIds) {
      this.emitToUsers("user_status", data, data.userIds);
    }
  }
}

// Create singleton instance
const sseManager = new SSEManager();

export default sseManager;

