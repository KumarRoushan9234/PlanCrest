import mongoose from "mongoose";
const { Schema } = mongoose;

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyInfo: {
      industry: { type: String, trim: true },
      size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      },
      website: { type: String, trim: true },
    },
    settings: {
      defaultPermissions: {
        canCreateProjects: { type: Boolean, default: true },
        canInviteMembers: { type: Boolean, default: true },
        canManageBilling: { type: Boolean, default: false },
      },
      // Feature Controls - Owner and Admin can toggle these
      features: {
        chat: { type: Boolean, default: true },
        documentation: { type: Boolean, default: true },
        timeTracking: { type: Boolean, default: true },
        clientPortal: { type: Boolean, default: true },
        integrations: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true },
        fileStorage: { type: Boolean, default: true },
        customFields: { type: Boolean, default: true },
      },
      // Admin-specific feature controls (Owner can toggle for Admins)
      adminPermissions: {
        canCreateProjects: { type: Boolean, default: true },
        canDeleteProjects: { type: Boolean, default: false },
        canManageEmployees: { type: Boolean, default: true },
        canManageClients: { type: Boolean, default: true },
        canManageIntegrations: { type: Boolean, default: true },
        canAccessAnalytics: { type: Boolean, default: true },
        canManageBilling: { type: Boolean, default: false },
      },
      // Employee-specific feature controls (Owner and Admin can toggle)
      employeePermissions: {
        canCreateTasks: { type: Boolean, default: true },
        canDeleteTasks: { type: Boolean, default: false },
        canCreateDocs: { type: Boolean, default: true },
        canDeleteDocs: { type: Boolean, default: false },
        canUseChat: { type: Boolean, default: true },
        canTrackTime: { type: Boolean, default: true },
        canUploadFiles: { type: Boolean, default: true },
        canInviteClients: { type: Boolean, default: false },
        canViewAnalytics: { type: Boolean, default: false },
      },
      // Client-specific feature controls (Owner and Admin can toggle)
      clientPermissions: {
        canViewTasks: { type: Boolean, default: true },
        canCommentOnTasks: { type: Boolean, default: true },
        canCreateTasks: { type: Boolean, default: false },
        canViewDocs: { type: Boolean, default: true },
        canCommentOnDocs: { type: Boolean, default: true },
        canUploadFiles: { type: Boolean, default: true },
        canUseChat: { type: Boolean, default: false },
        canViewProgress: { type: Boolean, default: true },
      },
      branding: {
        primaryColor: { type: String, default: "#6366f1" },
        accentColor: { type: String, default: "#8b5cf6" },
        logo: { type: String, default: null },
      },
    },
    // Workspace-level integrations
    integrations: {
      github: {
        enabled: { type: Boolean, default: false },
        organizationId: { type: String },
        accessToken: { type: String },
        webhookSecret: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      gitlab: {
        enabled: { type: Boolean, default: false },
        groupId: { type: String },
        accessToken: { type: String },
        webhookSecret: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      googleWorkspace: {
        enabled: { type: Boolean, default: false },
        domain: { type: String },
        clientId: { type: String },
        clientSecret: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        services: {
          drive: { type: Boolean, default: false },
          calendar: { type: Boolean, default: false },
          meet: { type: Boolean, default: false },
        },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      slack: {
        enabled: { type: Boolean, default: false },
        workspaceId: { type: String },
        teamId: { type: String },
        accessToken: { type: String },
        botToken: { type: String },
        webhookUrl: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      figma: {
        enabled: { type: Boolean, default: false },
        teamId: { type: String },
        accessToken: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      cloudStorage: {
        provider: { 
          type: String, 
          enum: ["aws_s3", "google_cloud", "azure", "dropbox"],
        },
        enabled: { type: Boolean, default: false },
        bucketName: { type: String },
        region: { type: String },
        accessKey: { type: String },
        secretKey: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      cicd: {
        provider: { 
          type: String, 
          enum: ["github_actions", "gitlab_ci", "jenkins", "circleci"],
        },
        enabled: { type: Boolean, default: false },
        webhookUrl: { type: String },
        apiToken: { type: String },
        connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date },
      },
      communication: {
        zoom: {
          enabled: { type: Boolean, default: false },
          accountId: { type: String },
          clientId: { type: String },
          clientSecret: { type: String },
          accessToken: { type: String },
          refreshToken: { type: String },
        },
        googleMeet: {
          enabled: { type: Boolean, default: false },
          // Uses Google Workspace integration
          linkedToWorkspace: { type: Boolean, default: false },
        },
      },
    },
    billing: {
      plan: {
        type: String,
        enum: ["free", "pro", "business", "enterprise"],
        default: "free",
      },
      memberLimit: { type: Number, default: 5 },
      projectLimit: { type: Number, default: 3 },
      storageLimit: { type: Number, default: 5000 }, // MB
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      nextBillingDate: { type: Date },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
workspaceSchema.index({ owner: 1 });
// Index already defined in schema with unique: true
workspaceSchema.index({ status: 1 });
workspaceSchema.index({ createdAt: -1 });

export default mongoose.model("Workspace", workspaceSchema);
