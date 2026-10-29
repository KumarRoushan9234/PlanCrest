/**
 * Demo data for local development and screenshots.
 *
 *   npm run dev:demo      starts an in-memory MongoDB, seeds it with this data, and runs the API
 *   npm run seed:demo     seeds the database named by DATABASE (refuses to run on a non-empty one)
 *
 * Every demo account uses the password below. It only exists in demo databases.
 */
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";
import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import Board from "../models/board.js";
import Column from "../models/column.js";
import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import Subtask from "../models/subtask.js";
import Comment from "../models/comment.js";
import CalendarEvent from "../models/calendarEvent.js";
import Notification from "../models/notification.js";
import ActivityLog from "../models/activityLog.js";
import { hashPassword } from "../utils/auth.js";
import { createDefaultChannels, createDefaultWorkspaceChannel } from "../utils/channelHelpers.js";
import { createTaskRecord } from "../utils/taskFactory.js";

export const DEMO_PASSWORD = "PlanCrest-demo-1";
export const DEMO_OWNER_EMAIL = "alex@plancrest.demo";

const day = 86400000;
const at = (offsetDays, hour = 17) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const PEOPLE = [
  { name: "Alex Morgan", email: DEMO_OWNER_EMAIL, role: "owner", title: "Founder" },
  { name: "Priya Shah", email: "priya@plancrest.demo", role: "admin", title: "Product Manager" },
  { name: "Jordan Lee", email: "jordan@plancrest.demo", role: "employee", title: "Frontend Engineer" },
  { name: "Sam Rivera", email: "sam@plancrest.demo", role: "employee", title: "Designer" },
];

const COLUMNS = [
  { name: "Backlog", type: "backlog", color: "#94a3b8", status: "backlog" },
  { name: "To Do", type: "todo", color: "#3b82f6", status: "todo" },
  { name: "In Progress", type: "in_progress", color: "#f59e0b", status: "in_progress" },
  { name: "In Review", type: "review", color: "#8b5cf6", status: "in_review" },
  { name: "Done", type: "done", color: "#10b981", status: "done" },
];

// [title, column index, priority, due offset (days) or null, assignee indexes]
const PROJECTS = [
  {
    name: "Website Relaunch",
    key: "WEB",
    color: "#2563eb",
    description: "New marketing site: messaging, design system, and launch.",
    tasks: [
      ["Finalize homepage copy", 3, "high", 1, [1]],
      ["Design pricing page", 2, "high", 2, [3]],
      ["Set up analytics events", 1, "medium", 5, [2]],
      ["Migrate blog posts", 1, "low", 9, [2]],
      ["Accessibility audit", 0, "medium", 14, [3]],
      ["Core Web Vitals pass", 2, "medium", -2, [2]],
      ["Brand guidelines v2", 4, "medium", -6, [3]],
      ["Choose CMS", 4, "high", -10, [1]],
    ],
  },
  {
    name: "Mobile App",
    key: "APP",
    color: "#7c5ce0",
    description: "Companion app for iOS and Android.",
    tasks: [
      ["Push notification service", 2, "high", 3, [2]],
      ["Offline task cache", 1, "high", 7, [2, 1]],
      ["Onboarding flow", 3, "medium", 0, [3]],
      ["App store assets", 0, "low", 21, [3]],
      ["Crash reporting", 1, "medium", -1, [2]],
      ["Login with Google", 4, "medium", -4, [2]],
    ],
  },
  {
    name: "Marketing Q4",
    key: "MKT",
    color: "#3fb97f",
    description: "Campaigns, content calendar and launch events.",
    tasks: [
      ["Launch announcement post", 2, "high", 1, [1]],
      ["Customer interview round", 1, "medium", 6, [0, 1]],
      ["Webinar slides", 3, "medium", 4, [0]],
      ["Newsletter template", 4, "low", -3, [3]],
      ["Competitor teardown", 0, "low", 12, [1]],
    ],
  },
];

export async function seedDemo({ log = console.log } = {}) {
  if ((await User.estimatedDocumentCount()) > 0) {
    throw new Error("Refusing to seed: the database already has users. Use an empty database.");
  }

  const password = await hashPassword(DEMO_PASSWORD);
  const users = [];
  for (const [i, p] of PEOPLE.entries()) {
    users.push(
      await User.create({
        // Stable ids keep browser sessions valid across demo restarts
        _id: new mongoose.Types.ObjectId(`6a00000000000000000000${String(i + 1).padStart(2, "0")}`),
        name: p.name,
        email: p.email,
        password,
        isVerified: true,
        jobTitle: p.title,
      })
    );
  }
  const [owner] = users;

  const workspace = await Workspace.create({
    name: "Acme Studio",
    slug: `acme-studio-${nanoid(6)}`,
    description: "Demo workspace",
    owner: owner._id,
  });
  for (let i = 0; i < users.length; i++) {
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: users[i]._id,
      role: PEOPLE[i].role,
      status: "active",
      joinedAt: new Date(),
    });
  }
  await createDefaultWorkspaceChannel(workspace._id, owner._id);

  const projects = [];
  for (const spec of PROJECTS) {
    const project = await Project.create({
      name: spec.name,
      key: spec.key,
      description: spec.description,
      workspace: workspace._id,
      color: spec.color,
      privacy: "public",
      createdBy: owner._id,
      lead: users[1]._id,
    });
    projects.push(project);

    for (const u of users) {
      await ProjectMember.create({
        project: project._id,
        user: u._id,
        role: u._id.equals(owner._id) || u._id.equals(users[1]._id) ? "admin" : "member",
        addedBy: owner._id,
      });
    }
    await createDefaultChannels(project._id, workspace._id, owner._id);

    const board = await Board.create({ name: "Main Board", project: project._id, isDefault: true, createdBy: owner._id });
    const columns = [];
    for (let i = 0; i < COLUMNS.length; i++) {
      const c = COLUMNS[i];
      columns.push(await Column.create({ name: c.name, board: board._id, project: project._id, position: i, type: c.type, color: c.color }));
    }

    for (const [title, colIndex, priority, dueOffset, assignees] of spec.tasks) {
      const task = await createTaskRecord({
        project,
        column: columns[colIndex],
        userId: owner._id,
        title,
        description: `${title}. Part of ${spec.name}.`,
        priority,
        status: COLUMNS[colIndex].status,
        dueDate: dueOffset == null ? undefined : at(dueOffset),
      });
      // Spread creation times over the last two weeks so charts look lived-in
      const age = (task.taskNumber * 5 + spec.key.charCodeAt(0)) % 14;
      await Task.collection.updateOne({ _id: task._id }, { $set: { createdAt: at(-age, 9 + (task.taskNumber % 8)) } });
      for (const a of assignees) {
        await TaskAssignment.create({ task: task._id, user: users[a]._id, project: project._id, assignedBy: owner._id, role: "assignee" });
      }
      if (colIndex === 4) {
        task.completedAt = at(Math.min(dueOffset ?? -1, -1));
        await task.save();
      }
      await ActivityLog.create({
        workspace: workspace._id,
        project: project._id,
        actor: users[assignees[0] ?? 0]._id,
        actorModel: "User",
        action: colIndex === 4 ? "updated" : "created",
        target: task._id,
        targetType: "Task",
        targetName: title,
        // never in the future
        createdAt: new Date(Math.min(at(-((task.taskNumber * 3) % 6), 10 + (task.taskNumber % 8)).getTime(), Date.now() - 600000)),
      });
    }
  }

  // A realistic first task with subtasks + comments
  const hero = await Task.findOne({ taskKey: "WEB-1" });
  const subs = ["Draft hero headline", "Write feature blurbs", "Review with legal", "Final proofread"];
  for (let i = 0; i < subs.length; i++) {
    await Subtask.create({ task: hero._id, title: subs[i], position: i, isCompleted: i < 2, createdBy: owner._id });
  }
  const comments = [
    [1, "Headline options are in the doc. I prefer option B."],
    [0, "Agreed on B. Can we ship the copy tomorrow?"],
  ];
  for (const [u, content] of comments) {
    await Comment.create({ content, commentOn: { model: "Task", id: hero._id }, project: hero.project, author: users[u]._id, authorModel: "User" });
  }

  const events = [
    ["Sprint planning", 1, 10, 1],
    ["Design review", 2, 15, 1],
    ["Launch sync", 4, 11, 1],
    ["Team lunch", 0, 12, 1],
  ];
  for (const [title, off, hour, dur] of events) {
    await CalendarEvent.create({
      title,
      startDate: at(off, hour),
      endDate: at(off, hour + dur),
      workspace: workspace._id,
      createdBy: owner._id,
      attendees: users.map((u) => ({ user: u._id, status: "accepted" })),
    });
  }

  const notes = [
    ["task_assigned", "Priya assigned you to “Webinar slides”", "/dashboard/tasks"],
    ["comment_added", "Jordan commented on “Finalize homepage copy”", "/dashboard/tasks"],
    ["task_due", "“Onboarding flow” is due today", "/dashboard/tasks"],
  ];
  for (const [type, title, link] of notes) {
    await Notification.create({ recipient: owner._id, recipientModel: "User", sender: users[1]._id, senderModel: "User", type, title, message: title, link, workspace: workspace._id });
  }

  log(`Seeded demo workspace "${workspace.name}" with ${projects.length} projects. Sign in as ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
  return { workspace, users, projects };
}

// Allow `node scripts/seed-demo.js` against DATABASE
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { default: dotenv } = await import("dotenv");
  dotenv.config();
  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(process.env.DATABASE);
  try {
    await seedDemo();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
