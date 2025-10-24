import mongoose from "mongoose";
const { Schema } = mongoose;

const calendarIntegrationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    provider: {
      type: String,
      required: true,
      enum: ["google", "outlook"],
    },
    // OAuth tokens
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    tokenType: {
      type: String,
      default: "Bearer",
    },
    // Calendar details
    calendarId: {
      type: String,
      required: true,
    },
    calendarName: {
      type: String,
      trim: true,
    },
    primaryCalendar: {
      type: Boolean,
      default: false,
    },
    // Sync settings
    syncSettings: {
      syncEnabled: {
        type: Boolean,
        default: true,
      },
      syncDirection: {
        type: String,
        enum: ["to_external", "to_internal", "bidirectional"],
        default: "bidirectional",
      },
      syncFrequency: {
        type: Number, // minutes
        default: 15,
      },
      syncPastEvents: {
        type: Boolean,
        default: false,
      },
      syncFutureEvents: {
        type: Boolean,
        default: true,
      },
      syncPastDays: {
        type: Number,
        default: 30,
      },
      syncFutureDays: {
        type: Number,
        default: 365,
      },
      syncCategories: {
        type: [String],
        default: ["meeting", "deadline", "milestone"],
      },
    },
    // Sync status
    syncStatus: {
      status: {
        type: String,
        enum: ["active", "paused", "error", "disconnected"],
        default: "active",
      },
      lastSyncAt: Date,
      lastSuccessfulSyncAt: Date,
      nextSyncAt: Date,
      syncErrors: [
        {
          timestamp: Date,
          error: String,
          eventId: String,
        },
      ],
    },
    // Statistics
    stats: {
      totalEventsSynced: {
        type: Number,
        default: 0,
      },
      totalEventsCreated: {
        type: Number,
        default: 0,
      },
      totalEventsUpdated: {
        type: Number,
        default: 0,
      },
      totalEventsDeleted: {
        type: Number,
        default: 0,
      },
      lastSyncDuration: Number, // milliseconds
    },
    // Connection status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    disconnectedAt: Date,
    disconnectedReason: String,
    // Provider-specific data
    providerData: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Indexes
calendarIntegrationSchema.index({ user: 1, provider: 1 });
calendarIntegrationSchema.index({ workspace: 1 });
calendarIntegrationSchema.index({ calendarId: 1 });
calendarIntegrationSchema.index({ "syncStatus.status": 1 });
calendarIntegrationSchema.index({ isActive: 1 });
calendarIntegrationSchema.index({ expiresAt: 1 });

// Unique index: one active integration per user per provider
calendarIntegrationSchema.index(
  { user: 1, provider: 1, workspace: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Method to check if token is expired
calendarIntegrationSchema.methods.isTokenExpired = function () {
  return new Date() >= this.expiresAt;
};

// Method to check if token needs refresh (expires in less than 5 minutes)
calendarIntegrationSchema.methods.needsRefresh = function () {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return this.expiresAt <= fiveMinutesFromNow;
};

// Method to check if sync is due
calendarIntegrationSchema.methods.isSyncDue = function () {
  if (!this.syncSettings.syncEnabled) return false;
  if (this.syncStatus.status !== "active") return false;
  
  const nextSync = this.syncStatus.nextSyncAt;
  if (!nextSync) return true;
  
  return new Date() >= nextSync;
};

// Method to calculate next sync time
calendarIntegrationSchema.methods.calculateNextSync = function () {
  const now = new Date();
  const intervalMs = this.syncSettings.syncFrequency * 60 * 1000;
  return new Date(now.getTime() + intervalMs);
};

console.log("✅ CalendarIntegration model initialized");

export default mongoose.model("CalendarIntegration", calendarIntegrationSchema);

