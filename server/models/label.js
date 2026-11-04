import mongoose from "mongoose";
const { Schema } = mongoose;

const labelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      required: true,
      default: "#6366f1",
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
labelSchema.index({ project: 1 });
labelSchema.index({ project: 1, name: 1 }, { unique: true });

export default mongoose.model("Label", labelSchema);

