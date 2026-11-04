import crypto from "crypto";
import Connector from "../../models/connector.js";
import IntegrationEvent from "../../models/integrationEvent.js";
import Notification from "../../models/notification.js";
import Task from "../../models/task.js";
import { logTaskActivity } from "../../utils/activityLogger.js";
import { safeEqual } from "../../utils/crypto.js";
import { HttpError } from "../../utils/workspaceAccess.js";
import { bearer, call } from "../http.js";
import { apiBaseUrl } from "../registry.js";
import { markSynced } from "../store.js";
import { addExternalLink, guessStatus, importAsTasks } from "../taskImport.js";

const API = "https://api.github.com";
const KEY_RE = /\b([A-Z][A-Z0-9]{1,9}-\d+)\b/g;

const gh = (connector, config) =>
  call({
    ...config,
    url: `${API}${config.url}`,
    headers: bearer(connector.config.accessToken, { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...config.headers }),
  });

const repoParam = (repo) => {
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo || ""))) throw new HttpError(400, "Choose a repository (owner/name)");
  return repo;
};

const linkedProjectFor = (connector, repo) => connector.linkedResources?.find((r) => r.repositoryFullName === repo)?.project;

const priorityFromLabels = (labels = []) => {
  const names = labels.map((l) => (l.name || l).toLowerCase()).join(" ");
  if (/(urgent|critical|p0|p1|high)/.test(names)) return "high";
  if (/(low|minor|p3|trivial)/.test(names)) return "low";
  return "medium";
};

const actions = {
  async repos(ctx, { q }) {
    const list = await gh(ctx.connector, { url: "/user/repos", params: { per_page: 100, sort: "pushed", affiliation: "owner,collaborator,organization_member" } });
    const term = String(q || "").toLowerCase();
    const links = new Map((ctx.connector.linkedResources || []).map((r) => [r.repositoryFullName, r.project]));
    await markSynced(ctx.connector);
    return {
      repos: list
        .filter((r) => !term || r.full_name.toLowerCase().includes(term))
        .map((r) => ({
          fullName: r.full_name,
          name: r.name,
          private: r.private,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          openIssues: r.open_issues_count,
          defaultBranch: r.default_branch,
          pushedAt: r.pushed_at,
          linkedProject: links.get(r.full_name) || null,
        })),
    };
  },

  async link_repo(ctx, { fullName, projectId }) {
    repoParam(fullName);
    const { workspaceId } = await ctx.project(projectId);
    const repo = await gh(ctx.connector, { url: `/repos/${fullName}` });
    const resource = {
      repositoryId: String(repo.id),
      repositoryNodeId: repo.node_id,
      repositoryName: repo.name,
      repositoryFullName: repo.full_name,
      defaultBranch: repo.default_branch,
      scope: "workspace",
      workspace: workspaceId,
      project: projectId,
      visibility: repo.private ? "private" : "public",
    };
    const existing = ctx.connector.linkedResources.find((r) => r.repositoryFullName === fullName);
    if (existing) Object.assign(existing, resource);
    else ctx.connector.linkedResources.push(resource);
    await ctx.connector.save();
    return { linked: fullName, projectId };
  },

  async unlink_repo(ctx, { fullName }) {
    ctx.connector.linkedResources = ctx.connector.linkedResources.filter((r) => r.repositoryFullName !== fullName);
    await ctx.connector.save();
    return { unlinked: fullName };
  },

  async issues(ctx, { repo, state = "open" }) {
    repoParam(repo);
    const list = await gh(ctx.connector, { url: `/repos/${repo}/issues`, params: { state, per_page: 50 } });
    const issues = list.filter((i) => !i.pull_request);
    const imported = new Set(
      (await Task.find({ externalLinks: { $elemMatch: { provider: "github", externalId: { $in: issues.map((i) => `${repo}#${i.number}`) } } } }).select("externalLinks").lean())
        .flatMap((t) => t.externalLinks.map((l) => l.externalId))
    );
    return {
      issues: issues.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.html_url,
        labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
        assignee: i.assignee?.login,
        author: i.user?.login,
        comments: i.comments,
        createdAt: i.created_at,
        imported: imported.has(`${repo}#${i.number}`),
      })),
      linkedProject: linkedProjectFor(ctx.connector, repo) || null,
    };
  },

  async import_issues(ctx, { repo, projectId, state = "open" }) {
    repoParam(repo);
    const target = projectId || linkedProjectFor(ctx.connector, repo);
    if (!target) throw new HttpError(400, "Link this repository to a project first");
    await ctx.project(target);
    const list = await gh(ctx.connector, { url: `/repos/${repo}/issues`, params: { state, per_page: 100 } });
    const items = list
      .filter((i) => !i.pull_request)
      .map((i) => ({
        externalId: `${repo}#${i.number}`,
        key: `#${i.number}`,
        url: i.html_url,
        title: i.title,
        description: `${i.body || ""}\n\n— Imported from ${i.html_url}`.trim(),
        status: i.state === "closed" ? "done" : guessStatus(i.labels.map((l) => l.name).join(" ")),
        priority: priorityFromLabels(i.labels),
        dueDate: i.milestone?.due_on,
      }));
    const result = await importAsTasks({ userId: ctx.userId, projectId: target, provider: "github", items });
    await markSynced(ctx.connector, `Imported ${result.created} issues`);
    return result;
  },

  async create_issue(ctx, { repo, taskId }) {
    repoParam(repo);
    const task = await Task.findById(taskId);
    if (!task) throw new HttpError(404, "Task not found");
    await ctx.project(task.project);
    const issue = await gh(ctx.connector, {
      method: "POST",
      url: `/repos/${repo}/issues`,
      data: { title: task.title, body: `${task.description || ""}\n\n_Created from PlanCrest task ${task.taskKey}_`.trim() },
    });
    await addExternalLink(task._id, { provider: "github", externalId: `${repo}#${issue.number}`, key: `#${issue.number}`, url: issue.html_url, title: issue.title });
    logTaskActivity({ task, actorId: ctx.userId, action: "updated", metadata: { linkedTo: `${repo}#${issue.number}` } });
    return { number: issue.number, url: issue.html_url };
  },

  async pulls(ctx, { repo, state = "open" }) {
    repoParam(repo);
    const list = await gh(ctx.connector, { url: `/repos/${repo}/pulls`, params: { state, per_page: 40, sort: "updated", direction: "desc" } });
    return {
      pulls: list.map((p) => ({
        number: p.number,
        title: p.title,
        state: p.merged_at ? "merged" : p.state,
        draft: p.draft,
        url: p.html_url,
        author: p.user?.login,
        branch: p.head?.ref,
        base: p.base?.ref,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        taskKeys: [...new Set(`${p.title} ${p.head?.ref}`.match(KEY_RE) || [])],
      })),
    };
  },

  async commits(ctx, { repo, branch }) {
    repoParam(repo);
    const list = await gh(ctx.connector, { url: `/repos/${repo}/commits`, params: { per_page: 25, sha: branch || undefined } });
    return {
      commits: list.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.author?.login || c.commit.author?.name,
        date: c.commit.author?.date,
        url: c.html_url,
      })),
    };
  },

  // ── GitHub Actions ──
  async workflows(ctx, { repo }) {
    repoParam(repo);
    const data = await gh(ctx.connector, { url: `/repos/${repo}/actions/workflows` });
    return { workflows: (data.workflows || []).map((w) => ({ id: w.id, name: w.name, state: w.state, path: w.path })) };
  },

  async workflow_runs(ctx, { repo, workflowId, branch, status }) {
    repoParam(repo);
    const url = workflowId ? `/repos/${repo}/actions/workflows/${workflowId}/runs` : `/repos/${repo}/actions/runs`;
    const data = await gh(ctx.connector, { url, params: { per_page: 25, branch: branch || undefined, status: status || undefined } });
    await markSynced(ctx.connector);
    return {
      runs: (data.workflow_runs || []).map((r) => ({
        id: r.id,
        name: r.name,
        number: r.run_number,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        event: r.event,
        actor: r.actor?.login,
        message: r.head_commit?.message?.split("\n")[0],
        url: r.html_url,
        createdAt: r.created_at,
        durationMs: r.updated_at && r.run_started_at ? new Date(r.updated_at) - new Date(r.run_started_at) : null,
      })),
    };
  },

  async rerun_run(ctx, { repo, runId, failedOnly }) {
    repoParam(repo);
    await gh(ctx.connector, { method: "POST", url: `/repos/${repo}/actions/runs/${Number(runId)}/${failedOnly ? "rerun-failed-jobs" : "rerun"}` });
    return { rerun: true };
  },

  async cancel_run(ctx, { repo, runId }) {
    repoParam(repo);
    await gh(ctx.connector, { method: "POST", url: `/repos/${repo}/actions/runs/${Number(runId)}/cancel` });
    return { cancelled: true };
  },

  async dispatch_workflow(ctx, { repo, workflowId, ref }) {
    repoParam(repo);
    await gh(ctx.connector, { method: "POST", url: `/repos/${repo}/actions/workflows/${Number(workflowId)}/dispatches`, data: { ref: ref || "main" } });
    return { dispatched: true };
  },

  // ── Webhooks ──
  async setup_webhook(ctx, { repo }) {
    repoParam(repo);
    const settings = ctx.connector.settings;
    if (!settings.webhooks?.secret) {
      settings.webhooks = { ...(settings.webhooks?.toObject?.() ?? {}), secret: crypto.randomBytes(24).toString("hex") };
    }
    const url = `${apiBaseUrl()}/api/integrations/github/webhook?c=${ctx.connector._id}`;
    const hook = await gh(ctx.connector, {
      method: "POST",
      url: `/repos/${repo}/hooks`,
      data: { name: "web", active: true, events: ["push", "pull_request", "issues", "workflow_run"], config: { url, content_type: "json", secret: settings.webhooks.secret, insecure_ssl: "0" } },
    });
    settings.webhooks.enabled = true;
    settings.webhooks.url = url;
    await ctx.connector.save();
    return { hookId: hook.id, url, publiclyReachable: !/localhost|127\.0\.0\.1/.test(url) };
  },

  async remove_webhook(ctx, { repo, hookId }) {
    repoParam(repo);
    await gh(ctx.connector, { method: "DELETE", url: `/repos/${repo}/hooks/${Number(hookId)}` });
    return { removed: true };
  },

  async events(ctx) {
    const events = await IntegrationEvent.find({ connector: ctx.connector._id }).sort({ createdAt: -1 }).limit(30).lean();
    return { events };
  },
};

export const githubActions = actions;

// ── Incoming webhooks ───────────────────────────────────────────────────────

const record = (connector, type, title, extra = {}) =>
  IntegrationEvent.create({ connector: connector._id, provider: "github", type, title, ...extra });

const alert = (connector, title, message, link) =>
  Notification.create({
    recipient: connector.user,
    recipientModel: "User",
    type: "integration_event",
    title,
    message,
    link,
    metadata: { provider: "github" },
  }).catch(() => {});

/** Attach a PR to any task whose key appears in its title, branch or body. */
const linkPullRequest = async (connector, repo, pr, merged) => {
  const projectId = linkedProjectFor(connector, repo);
  if (!projectId) return;
  const keys = [...new Set(`${pr.title} ${pr.head?.ref} ${pr.body || ""}`.match(KEY_RE) || [])];
  for (const key of keys) {
    const task = await Task.findOne({ project: projectId, taskKey: key });
    if (!task) continue;
    const externalId = `${repo}!${pr.number}`;
    if (!task.externalLinks.some((l) => l.externalId === externalId)) {
      task.externalLinks.push({ provider: "github", externalId, key: `PR #${pr.number}`, url: pr.html_url, title: pr.title });
    }
    if (merged && connector.settings?.taskSync?.autoCloseOnMerge && task.status !== "done") {
      task.status = "done";
      task.completedAt = new Date();
    } else if (!merged && task.status === "todo") {
      task.status = "in_review";
    }
    await task.save();
    logTaskActivity({ task, actorId: connector.user, action: "updated", metadata: { pullRequest: pr.html_url } });
  }
};

export const handleGithubWebhook = async (req, res) => {
  const connector = await Connector.findOne({ _id: req.query.c, type: "github" }).catch(() => null);
  const signature = req.headers["x-hub-signature-256"];
  const secret = connector?.settings?.webhooks?.secret;

  if (!connector || !secret || !signature || !req.rawBody) return res.status(401).json({ error: "Unknown webhook" });
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex")}`;
  if (!safeEqual(signature, expected)) return res.status(401).json({ error: "Invalid signature" });

  const event = req.headers["x-github-event"];
  const body = req.body;
  const repo = body.repository?.full_name;
  res.status(200).json({ ok: true }); // acknowledge fast, work afterwards

  try {
    if (event === "issues" && body.action === "opened") {
      await record(connector, "issue.opened", `${repo} #${body.issue.number}: ${body.issue.title}`, { url: body.issue.html_url, actor: body.sender?.login, repository: repo });
      const projectId = linkedProjectFor(connector, repo);
      if (projectId && connector.settings?.taskSync?.autoCreateFromIssues) {
        const issue = body.issue;
        await importAsTasks({
          userId: connector.user,
          projectId,
          provider: "github",
          items: [{ externalId: `${repo}#${issue.number}`, key: `#${issue.number}`, url: issue.html_url, title: issue.title, description: `${issue.body || ""}\n\n— From ${issue.html_url}`, priority: priorityFromLabels(issue.labels) }],
        });
      }
    } else if (event === "pull_request" && ["opened", "closed", "reopened", "ready_for_review"].includes(body.action)) {
      const pr = body.pull_request;
      const merged = body.action === "closed" && pr.merged;
      const state = merged ? "merged" : body.action;
      await record(connector, `pull_request.${state}`, `${repo} PR #${pr.number}: ${pr.title}`, { url: pr.html_url, actor: pr.user?.login, repository: repo, status: state });
      await linkPullRequest(connector, repo, pr, merged);
      if (body.action === "opened") await alert(connector, `New pull request in ${repo}`, pr.title, pr.html_url);
    } else if (event === "push") {
      const count = body.commits?.length || 0;
      if (count) await record(connector, "push", `${body.pusher?.name} pushed ${count} commit${count > 1 ? "s" : ""} to ${repo}`, { url: body.compare, actor: body.pusher?.name, repository: repo });
    } else if (event === "workflow_run" && body.action === "completed") {
      const run = body.workflow_run;
      await record(connector, `workflow_run.${run.conclusion}`, `${run.name} #${run.run_number} ${run.conclusion} on ${run.head_branch}`, { url: run.html_url, actor: run.actor?.login, repository: repo, status: run.conclusion });
      if (run.conclusion === "failure") await alert(connector, `Build failed in ${repo}`, `${run.name} on ${run.head_branch}`, run.html_url);
    }
  } catch (error) {
    console.error("GitHub webhook processing failed:", error.message);
  }
};

