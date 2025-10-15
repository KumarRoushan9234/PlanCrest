import mongoose from "mongoose";
const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    attachedTo: {
      model: {
        type: String,
        required: true,
        enum: ["Task", "ChatMessage", "Document", "Comment"],
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
attachmentSchema.index({ "attachedTo.model": 1, "attachedTo.id": 1 });
attachmentSchema.index({ project: 1 });
attachmentSchema.index({ workspace: 1 });
attachmentSchema.index({ uploadedBy: 1 });

export default mongoose.model("Attachment", attachmentSchema);
