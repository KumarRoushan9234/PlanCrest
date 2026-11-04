import mongoose from "mongoose";
const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: "",
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
    parentDocument: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: "📄",
    },
    coverImage: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["private", "team", "public", "client"],
      default: "team",
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    linkedTasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    tags: [String],
    // Embedded version history instead of separate collection
    versions: [
      {
        version: { type: Number, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        changeDescription: { type: String, maxlength: 500 },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
    // Collaborators embedded
    collaborators: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        permission: {
          type: String,
          enum: ["view", "comment", "edit", "admin"],
          default: "view",
        },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastEditedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
documentSchema.index({ project: 1, isArchived: 1 });
documentSchema.index({ workspace: 1, visibility: 1 });
documentSchema.index({ parentDocument: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ isTemplate: 1 });
documentSchema.index({ "collaborators.user": 1 });

export default mongoose.model("Document", documentSchema);
