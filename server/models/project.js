import mongoose from "mongoose";
const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    icon: {
      type: String,
      default: "Folder",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    settings: {
      defaultView: {
        type: String,
        enum: ["kanban", "list", "calendar"],
        default: "kanban",
      },
      features: {
        chat: { type: Boolean, default: true },
        documentation: { type: Boolean, default: true },
        timeTracking: { type: Boolean, default: true },
        clientPortal: { type: Boolean, default: false },
      },
      automations: {
        autoAssignOnCreate: { type: Boolean, default: false },
        autoMoveOnComplete: { type: Boolean, default: false },
        notifyOnTaskDue: { type: Boolean, default: true },
      },
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "on_hold", "completed", "archived"],
      default: "active",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    templateUsed: {
      type: Schema.Types.ObjectId,
      ref: "ProjectTemplate",
    },
  },
  { timestamps: true }
);

// Compound index for unique project key per workspace
projectSchema.index({ workspace: 1, key: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ lead: 1 });
projectSchema.index({ status: 1 });

export default mongoose.model("Project", projectSchema);

