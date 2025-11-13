import mongoose from "mongoose";

const githubActivitySchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GitHubRepository",
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
    type: {
      type: String,
      enum: ["commit", "pull_request", "issue", "push", "review", "release", "deployment", "workflow"],
      required: true,
      index: true,
    },
    // Common fields
    githubId: {
      type: String,
      required: true,
      index: true,
    },
    title: String,
    description: String,
    url: String,
    author: {
      username: String,
      avatar: String,
      githubId: String,
    },
    createdAt: Date,
    updatedAt: Date,
    // Type-specific data
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Commit-specific
    commit: {
      sha: String,
      message: String,
      branch: String,
      filesChanged: Number,
      additions: Number,
      deletions: Number,
      parentShas: [String],
    },
    // PR-specific
    pullRequest: {
      number: Number,
      state: { type: String, enum: ["open", "closed", "merged", "draft"] },
      baseBranch: String,
      headBranch: String,
      mergeable: Boolean,
      mergeableState: String,
      reviewComments: Number,
      commits: Number,
      changedFiles: Number,
      additions: Number,
      deletions: Number,
      mergedAt: Date,
      mergedBy: {
        username: String,
        avatar: String,
      },
    },
    // Issue-specific
    issue: {
      number: Number,
      state: { type: String, enum: ["open", "closed"] },
      labels: [String],
      assignees: [{
        username: String,
        avatar: String,
      }],
      milestone: String,
      closedAt: Date,
      closedBy: {
        username: String,
        avatar: String,
      },
    },
    // Review-specific
    review: {
      state: { type: String, enum: ["approved", "changes_requested", "commented", "dismissed"] },
      prNumber: Number,
      body: String,
    },
    // Workflow-specific
    workflow: {
      name: String,
      status: { type: String, enum: ["success", "failure", "cancelled", "in_progress", "queued"] },
      conclusion: String,
      runId: String,
      workflowId: String,
    },
    // Linked task
    linkedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      index: true,
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
githubActivitySchema.index({ repository: 1, type: 1, createdAt: -1 });
githubActivitySchema.index({ connector: 1, createdAt: -1 });
githubActivitySchema.index({ project: 1, createdAt: -1 });
githubActivitySchema.index({ workspace: 1, createdAt: -1 });
githubActivitySchema.index({ githubId: 1 }, { unique: true });
githubActivitySchema.index({ linkedTask: 1 });
githubActivitySchema.index({ "pullRequest.number": 1 });
githubActivitySchema.index({ "issue.number": 1 });

const GitHubActivity = mongoose.model("GitHubActivity", githubActivitySchema);

export default GitHubActivity;

