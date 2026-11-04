import mongoose from "mongoose";
const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: "ChatChannel",
    },
    thread: {
      type: Schema.Types.ObjectId,
      ref: "ChatThread",
    },
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Rich content support
    contentFormat: {
      type: String,
      enum: ["plain", "markdown", "html"],
      default: "plain",
    },
    type: {
      type: String,
      enum: ["text", "file", "image", "system", "task_created", "task_updated", "code"],
      default: "text",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Task mentions in messages
    taskMentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    // Embedded reactions instead of separate collection
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: "User" }],
        count: { type: Number, default: 0 },
      },
    ],
    linkedTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    linkedDoc: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    // Message link for sharing
    messageLink: {
      type: String,
    },
    // Read receipts
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
chatMessageSchema.index({ channel: 1, createdAt: -1 });
chatMessageSchema.index({ thread: 1, createdAt: -1 });
chatMessageSchema.index({ parentMessage: 1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ mentions: 1 });
chatMessageSchema.index({ taskMentions: 1 });
chatMessageSchema.index({ linkedTask: 1 });
chatMessageSchema.index({ isPinned: 1, channel: 1 });
chatMessageSchema.index({ createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
