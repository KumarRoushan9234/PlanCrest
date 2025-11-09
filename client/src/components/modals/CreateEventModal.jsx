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
} from "lucide-react";
import { calendarService } from "../../services";
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
    allDay: false,
    recurring: false,
    recurringPattern: "daily",
    recurringEndDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateMeetLink, setGenerateMeetLink] = useState(false);
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false);
  const [meetConnected, setMeetConnected] = useState(false);

  // Check if Google Meet is connected
  useEffect(() => {
    const checkMeetConnection = async () => {
      try {
        const { connectors } = await connectorService.getAllConnectors(
          "workspace",
          currentWorkspace?._id
        );
        const meetConnector = connectors?.find((c) => c.type === "google_meet");
        setMeetConnected(!!meetConnector);
      } catch (error) {
        console.error("Error checking Meet connection:", error);
      }
    };

    if (isOpen && currentWorkspace) {
      checkMeetConnection();
    }
  }, [isOpen, currentWorkspace]);

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
          : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      let meetingLinkToUse = formData.meetingLink;

      // Generate Google Meet link if requested
      if (
        generateMeetLink &&
        meetConnected &&
        formData.category === "meeting"
      ) {
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

      if (onEventCreated) {
        onEventCreated(response.data);
      }

      // Reset form
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
        allDay: false,
        recurring: false,
        recurringPattern: "daily",
        recurringEndDate: "",
      });

      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-800">
                Create Calendar Event
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Team Meeting, Sprint Planning, etc."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event details..."
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={formData.allDay}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={formData.allDay}
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
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                  All day event
                </label>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="reminder">Reminder</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Conference Room A, Office Building, etc."
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Meeting Link
                </label>

                {meetConnected && formData.category === "meeting" && (
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateMeetLink}
                      onChange={(e) => setGenerateMeetLink(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Video className="w-4 h-4 text-blue-600" />
                      Generate Google Meet link automatically
                    </span>
                  </label>
                )}

                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  disabled={generateMeetLink}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Attendees
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {workspaceMembers.map((member) => (
                    <label
                      key={member.user._id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.attendees.includes(member.user._id)}
                        onChange={() => handleAttendeeToggle(member.user._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {member.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recurring Event */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="recurring"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="recurring"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Recurring event
                  </label>
                </div>

                {formData.recurring && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repeat
                      </label>
                      <select
                        name="recurringPattern"
                        value={formData.recurringPattern}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="recurringEndDate"
                        value={formData.recurringEndDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateEventModal;
