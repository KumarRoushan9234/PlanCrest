import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  Link as LinkIcon,
  Video,
  Loader2,
  FolderKanban,
  CheckSquare,
  Mail,
  Bell,
} from "lucide-react";
import { calendarService, projectService, taskService } from "../../services";
import connectorService from "../../services/connectorService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const CreateEventModal = ({
  isOpen,
  onClose,
  onEventCreated,
  initialDate = null,
}) => {
  const { currentWorkspace, workspaceMembers } = useWorkspace();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    category: "meeting",
    location: "",
    meetingLink: "",
    attendees: [],
    project: "",
    task: "",
    allDay: false,
    recurring: false,
    recurringPattern: "daily",
    recurringEndDate: "",
    sendReminder: true,
    sendInvitations: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateMeetLink, setGenerateMeetLink] = useState(false);
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false);
  const [meetConnected, setMeetConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Category options with dynamic fields
  const categoryOptions = [
    {
      value: "meeting",
      label: "Meeting",
      icon: "📞",
      showMeetLink: true,
      showAttendees: true,
    },
    {
      value: "deadline",
      label: "Deadline",
      icon: "⏰",
      showMeetLink: false,
      showAttendees: true,
    },
    {
      value: "reminder",
      label: "Reminder",
      icon: "🔔",
      showMeetLink: false,
      showAttendees: false,
    },
    {
      value: "event",
      label: "Event",
      icon: "🎉",
      showMeetLink: false,
      showAttendees: true,
    },
    {
      value: "holiday",
      label: "Holiday",
      icon: "🏖️",
      showMeetLink: false,
      showAttendees: false,
    },
    {
      value: "other",
      label: "Other",
      icon: "📌",
      showMeetLink: false,
      showAttendees: true,
    },
  ];

  const selectedCategory = categoryOptions.find(
    (cat) => cat.value === formData.category
  );

  // Check if Google Meet and Calendar are connected
  useEffect(() => {
    const checkIntegrations = async () => {
      try {
        const { connectors } = await connectorService.getAllConnectors(
          "workspace",
          currentWorkspace?._id
        );
        const meetConnector = connectors?.find((c) => c.type === "google_meet");
        const calConnector = connectors?.find(
          (c) => c.type === "google_calendar"
        );
        setMeetConnected(!!meetConnector);
        setCalendarConnected(!!calConnector);
      } catch (error) {
        console.error("Error checking integrations:", error);
      }
    };

    if (isOpen && currentWorkspace) {
      checkIntegrations();
    }
  }, [isOpen, currentWorkspace]);

  // Fetch projects and tasks
  useEffect(() => {
    const fetchProjectsAndTasks = async () => {
      if (!currentWorkspace?._id) return;

      try {
        setLoadingProjects(true);
        const projectsResponse = await projectService.getWorkspaceProjects(
          currentWorkspace._id
        );
        setProjects(projectsResponse?.data || []);

        // Fetch all workspace tasks
        const tasksResponse = await taskService.getWorkspaceTasks(
          currentWorkspace._id
        );
        setTasks(tasksResponse?.data || []);
      } catch (error) {
        console.error("Error fetching projects/tasks:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    if (isOpen && currentWorkspace) {
      fetchProjectsAndTasks();
    }
  }, [isOpen, currentWorkspace]);

  // Filter tasks by selected project
  const filteredTasks = formData.project
    ? tasks.filter(
        (task) =>
          task.project?._id === formData.project ||
          task.project === formData.project
      )
    : tasks;

  useEffect(() => {
    if (isOpen && initialDate) {
      const date = new Date(initialDate);
      const dateStr = date.toISOString().split("T")[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setFormData((prev) => ({
        ...prev,
        startDate: dateStr,
        startTime: timeStr,
        endDate: dateStr,
        endTime: new Date(date.getTime() + 60 * 60 * 1000)
          .toTimeString()
          .slice(0, 5),
      }));
    }
  }, [isOpen, initialDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAttendeeToggle = (userId) => {
    setFormData((prev) => {
      const attendees = prev.attendees.includes(userId)
        ? prev.attendees.filter((id) => id !== userId)
        : [...prev.attendees, userId];
      return { ...prev, attendees };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.startDate || !formData.startTime) {
      setError("Start date and time are required");
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      const endDateTime =
        formData.endDate && formData.endTime
          ? new Date(`${formData.endDate}T${formData.endTime}`)
          : new Date(startDateTime.getTime() + 60 * 60 * 1000);

      // Generate Google Meet link if requested (for any category)
      let meetingLinkToUse = formData.meetingLink;

      if (generateMeetLink && meetConnected) {
        try {
          setGeneratingMeetLink(true);

          // Get attendee emails
          const attendeeEmails = formData.attendees
            .map((userId) => {
              const member = workspaceMembers?.find(
                (m) => m.user._id === userId
              );
              return member?.user?.email;
            })
            .filter(Boolean);

          const meetResponse = await connectorService.createGoogleMeetLink(
            "workspace",
            currentWorkspace?._id,
            {
              title: formData.title,
              description: formData.description,
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              timezone: "UTC",
              attendeeEmails,
            }
          );

          if (meetResponse.success && meetResponse.meetLink) {
            meetingLinkToUse = meetResponse.meetLink;
            // Update form data to show the generated link
            setFormData((prev) => ({
              ...prev,
              meetingLink: meetResponse.meetLink,
            }));
            toast.success("Google Meet link created!");
          }
        } catch (meetError) {
          console.error("Error creating Meet link:", meetError);
          toast.error(
            "Failed to create Meet link, event will be created without it"
          );
        } finally {
          setGeneratingMeetLink(false);
        }
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        category: formData.category,
        location: formData.location,
        meetingLink: meetingLinkToUse,
        allDay: formData.allDay,
        attendees: formData.attendees.map((userId) => ({
          user: userId,
          response: "pending",
        })),
        project: formData.project || undefined,
        task: formData.task || undefined,
        sendReminder: formData.sendReminder,
        sendInvitations: formData.sendInvitations,
        syncToGoogleCalendar: calendarConnected,
      };

      if (formData.recurring) {
        eventData.recurring = {
          enabled: true,
          frequency: formData.recurringPattern,
          endDate: formData.recurringEndDate
            ? new Date(formData.recurringEndDate).toISOString()
            : null,
        };
      }

      const response = await calendarService.createEvent(
        currentWorkspace._id,
        eventData
      );

      // Reset form first
      setFormData({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        category: "meeting",
        location: "",
        meetingLink: "",
        attendees: [],
        project: "",
        task: "",
        allDay: false,
        recurring: false,
        recurringPattern: "daily",
        recurringEndDate: "",
        sendReminder: true,
        sendInvitations: true,
      });

      // Close modal
      onClose();

      // Call onEventCreated callback to refresh events (this will show toast)
      if (onEventCreated) {
        await onEventCreated(response.data);
      }
    } catch (err) {
      console.error("Error creating event:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to create event"
      );
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading || generatingMeetLink ? undefined : onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50"
          />

          {/* Full-screen Loading Overlay */}
          {(loading || generatingMeetLink) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <Loader2 className="w-16 h-16 text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {generatingMeetLink
                    ? "Generating Google Meet Link..."
                    : "Creating Event..."}
                </h3>
                <p className="text-gray-400 text-sm">
                  {generatingMeetLink
                    ? "Setting up your meeting room..."
                    : "Scheduling your event and sending invitations..."}
                </p>
                {generatingMeetLink && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                    <Video className="w-5 h-5" />
                    <span className="text-sm">Creating Meet link</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-2xl border w-full max-w-6xl max-h-[85vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                backdropFilter: "blur(100px)",
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <Calendar className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Create Calendar Event
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    Workspace:{" "}
                    <span className="font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {currentWorkspace?.name || "N/A"}
                    </span>
                  </span>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-6"
                style={{
                  pointerEvents:
                    loading || generatingMeetLink ? "none" : "auto",
                  opacity: loading || generatingMeetLink ? 0.5 : 1,
                }}
              >
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN - Event Details */}
                  <div className="space-y-6">
                    {/* Event Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Team Meeting, Sprint Planning"
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Event details and agenda..."
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                      />
                    </div>

                    {/* Date and Time - Start */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Start Time *
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          required
                          disabled={formData.allDay}
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Date and Time - End */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          disabled={formData.allDay}
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* All Day Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="allDay"
                        id="allDay"
                        checked={formData.allDay}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                      />
                      <label
                        htmlFor="allDay"
                        className="ml-2 text-sm text-gray-300"
                      >
                        All day event
                      </label>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Category, Attendees, and Dynamic Fields */}
                  <div className="space-y-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {categoryOptions.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                category: cat.value,
                              }))
                            }
                            className={`p-3 rounded-lg border transition-all duration-200 ${
                              formData.category === cat.value
                                ? "border-purple-500 bg-purple-500/20"
                                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            }`}
                          >
                            <div className="text-2xl mb-1">{cat.icon}</div>
                            <div className="text-xs text-gray-300 font-medium">
                              {cat.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location - Show for all categories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Conference Room A, Office Building, etc."
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      />
                    </div>

                    {/* Meeting Link with Google Meet Integration - Available for all events */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <LinkIcon className="w-4 h-4 inline mr-1" />
                        Meeting Link (Optional)
                      </label>

                      {meetConnected && (
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={generateMeetLink}
                            onChange={(e) =>
                              setGenerateMeetLink(e.target.checked)
                            }
                            disabled={loading || generatingMeetLink}
                            className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700 disabled:opacity-50"
                          />
                          <span className="text-sm text-gray-300 flex items-center gap-1">
                            <Video className="w-4 h-4 text-blue-400" />
                            Generate Google Meet link automatically
                            {generatingMeetLink && (
                              <Loader2 className="w-3 h-3 animate-spin ml-1" />
                            )}
                          </span>
                        </label>
                      )}

                      {generatingMeetLink && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Google Meet link...</span>
                        </div>
                      )}

                      <input
                        type="url"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleChange}
                        disabled={
                          generateMeetLink || loading || generatingMeetLink
                        }
                        placeholder={
                          generatingMeetLink
                            ? "Generating link..."
                            : "https://meet.google.com/..."
                        }
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {formData.meetingLink && generateMeetLink && (
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Meet link generated successfully!
                        </p>
                      )}
                      {!meetConnected && (
                        <p className="text-xs text-gray-500 mt-1">
                          Connect Google Meet integration to generate links
                          automatically
                        </p>
                      )}
                    </div>

                    {/* Project Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <FolderKanban className="w-4 h-4 inline mr-1" />
                        Link to Project (Optional)
                      </label>
                      <select
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        disabled={loadingProjects}
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      >
                        <option value="">No project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Selection */}
                    {formData.project && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <CheckSquare className="w-4 h-4 inline mr-1" />
                          Link to Task (Optional)
                        </label>
                        <select
                          name="task"
                          value={formData.task}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        >
                          <option value="">No task</option>
                          {filteredTasks.map((task) => (
                            <option key={task._id} value={task._id}>
                              {task.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Attendees - Show based on category */}
                    {selectedCategory?.showAttendees && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Users className="w-4 h-4 inline mr-1" />
                          Attendees
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800/30 backdrop-blur-sm">
                          {workspaceMembers.map((member, memberIndex) => (
                            <label
                              key={
                                member._id ||
                                `member-${memberIndex}-${member.user?._id}`
                              }
                              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/30 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={formData.attendees.includes(
                                  member.user._id
                                )}
                                onChange={() =>
                                  handleAttendeeToggle(member.user._id)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                              />
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">
                                    {member.user.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {member.user.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {member.user.email}
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notification Options */}
                    {selectedCategory?.showAttendees &&
                      formData.attendees.length > 0 && (
                        <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="sendInvitations"
                              id="sendInvitations"
                              checked={formData.sendInvitations}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                            />
                            <label
                              htmlFor="sendInvitations"
                              className="ml-2 text-sm text-gray-300 flex items-center gap-1"
                            >
                              <Mail className="w-4 h-4 text-blue-400" />
                              Send email invitations to attendees
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="sendReminder"
                              id="sendReminder"
                              checked={formData.sendReminder}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                            />
                            <label
                              htmlFor="sendReminder"
                              className="ml-2 text-sm text-gray-300 flex items-center gap-1"
                            >
                              <Bell className="w-4 h-4 text-orange-400" />
                              Send reminder 30 minutes before event
                            </label>
                          </div>
                        </div>
                      )}

                    {/* Integration Status */}
                    {(meetConnected || calendarConnected) && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="text-xs text-green-400 space-y-1">
                          {calendarConnected && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Will sync to Google Calendar
                            </div>
                          )}
                          {meetConnected && formData.category === "meeting" && (
                            <div className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Google Meet integration ready
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - Bottom Right */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-600 border-opacity-50">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading || generatingMeetLink}
                    className="px-6 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || generatingMeetLink}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                  >
                    {(loading || generatingMeetLink) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {generatingMeetLink
                      ? "Generating Meet Link..."
                      : loading
                      ? "Creating Event..."
                      : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal;
