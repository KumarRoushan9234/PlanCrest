import mongoose from "mongoose";
const { Schema } = mongoose;

const calendarEventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    location: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    // Recurring event settings
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: { type: Number, default: 1 },
      endType: {
        type: String,
        enum: ["never", "after", "onDate"],
        default: "never",
      },
      endAfterOccurrences: Number,
      endDate: Date,
      daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
      dayOfMonth: Number,
      monthOfYear: Number,
    },
    // Event status
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    // Event category
    category: {
      type: String,
      enum: ["meeting", "deadline", "milestone", "reminder", "other"],
      default: "meeting",
    },
    // Event priority
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // Attendees
    attendees: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        response: {
          type: String,
          enum: ["pending", "accepted", "declined", "tentative"],
          default: "pending",
        },
        responseAt: Date,
      },
    ],
    // Reminders
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "notification", "both"],
          default: "both",
        },
        minutesBefore: {
          type: Number,
          required: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Relationships
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // External calendar sync
    externalCalendarId: {
      type: String,
      trim: true,
    },
    externalProvider: {
      type: String,
      enum: ["google", "outlook", null],
    },
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "failed", "not_synced"],
      default: "not_synced",
    },
    lastSyncedAt: Date,
    syncError: String,
    // Additional metadata
    color: {
      type: String,
      default: "#667eea",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
  },
  { timestamps: true }
);

// Indexes for performance
calendarEventSchema.index({ workspace: 1, startDate: 1 });
calendarEventSchema.index({ workspace: 1, endDate: 1 });
calendarEventSchema.index({ project: 1, startDate: 1 });
calendarEventSchema.index({ task: 1 });
calendarEventSchema.index({ createdBy: 1 });
calendarEventSchema.index({ "attendees.user": 1 });
calendarEventSchema.index({ status: 1 });
calendarEventSchema.index({ category: 1 });
calendarEventSchema.index({ externalCalendarId: 1 });
calendarEventSchema.index({ syncStatus: 1 });

// Virtual for duration in minutes
calendarEventSchema.virtual("durationMinutes").get(function () {
  if (this.startDate && this.endDate) {
    return Math.floor((this.endDate - this.startDate) / (1000 * 60));
  }
  return 0;
});

// Method to check if event is happening now
calendarEventSchema.methods.isHappeningNow = function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Method to check if event is upcoming
calendarEventSchema.methods.isUpcoming = function () {
  const now = new Date();
  return this.startDate > now;
};

// Method to check if event is past
calendarEventSchema.methods.isPast = function () {
  const now = new Date();
  return this.endDate < now;
};

console.log("✅ CalendarEvent model initialized");

export default mongoose.model("CalendarEvent", calendarEventSchema);

