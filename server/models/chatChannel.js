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
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    members: [
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
  },
  { timestamps: true }
);

// Indexes
chatChannelSchema.index({ project: 1, isArchived: 1 });
chatChannelSchema.index({ workspace: 1, type: 1 });
chatChannelSchema.index({ members: 1 });
chatChannelSchema.index({ lastMessageAt: -1 });

export default mongoose.model("ChatChannel", chatChannelSchema);

