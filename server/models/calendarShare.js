import mongoose from "mongoose";
const { Schema } = mongoose;

const calendarShareSchema = new Schema(
  {
    // What is being shared (can be workspace, project, or user calendar)
    shareType: {
      type: String,
      required: true,
      enum: ["workspace", "project", "user"],
    },
    // Reference to what is being shared
    sharedResource: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "shareType",
    },
    // Who is sharing
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Share target type
    shareTargetType: {
      type: String,
      required: true,
      enum: ["user", "workspace", "project", "team", "public"],
    },
    // Reference to share target (optional for public shares)
    shareTarget: {
      type: Schema.Types.ObjectId,
      refPath: "shareTargetType",
    },
    // Permissions
    permissions: {
      canView: {
        type: Boolean,
        default: true,
      },
      canEdit: {
        type: Boolean,
        default: false,
      },
      canDelete: {
        type: Boolean,
        default: false,
      },
      canShare: {
        type: Boolean,
        default: false,
      },
      canManagePermissions: {
        type: Boolean,
        default: false,
      },
    },
    // Settings
    settings: {
      showDetails: {
        type: Boolean,
        default: true,
      },
      showAttendees: {
        type: Boolean,
        default: true,
      },
      showDescription: {
        type: Boolean,
        default: true,
      },
      showLocation: {
        type: Boolean,
        default: true,
      },
      syncEnabled: {
        type: Boolean,
        default: false,
      },
    },
    // Share link (for public shares)
    shareLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    shareLinkExpiry: Date,
    // Status
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    // Notification settings
    notifyOnCreate: {
      type: Boolean,
      default: true,
    },
    notifyOnUpdate: {
      type: Boolean,
      default: true,
    },
    notifyOnDelete: {
      type: Boolean,
      default: true,
    },
    // Access tracking
    lastAccessedAt: Date,
    accessCount: {
      type: Number,
      default: 0,
    },
    // Expiry
    expiresAt: Date,
    autoRevokeAfterDays: Number,
    // Additional metadata
    notes: {
      type: String,
      trim: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
calendarShareSchema.index({ shareType: 1, sharedResource: 1 });
calendarShareSchema.index({ shareTargetType: 1, shareTarget: 1 });
calendarShareSchema.index({ sharedBy: 1 });
calendarShareSchema.index({ workspace: 1 });
calendarShareSchema.index({ status: 1 });
calendarShareSchema.index({ shareLink: 1 });
calendarShareSchema.index({ expiresAt: 1 });

// Compound indexes
calendarShareSchema.index({ sharedResource: 1, shareTarget: 1 }, { unique: true });

// Method to check if share is expired
calendarShareSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() >= this.expiresAt;
};

// Method to check if share is active
calendarShareSchema.methods.isActive = function () {
  return this.status === "active" && !this.isExpired();
};

// Method to revoke share
calendarShareSchema.methods.revoke = async function () {
  this.status = "revoked";
  await this.save();
};

// Method to track access
calendarShareSchema.methods.trackAccess = async function () {
  this.lastAccessedAt = new Date();
  this.accessCount += 1;
  await this.save();
};

// Method to check permissions
calendarShareSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

// Pre-save middleware to handle auto-revoke
calendarShareSchema.pre("save", function (next) {
  if (this.autoRevokeAfterDays && !this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.autoRevokeAfterDays);
    this.expiresAt = expiryDate;
  }
  next();
});

console.log("✅ CalendarShare model initialized");

export default mongoose.model("CalendarShare", calendarShareSchema);

