import mongoose from "mongoose";
const { Schema } = mongoose;

const chatChannelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Channel category
    category: {
      type: String,
      enum: ["project", "feature", "team", "direct", "group", "task", "workspace"],
      required: true,
    },
    // For project channels (optional)
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    // For task threads
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    type: {
      type: String,
      enum: ["public", "private", "direct", "group"],
      default: "public",
    },
    // Auto-created channels
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Channel prefix (e.g., #general-, #tasks-)
    prefix: {
      type: String,
      enum: ["general", "tasks", "client", "feature", "team", null],
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // For direct messages - store both participants
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Unread count per user
    unreadCounts: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
        lastReadAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
chatChannelSchema.index({ project: 1, isArchived: 1 });
chatChannelSchema.index({ workspace: 1, category: 1 });
chatChannelSchema.index({ workspace: 1, type: 1 });
chatChannelSchema.index({ workspace: 1, category: 1, type: 1 });
chatChannelSchema.index({ members: 1 });
chatChannelSchema.index({ participants: 1 });
chatChannelSchema.index({ task: 1 }, { unique: true, sparse: true });
chatChannelSchema.index({ lastMessageAt: -1 });
chatChannelSchema.index({ category: 1, workspace: 1 });

export default mongoose.model("ChatChannel", chatChannelSchema);

