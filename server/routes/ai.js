import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import User from "../models/user.js";
import {
  breakdownTask,
  chat,
  getAiStatus,
  getUsage,
  planDay,
  requireAiEnabled,
} from "../controllers/ai.js";
import { requireSignin, handleAuthError } from "../middlewares/index.js";
import { requireWorkspaceMember } from "../middlewares/permissions.js";
import { requireTaskAccess } from "../middlewares/resourceAccess.js";
import Task from "../models/task.js";
import Project from "../models/project.js";

const router = express.Router();

// AI calls cost money; cap them per user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AI_REQUESTS_PER_HOUR) || 60,
  // Per user once signed in; ipKeyGenerator handles IPv6 subnets correctly
  keyGenerator: (req) => req.auth?._id?.toString() || ipKeyGenerator(req.ip),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "AI request limit reached. Please try again later." },
});

const loadUserName = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth._id).select("name").lean();
    req.aiUserName = user?.name || "a teammate";
    next();
  } catch (error) {
    next(error);
  }
};

/** Task routes have no workspace in the URL; attach it for the AI context. */
const loadTaskWorkspace = async (req, res, next) => {
  try {
    if (!req.workspace) {
      const task = await Task.findById(req.params.taskId).select("project").lean();
      const project = await Project.findById(task.project).populate("workspace").lean();
      req.workspace = project.workspace;
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/status", requireSignin, getAiStatus, handleAuthError);

router.post(
  "/workspaces/:workspaceId/chat",
  requireSignin,
  requireAiEnabled,
  requireWorkspaceMember,
  aiLimiter,
  loadUserName,
  chat,
  handleAuthError
);

router.post(
  "/workspaces/:workspaceId/plan-day",
  requireSignin,
  requireAiEnabled,
  requireWorkspaceMember,
  aiLimiter,
  loadUserName,
  planDay,
  handleAuthError
);

router.get(
  "/workspaces/:workspaceId/usage",
  requireSignin,
  requireWorkspaceMember,
  getUsage,
  handleAuthError
);

router.post(
  "/tasks/:taskId/breakdown",
  requireSignin,
  requireAiEnabled,
  requireTaskAccess,
  loadTaskWorkspace,
  aiLimiter,
  loadUserName,
  breakdownTask,
  handleAuthError
);

router.use(handleAuthError);

export default router;
