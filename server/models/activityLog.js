import mongoose from "mongoose";
const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    actor: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "actorModel",
    },
    actorModel: {
      type: String,
      required: true,
      enum: ["User", "ClientUser"],
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "deleted",
        "archived",
        "restored",
        "assigned",
        "unassigned",
        "moved",
        "commented",
        "uploaded",
        "invited",
        "joined",
        "left",
        "completed",
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: [
        "Task",
        "Project",
        "Board",
        "Column",
        "Document",
        "ChatChannel",
        "ChatMessage",
        "Comment",
        "Workspace",
        "User",
      ],
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Indexes
activityLogSchema.index({ workspace: 1, createdAt: -1 });
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, target: 1 });
activityLogSchema.index({ action: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
