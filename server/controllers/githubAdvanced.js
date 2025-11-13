import { Octokit } from "@octokit/rest";
import mongoose from "mongoose";
import crypto from "crypto";
import Connector from "../models/connector.js";
import GitHubRepository from "../models/githubRepository.js";
import GitHubActivity from "../models/githubActivity.js";
import GitHubAnalytics from "../models/githubAnalytics.js";
import Task from "../models/task.js";
import Notification from "../models/notification.js";
import Project from "../models/project.js";
import Workspace from "../models/workspace.js";
import User from "../models/user.js";
import Board from "../models/board.js";
import Column from "../models/column.js";
import { createNotification } from "../utils/notificationHelpers.js";

// ==================== REPOSITORY STATISTICS ====================

export const getRepositoryStatistics = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Fetch comprehensive repository data with error handling
    const [
      repoResult,
      contributorsResult,
      languagesResult,
      branchesResult,
      issuesResult,
      prsResult,
      releasesResult,
    ] = await Promise.allSettled([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listContributors({ owner, repo, per_page: 10 }).catch(() => ({ data: [] })),
      octokit.repos.listLanguages({ owner, repo }).catch(() => ({ data: {} })),
      octokit.repos.listBranches({ owner, repo, per_page: 10 }).catch(() => ({ data: [] })),
      octokit.issues.listForRepo({ owner, repo, state: "open", per_page: 1 }).catch(() => ({ data: [] })),
      octokit.pulls.list({ owner, repo, state: "open", per_page: 30 }).catch(() => ({ data: [] })),
      octokit.repos.listReleases({ owner, repo, per_page: 5 }).catch(() => ({ data: [] })),
    ]);

    // Handle repository data - this is required, so fail if it errors
    if (repoResult.status === "rejected") {
      throw repoResult.reason;
    }
    const repoData = repoResult.value;

    // Handle optional data with defaults
    const contributorsData = contributorsResult.status === "fulfilled" ? contributorsResult.value : { data: [] };
    const languagesData = languagesResult.status === "fulfilled" ? languagesResult.value : { data: {} };
    const branchesData = branchesResult.status === "fulfilled" ? branchesResult.value : { data: [] };
    const issuesData = issuesResult.status === "fulfilled" ? issuesResult.value : { data: [] };
    const prsData = prsResult.status === "fulfilled" ? prsResult.value : { data: [] };
    const releasesData = releasesResult.status === "fulfilled" ? releasesResult.value : { data: [] };

    // Get protected branches
    const protectedBranches = [];
    try {
      for (const branch of branchesData.data) {
        try {
          const branchData = await octokit.repos.getBranchProtection({
            owner,
            repo,
            branch: branch.name,
          });
          if (branchData.data) {
            protectedBranches.push(branch.name);
          }
        } catch (e) {
          // Branch not protected
        }
      }
    } catch (e) {
      // No permission to check protection
    }

    // Calculate language percentages
    const languagesMap = languagesData.data || {};
    const totalBytes = Object.values(languagesMap).reduce((sum, bytes) => sum + (bytes || 0), 0);
    const languages = totalBytes > 0
      ? Object.entries(languagesMap)
          .map(([lang, bytes]) => ({
            name: lang,
            bytes: bytes || 0,
            percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(1)),
          }))
          .sort((a, b) => b.bytes - a.bytes)
      : [];

    // Format contributors
    const contributors = (contributorsData.data || [])
      .slice(0, 10)
      .map((contrib) => ({
        username: contrib.login,
        avatar: contrib.avatar_url,
        contributions: contrib.contributions || 0,
        profileUrl: contrib.html_url,
      }));

    // Format branches
    const branches = (branchesData.data || []).map((branch) => ({
      name: branch.name,
      protected: protectedBranches.includes(branch.name),
      sha: branch.commit?.sha,
      commitUrl: branch.commit?.url,
    }));

    const statistics = {
      basic: {
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        watchers: repoData.data.watchers_count,
        openIssues: repoData.data.open_issues_count || 0,
        openPRs: (prsData.data || []).length,
        size: repoData.data.size,
        archived: repoData.data.archived,
        disabled: repoData.data.disabled,
      },
      languages,
      contributors,
      branches: {
        default: repoData.data.default_branch,
        protected: protectedBranches,
        recent: branches,
      },
      license: repoData.data.license
        ? {
            key: repoData.data.license.key,
            name: repoData.data.license.name,
            spdxId: repoData.data.license.spdx_id,
          }
        : null,
      topics: repoData.data.topics || [],
      releases: (releasesData.data || []).map((release) => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        publishedAt: release.published_at,
        author: release.author
          ? {
              username: release.author.login,
              avatar: release.author.avatar_url,
            }
          : null,
      })),
      health: {
        codeQuality: "fair", // Would need external tools to determine
        testCoverage: 0, // Would need coverage reports
        documentationStatus: repoData.data.has_wiki ? "complete" : "partial",
        lastHealthCheck: new Date(),
      },
    };

    res.json({ success: true, statistics });
  } catch (error) {
    console.error("Error fetching repository statistics:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch repository statistics" });
  }
};

// ==================== ACTIVITY ANALYTICS ====================

export const getActivityAnalytics = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, period = "weekly", limit = 30 } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === "daily") {
      startDate.setDate(startDate.getDate() - parseInt(limit));
    } else if (period === "weekly") {
      startDate.setDate(startDate.getDate() - parseInt(limit) * 7);
    } else if (period === "monthly") {
      startDate.setMonth(startDate.getMonth() - parseInt(limit));
    }

    // Fetch commits, PRs, and issues with error handling
    const [commitsResult, prsResult, issuesResult] = await Promise.allSettled([
      octokit.repos.listCommits({
        owner,
        repo,
        since: startDate.toISOString(),
        per_page: 100,
      }).catch((err) => {
        // Handle empty repository (409) or other errors
        if (err.status === 409) {
          return { data: [] }; // Empty repository
        }
        throw err;
      }),
      octokit.pulls.list({
        owner,
        repo,
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      }).catch(() => ({ data: [] })),
      octokit.issues.listForRepo({
        owner,
        repo,
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      }).catch(() => ({ data: [] })),
    ]);

    const commitsData = commitsResult.status === "fulfilled" ? commitsResult.value : { data: [] };
    const prsData = prsResult.status === "fulfilled" ? prsResult.value : { data: [] };
    const issuesData = issuesResult.status === "fulfilled" ? issuesResult.value : { data: [] };

    // Process commits
    const commitActivity = {};
    const commitByHour = {};
    const commitByAuthor = {};

    commitsData.data.forEach((commit) => {
      const date = new Date(commit.commit.author.date);
      const dateKey = date.toISOString().split("T")[0];
      const hour = date.getHours();

      commitActivity[dateKey] = (commitActivity[dateKey] || 0) + 1;
      commitByHour[hour] = (commitByHour[hour] || 0) + 1;

      const author = commit.author?.login || commit.commit.author.name;
      commitByAuthor[author] = (commitByAuthor[author] || 0) + 1;
    });

    // Process PRs
    const prTrends = {};
    const prMetrics = {
      opened: 0,
      closed: 0,
      merged: 0,
      averageMergeTime: 0,
      averageReviewTime: 0,
      mergeTimes: [],
    };

    prsData.data.forEach((pr) => {
      const date = new Date(pr.created_at);
      const dateKey = date.toISOString().split("T")[0];
      prTrends[dateKey] = (prTrends[dateKey] || 0) + 1;

      if (pr.state === "open") prMetrics.opened++;
      else if (pr.merged_at) {
        prMetrics.merged++;
        const mergeTime = (new Date(pr.merged_at) - new Date(pr.created_at)) / (1000 * 60 * 60);
        prMetrics.mergeTimes.push(mergeTime);
      } else {
        prMetrics.closed++;
      }
    });

    if (prMetrics.mergeTimes.length > 0) {
      prMetrics.averageMergeTime =
        prMetrics.mergeTimes.reduce((a, b) => a + b, 0) / prMetrics.mergeTimes.length;
    }

    // Process issues
    const issueTrends = {};
    const issueMetrics = {
      opened: 0,
      closed: 0,
      averageResolutionTime: 0,
      resolutionTimes: [],
    };

    issuesData.data
      .filter((issue) => !issue.pull_request) // Exclude PRs
      .forEach((issue) => {
        const date = new Date(issue.created_at);
        const dateKey = date.toISOString().split("T")[0];
        issueTrends[dateKey] = (issueTrends[dateKey] || 0) + 1;

        if (issue.state === "open") {
          issueMetrics.opened++;
        } else {
          issueMetrics.closed++;
          if (issue.closed_at) {
            const resolutionTime =
              (new Date(issue.closed_at) - new Date(issue.created_at)) / (1000 * 60 * 60);
            issueMetrics.resolutionTimes.push(resolutionTime);
          }
        }
      });

    if (issueMetrics.resolutionTimes.length > 0) {
      issueMetrics.averageResolutionTime =
        issueMetrics.resolutionTimes.reduce((a, b) => a + b, 0) /
        issueMetrics.resolutionTimes.length;
    }

    // Calculate code frequency
    let totalAdditions = 0;
    let totalDeletions = 0;
    commitsData.data.forEach((commit) => {
      // Note: GitHub API doesn't provide additions/deletions in listCommits
      // Would need to fetch each commit individually or use stats API
    });

    const analytics = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      commits: {
        total: commitsData.data.length,
        byDate: commitActivity,
        byHour: commitByHour,
        byAuthor: commitByAuthor,
        additions: totalAdditions,
        deletions: totalDeletions,
        netChange: totalAdditions - totalDeletions,
      },
      pullRequests: {
        trends: prTrends,
        metrics: prMetrics,
      },
      issues: {
        trends: issueTrends,
        metrics: issueMetrics,
      },
      contributors: {
        active: Object.keys(commitByAuthor).length,
        topContributors: Object.entries(commitByAuthor)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([username, commits]) => ({
            username,
            commits,
          })),
      },
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error("Error fetching activity analytics:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch activity analytics" });
  }
};

// ==================== ENHANCED COMMIT HISTORY ====================

export const getCommitHistory = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, page = 1, perPage = 30, branch, author, since, until } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const params = {
      owner,
      repo,
      page: parseInt(page),
      per_page: parseInt(perPage),
    };

    if (branch) params.sha = branch;
    if (author) params.author = author;
    if (since) params.since = since;
    if (until) params.until = until;

    let commitsData;
    try {
      commitsData = await octokit.repos.listCommits(params);
    } catch (error) {
      // Handle empty repository (409) gracefully
      if (error.status === 409) {
        return res.json({
          success: true,
          commits: [],
          pagination: {
            page: parseInt(page),
            perPage: parseInt(perPage),
            total: 0,
            totalPages: 0,
          },
        });
      }
      throw error;
    }

    // Fetch detailed commit info for first page
    const commits = await Promise.all(
      commitsData.data.map(async (commit) => {
        try {
          const commitDetail = await octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author.name,
              email: commit.commit.author.email,
              username: commit.author?.login,
              avatar: commit.author?.avatar_url,
              date: commit.commit.author.date,
            },
            committer: {
              name: commit.commit.committer.name,
              email: commit.commit.committer.email,
              username: commit.committer?.login,
              avatar: commit.committer?.avatar_url,
              date: commit.commit.committer.date,
            },
            url: commit.html_url,
            stats: commitDetail.data.stats
              ? {
                  additions: commitDetail.data.stats.additions,
                  deletions: commitDetail.data.stats.deletions,
                  total: commitDetail.data.stats.total,
                }
              : null,
            files: commitDetail.data.files?.map((file) => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch?.substring(0, 500), // Limit patch size
            })),
          };
        } catch (e) {
          // Fallback to basic commit info
          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author.name,
              email: commit.commit.author.email,
              username: commit.author?.login,
              avatar: commit.author?.avatar_url,
              date: commit.commit.author.date,
            },
            url: commit.html_url,
          };
        }
      })
    );

    res.json({
      success: true,
      commits,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: commitsData.data.length,
        hasMore: commitsData.data.length === parseInt(perPage),
      },
    });
  } catch (error) {
    console.error("Error fetching commit history:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch commit history" });
  }
};

// ==================== AUTO-CREATE TASKS FROM ISSUES ====================

export const syncIssuesToTasks = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, projectId, scope, scopeId, autoLink = true } = req.body;

    if (!repositoryFullName || !projectId) {
      return res.status(400).json({ error: "Repository full name and project ID are required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Fetch open issues
    const issuesData = await octokit.issues.listForRepo({
      owner,
      repo,
      state: "open",
      per_page: 100,
    });

    const createdTasks = [];
    const linkedTasks = [];

    for (const issue of issuesData.data) {
      // Check if task already exists for this issue
      const existingTask = await Task.findOne({
        project: projectId,
        "githubLinks.type": "issue",
        "githubLinks.number": issue.number,
      });

      if (existingTask) {
        if (autoLink) {
          linkedTasks.push({
            taskId: existingTask._id,
            taskKey: existingTask.taskKey,
            issueNumber: issue.number,
          });
        }
        continue;
      }

      // Get project board and column
      const board = await Board.findOne({ project: projectId });
      if (!board) {
        return res.status(400).json({ error: "Project board not found" });
      }

      let column = await Column.findOne({
        board: board._id,
        name: "Backlog",
      });
      if (!column) {
        // Use first column if backlog doesn't exist
        const firstColumn = await Column.findOne({ board: board._id });
        if (!firstColumn) {
          return res.status(400).json({ error: "No columns found in project board" });
        }
        column = firstColumn;
      }

      // Get next task number
      const lastTask = await Task.findOne({ project: projectId })
        .sort({ taskNumber: -1 })
        .limit(1);
      const taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;
      const taskKey = `${project.key}-${taskNumber}`;

      // Determine priority from labels
      let priority = "medium";
      if (issue.labels.some((label) => label.name.toLowerCase().includes("high") || label.name.toLowerCase().includes("critical"))) {
        priority = "high";
      } else if (issue.labels.some((label) => label.name.toLowerCase().includes("low"))) {
        priority = "low";
      }

      // Create task
      const task = new Task({
        title: issue.title,
        description: issue.body || "",
        project: projectId,
        board: board._id,
        column: column._id,
        taskNumber,
        taskKey,
        priority,
        status: "todo",
        githubLinks: [
          {
            type: "issue",
            url: issue.html_url,
            number: issue.number,
            title: issue.title,
            status: issue.state,
          },
        ],
        tags: issue.labels.map((label) => label.name),
        createdBy: userId,
      });

      await task.save();
      createdTasks.push({
        taskId: task._id,
        taskKey: task.taskKey,
        issueNumber: issue.number,
        title: task.title,
      });
    }

    res.json({
      success: true,
      created: createdTasks.length,
      linked: linkedTasks.length,
      tasks: createdTasks,
      linkedTasks,
    });
  } catch (error) {
    console.error("Error syncing issues to tasks:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to sync issues to tasks" });
  }
};

// ==================== LINK PR TO TASK ====================

export const linkPRToTask = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { taskId, repositoryFullName, prNumber } = req.body;

    if (!taskId || !repositoryFullName || !prNumber) {
      return res.status(400).json({ error: "Task ID, repository full name, and PR number are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get connector
    const connector = await Connector.findOne({
      user: userId,
      type: "github",
      status: "active",
      scope: "personal",
    });

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Fetch PR details
    const prData = await octokit.pulls.get({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Check if PR is already linked
    const existingLink = task.githubLinks?.find(
      (link) => link.type === "pr" && link.number === parseInt(prNumber)
    );

    if (existingLink) {
      return res.json({
        success: true,
        message: "PR already linked to task",
        task,
      });
    }

    // Add PR link
    if (!task.githubLinks) {
      task.githubLinks = [];
    }

    task.githubLinks.push({
      type: "pr",
      url: prData.data.html_url,
      number: parseInt(prNumber),
      title: prData.data.title,
      status: prData.data.state,
    });

    task.lastEditedBy = userId;
    await task.save();

    res.json({
      success: true,
      message: "PR linked to task successfully",
      task,
    });
  } catch (error) {
    console.error("Error linking PR to task:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: "PR not found" });
    }
    res.status(500).json({ error: "Failed to link PR to task" });
  }
};

// ==================== NOTIFICATION RULES ====================

export const createNotificationRule = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, rule } = req.body;

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    if (!connector.settings) {
      connector.settings = {};
    }
    if (!connector.settings.notificationRules) {
      connector.settings.notificationRules = [];
    }

    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: rule.name,
      enabled: rule.enabled !== false,
      filters: rule.filters || {
        repositories: [],
        branches: [],
        filePaths: [],
        events: [],
      },
      priority: rule.priority || "normal",
      channels: rule.channels || {
        email: true,
        inApp: true,
        webhook: false,
        webhookUrl: null,
      },
      quietHours: rule.quietHours || {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      },
      digestMode: rule.digestMode || {
        enabled: false,
        frequency: "daily",
        time: "09:00",
      },
    };

    connector.settings.notificationRules.push(newRule);
    await connector.save();

    res.json({
      success: true,
      rule: newRule,
    });
  } catch (error) {
    console.error("Error creating notification rule:", error);
    res.status(500).json({ error: "Failed to create notification rule" });
  }
};

export const updateNotificationRule = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, ruleId, updates } = req.body;

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const ruleIndex = connector.settings?.notificationRules?.findIndex((r) => r.id === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({ error: "Notification rule not found" });
    }

    Object.assign(connector.settings.notificationRules[ruleIndex], updates);
    await connector.save();

    res.json({
      success: true,
      rule: connector.settings.notificationRules[ruleIndex],
    });
  } catch (error) {
    console.error("Error updating notification rule:", error);
    res.status(500).json({ error: "Failed to update notification rule" });
  }
};

export const deleteNotificationRule = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId, ruleId } = req.body;

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    connector.settings.notificationRules = connector.settings?.notificationRules?.filter(
      (r) => r.id !== ruleId
    ) || [];
    await connector.save();

    res.json({
      success: true,
      message: "Notification rule deleted",
    });
  } catch (error) {
    console.error("Error deleting notification rule:", error);
    res.status(500).json({ error: "Failed to delete notification rule" });
  }
};

export const getNotificationRules = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { scope, scopeId } = req.query;

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    res.json({
      success: true,
      rules: connector.settings?.notificationRules || [],
    });
  } catch (error) {
    console.error("Error fetching notification rules:", error);
    res.status(500).json({ error: "Failed to fetch notification rules" });
  }
};

// ==================== TEAM INSIGHTS ====================

export const getTeamInsights = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, period = "monthly" } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "monthly") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "quarterly") {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    // Fetch team activity
    const [contributorsData, prsData, issuesData, commitsData] = await Promise.all([
      octokit.repos.listContributors({ owner, repo, per_page: 100 }),
      octokit.pulls.list({ owner, repo, state: "all", per_page: 100 }),
      octokit.issues.listForRepo({ owner, repo, state: "all", per_page: 100 }),
      octokit.repos.listCommits({ owner, repo, since: startDate.toISOString(), per_page: 100 }),
    ]);

    // Process contributors
    const contributors = contributorsData.data.map((contrib) => ({
      username: contrib.login,
      avatar: contrib.avatar_url,
      contributions: contrib.contributions,
      profileUrl: contrib.html_url,
    }));

    // Process PRs by author
    const prsByAuthor = {};
    const reviewRequests = {};
    const reviewStatus = {
      approved: 0,
      changesRequested: 0,
      commented: 0,
      pending: 0,
    };

    for (const pr of prsData.data) {
      const author = pr.user?.login;
      if (author) {
        prsByAuthor[author] = (prsByAuthor[author] || 0) + 1;
      }

      // Get review requests
      try {
        const reviewRequestsData = await octokit.pulls.listRequestedReviewers({
          owner,
          repo,
          pull_number: pr.number,
        });
        reviewRequestsData.data.users?.forEach((user) => {
          reviewRequests[user.login] = (reviewRequests[user.login] || 0) + 1;
        });
      } catch (e) {
        // No permission or error
      }

      // Get review status
      try {
        const reviewsData = await octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pr.number,
        });
        reviewsData.data.forEach((review) => {
          if (review.state === "APPROVED") reviewStatus.approved++;
          else if (review.state === "CHANGES_REQUESTED") reviewStatus.changesRequested++;
          else if (review.state === "COMMENTED") reviewStatus.commented++;
        });
      } catch (e) {
        // No permission or error
      }
    }

    // Process commits by author
    const commitsByAuthor = {};
    commitsData.data.forEach((commit) => {
      const author = commit.author?.login || commit.commit.author.name;
      commitsByAuthor[author] = (commitsByAuthor[author] || 0) + 1;
    });

    // Process issues by assignee
    const issuesByAssignee = {};
    issuesData.data
      .filter((issue) => !issue.pull_request)
      .forEach((issue) => {
        issue.assignees?.forEach((assignee) => {
          issuesByAssignee[assignee.login] = (issuesByAssignee[assignee.login] || 0) + 1;
        });
      });

    // Calculate metrics
    const totalPRs = prsData.data.length;
    const openPRs = prsData.data.filter((pr) => pr.state === "open").length;
    const mergedPRs = prsData.data.filter((pr) => pr.merged_at).length;
    const averagePRMergeTime = prsData.data
      .filter((pr) => pr.merged_at)
      .reduce((sum, pr) => {
        const mergeTime = (new Date(pr.merged_at) - new Date(pr.created_at)) / (1000 * 60 * 60);
        return sum + mergeTime;
      }, 0) / mergedPRs || 0;

    const insights = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      contributors: {
        total: contributors.length,
        active: Object.keys(commitsByAuthor).length,
        topContributors: contributors.slice(0, 10),
      },
      pullRequests: {
        total: totalPRs,
        open: openPRs,
        merged: mergedPRs,
        averageMergeTime: averagePRMergeTime.toFixed(1),
        byAuthor: Object.entries(prsByAuthor)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([username, count]) => ({ username, count })),
        reviewStatus,
        reviewRequests: Object.entries(reviewRequests)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([username, count]) => ({ username, count })),
      },
      commits: {
        total: commitsData.data.length,
        byAuthor: Object.entries(commitsByAuthor)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([username, count]) => ({ username, count })),
      },
      issues: {
        total: issuesData.data.filter((i) => !i.pull_request).length,
        open: issuesData.data.filter((i) => !i.pull_request && i.state === "open").length,
        byAssignee: Object.entries(issuesByAssignee)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([username, count]) => ({ username, count })),
      },
    };

    res.json({ success: true, insights });
  } catch (error) {
    console.error("Error fetching team insights:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch team insights" });
  }
};

// ==================== SECURITY FEATURES ====================

export const getSecurityAlerts = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const alerts = [];
    let vulnerabilities = [];
    let secrets = [];
    let licenses = [];

    // Fetch Dependabot alerts (requires repository access)
    try {
      const dependabotAlerts = await octokit.dependabot.listAlertsForRepo({
        owner,
        repo,
        per_page: 100,
      });
      vulnerabilities = dependabotAlerts.data.map((alert) => ({
        id: alert.number,
        type: "vulnerability",
        severity: alert.security_vulnerability?.severity || "unknown",
        package: alert.dependency?.package?.name,
        ecosystem: alert.dependency?.package?.ecosystem,
        vulnerableVersionRange: alert.security_vulnerability?.vulnerable_version_range,
        patchedVersion: alert.security_vulnerability?.first_patched_version?.identifier,
        summary: alert.security_advisory?.summary,
        description: alert.security_advisory?.description,
        cveId: alert.security_advisory?.cve_id,
        ghsaId: alert.security_advisory?.ghsa_id,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        dismissedAt: alert.dismissed_at,
        state: alert.state,
      }));
    } catch (e) {
      // Dependabot not enabled or no permission
      console.log("Dependabot alerts not available:", e.message);
    }

    // Note: Secret scanning and license compliance would require additional API calls
    // or webhook integration as they're not directly available via REST API

    const security = {
      vulnerabilities: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter((v) => v.severity === "critical").length,
        high: vulnerabilities.filter((v) => v.severity === "high").length,
        medium: vulnerabilities.filter((v) => v.severity === "medium").length,
        low: vulnerabilities.filter((v) => v.severity === "low").length,
        open: vulnerabilities.filter((v) => v.state === "open").length,
        dismissed: vulnerabilities.filter((v) => v.state === "dismissed").length,
        alerts: vulnerabilities,
      },
      secrets: {
        total: secrets.length,
        alerts: secrets,
      },
      licenses: {
        total: licenses.length,
        alerts: licenses,
      },
      lastScan: new Date(),
    };

    res.json({ success: true, security });
  } catch (error) {
    console.error("Error fetching security alerts:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch security alerts" });
  }
};

// ==================== GITHUB ACTIONS ====================

export const getWorkflowRuns = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, workflowId, perPage = 30 } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // List workflows with error handling
    let workflowsData = { data: { workflows: [] } };
    let runsData = { data: { workflow_runs: [] } };

    try {
      // Try different possible method locations
      if (typeof octokit.rest?.actions?.listWorkflowsForRepo === "function") {
        workflowsData = await octokit.rest.actions.listWorkflowsForRepo({
          owner,
          repo,
          per_page: 100,
        });
      } else if (typeof octokit.actions?.listWorkflowsForRepo === "function") {
        workflowsData = await octokit.actions.listWorkflowsForRepo({
          owner,
          repo,
          per_page: 100,
        });
      }
    } catch (error) {
      console.error("Error fetching workflows:", error.message);
      // Return empty workflows on error (permission denied, not found, etc.)
      workflowsData = { data: { workflows: [] } };
    }

    // Get workflow runs
    try {
      const params = {
        owner,
        repo,
        per_page: parseInt(perPage),
      };
      if (workflowId) {
        params.workflow_id = parseInt(workflowId);
      }

      // Try different possible method locations
      if (typeof octokit.rest?.actions?.listWorkflowRunsForRepo === "function") {
        runsData = await octokit.rest.actions.listWorkflowRunsForRepo(params);
      } else if (typeof octokit.actions?.listWorkflowRunsForRepo === "function") {
        runsData = await octokit.actions.listWorkflowRunsForRepo(params);
      }
    } catch (error) {
      console.error("Error fetching workflow runs:", error.message);
      // Return empty runs on error
      runsData = { data: { workflow_runs: [] } };
    }

    const workflows = (workflowsData.data?.workflows || []).map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
    }));

    const runs = (runsData.data?.workflow_runs || []).map((run) => ({
      id: run.id,
      name: run.name,
      workflowId: run.workflow_id,
      status: run.status,
      conclusion: run.conclusion,
      headBranch: run.head_branch,
      headSha: run.head_sha,
      event: run.event,
      actor: {
        username: run.actor?.login,
        avatar: run.actor?.avatar_url,
      },
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      runStartedAt: run.run_started_at,
      htmlUrl: run.html_url,
      jobsUrl: run.jobs_url,
      logsUrl: run.logs_url,
    }));

    res.json({
      success: true,
      workflows,
      runs,
      total: runsData.data.total_count,
    });
  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch workflow runs" });
  }
};

// ==================== WEBHOOK MANAGEMENT ====================

export const setupWebhook = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, events, webhookUrl } = req.body;

    if (!repositoryFullName || !events || !webhookUrl) {
      return res.status(400).json({
        error: "Repository full name, events, and webhook URL are required",
      });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    // Create webhook
    const webhookData = await octokit.repos.createWebhook({
      owner,
      repo,
      name: "web",
      active: true,
      events: events,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: webhookSecret,
        insecure_ssl: "0",
      },
    });

    // Update connector settings
    if (!connector.settings) {
      connector.settings = {};
    }
    if (!connector.settings.webhooks) {
      connector.settings.webhooks = {
        enabled: true,
        secret: webhookSecret,
        url: webhookUrl,
        events: events,
      };
    }

    await connector.save();

    res.json({
      success: true,
      webhook: {
        id: webhookData.data.id,
        url: webhookData.data.url,
        events: webhookData.data.events,
        active: webhookData.data.active,
        secret: webhookSecret, // Return only once for user to save
      },
    });
  } catch (error) {
    console.error("Error setting up webhook:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    if (error.status === 422) {
      return res.status(422).json({
        error: "Webhook already exists or invalid configuration",
        details: error.response?.data?.message,
      });
    }
    res.status(500).json({ error: "Failed to setup webhook" });
  }
};

export const getWebhooks = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    let webhooks = [];
    try {
      const webhooksData = await octokit.repos.listWebhooks({
        owner,
        repo,
        per_page: 100,
      });

      webhooks = webhooksData.data.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.created_at,
        updatedAt: webhook.updated_at,
      }));
    } catch (error) {
      // Handle 404 (no webhooks or no permission) gracefully
      if (error.status === 404 || error.status === 403) {
        webhooks = [];
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      webhooks,
    });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    // Return empty array for 404/403 instead of error
    if (error.status === 404 || error.status === 403) {
      return res.json({
        success: true,
        webhooks: [],
      });
    }
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, webhookId } = req.body;

    if (!repositoryFullName || !webhookId) {
      return res.status(400).json({
        error: "Repository full name and webhook ID are required",
      });
    }

    // Get connector
    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    await octokit.repos.deleteWebhook({
      owner,
      repo,
      hook_id: parseInt(webhookId),
    });

    res.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to delete webhook" });
  }
};

// ==================== WEBHOOK HANDLER ====================

export const handleGitHubWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];

    if (!signature || !event || !deliveryId) {
      return res.status(400).json({ error: "Missing webhook headers" });
    }

    // Verify webhook signature
    // Note: In production, verify against stored webhook secret
    const payload = JSON.stringify(req.body);
    // const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    // if (signature !== `sha256=${expectedSignature}`) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Process webhook event
    const eventData = req.body;

    // Store activity
    if (["push", "pull_request", "issues", "issue_comment"].includes(event)) {
      // Find connector by repository
      const repositoryFullName = eventData.repository?.full_name;
      if (repositoryFullName) {
        const connectors = await Connector.find({
          type: "github",
          status: "active",
          "linkedResources.repositoryFullName": repositoryFullName,
        });

        for (const connector of connectors) {
          // Create activity record
          const activity = new GitHubActivity({
            repository: null, // Would need to link to GitHubRepository model
            connector: connector._id,
            type: event === "push" ? "push" : event === "pull_request" ? "pull_request" : "issue",
            githubId: `${event}_${eventData[event]?.id || eventData.issue?.id || eventData.comment?.id}`,
            title: eventData[event]?.title || eventData.issue?.title || "Webhook event",
            description: eventData[event]?.body || eventData.issue?.body || "",
            url: eventData[event]?.html_url || eventData.issue?.html_url || "",
            author: {
              username: eventData.sender?.login,
              avatar: eventData.sender?.avatar_url,
            },
            createdAt: new Date(eventData[event]?.created_at || eventData.issue?.created_at),
            data: eventData,
          });

          await activity.save();

          // Create notifications based on rules
          // This would check connector.settings.notificationRules and create notifications accordingly
        }
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

// ==================== PR/ISSUE DETAILS ====================

export const getPullRequestDetails = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, prNumber, scope, scopeId } = req.query;

    if (!repositoryFullName || !prNumber) {
      return res.status(400).json({ error: "Repository and PR number are required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const [prData, commentsData, reviewsData, filesData] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number: parseInt(prNumber) }),
      octokit.issues.listComments({ owner, repo, issue_number: parseInt(prNumber) }),
      octokit.pulls.listReviews({ owner, repo, pull_number: parseInt(prNumber) }),
      octokit.pulls.listFiles({ owner, repo, pull_number: parseInt(prNumber) }),
    ]);

    const pr = {
      number: prData.data.number,
      title: prData.data.title,
      body: prData.data.body,
      state: prData.data.state,
      merged: prData.data.merged,
      mergeable: prData.data.mergeable,
      mergeableState: prData.data.mergeable_state,
      mergedAt: prData.data.merged_at,
      mergedBy: prData.data.merged_by ? {
        username: prData.data.merged_by.login,
        avatar: prData.data.merged_by.avatar_url,
      } : null,
      author: {
        username: prData.data.user.login,
        avatar: prData.data.user.avatar_url,
      },
      createdAt: prData.data.created_at,
      updatedAt: prData.data.updated_at,
      head: {
        ref: prData.data.head.ref,
        sha: prData.data.head.sha,
        repo: prData.data.head.repo.full_name,
      },
      base: {
        ref: prData.data.base.ref,
        sha: prData.data.base.sha,
        repo: prData.data.base.repo.full_name,
      },
      additions: prData.data.additions,
      deletions: prData.data.deletions,
      changedFiles: prData.data.changed_files,
      commits: prData.data.commits,
      url: prData.data.html_url,
      diffUrl: prData.data.diff_url,
      patchUrl: prData.data.patch_url,
      labels: prData.data.labels.map((label) => ({
        name: label.name,
        color: label.color,
        description: label.description,
      })),
      assignees: prData.data.assignees.map((assignee) => ({
        username: assignee.login,
        avatar: assignee.avatar_url,
      })),
      requestedReviewers: prData.data.requested_reviewers.map((reviewer) => ({
        username: reviewer.login,
        avatar: reviewer.avatar_url,
      })),
      comments: commentsData.data.map((comment) => ({
        id: comment.id,
        body: comment.body,
        author: {
          username: comment.user.login,
          avatar: comment.user.avatar_url,
        },
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      })),
      reviews: reviewsData.data.map((review) => ({
        id: review.id,
        state: review.state,
        body: review.body,
        reviewer: {
          username: review.user.login,
          avatar: review.user.avatar_url,
        },
        submittedAt: review.submitted_at,
      })),
      files: filesData.data.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch?.substring(0, 1000),
        blobUrl: file.blob_url,
        rawUrl: file.contents_url,
      })),
    };

    res.json({ success: true, pullRequest: pr });
  } catch (error) {
    console.error("Error fetching PR details:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch PR details" });
  }
};

export const getIssueDetails = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, issueNumber, scope, scopeId } = req.query;

    if (!repositoryFullName || !issueNumber) {
      return res.status(400).json({ error: "Repository and issue number are required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const [issueData, commentsData, eventsData] = await Promise.all([
      octokit.issues.get({ owner, repo, issue_number: parseInt(issueNumber) }),
      octokit.issues.listComments({ owner, repo, issue_number: parseInt(issueNumber) }),
      octokit.issues.listEvents({ owner, repo, issue_number: parseInt(issueNumber) }),
    ]);

    const issue = {
      number: issueData.data.number,
      title: issueData.data.title,
      body: issueData.data.body,
      state: issueData.data.state,
      locked: issueData.data.locked,
      author: {
        username: issueData.data.user.login,
        avatar: issueData.data.user.avatar_url,
      },
      createdAt: issueData.data.created_at,
      updatedAt: issueData.data.updated_at,
      closedAt: issueData.data.closed_at,
      closedBy: issueData.data.closed_by ? {
        username: issueData.data.closed_by.login,
        avatar: issueData.data.closed_by.avatar_url,
      } : null,
      url: issueData.data.html_url,
      labels: issueData.data.labels.map((label) => ({
        name: label.name,
        color: label.color,
        description: label.description,
      })),
      assignees: issueData.data.assignees.map((assignee) => ({
        username: assignee.login,
        avatar: assignee.avatar_url,
      })),
      milestone: issueData.data.milestone ? {
        title: issueData.data.milestone.title,
        number: issueData.data.milestone.number,
        state: issueData.data.milestone.state,
        dueOn: issueData.data.milestone.due_on,
      } : null,
      comments: commentsData.data.map((comment) => ({
        id: comment.id,
        body: comment.body,
        author: {
          username: comment.user.login,
          avatar: comment.user.avatar_url,
        },
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      })),
      events: eventsData.data.map((event) => ({
        id: event.id,
        event: event.event,
        actor: {
          username: event.actor.login,
          avatar: event.actor.avatar_url,
        },
        createdAt: event.created_at,
        label: event.label?.name,
        assignee: event.assignee?.login,
        milestone: event.milestone?.title,
      })),
    };

    res.json({ success: true, issue });
  } catch (error) {
    console.error("Error fetching issue details:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch issue details" });
  }
};

// ==================== REPOSITORY FILES & TREE ====================

export const getRepositoryTree = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, branch = "main", path = "", scope, scopeId } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    // Get branch SHA with error handling
    let branchData;
    try {
      branchData = await octokit.repos.getBranch({ owner, repo, branch });
    } catch (error) {
      // If branch not found, try to get default branch
      if (error.status === 404) {
        try {
          const repoData = await octokit.repos.get({ owner, repo });
          branchData = await octokit.repos.getBranch({
            owner,
            repo,
            branch: repoData.data.default_branch,
          });
        } catch (fallbackError) {
          return res.status(404).json({
            error: "Branch not found and default branch could not be retrieved",
          });
        }
      } else {
        throw error;
      }
    }
    const treeSha = branchData.data.commit.sha;

    // Get tree
    const treeData = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: path ? "1" : "0",
    });

    const files = treeData.data.tree
      .filter((item) => !path || item.path.startsWith(path))
      .map((item) => ({
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
        url: item.url,
        mode: item.mode,
      }));

    res.json({ success: true, files, treeSha });
  } catch (error) {
    console.error("Error fetching repository tree:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch repository tree" });
  }
};

export const getFileContent = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, path, branch = "main", scope, scopeId } = req.query;

    if (!repositoryFullName || !path) {
      return res.status(400).json({ error: "Repository and file path are required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const fileData = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    let content = "";
    let encoding = "";
    let size = 0;

    if (Array.isArray(fileData.data)) {
      // Directory
      return res.json({
        success: true,
        type: "directory",
        files: fileData.data.map((item) => ({
          name: item.name,
          type: item.type,
          path: item.path,
          size: item.size,
          sha: item.sha,
          url: item.html_url,
        })),
      });
    } else {
      // File
      if (fileData.data.encoding === "base64") {
        content = Buffer.from(fileData.data.content, "base64").toString("utf-8");
      } else {
        content = fileData.data.content;
      }
      encoding = fileData.data.encoding;
      size = fileData.data.size;
    }

    res.json({
      success: true,
      type: "file",
      content,
      encoding,
      size,
      path: fileData.data.path,
      sha: fileData.data.sha,
      url: fileData.data.html_url,
      downloadUrl: fileData.data.download_url,
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch file content" });
  }
};

// ==================== RELEASES ====================

export const getReleases = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, perPage = 30 } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const releasesData = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: parseInt(perPage),
    });

    const releases = releasesData.data.map((release) => ({
      id: release.id,
      tagName: release.tag_name,
      name: release.name,
      body: release.body,
      author: {
        username: release.author.login,
        avatar: release.author.avatar_url,
      },
      createdAt: release.created_at,
      publishedAt: release.published_at,
      prerelease: release.prerelease,
      draft: release.draft,
      url: release.html_url,
      tarballUrl: release.tarball_url,
      zipballUrl: release.zipball_url,
      assets: release.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        size: asset.size,
        downloadCount: asset.download_count,
        url: asset.browser_download_url,
        contentType: asset.content_type,
      })),
    }));

    res.json({ success: true, releases });
  } catch (error) {
    console.error("Error fetching releases:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch releases" });
  }
};

// ==================== BRANCHES ====================

export const getBranches = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, scope, scopeId, perPage = 100 } = req.query;

    if (!repositoryFullName) {
      return res.status(400).json({ error: "Repository full name is required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const query = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        query.workspace = scopeId;
      }
      connector = await Connector.findOne(query);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const branchesData = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: parseInt(perPage),
    });

    // Get protection info for each branch
    const branches = await Promise.all(
      branchesData.data.map(async (branch) => {
        let isProtected = false;
        let protection = null;
        try {
          const protectionData = await octokit.repos.getBranchProtection({
            owner,
            repo,
            branch: branch.name,
          });
          isProtected = true;
          protection = {
            requiredStatusChecks: protectionData.data.required_status_checks,
            enforceAdmins: protectionData.data.enforce_admins.enabled,
            requiredPullRequestReviews: protectionData.data.required_pull_request_reviews,
            restrictions: protectionData.data.restrictions,
          };
        } catch (e) {
          // Branch not protected
        }

        return {
          name: branch.name,
          sha: branch.commit.sha,
          protected: isProtected,
          protection,
          commit: {
            sha: branch.commit.sha,
            url: branch.commit.url,
            author: branch.commit.commit?.author?.name,
            message: branch.commit.commit?.message,
            date: branch.commit.commit?.author?.date,
          },
        };
      })
    );

    res.json({ success: true, branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

// ==================== SEARCH ====================

export const searchRepository = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { repositoryFullName, query, type = "code", scope, scopeId } = req.query;

    if (!repositoryFullName || !query) {
      return res.status(400).json({ error: "Repository and search query are required" });
    }

    let connector;
    if (scope === "project") {
      connector = await Connector.findOne({
        user: userId,
        type: "github",
        status: "active",
        scope: "personal",
      });
    } else {
      const queryObj = {
        user: userId,
        type: "github",
        status: "active",
        scope: scope || "personal",
      };
      if (scope === "workspace" && scopeId) {
        queryObj.workspace = scopeId;
      }
      connector = await Connector.findOne(queryObj);
    }

    if (!connector) {
      return res.status(404).json({ error: "GitHub connector not found" });
    }

    const octokit = new Octokit({ auth: connector.config.accessToken });
    const [owner, repo] = repositoryFullName.split("/");

    const searchQuery = `${query} repo:${owner}/${repo} type:${type}`;
    const searchData = await octokit.search.code({ q: searchQuery });

    const results = searchData.data.items.map((item) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      url: item.html_url,
      repository: item.repository.full_name,
      score: item.score,
      textMatches: item.text_matches?.map((match) => ({
        fragment: match.fragment,
        matches: match.matches,
      })),
    }));

    res.json({
      success: true,
      results,
      total: searchData.data.total_count,
    });
  } catch (error) {
    console.error("Error searching repository:", error);
    if (error.status === 401) {
      return res.status(401).json({
        error: "GitHub authentication failed. Please reconnect your GitHub account.",
        requiresReconnect: true,
      });
    }
    res.status(500).json({ error: "Failed to search repository" });
  }
};

