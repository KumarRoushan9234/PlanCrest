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
        "github",
        "gitlab",
        "google_drive",
        "google_calendar",
        "google_meet",
        "slack",
        "zoom",
        "figma",
        "aws_s3",
        "google_cloud",
        "azure_storage",
        "dropbox",
        "github_actions",
        "gitlab_ci",
        "jenkins",
        "circleci",
        "custom",
      ],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
integrationSchema.index({ workspace: 1, type: 1 });
integrationSchema.index({ project: 1, type: 1 });
integrationSchema.index({ workspace: 1, isActive: 1 });
integrationSchema.index({ type: 1, isActive: 1 });

export default mongoose.model("Integration", integrationSchema);
