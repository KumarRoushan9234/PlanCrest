import mongoose from "mongoose";
const { Schema } = mongoose;

const integrationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // Google Workspace
        "google_drive",
        "google_calendar", 
        "google_meet",
        "google_docs",
        "gmail",
        // Version Control
        "github",
        "gitlab",
        "bitbucket",
        // Design Tools
        "figma",
        "adobe_creative",
        "sketch",
        // Communication
        "slack",
        "microsoft_teams",
        "discord",
        // Video Conferencing
        "zoom",
        "google_meet",
        "teams_video",
        // Cloud Storage
        "aws_s3",
        "google_cloud",
        "azure_storage",
        "dropbox",
        "onedrive",
        // CI/CD
        "github_actions",
        "gitlab_ci",
        "jenkins",
        "circleci",
        "azure_devops",
        // Calendar
        "google_calendar",
        "outlook_calendar",
        "apple_calendar",
        "calendly",
        // Project Management
        "jira",
        "trello",
        "asana",
        "monday",
        // Analytics
        "google_analytics",
        "mixpanel",
        "amplitude",
        "custom",
      ],
    },
    // Integration Scope - NEW: Support for 3 levels
    scope: {
      type: String,
      required: true,
      enum: ["personal", "workspace", "project"],
    },
    // User who created this integration
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Workspace (required for workspace and project scopes)
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: function() {
        return this.scope === "workspace" || this.scope === "project";
      },
    },
    // Project (required only for project scope)
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: function() {
        return this.scope === "project";
      },
    },
    // Integration-specific configuration
    config: {
      // For GitHub/GitLab
      repositoryUrl: { type: String },
      repositoryId: { type: String },
      organizationId: { type: String },
      groupId: { type: String },
      
      // For Google services
      projectId: { type: String },
      folderId: { type: String },
      calendarId: { type: String },
      
      // For Slack
      channelId: { type: String },
      channelName: { type: String },
      teamId: { type: String },
      
      // For Zoom
      meetingId: { type: String },
      
      // For Figma
      fileKey: { type: String },
      teamId: { type: String },
      
      // For Cloud Storage
      bucketName: { type: String },
      region: { type: String },
      containerName: { type: String },
      
      // For CI/CD
      pipelineId: { type: String },
      buildConfigPath: { type: String },
      
      // Custom configuration
      customConfig: { type: Schema.Types.Mixed },
    },
    credentials: {
      accessToken: { type: String },
      refreshToken: { type: String },
      expiresAt: { type: Date },
      tokenType: { type: String, default: "Bearer" },
      scope: { type: String },
      apiKey: { type: String },
      apiSecret: { type: String },
      clientId: { type: String },
      clientSecret: { type: String },
    },
    webhookUrl: {
      type: String,
    },
    webhookSecret: {
      type: String,
    },
    // Sync settings
    syncSettings: {
      autoSync: { type: Boolean, default: false },
      syncFrequency: { 
        type: String, 
        enum: ["realtime", "hourly", "daily", "manual"],
        default: "manual" 
      },
      syncDirection: {
        type: String,
        enum: ["both", "import", "export"],
        default: "both",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ["success", "failed", "in_progress", "pending"],
      default: "pending",
    },
    lastError: {
      type: String,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    // Usage statistics
    stats: {
      totalSyncs: { type: Number, default: 0 },
      successfulSyncs: { type: Number, default: 0 },
      failedSyncs: { type: Number, default: 0 },
      lastSuccessfulSync: { type: Date },
    },
    // Integration visibility and permissions
    visibility: {
      type: String,
      enum: ["private", "workspace", "public"],
      default: "private",
    },
    // Permissions for different user roles
    permissions: {
      owner: {
        canEdit: { type: Boolean, default: true },
        canDelete: { type: Boolean, default: true },
        canShare: { type: Boolean, default: true },
      },
      admin: {
        canEdit: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
        canShare: { type: Boolean, default: true },
      },
      member: {
        canEdit: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
        canShare: { type: Boolean, default: false },
      },
    },
    // Integration sharing settings
    sharedWith: [{
      user: { type: Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["viewer", "editor", "admin"] },
      sharedAt: { type: Date, default: Date.now },
    }],
    // Integration templates for easy setup
    template: {
      type: Schema.Types.ObjectId,
      ref: "IntegrationTemplate",
    },
    // Integration category for better organization
    category: {
      type: String,
      enum: [
        "productivity",
        "development", 
        "design",
        "communication",
        "storage",
        "analytics",
        "automation",
        "calendar",
        "project_management"
      ],
      required: true,
    },
    // Integration priority for display order
    priority: {
      type: Number,
      default: 0,
    },
    // Integration status
    status: {
      type: String,
      enum: ["active", "inactive", "error", "pending_setup"],
      default: "pending_setup",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
integrationSchema.index({ user: 1, scope: 1 });
integrationSchema.index({ workspace: 1, scope: 1 });
integrationSchema.index({ project: 1, scope: 1 });
integrationSchema.index({ type: 1, category: 1 });
integrationSchema.index({ status: 1, isActive: 1 });
integrationSchema.index({ "sharedWith.user": 1 });
integrationSchema.index({ priority: -1, createdAt: -1 });

// Compound indexes for common queries
integrationSchema.index({ user: 1, type: 1, scope: 1 });
integrationSchema.index({ workspace: 1, type: 1, scope: 1 });
integrationSchema.index({ project: 1, type: 1, scope: 1 });

// Unique constraint: one active integration per user/workspace/project per type
integrationSchema.index(
  { user: 1, workspace: 1, project: 1, type: 1, scope: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      isActive: true,
      status: { $in: ["active", "pending_setup"] }
    } 
  }
);
integrationSchema.index({ workspace: 1, isActive: 1 });
integrationSchema.index({ type: 1, isActive: 1 });

export default mongoose.model("Integration", integrationSchema);
