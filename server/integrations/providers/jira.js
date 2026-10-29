import Task from "../../models/task.js";
import { HttpError } from "../../utils/workspaceAccess.js";
import { call } from "../http.js";
import { markSynced } from "../store.js";
import { addExternalLink, importAsTasks } from "../taskImport.js";

const normalizeSite = (input) => {
  const host = String(input || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  // Jira Cloud only: keeps the server from being pointed at arbitrary hosts
  if (!/^[a-z0-9-]+\.atlassian\.net$/.test(host)) {
    throw new HttpError(400, "Enter your Jira Cloud site, like your-team.atlassian.net");
  }
  return host;
};

const jira = (connector, config) => {
  const { site, accessToken, email } = connector.config;
  const auth = Buffer.from(`${email}:${accessToken}`).toString("base64");
  return call({ ...config, url: `https://${site}${config.url}`, headers: { Authorization: `Basic ${auth}`, Accept: "application/json", ...config.headers } });
};

const adfToText = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text || "";
  const inner = (node.content || []).map(adfToText).join(node.type === "paragraph" || node.type === "heading" ? "" : "\n");
  return ["paragraph", "heading", "listItem", "bulletList", "orderedList"].includes(node.type) ? `${inner}\n` : inner;
};

const toAdf = (text) => ({
  type: "doc",
  version: 1,
  content: String(text || "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => ({ type: "paragraph", content: [{ type: "text", text: p.slice(0, 5000) }] })),
});

const STATUS = { new: "todo", indeterminate: "in_progress", done: "done" };
const priority = (name = "") => (/(highest|high|blocker|critical)/i.test(name) ? "high" : /(lowest|low|trivial)/i.test(name) ? "low" : "medium");

const projectKey = (value) => {
  if (!/^[A-Za-z][A-Za-z0-9_]{1,19}$/.test(String(value || ""))) throw new HttpError(400, "Choose a Jira project");
  return String(value).toUpperCase();
};

const search = async (connector, jql, max = 50) => {
  const data = await jira(connector, {
    url: "/rest/api/3/search/jql",
    params: { jql, maxResults: Math.min(max, 100), fields: "summary,status,priority,duedate,description,issuetype,assignee" },
  });
  return (data.issues || []).map((i) => ({
    id: i.id,
    key: i.key,
    summary: i.fields.summary,
    status: i.fields.status?.name,
    statusCategory: i.fields.status?.statusCategory?.key,
    priority: i.fields.priority?.name,
    type: i.fields.issuetype?.name,
    assignee: i.fields.assignee?.displayName,
    dueDate: i.fields.duedate,
    description: adfToText(i.fields.description).trim(),
    url: `https://${connector.config.site}/browse/${i.key}`,
  }));
};

export const validateJira = async ({ site, email, token }) => {
  const host = normalizeSite(site);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) throw new HttpError(400, "Enter the email address of your Atlassian account");
  if (!String(token || "").trim()) throw new HttpError(400, "Enter your Jira API token");

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const me = await call({ url: `https://${host}/rest/api/3/myself`, headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } });
  return {
    config: { site: host, email, accessToken: String(token).trim() },
    account: { email: me.emailAddress || email, name: me.displayName, picture: me.avatarUrls?.["48x48"] },
    name: `Jira (${host})`,
  };
};

export const jiraActions = {
  async projects(ctx) {
    const data = await jira(ctx.connector, { url: "/rest/api/3/project/search", params: { maxResults: 100, orderBy: "name" } });
    await markSynced(ctx.connector);
    return { projects: (data.values || []).map((p) => ({ id: p.id, key: p.key, name: p.name, avatar: p.avatarUrls?.["24x24"] })) };
  },

  async issues(ctx, { projectKey: key, jql, max }) {
    const query = jql?.trim() || `project = ${projectKey(key)} ORDER BY updated DESC`;
    return { issues: await search(ctx.connector, query, Number(max) || 50) };
  },

  async import_issues(ctx, { projectKey: key, projectId, jql }) {
    await ctx.project(projectId);
    const query = jql?.trim() || `project = ${projectKey(key)} AND statusCategory != Done ORDER BY updated DESC`;
    const issues = await search(ctx.connector, query, 100);
    const result = await importAsTasks({
      userId: ctx.userId,
      projectId,
      provider: "jira",
      items: issues.map((i) => ({
        externalId: i.id,
        key: i.key,
        url: i.url,
        title: `${i.key} ${i.summary}`,
        description: `${i.description}\n\n— Imported from ${i.url}`.trim(),
        status: STATUS[i.statusCategory] || "todo",
        priority: priority(i.priority),
        dueDate: i.dueDate,
      })),
    });
    await markSynced(ctx.connector, `Imported ${result.created} issues`);
    return result;
  },

  async create_issue(ctx, { projectKey: key, taskId, issueType = "Task" }) {
    const task = await Task.findById(taskId);
    if (!task) throw new HttpError(404, "Task not found");
    await ctx.project(task.project);
    const created = await jira(ctx.connector, {
      method: "POST",
      url: "/rest/api/3/issue",
      data: { fields: { project: { key: projectKey(key) }, summary: task.title.slice(0, 250), description: toAdf(`${task.description || ""}\n\nCreated from PlanCrest task ${task.taskKey}`), issuetype: { name: String(issueType).slice(0, 60) } } },
    });
    const url = `https://${ctx.connector.config.site}/browse/${created.key}`;
    await addExternalLink(task._id, { provider: "jira", externalId: created.id, key: created.key, url, title: task.title });
    return { key: created.key, url };
  },
};
