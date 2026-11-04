import Connector from "../models/connector.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import { clientUrl } from "../config/env.js";
import { postToSlack } from "./providers/slack.js";
import { postToTeams } from "./providers/teams.js";

const ACTION_TO_EVENT = {
  created: "taskCreated",
  assigned: "taskAssigned",
  completed: "taskCompleted",
  commented: "commentAdded",
};

const VERB = {
  taskCreated: "created a task",
  taskAssigned: "assigned a task",
  taskCompleted: "completed a task",
  commentAdded: "commented on a task",
};

/** Defaults: created and completed notify; others are opt-in. */
const DEFAULTS = { taskCreated: true, taskCompleted: true, taskAssigned: false, commentAdded: false };

/**
 * Fan a task event out to every active chat connection in the workspace that
 * wants it. Fire-and-forget: a failing webhook must never break the request.
 */
export const notifyTaskEvent = async ({ task, actorId, action, assignee }) => {
  const eventKey = ACTION_TO_EVENT[action];
  if (!eventKey) return;

  try {
    const project = await Project.findById(task.project?._id ?? task.project).select("workspace name key");
    if (!project) return;

    const connectors = await Connector.find({
      workspace: project.workspace,
      scope: "workspace",
      type: { $in: ["slack", "microsoft_teams"] },
      status: "active",
      "settings.notifications": { $ne: false },
    });
    if (!connectors.length) return;

    const actor = await User.findById(actorId).select("name");
    const message = {
      title: task.title,
      subtitle: `${actor?.name ?? "Someone"} ${VERB[eventKey]}${assignee ? ` for ${assignee}` : ""}`,
      detail: `${project.name}${task.taskKey ? ` · ${task.taskKey}` : ""}`,
      url: `${clientUrl}/dashboard/tasks`,
    };

    await Promise.allSettled(
      connectors.map(async (connector) => {
        const wanted = { ...DEFAULTS, ...(connector.settings?.options?.notify || {}) };
        if (!wanted[eventKey]) return;
        try {
          if (connector.type === "slack") await postToSlack(connector, message);
          else await postToTeams(connector, message);
        } catch (error) {
          console.error(`Failed to notify ${connector.type}:`, error.message);
        }
      })
    );
  } catch (error) {
    console.error("notifyTaskEvent failed:", error.message);
  }
};
