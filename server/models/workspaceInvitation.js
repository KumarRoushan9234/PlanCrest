import mongoose from "mongoose";
const { Schema } = mongoose;

const workspaceInvitationSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "guest"],
      default: "member",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    declinedAt: {
      type: Date,
    },
    declinedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
workspaceInvitationSchema.index({ workspace: 1, email: 1 });
// Index already defined in schema with unique: true
workspaceInvitationSchema.index({ status: 1 });
workspaceInvitationSchema.index({ expiresAt: 1 });

export default mongoose.model("WorkspaceInvitation", workspaceInvitationSchema);
