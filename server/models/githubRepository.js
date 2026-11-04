import mongoose from "mongoose";

const githubRepositorySchema = new mongoose.Schema(
  {
    repositoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    repositoryFullName: {
      type: String,
      required: true,
      index: true,
    },
    connector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connector",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      index: true,
    },
    // Repository metadata
    name: String,
    description: String,
    private: { type: Boolean, default: false },
    visibility: String,
    defaultBranch: String,
    language: String,
    languages: { type: Map, of: Number }, // language -> bytes
    license: {
      key: String,
      name: String,
      spdxId: String,
    },
    topics: [String],
    // Statistics
    stats: {
      stars: { type: Number, default: 0 },
      forks: { type: Number, default: 0 },
      watchers: { type: Number, default: 0 },
      openIssues: { type: Number, default: 0 },
      openPRs: { type: Number, default: 0 },
      size: { type: Number, default: 0 },
      archived: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
    },
    // Health metrics
    health: {
      codeQuality: { type: String, enum: ["excellent", "good", "fair", "poor"], default: "fair" },
      testCoverage: { type: Number, default: 0 },
      documentationStatus: { type: String, enum: ["complete", "partial", "missing"], default: "partial" },
      lastHealthCheck: Date,
    },
    // Branch information
    branches: {
      default: String,
      protected: [String],
      recent: [{
        name: String,
        lastCommit: Date,
        sha: String,
      }],
    },
    // Contributors
    contributors: [{
      username: String,
      avatar: String,
      contributions: { type: Number, default: 0 },
      lastActivity: Date,
      githubId: String,
    }],
    // Activity metrics
    activity: {
      commitFrequency: { type: Map, of: Number }, // date -> count
      prTrends: { type: Map, of: Number }, // date -> count
      issueTrends: { type: Map, of: Number }, // date -> count
      lastActivity: Date,
    },
    // Security
    security: {
      alerts: [{
        type: String, // vulnerability, secret, license, etc.
        severity: { type: String, enum: ["low", "medium", "high", "critical"] },
        title: String,
        description: String,
        createdAt: Date,
        resolvedAt: Date,
        status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
      }],
      lastSecurityScan: Date,
    },
    // GitHub Actions
    workflows: [{
      id: String,
      name: String,
      state: { type: String, enum: ["active", "deleted", "disabled_fork", "disabled_inactivity", "disabled_manually"] },
      lastRun: {
        status: { type: String, enum: ["success", "failure", "cancelled", "in_progress", "queued"] },
        conclusion: String,
        createdAt: Date,
      },
    }],
    // Last sync information
    lastSyncedAt: Date,
    syncedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
githubRepositorySchema.index({ connector: 1, repositoryFullName: 1 });
githubRepositorySchema.index({ project: 1 });
githubRepositorySchema.index({ workspace: 1 });
githubRepositorySchema.index({ "stats.stars": -1 });
githubRepositorySchema.index({ "activity.lastActivity": -1 });

const GitHubRepository = mongoose.model("GitHubRepository", githubRepositorySchema);

export default GitHubRepository;

