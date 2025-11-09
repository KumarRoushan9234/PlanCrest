import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ["User", "ClientUser"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      enum: ["User", "ClientUser"],
    },
    type: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_due",
        "task_completed",
        "task_updated",
        "comment_added",
        "mention",
        "chat_message",
        "project_invite",
        "workspace_invite",
        "document_shared",
        "file_uploaded",
        "event_invitation",
        "event_response",
        "event_reminder",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    relatedTo: {
      model: {
        type: String,
        enum: ["Task", "Project", "Document", "ChatMessage", "Comment", "Workspace", "CalendarEvent"],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ workspace: 1 });
notificationSchema.index({ project: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);

