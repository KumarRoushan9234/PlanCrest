import mongoose from "mongoose";
const { Schema } = mongoose;

const columnSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: "#94a3b8",
    },
    wipLimit: {
      enabled: { type: Boolean, default: false },
      limit: { type: Number, default: 0 },
    },
    type: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "review", "done", "custom"],
      default: "custom",
    },
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
columnSchema.index({ board: 1, position: 1 });
columnSchema.index({ project: 1 });

export default mongoose.model("Column", columnSchema);

