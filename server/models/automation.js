import mongoose from "mongoose";
const { Schema } = mongoose;

/** "When <trigger>, then <actions>" rule that runs on a project's tasks. */
const automationSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    enabled: { type: Boolean, default: true },
    trigger: {
      type: { type: String, enum: ["task_created", "status_changed", "priority_changed", "task_assigned"], required: true },
      // status/priority to match; empty matches any
      value: { type: String, trim: true },
    },
    actions: [
      {
        type: { type: String, enum: ["set_status", "set_priority", "assign_user", "add_tag", "add_comment", "notify_user"], required: true },
        value: { type: String, trim: true, maxlength: 500 },
      },
    ],
    runCount: { type: Number, default: 0 },
    lastRunAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Automation", automationSchema);
