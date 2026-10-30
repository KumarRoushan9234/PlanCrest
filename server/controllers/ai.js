import { z } from "zod";
import AiUsage from "../models/aiUsage.js";
import Task from "../models/task.js";
import Subtask from "../models/subtask.js";
import { createCompletion, describeAiError, getAiModel, getProviderChain, isAiEnabled } from "../utils/ai/client.js";
import { TOOL_DEFINITIONS, findTasks, runTool } from "../utils/ai/workspaceTools.js";

const MAX_TOOL_ROUNDS = 8;
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 4000;

const baseSystemPrompt = (ctx) =>
  [
    "You are the PlanCrest assistant, built into a project management app.",
    `You are helping ${ctx.userName} in the workspace "${ctx.workspace.name}".`,
    `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
    "Use the tools to look up real projects and tasks instead of guessing. Only report data the tools return.",
    "Create tasks only when the user clearly asks you to; mention the task key of anything you create.",
    "Keep answers concise and use short markdown lists where they help.",
  ].join("\n");

const buildContext = (req) => ({
  userId: req.auth._id,
  userName: req.aiUserName,
  workspace: req.workspace,
  workspaceMember: req.workspaceMember,
  isWorkspaceOwner: req.isWorkspaceOwner,
  actions: [],
});

const recordUsage = (ctx, feature, usage, extra = {}) =>
  AiUsage.create({
    user: ctx.userId,
    workspace: ctx.workspace._id,
    feature,
    model: usage.model || getAiModel(),
    inputTokens: usage.input,
    outputTokens: usage.output,
    ...extra,
  }).catch((error) => console.error("Failed to record AI usage:", error.message));

/** Validate the client-held conversation: text turns only, user first and last. */
const sanitizeHistory = (messages) => {
  if (!Array.isArray(messages)) return null;
  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => ["user", "assistant"].includes(m?.role) && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content.trim());
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") return null;
  return history;
};

/** Run the model with the workspace tools until it produces a final answer. */
const runAssistant = async (ctx, system, history) => {
  const messages = [{ role: "system", content: system }, ...history];
  const usage = { input: 0, output: 0, model: null };
  let toolCalls = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { message, usage: u, provider, model } = await createCompletion({ messages, tools: TOOL_DEFINITIONS, maxTokens: 2000 });
    usage.input += u.input;
    usage.output += u.output;
    usage.model = `${provider}/${model}`;

    const calls = message.tool_calls || [];
    if (!calls.length) return { reply: (message.content || "").trim() || "Done.", usage, toolCalls, model: usage.model };

    messages.push({ role: "assistant", content: message.content || null, tool_calls: calls });
    for (const call of calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // malformed arguments: run with none and let the tool report what is missing
      }
      const result = await runTool(ctx, call.function.name, args);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
    toolCalls += calls.length;
  }

  return { reply: "I couldn't finish that within the allowed number of steps. Try a narrower question.", usage, toolCalls };
};

export const getAiStatus = (req, res) => {
  const chain = getProviderChain();
  res.json({
    enabled: chain.length > 0,
    model: chain[0]?.models[0] || null,
    // Names only, never keys
    providers: chain.map((p) => ({ name: p.label, models: p.models })),
  });
};

export const requireAiEnabled = (req, res, next) => {
  if (!isAiEnabled()) {
    return res.status(503).json({
      error: "AI Mode is not configured. Set an API key and model list for at least one provider (OPENROUTER_*, GROQCLOUD_* or DEEPSEEK_*) on the server.",
    });
  }
  next();
};

/** POST /api/ai/workspaces/:workspaceId/chat */
export const chat = async (req, res) => {
  const messages = sanitizeHistory(req.body.messages);
  if (!messages) {
    return res.status(400).json({ error: "messages must end with a user message" });
  }

  const ctx = buildContext(req);
  try {
    const result = await runAssistant(ctx, baseSystemPrompt(ctx), messages);
    recordUsage(ctx, "assistant", result.usage, {
      toolCalls: result.toolCalls,
      actionsTaken: ctx.actions.length,
    });
    res.json({ reply: result.reply, actions: ctx.actions, model: result.model });
  } catch (error) {
    console.error("AI chat error:", error.message);
    const { status, message } = describeAiError(error);
    res.status(status).json({ error: message });
  }
};

/** POST /api/ai/workspaces/:workspaceId/plan-day */
export const planDay = async (req, res) => {
  const ctx = buildContext(req);
  try {
    const { tasks } = await findTasks(ctx, { assignedToMe: true });
    if (!tasks.length) {
      return res.json({
        reply: "You have no open tasks assigned to you in this workspace. Enjoy the calm!",
        taskCount: 0,
      });
    }

    const { message, usage, provider, model } = await createCompletion({
      messages: [
        { role: "system", content: baseSystemPrompt(ctx) },
        {
          role: "user",
          content:
            "Here are my open tasks as JSON:\n" +
            JSON.stringify(tasks) +
            "\n\nPlan my day: pick the 3-5 tasks I should focus on today and say why " +
            "(overdue, due soon, high priority, blocking others). Then list anything I can " +
            "safely postpone. Reference tasks by their key.",
        },
      ],
    });
    recordUsage(ctx, "plan_day", { ...usage, model: `${provider}/${model}` });
    res.json({ reply: (message.content || "").trim() || "I couldn't build a plan right now.", taskCount: tasks.length });
  } catch (error) {
    console.error("AI plan-day error:", error.message);
    const { status, message } = describeAiError(error);
    res.status(status).json({ error: message });
  }
};

const BreakdownSchema = z.object({
  subtasks: z.array(z.object({ title: z.string().min(1), description: z.string().default("") })).min(1).max(12),
});

/**
 * POST /api/ai/tasks/:taskId/breakdown
 * Body: { create?: boolean }. Without `create`, only returns suggestions.
 */
export const breakdownTask = async (req, res) => {
  const ctx = buildContext(req);
  try {
    const task = await Task.findById(req.params.taskId).lean();
    const existing = await Subtask.find({ task: task._id }).select("title").lean();

    const { message, usage, provider, model } = await createCompletion({
      json: true,
      messages: [
        {
          role: "system",
          content:
            'Reply with only JSON of the form {"subtasks":[{"title":"short actionable title","description":"one sentence on what done looks like"}]} containing 3 to 8 subtasks in a sensible order.',
        },
        {
          role: "user",
          content:
            `Break this task into concrete subtasks.\n\nTitle: ${task.title}\n` +
            `Description: ${task.description || "(none)"}\n` +
            `Existing subtasks (don't repeat them): ${existing.map((s) => s.title).join("; ") || "(none)"}`,
        },
      ],
    });
    recordUsage(ctx, "task_breakdown", { ...usage, model: `${provider}/${model}` });

    let suggestions = null;
    try {
      const raw = (message.content || "").replace(/^```(?:json)?|```$/gm, "").trim();
      suggestions = BreakdownSchema.parse(JSON.parse(raw)).subtasks;
    } catch {
      suggestions = null;
    }
    if (!suggestions?.length) {
      return res.status(502).json({ error: "The AI didn't return usable subtasks. Try again." });
    }

    if (!req.body?.create) {
      return res.json({ subtasks: suggestions });
    }

    const start = existing.length;
    const created = await Subtask.insertMany(
      suggestions.map((s, i) => ({
        task: task._id,
        title: s.title.slice(0, 200),
        description: s.description,
        position: start + i,
        createdBy: ctx.userId,
      }))
    );
    res.status(201).json({ subtasks: created });
  } catch (error) {
    console.error("AI breakdown error:", error.message);
    const { status, message } = describeAiError(error);
    res.status(status).json({ error: message });
  }
};

/** GET /api/ai/workspaces/:workspaceId/usage - real usage stats for AI Mode */
export const getUsage = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const [byFeature] = await AiUsage.aggregate([
      { $match: { workspace: req.workspace._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          interactions: { $sum: 1 },
          tasksCreated: { $sum: "$actionsTaken" },
          plans: { $sum: { $cond: [{ $eq: ["$feature", "plan_day"] }, 1, 0] } },
          breakdowns: { $sum: { $cond: [{ $eq: ["$feature", "task_breakdown"] }, 1, 0] } },
        },
      },
    ]);
    res.json({
      periodDays: 30,
      interactions: byFeature?.interactions || 0,
      tasksCreated: byFeature?.tasksCreated || 0,
      plans: byFeature?.plans || 0,
      breakdowns: byFeature?.breakdowns || 0,
    });
  } catch (error) {
    console.error("AI usage error:", error);
    res.status(500).json({ error: "Failed to load AI usage" });
  }
};
