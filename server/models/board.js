import mongoose from "mongoose";
const { Schema } = mongoose;

const boardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    settings: {
      enableWipLimits: { type: Boolean, default: false },
      showCompletedTasks: { type: Boolean, default: true },
      autoArchiveCompleted: { type: Boolean, default: false },
      autoArchiveDays: { type: Number, default: 30 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes
boardSchema.index({ project: 1, status: 1 });
boardSchema.index({ project: 1, isDefault: 1 });
boardSchema.index({ createdBy: 1 });

export default mongoose.model("Board", boardSchema);

