import ChatThread from "../../models/chatThread.js";
import ChatMessage from "../../models/chatMessage.js";
import Task from "../../models/task.js";
import { formatMessageForResponse } from "../../utils/messageHelpers.js";
import { getChannelMembers } from "../../utils/channelHelpers.js";
import sseManager from "../../utils/sseManager.js";

/**
 * Get or create task thread
 */
export const getTaskThread = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.auth._id;

    // Get or create thread
    let thread = await ChatThread.findOne({ task: taskId })
      .populate("task", "title taskKey project")
      .populate("participants", "name email avatar");

    if (!thread) {
      const task = await Task.findById(taskId).populate("project");
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      thread = new ChatThread({
        task: taskId,
        project: task.project._id,
        title: `Discussion: ${task.title}`,
        participants: [userId],
        createdBy: userId,
      });

      await thread.save();
      await thread.populate("task", "title taskKey project");
      await thread.populate("participants", "name email avatar");

      // Link thread to task
      task.chatThread = thread._id;
      await task.save();
    }

    // Get messages
    const messages = await ChatMessage.find({
      thread: thread._id,
      isDeleted: false,
    })
      .populate("sender", "name email avatar status lastActive")
      .populate("parentMessage", "content sender")
      .populate("reactions.users", "name avatar")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        thread,
        messages,
      },
    });
  } catch (error) {
    console.error("Error fetching task thread:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task thread",
      error: error.message,
    });
  }
};

/**
 * Send message to thread
 */
export const sendThreadMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, contentFormat, parentMessageId } = req.body;
    const userId = req.auth._id;

    // Get thread
    let thread = await ChatThread.findOne({ task: taskId });

    if (!thread) {
      // Create thread if doesn't exist
      const task = await Task.findById(taskId).populate("project");
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      thread = new ChatThread({
        task: taskId,
        project: task.project._id,
        title: `Discussion: ${task.title}`,
        participants: [userId],
        createdBy: userId,
      });

      await thread.save();

      // Link thread to task
      task.chatThread = thread._id;
      await task.save();
    }

    // Create message
    const message = new ChatMessage({
      thread: thread._id,
      sender: userId,
      content,
      contentFormat: contentFormat || "plain",
      parentMessage: parentMessageId || null,
    });

    await message.save();

    // Update thread metadata
    thread.lastMessageAt = new Date();
    thread.lastMessageBy = userId;
    thread.messageCount += 1;

    // Add user to participants if not already
    const isParticipant = thread.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
      thread.participants.push(userId);
    }

    await thread.save();

    const formattedMessage = await formatMessageForResponse(message);

    // Emit SSE event (would need to get workspace members)
    // For now, just emit to thread participants
    const participantIds = thread.participants.map((p) => p.toString());
    sseManager.emitMessageEvent({
      type: "new_message",
      threadId: thread._id.toString(),
      message: formattedMessage.toObject(),
      userId: userId.toString(),
      channelMembers: participantIds,
    });

    res.status(201).json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error sending thread message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send thread message",
      error: error.message,
    });
  }
};

/**
 * Get thread messages
 */
export const getThreadMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const thread = await ChatThread.findOne({ task: taskId });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    const messages = await ChatMessage.find({
      thread: thread._id,
      isDeleted: false,
    })
      .populate("sender", "name email avatar status lastActive")
      .populate("parentMessage", "content sender")
      .populate("reactions.users", "name avatar")
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch thread messages",
      error: error.message,
    });
  }
};

