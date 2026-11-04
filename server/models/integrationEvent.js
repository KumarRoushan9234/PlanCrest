import mongoose from "mongoose";
const { Schema } = mongoose;

/** Things that happened in a connected tool (a PR opened, a workflow failed, ...). */
const integrationEventSchema = new Schema(
  {
    connector: { type: Schema.Types.ObjectId, ref: "Connector", required: true, index: true },
    provider: { type: String, required: true },
    type: { type: String, required: true }, // e.g. pull_request.opened, workflow_run.failure
    title: { type: String, required: true },
    url: { type: String },
    actor: { type: String },
    repository: { type: String },
    status: { type: String },
  },
  { timestamps: true }
);

integrationEventSchema.index({ connector: 1, createdAt: -1 });

export default mongoose.model("IntegrationEvent", integrationEventSchema);
