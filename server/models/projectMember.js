import mongoose from "mongoose";
const { Schema } = mongoose;

const projectMemberSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      default: "member",
    },
    // Detailed permissions for project-level access
    permissions: {
      // Task permissions
      canCreateTasks: { type: Boolean, default: true },
      canEditTasks: { type: Boolean, default: true },
      canDeleteTasks: { type: Boolean, default: false },
      canAssignTasks: { type: Boolean, default: true },
      // Project management
      canManageProject: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false },
      canManageBoard: { type: Boolean, default: false },
      // Documentation
      canAccessDocs: { type: Boolean, default: true },
      canCreateDocs: { type: Boolean, default: true },
      canEditDocs: { type: Boolean, default: true },
      canDeleteDocs: { type: Boolean, default: false },
      canManageDocs: { type: Boolean, default: false },
      // Chat
      canAccessChat: { type: Boolean, default: true },
      canSendMessages: { type: Boolean, default: true },
      canCreateChannels: { type: Boolean, default: false },
      // Files
      canUploadFiles: { type: Boolean, default: true },
      canDeleteFiles: { type: Boolean, default: false },
      // Time tracking
      canTrackTime: { type: Boolean, default: true },
      canViewTimeReports: { type: Boolean, default: false },
      // Client portal (for employee/admin managing clients)
      canManageClientAccess: { type: Boolean, default: false },
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "removed"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Compound index for unique project-user combination
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
projectMemberSchema.index({ user: 1 });
projectMemberSchema.index({ project: 1, status: 1 });
projectMemberSchema.index({ project: 1, role: 1 });

export default mongoose.model("ProjectMember", projectMemberSchema);
