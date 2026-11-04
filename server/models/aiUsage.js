import mongoose from "mongoose";
const { Schema } = mongoose;

/** One record per AI request, used for the AI Mode usage stats. */
const aiUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    feature: {
      type: String,
      enum: ["assistant", "plan_day", "task_breakdown"],
      required: true,
    },
    model: { type: String },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    toolCalls: { type: Number, default: 0 },
    actionsTaken: { type: Number, default: 0 },
  },
  { timestamps: true }
);

aiUsageSchema.index({ workspace: 1, createdAt: -1 });
aiUsageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("AiUsage", aiUsageSchema);
