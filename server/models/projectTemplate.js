import mongoose from "mongoose";
const { Schema } = mongoose;

const projectTemplateSchema = new Schema(
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
      unique: true,
      maxlength: 20,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "software",
        "marketing",
        "design",
        "hr",
        "operations",
        "product",
        "content",
        "support",
      ],
    },
    icon: {
      type: String,
      default: "Folder",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    defaultColumns: [
      {
        name: {
          type: String,
          required: true,
        },
        position: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
          default: "#6366f1",
        },
        limit: {
          type: Number,
        },
      },
    ],
    defaultTasks: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        columnIndex: {
          type: Number,
          required: true,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
        },
        position: {
          type: Number,
          required: true,
        },
      },
    ],
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

projectTemplateSchema.index({ category: 1 });
projectTemplateSchema.index({ isGlobal: 1 });
projectTemplateSchema.index({ workspace: 1 });
projectTemplateSchema.index({ usageCount: -1 });

export default mongoose.model("ProjectTemplate", projectTemplateSchema);

