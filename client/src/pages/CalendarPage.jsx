import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { Layout } from "../components/common-afterauth";
import { AuthLoader } from "../components/loaders";
import { MonthView, LinearView } from "../components/calendar";
import { TaskSidebar, DaySidebar } from "../components/sidebar";
import CalendarTopNav from "../components/top-nav/CalendarTopNav";
import CreateEventModal from "../components/modals/CreateEventModal";
import { taskService, calendarService } from "../services";
import toast from "react-hot-toast";

const CalendarPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month"); // "month" or "linear"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDaySidebarOpen, setIsDaySidebarOpen] = useState(false);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);

  // Fetch tasks and events when workspace changes
  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchTasks();
      fetchEvents();
    }
  }, [currentWorkspace]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getWorkspaceTasks(
        currentWorkspace._id
      );

      if (response?.success && response?.data) {
        // Transform tasks to include assignment information and project data
        const tasksWithAssignments = await Promise.all(
          response.data.map(async (task) => {
            try {
              const assignmentsRes = await taskService.getTaskAssignments(
                task._id
              );
              const primaryAssignee = assignmentsRes?.data?.find(
                (a) => a.role === "assignee"
              );

              // Ensure task has project information
              // If task.project is just an ID, we might need to fetch it
              // For now, assume it's populated or we'll handle it in the sidebar
              return {
                ...task,
                assignee: primaryAssignee?.user || null,
                time: task.dueDate
                  ? new Date(task.dueDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : null,
                // Ensure project is an object, not just an ID
                project:
                  typeof task.project === "object"
                    ? task.project
                    : { _id: task.project },
              };
            } catch (err) {
              return {
                ...task,
                project:
                  typeof task.project === "object"
                    ? task.project
                    : { _id: task.project },
              };
            }
          })
        );

        setTasks(tasksWithAssignments);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Get current month range
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const response = await calendarService.getWorkspaceEvents(
        currentWorkspace._id,
        {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        }
      );

      if (response?.success && response?.data) {
        // Add time field for display with proper date handling
        const eventsWithTime = response.data.map((event) => {
          try {
            const startDate = event.startDate
              ? new Date(event.startDate)
              : null;
            return {
              ...event,
              date: startDate, // Use Date object for compatibility
              startDate: startDate, // Ensure it's a Date object
              time:
                startDate && !isNaN(startDate.getTime())
                  ? startDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : null,
            };
          } catch (e) {
            console.error("Error processing event date:", e);
            return {
              ...event,
              date: null,
              time: null,
            };
          }
        });
        setEvents(eventsWithTime);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      // Don't show error toast for events - they might not be set up yet
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDaySidebarOpen(true);
    setIsTaskSidebarOpen(false);
  };

  const handleEventClick = (event, date) => {
    // Set the date so sidebar shows events for that day
    setSelectedDate(date || new Date(event.startDate || event.date));
    setIsDaySidebarOpen(true);
    setIsTaskSidebarOpen(false);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskSidebarOpen(true);
    setIsDaySidebarOpen(false);
  };

  const handleTaskUpdate = (updatedTask) => {
    // Update task in state
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskId) => {
    // Delete task from state
    setIsTaskSidebarOpen(false);
    setSelectedTask(null);
  };

  const handleEventCreated = async (newEvent) => {
    // Refresh events to get the latest data from server
    await fetchEvents();
    toast.success("Event created successfully!");
  };

  const handleNavigate = (action) => {
    const newDate = new Date(currentDate);

    switch (action) {
      case "prev":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "next":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "prev-week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "next-week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "today":
        setCurrentDate(new Date());
        return;
      default:
        break;
    }

    setCurrentDate(newDate);
  };

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return [];

    // Use local date comparison to avoid timezone issues
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();

    return events.filter((e) => {
      const eventDateValue = e.date || e.startDate;
      if (!eventDateValue) return false;

      try {
        const eventDate = new Date(eventDateValue);
        if (isNaN(eventDate.getTime())) return false;

        return (
          eventDate.getFullYear() === selectedYear &&
          eventDate.getMonth() === selectedMonth &&
          eventDate.getDate() === selectedDay
        );
      } catch (e) {
        return false;
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading calendar..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Top Navigation */}
          <CalendarTopNav
            currentDate={currentDate}
            onNavigate={handleNavigate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onCreateEvent={() => setIsCreateEventOpen(true)}
          />

          {/* Calendar View - Full Width */}
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-950 to-black">
            <AnimatePresence mode="wait">
              {viewMode === "month" ? (
                <motion.div
                  key="month"
                  className="h-full"
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <MonthView
                    currentDate={currentDate}
                    onDateSelect={handleDateSelect}
                    tasks={tasks}
                    events={events}
                    onNavigate={handleNavigate}
                    onEventClick={handleEventClick}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="linear"
                  className="h-full"
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <LinearView
                    currentDate={currentDate}
                    tasks={tasks}
                    events={events}
                    onTaskClick={handleTaskClick}
                    onNavigate={handleNavigate}
                    onEventClick={handleEventClick}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Day Details Sidebar */}
      <DaySidebar
        isOpen={isDaySidebarOpen}
        onClose={() => setIsDaySidebarOpen(false)}
        selectedDate={selectedDate}
        tasks={getTasksForSelectedDate()}
        events={getEventsForSelectedDate()}
        onTaskClick={handleTaskClick}
        onEventUpdate={fetchEvents}
      />

      {/* Task Details Sidebar */}
      {selectedTask && selectedTask.project && (
        <TaskSidebar
          isOpen={isTaskSidebarOpen}
          onClose={() => setIsTaskSidebarOpen(false)}
          task={selectedTask}
          project={selectedTask.project}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onEventCreated={handleEventCreated}
        initialDate={selectedDate}
      />
    </Layout>
  );
};

export default CalendarPage;
