import mongoose from "mongoose";
import Task from "../models/task.js";
import Subtask from "../models/subtask.js";
import TaskAssignment from "../models/taskAssignment.js";
import Label from "../models/label.js";
import Comment from "../models/comment.js";
import Column from "../models/column.js";
import Board from "../models/board.js";
import Attachment from "../models/attachment.js";
import CalendarEvent from "../models/calendarEvent.js";
import ChatChannel from "../models/chatChannel.js";
import ChatMessage from "../models/chatMessage.js";
import { requireProjectAccess, requireWorkspaceMember } from "./permissions.js";

/*
 * Routes addressed by a child resource ID (e.g. /tasks/:taskId) carry no
 * project or workspace ID in the URL. These middlewares look up which
 * project/workspace the resource belongs to and then run the standard
 * membership checks, so every such route enforces the same access rules
 * as /projects/:projectId routes.
 */

const notFound = (res) => res.status(404).json({ error: "Resource not found" });

const field = async (Model, id, path) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await Model.findById(id).select(path).lean();
  return doc?.[path] ?? null;
};

const projectAccessVia = (resolve) => async (req, res, next) => {
  try {
    const projectId = await resolve(req);
    if (!projectId) return notFound(res);
    req.scopedProjectId = projectId.toString();
    return requireProjectAccess(req, res, next);
  } catch (error) {
    next(error);
  }
};

const workspaceAccessVia = (resolve) => async (req, res, next) => {
  try {
    const workspaceId = await resolve(req);
    if (!workspaceId) return notFound(res);
    req.scopedWorkspaceId = workspaceId.toString();
    return requireWorkspaceMember(req, res, next);
  } catch (error) {
    next(error);
  }
};

const taskProject = (taskId) => field(Task, taskId, "project");

export const requireTaskAccess = projectAccessVia((req) => taskProject(req.params.taskId));

export const requireSubtaskAccess = projectAccessVia(async (req) =>
  taskProject(await field(Subtask, req.params.subtaskId, "task"))
);

export const requireAssignmentAccess = projectAccessVia(async (req) => {
  const projectId = await field(TaskAssignment, req.params.assignmentId, "project");
  if (projectId) return projectId;
  return taskProject(await field(TaskAssignment, req.params.assignmentId, "task"));
});

export const requireLabelAccess = projectAccessVia((req) =>
  field(Label, req.params.labelId, "project")
);

export const requireCommentAccess = projectAccessVia((req) =>
  field(Comment, req.params.commentId, "project")
);

export const requireColumnAccess = projectAccessVia((req) =>
  field(Column, req.params.columnId, "project")
);

export const requireBoardAccess = projectAccessVia((req) =>
  field(Board, req.params.boardId, "project")
);

/** Attachments belong to a project when they have one, else to a workspace. */
export const requireAttachmentAccess = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;
    if (!mongoose.isValidObjectId(attachmentId)) return notFound(res);
    const attachment = await Attachment.findById(attachmentId)
      .select("project workspace")
      .lean();
    if (!attachment) return notFound(res);
    if (attachment.project) {
      req.scopedProjectId = attachment.project.toString();
      return requireProjectAccess(req, res, next);
    }
    req.scopedWorkspaceId = attachment.workspace.toString();
    return requireWorkspaceMember(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const requireEventAccess = workspaceAccessVia((req) =>
  field(CalendarEvent, req.params.eventId, "workspace")
);

export const requireChannelWorkspaceAccess = workspaceAccessVia((req) =>
  field(ChatChannel, req.params.channelId, "workspace")
);

export const requireMessageWorkspaceAccess = workspaceAccessVia(async (req) => {
  const channelId = await field(ChatMessage, req.params.messageId, "channel");
  return channelId ? field(ChatChannel, channelId, "workspace") : null;
});

/**
 * Message-level operations (reactions, pins) also require that the user can
 * see the channel: public channels are visible to all workspace members,
 * everything else only to its members/participants.
 */
export const requireMessageChannelAccess = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) return notFound(res);
    const message = await ChatMessage.findById(messageId).select("channel").lean();
    if (!message) return notFound(res);
    const channel = await ChatChannel.findById(message.channel)
      .select("type members participants workspace")
      .lean();
    if (!channel) return notFound(res);

    const userId = req.auth._id.toString();
    const isMember = [...(channel.members || []), ...(channel.participants || [])].some(
      (id) => id?.toString() === userId
    );
    if (channel.type !== "public" && !isMember) {
      return res.status(403).json({ error: "Not authorized to access this channel" });
    }
    req.scopedWorkspaceId = channel.workspace.toString();
    return requireWorkspaceMember(req, res, next);
  } catch (error) {
    next(error);
  }
};

/** Attach the task so canEditTask can check its creator. Run after requireTaskAccess. */
export const loadTask = async (req, res, next) => {
  try {
    req.task = await Task.findById(req.params.taskId).select("createdBy project");
    if (!req.task) return notFound(res);
    next();
  } catch (error) {
    next(error);
  }
};

/** True when the requester administers the workspace or project in scope. */
export const isScopeAdmin = (req) =>
  Boolean(
    req.isWorkspaceOwner ||
      req.workspaceMember?.role === "admin" ||
      req.projectMember?.role === "admin"
  );
