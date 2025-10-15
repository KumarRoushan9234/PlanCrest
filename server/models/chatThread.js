import mongoose from "mongoose";
const { Schema } = mongoose;

const chatThreadSchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
chatThreadSchema.index({ task: 1 }, { unique: true });
chatThreadSchema.index({ project: 1 });
chatThreadSchema.index({ participants: 1 });
chatThreadSchema.index({ lastMessageAt: -1 });

export default mongoose.model("ChatThread", chatThreadSchema);

