import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    column: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      required: true,
    },
    taskNumber: {
      type: Number,
      required: true,
    },
    taskKey: {
      type: String,
      required: true,
    },
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"],
      default: "todo",
    },
    position: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
      },
    ],
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    estimatedTime: {
      value: { type: Number },
      unit: { type: String, enum: ["hours", "days", "weeks"], default: "hours" },
    },
    actualTime: {
      type: Number,
      default: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    tags: [String],
    milestone: {
      type: Boolean,
      default: false,
    },
    milestoneDate: {
      type: Date,
    },
    calendarEventId: {
      type: Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    chatThread: {
      type: Schema.Types.ObjectId,
      ref: "ChatThread",
    },
    linkedDocs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    githubLinks: [
      {
        type: { type: String, enum: ["pr", "issue", "commit"] },
        url: String,
        number: Number,
        title: String,
        status: String,
      },
    ],
    // Items in other tools this task was imported from or exported to (Jira, Trello, GitHub issues)
    externalLinks: [
      {
        provider: { type: String },
        externalId: { type: String },
        key: { type: String },
        url: { type: String },
        title: { type: String },
      },
    ],
    // Tasks that must finish before this one can (ClickUp-style "waiting on")
    blockedBy: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    recurrence: {
      frequency: { type: String, enum: ["none", "daily", "weekly", "monthly"], default: "none" },
      interval: { type: Number, default: 1, min: 1, max: 365 },
    },
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for performance
taskSchema.index({ project: 1, taskNumber: 1 }, { unique: true });
taskSchema.index({ project: 1, board: 1, column: 1 });
taskSchema.index({ taskKey: 1 }, { unique: true });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ createdBy: 1 });

export default mongoose.model("Task", taskSchema);
