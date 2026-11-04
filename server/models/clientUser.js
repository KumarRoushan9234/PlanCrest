import mongoose from "mongoose";
const { Schema } = mongoose;

const clientUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    // Portal access with approval tracking
    portalAccess: [
      {
        clientPortal: {
          type: Schema.Types.ObjectId,
          ref: "ClientPortal",
          required: true,
        },
        project: {
          type: Schema.Types.ObjectId,
          ref: "Project",
          required: true,
        },
        // Granular permissions - controlled by admin/owner/employee
        permissions: {
          canViewTasks: { type: Boolean, default: true },
          canCommentOnTasks: { type: Boolean, default: true },
          canCreateTasks: { type: Boolean, default: false },
          canViewDocs: { type: Boolean, default: true },
          canCommentOnDocs: { type: Boolean, default: true },
          canUploadFiles: { type: Boolean, default: true },
          canViewProgress: { type: Boolean, default: true },
          canUseChat: { type: Boolean, default: false },
        },
        // Specific items approved for viewing
        approvedItems: {
          tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
          documents: [{ type: Schema.Types.ObjectId, ref: "Document" }],
          boards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
        },
        grantedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        grantedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["active", "revoked", "expired"],
          default: "active",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Approval workflow
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    notificationSettings: {
      email: {
        taskUpdates: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        statusChanges: { type: Boolean, default: true },
        projectUpdates: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

// Indexes
clientUserSchema.index({ email: 1, workspace: 1 }, { unique: true });
clientUserSchema.index({ workspace: 1, status: 1 });
clientUserSchema.index({ "portalAccess.clientPortal": 1 });
clientUserSchema.index({ "portalAccess.project": 1 });
clientUserSchema.index({ invitedBy: 1 });
clientUserSchema.index({ approvedBy: 1 });

export default mongoose.model("ClientUser", clientUserSchema);
