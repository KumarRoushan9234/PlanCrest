import mongoose from "mongoose";

const connectorSchema = new mongoose.Schema(
  {
    // User who created this connector
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Scope: personal, workspace, or project
    scope: {
      type: String,
      enum: ["personal", "workspace", "project"],
      required: true,
      index: true,
    },

    // Reference to workspace (if scope is workspace)
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: function () {
        return this.scope === "workspace";
      },
      index: true,
    },

    // Reference to project (if scope is project)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: function () {
        return this.scope === "project";
      },
      index: true,
    },

    // Type of connector
    type: {
      type: String,
      enum: [
        "google_calendar",
        "google_meet",
        "google_drive",
        "gmail",
        "github",
        "gitlab",
        "slack",
        "microsoft_teams",
        "zoom",
        "figma",
        "jira",
        "trello",
        "asana",
        "notion",
        "dropbox",
        "onedrive",
      ],
      required: true,
      index: true,
    },

    // Display name
    name: {
      type: String,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "disconnected", "error", "pending"],
      default: "active",
      index: true,
    },

    // Configuration (encrypted tokens, credentials)
    config: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number,
      email: String,
      username: String,
      scopes: [String],
      webhookUrl: String,
      apiKey: String,
    },

    // Metadata
    metadata: {
      connectedAt: Date,
      lastSync: Date,
      syncFrequency: String,
      userInfo: {
        email: String,
        name: String,
        picture: String,
        avatar: String,
        username: String,
      },
      stats: {
        totalSyncs: { type: Number, default: 0 },
        lastSyncStatus: String,
        errorCount: { type: Number, default: 0 },
      },
    },

    // Settings
    settings: {
      autoSync: { type: Boolean, default: true },
      syncDirection: {
        type: String,
        enum: ["bidirectional", "import", "export"],
        default: "bidirectional",
      },
      notifications: { type: Boolean, default: true },
      // GitHub-specific notification settings
      notificationRules: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        filters: {
          repositories: [String], // repository full names
          branches: [String],
          filePaths: [String], // glob patterns
          events: [String], // pr, issue, commit, push, review, etc.
        },
        priority: { type: String, enum: ["low", "normal", "high", "critical"], default: "normal" },
        channels: {
          email: { type: Boolean, default: true },
          inApp: { type: Boolean, default: true },
          webhook: { type: Boolean, default: false },
          webhookUrl: String,
        },
        quietHours: {
          enabled: { type: Boolean, default: false },
          start: String, // HH:mm format
          end: String, // HH:mm format
          timezone: { type: String, default: "UTC" },
        },
        digestMode: {
          enabled: { type: Boolean, default: false },
          frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
          time: String, // HH:mm format
        },
      }],
      // Auto-sync task settings
      taskSync: {
        autoCreateFromIssues: { type: Boolean, default: false },
        autoLinkPRs: { type: Boolean, default: true },
        autoCloseOnMerge: { type: Boolean, default: false },
        trackCommits: { type: Boolean, default: true },
        branchBasedOrganization: { type: Boolean, default: false },
      },
      // Webhook settings
      webhooks: {
        enabled: { type: Boolean, default: false },
        secret: String,
        url: String,
        events: [String], // push, pull_request, issues, etc.
      },
    },

    // Linked resources (e.g., repositories for VCS connectors)
    linkedResources: [
      {
        repositoryId: { type: String },
        repositoryNodeId: { type: String },
        repositoryName: { type: String },
        repositoryFullName: { type: String },
        defaultBranch: { type: String },
        scope: {
          type: String,
          enum: ["personal", "workspace", "project"],
        },
        workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
        project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        visibility: { type: String },
        permissions: {
          admin: { type: Boolean },
          maintain: { type: Boolean },
          push: { type: Boolean },
          triage: { type: Boolean },
          pull: { type: Boolean },
        },
        topics: [String],
        connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        connectedAt: { type: Date, default: Date.now },
        lastSyncedAt: { type: Date },
        // Enhanced repository statistics
        stats: {
          stars: { type: Number, default: 0 },
          forks: { type: Number, default: 0 },
          watchers: { type: Number, default: 0 },
          openIssues: { type: Number, default: 0 },
          openPRs: { type: Number, default: 0 },
          languages: { type: Map, of: Number }, // language -> bytes
          license: { type: String },
          size: { type: Number },
          archived: { type: Boolean, default: false },
          disabled: { type: Boolean, default: false },
          lastUpdated: { type: Date },
        },
        // Repository health metrics
        health: {
          codeQuality: { type: String, enum: ["excellent", "good", "fair", "poor"], default: "fair" },
          testCoverage: { type: Number, default: 0 }, // percentage
          documentationStatus: { type: String, enum: ["complete", "partial", "missing"], default: "partial" },
          lastHealthCheck: { type: Date },
        },
        // Branch information
        branches: {
          default: { type: String },
          protected: [String],
          recent: [{ name: String, lastCommit: Date }],
        },
        // Contributors
        contributors: [{
          username: String,
          avatar: String,
          contributions: { type: Number, default: 0 },
          lastActivity: Date,
        }],
      },
    ],

    // Permissions (who can view/edit)
    permissions: {
      canView: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      canEdit: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
connectorSchema.index({ user: 1, type: 1, scope: 1 });
connectorSchema.index({ workspace: 1, status: 1 });
connectorSchema.index({ project: 1, status: 1 });
connectorSchema.index({ user: 1, status: 1 });
connectorSchema.index({ "linkedResources.repositoryFullName": 1 });

// Compound unique index to prevent duplicate active connectors
connectorSchema.index(
  { user: 1, type: 1, scope: 1, workspace: 1, project: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

const Connector = mongoose.model("Connector", connectorSchema);

export default Connector;


