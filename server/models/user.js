import mongoose from "mongoose";
import { encryptedString } from "../utils/crypto.js";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 64,
    },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String },
      format: { type: String },
      bytes: { type: Number },
      width: { type: Number },
      height: { type: Number },
      folder: { type: String },
      version: { type: Number },
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    // Professional Information
    title: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      city: { type: String, trim: true },
      country: { type: String, trim: true },
      timezone: { type: String, default: "UTC" },
    },
    // Email Configuration for sending emails on behalf of user
    emailConfig: {
      service: { 
        type: String, 
        enum: ["gmail", "outlook", "zoho", "custom"],
        default: "gmail"
      },
      user: { type: String, trim: true }, // Email address
      password: encryptedString, // App password or OAuth token, encrypted at rest
      host: { type: String, trim: true }, // For custom SMTP
      port: { type: Number }, // For custom SMTP
      secure: { type: Boolean, default: true }, // Use TLS
      isConfigured: { type: Boolean, default: false },
      lastVerified: { type: Date },
    },
    // Skills and Expertise
    skills: [
      {
        name: { type: String, trim: true },
        level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
      },
    ],
    expertise: [String],
    // Social Links
    socialLinks: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      twitter: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    // Personal Integrations (User-level integrations)
    integrations: {
      github: {
        connected: { type: Boolean, default: false },
        username: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        connectedAt: { type: Date },
      },
      gitlab: {
        connected: { type: Boolean, default: false },
        username: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        connectedAt: { type: Date },
      },
      google: {
        connected: { type: Boolean, default: false },
        email: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        scopes: [String], // drive, calendar, meet
        connectedAt: { type: Date },
      },
      slack: {
        connected: { type: Boolean, default: false },
        userId: { type: String },
        teamId: { type: String },
        accessToken: { type: String },
        connectedAt: { type: Date },
      },
      figma: {
        connected: { type: Boolean, default: false },
        userId: { type: String },
        accessToken: { type: String },
        connectedAt: { type: Date },
      },
      zoom: {
        connected: { type: Boolean, default: false },
        userId: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        connectedAt: { type: Date },
      },
    },
    // Preferences
    language: {
      type: String,
      default: "en",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    // Notification Settings
    notificationSettings: {
      email: {
        taskAssigned: { type: Boolean, default: true },
        taskDue: { type: Boolean, default: true },
        taskCompleted: { type: Boolean, default: false },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        chatMessages: { type: Boolean, default: true },
        projectInvites: { type: Boolean, default: true },
        workspaceInvites: { type: Boolean, default: true },
        deadlineReminder: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
        projectCreated: { type: Boolean, default: true },
        digestFrequency: { 
          type: String, 
          enum: ["realtime", "hourly", "daily", "weekly", "never"],
          default: "realtime" 
        },
      },
      inApp: {
        taskAssigned: { type: Boolean, default: true },
        taskDue: { type: Boolean, default: true },
        taskCompleted: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        chatMessages: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        deadlineReminder: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
        projectInvite: { type: Boolean, default: true },
      },
      push: {
        taskAssigned: { type: Boolean, default: true },
        taskCompleted: { type: Boolean, default: false },
        projectInvite: { type: Boolean, default: true },
        workspaceInvite: { type: Boolean, default: true },
        deadlineReminder: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
      },
      desktop: {
        enabled: { type: Boolean, default: true },
        taskAssigned: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        chatMessages: { type: Boolean, default: false },
      },
      mobile: {
        enabled: { type: Boolean, default: true },
        taskAssigned: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        chatMessages: { type: Boolean, default: false },
      },
    },
    // Work Preferences
    workPreferences: {
      workingHours: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
      },
      workingDays: {
        type: [String],
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      availability: {
        type: String,
        enum: ["available", "busy", "away", "offline"],
        default: "available",
      },
      autoAssignTasks: { type: Boolean, default: false },
      taskCapacity: { type: Number, default: 0 }, // 0 means unlimited
    },
    // Status
    status: {
      type: String,
      enum: ["online", "away", "busy", "offline"],
      default: "offline",
    },
    statusMessage: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    // Security & Authentication
    // Stored as SHA-256 hashes
    passwordResetCode: {
      type: String,
      default: "",
    },
    passwordResetCodeExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: "",
    },
    verificationCodeExpires: {
      type: Date,
    },
    isFirebaseUser: {
      type: Boolean,
      default: false,
    },
    firebaseUid: {
      type: String,
      default: "",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    // Activity Tracking
    stats: {
      tasksCompleted: { type: Number, default: 0 },
      tasksCreated: { type: Number, default: 0 },
      projectsCreated: { type: Number, default: 0 },
      commentsPosted: { type: Number, default: 0 },
      totalTimeLogged: { type: Number, default: 0 }, // in minutes
    },
    // Onboarding
    onboarding: {
      completed: { type: Boolean, default: false },
      steps: {
        profileSetup: { type: Boolean, default: false },
        workspaceCreated: { type: Boolean, default: false },
        projectCreated: { type: Boolean, default: false },
        taskCreated: { type: Boolean, default: false },
        teamInvited: { type: Boolean, default: false },
      },
    },
    // Last Selected Items for Auto-Restoration
    lastSelected: {
      workspace: {
        id: { type: Schema.Types.ObjectId, ref: "Workspace" },
        name: { type: String },
        selectedAt: { type: Date, default: Date.now },
      },
      project: {
        id: { type: Schema.Types.ObjectId, ref: "Project" },
        name: { type: String },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
        selectedAt: { type: Date, default: Date.now },
      },
      task: {
        id: { type: Schema.Types.ObjectId, ref: "Task" },
        title: { type: String },
        projectId: { type: Schema.Types.ObjectId, ref: "Project" },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
        selectedAt: { type: Date, default: Date.now },
      },
      board: {
        id: { type: Schema.Types.ObjectId, ref: "Board" },
        name: { type: String },
        projectId: { type: Schema.Types.ObjectId, ref: "Project" },
        selectedAt: { type: Date, default: Date.now },
      },
      column: {
        id: { type: Schema.Types.ObjectId, ref: "Column" },
        name: { type: String },
        boardId: { type: Schema.Types.ObjectId, ref: "Board" },
        projectId: { type: Schema.Types.ObjectId, ref: "Project" },
        selectedAt: { type: Date, default: Date.now },
      },
      channel: {
        id: { type: Schema.Types.ObjectId, ref: "ChatChannel" },
        name: { type: String },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
        selectedAt: { type: Date, default: Date.now },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.verificationCode;
        delete ret.verificationCodeExpires;
        delete ret.passwordResetCode;
        delete ret.passwordResetCodeExpires;
        delete ret.twoFactorSecret;
        if (ret.emailConfig) delete ret.emailConfig.password;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ lastActive: -1 });
userSchema.index({ status: 1 });
userSchema.index({ "location.timezone": 1 });
userSchema.index({ department: 1 });

export default mongoose.model("User", userSchema);
