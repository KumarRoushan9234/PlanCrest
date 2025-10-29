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
    },

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


