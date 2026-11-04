import mongoose from "mongoose";
const { Schema } = mongoose;

const clientPortalSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    branding: {
      logo: { type: String },
      primaryColor: { type: String, default: "#6366f1" },
      welcomeMessage: { type: String, trim: true },
    },
    settings: {
      allowClientComments: { type: Boolean, default: true },
      allowFileUploads: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: true },
      showProjectProgress: { type: Boolean, default: true },
      showTeamMembers: { type: Boolean, default: true },
    },
    visibleBoards: [
      {
        type: Schema.Types.ObjectId,
        ref: "Board",
      },
    ],
    visibleDocuments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
clientPortalSchema.index({ project: 1 }, { unique: true });
clientPortalSchema.index({ slug: 1 }, { unique: true });
clientPortalSchema.index({ workspace: 1 });

export default mongoose.model("ClientPortal", clientPortalSchema);

