import mongoose from "mongoose";
const { Schema } = mongoose;

const workspaceMemberSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "employee", "client"],
      default: "employee",
      required: true,
    },
    // Custom permissions - can override workspace defaults
    customPermissions: {
      // For Admins (Owner can customize)
      admin: {
        canCreateProjects: { type: Boolean },
        canDeleteProjects: { type: Boolean },
        canManageEmployees: { type: Boolean },
        canManageClients: { type: Boolean },
        canManageIntegrations: { type: Boolean },
        canAccessAnalytics: { type: Boolean },
        canManageBilling: { type: Boolean },
      },
      // For Employees (Owner and Admin can customize)
      employee: {
        canCreateTasks: { type: Boolean },
        canDeleteTasks: { type: Boolean },
        canCreateDocs: { type: Boolean },
        canDeleteDocs: { type: Boolean },
        canUseChat: { type: Boolean },
        canTrackTime: { type: Boolean },
        canUploadFiles: { type: Boolean },
        canInviteClients: { type: Boolean },
        canViewAnalytics: { type: Boolean },
      },
      // For Clients (Owner and Admin can customize)
      client: {
        canViewTasks: { type: Boolean },
        canCommentOnTasks: { type: Boolean },
        canCreateTasks: { type: Boolean },
        canViewDocs: { type: Boolean },
        canCommentOnDocs: { type: Boolean },
        canUploadFiles: { type: Boolean },
        canUseChat: { type: Boolean },
        canViewProgress: { type: Boolean },
      },
    },
    // Assigned projects (for employees and clients)
    assignedProjects: [
      {
        project: { type: Schema.Types.ObjectId, ref: "Project" },
        assignedAt: { type: Date, default: Date.now },
        assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
        role: { 
          type: String, 
          enum: ["admin", "member", "viewer"],
          default: "member" 
        },
      },
    ],
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "removed"],
      default: "active",
    },
    // For clients - approval tracking
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for unique workspace-user combination
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });
workspaceMemberSchema.index({ user: 1 });
workspaceMemberSchema.index({ workspace: 1, status: 1 });
workspaceMemberSchema.index({ workspace: 1, role: 1 });
workspaceMemberSchema.index({ "assignedProjects.project": 1 });

export default mongoose.model("WorkspaceMember", workspaceMemberSchema);
