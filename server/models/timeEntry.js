import mongoose from "mongoose";
const { Schema } = mongoose;

const timeEntrySchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    isBillable: {
      type: Boolean,
      default: true,
    },
    hourlyRate: {
      type: Number,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
timeEntrySchema.index({ task: 1, user: 1 });
timeEntrySchema.index({ project: 1, user: 1 });
timeEntrySchema.index({ workspace: 1, user: 1 });
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ isRunning: 1, user: 1 });

export default mongoose.model("TimeEntry", timeEntrySchema);
