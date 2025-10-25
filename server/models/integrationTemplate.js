import mongoose from "mongoose";
const { Schema } = mongoose;

const integrationTemplateSchema = new Schema(
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
    category: {
      type: String,
      required: true,
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
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    // Supported scopes for this integration
    supportedScopes: [{
      type: String,
      enum: ["personal", "workspace", "project"],
    }],
    // Default configuration template
    defaultConfig: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Required credentials for this integration
    requiredCredentials: [{
      name: { type: String, required: true },
      type: { type: String, enum: ["oauth", "api_key", "username_password", "webhook"], required: true },
      description: { type: String, required: true },
      required: { type: Boolean, default: true },
    }],
    // OAuth configuration
    oauthConfig: {
      clientId: { type: String },
      clientSecret: { type: String },
      authUrl: { type: String },
      tokenUrl: { type: String },
      scope: [String],
      redirectUri: { type: String },
    },
    // Webhook configuration
    webhookConfig: {
      supportedEvents: [String],
      webhookUrl: { type: String },
      secret: { type: String },
    },
    // Integration capabilities
    capabilities: {
      sync: { type: Boolean, default: false },
      webhooks: { type: Boolean, default: false },
      realtime: { type: Boolean, default: false },
      fileUpload: { type: Boolean, default: false },
      calendar: { type: Boolean, default: false },
      notifications: { type: Boolean, default: false },
    },
    // Setup instructions
    setupInstructions: {
      type: String,
      required: true,
    },
    // Documentation links
    documentation: {
      setup: { type: String },
      api: { type: String },
      troubleshooting: { type: String },
    },
    // Integration status
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    // Usage statistics
    usage: {
      totalInstalls: { type: Number, default: 0 },
      activeInstalls: { type: Number, default: 0 },
      rating: { type: Number, min: 0, max: 5, default: 0 },
      reviews: { type: Number, default: 0 },
    },
    // Version information
    version: {
      type: String,
      default: "1.0.0",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
integrationTemplateSchema.index({ type: 1, isActive: 1 });
integrationTemplateSchema.index({ category: 1, isActive: 1 });
integrationTemplateSchema.index({ isPopular: 1, usage: -1 });
integrationTemplateSchema.index({ "supportedScopes": 1 });

export default mongoose.model("IntegrationTemplate", integrationTemplateSchema);
