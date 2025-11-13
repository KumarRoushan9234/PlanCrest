import mongoose from "mongoose";

const githubAnalyticsSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GitHubRepository",
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
    // Time period
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Commit metrics
    commits: {
      total: { type: Number, default: 0 },
      byAuthor: { type: Map, of: Number }, // username -> count
      byHour: { type: Map, of: Number }, // hour -> count
      byDay: { type: Map, of: Number }, // day -> count
      additions: { type: Number, default: 0 },
      deletions: { type: Number, default: 0 },
      netChange: { type: Number, default: 0 },
    },
    // PR metrics
    pullRequests: {
      opened: { type: Number, default: 0 },
      closed: { type: Number, default: 0 },
      merged: { type: Number, default: 0 },
      averageMergeTime: { type: Number, default: 0 }, // in hours
      averageReviewTime: { type: Number, default: 0 }, // in hours
      byAuthor: { type: Map, of: Number },
    },
    // Issue metrics
    issues: {
      opened: { type: Number, default: 0 },
      closed: { type: Number, default: 0 },
      averageResolutionTime: { type: Number, default: 0 }, // in hours
      byLabel: { type: Map, of: Number },
    },
    // Contributor metrics
    contributors: {
      active: { type: Number, default: 0 },
      new: { type: Number, default: 0 },
      topContributors: [{
        username: String,
        commits: Number,
        prs: Number,
        issues: Number,
      }],
    },
    // Code metrics
    code: {
      linesAdded: { type: Number, default: 0 },
      linesDeleted: { type: Number, default: 0 },
      filesChanged: { type: Number, default: 0 },
      languages: { type: Map, of: Number }, // language -> bytes
    },
    // Review metrics
    reviews: {
      total: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      changesRequested: { type: Number, default: 0 },
      commented: { type: Number, default: 0 },
      averageReviewTime: { type: Number, default: 0 }, // in hours
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
githubAnalyticsSchema.index({ repository: 1, period: 1, date: -1 }, { unique: true });
githubAnalyticsSchema.index({ project: 1, period: 1, date: -1 });
githubAnalyticsSchema.index({ workspace: 1, period: 1, date: -1 });

const GitHubAnalytics = mongoose.model("GitHubAnalytics", githubAnalyticsSchema);

export default GitHubAnalytics;

