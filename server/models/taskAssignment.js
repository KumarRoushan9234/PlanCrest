import mongoose from "mongoose";
const { Schema } = mongoose;

const taskAssignmentSchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["assignee", "reviewer", "watcher"],
      default: "assignee",
    },
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Compound index for unique task-user-role combination
taskAssignmentSchema.index({ task: 1, user: 1, role: 1 }, { unique: true });
taskAssignmentSchema.index({ user: 1, status: 1 });
taskAssignmentSchema.index({ task: 1, status: 1 });
taskAssignmentSchema.index({ project: 1, user: 1 });

export default mongoose.model("TaskAssignment", taskAssignmentSchema);
