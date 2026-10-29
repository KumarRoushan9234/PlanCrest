import mongoose from "mongoose";
const { Schema } = mongoose;

const targetSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  // number: manual current/target; task: done when the linked task is done; boolean: manual tick
  type: { type: String, enum: ["number", "task", "boolean"], default: "number" },
  current: { type: Number, default: 0 },
  target: { type: Number, default: 100 },
  unit: { type: String, trim: true, maxlength: 20 },
  task: { type: Schema.Types.ObjectId, ref: "Task" },
  done: { type: Boolean, default: false },
});

const goalSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    color: { type: String, default: "#4d8dff" },
    dueDate: { type: Date },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targets: [targetSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
