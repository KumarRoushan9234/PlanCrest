import mongoose from "mongoose";
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    commentOn: {
      model: {
        type: String,
        required: true,
        enum: ["Task", "Document"],
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "authorModel",
    },
    authorModel: {
      type: String,
      required: true,
      enum: ["User", "ClientUser"],
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
commentSchema.index({ "commentOn.model": 1, "commentOn.id": 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ project: 1 });
commentSchema.index({ parentComment: 1 });

export default mongoose.model("Comment", commentSchema);
