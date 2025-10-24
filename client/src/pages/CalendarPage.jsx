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
        // Transform tasks to include assignment information
        const tasksWithAssignments = await Promise.all(
          response.data.map(async (task) => {
            try {
              const assignmentsRes = await taskService.getTaskAssignments(
                task._id
              );
              const primaryAssignee = assignmentsRes?.data?.find(
                (a) => a.role === "assignee"
              );

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
              };
            } catch (err) {
              return task;
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
        setEvents(response.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      // Don't show error toast for events - they might not be set up yet
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDaySidebarOpen(true);
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

  const handleEventCreated = (newEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    fetchEvents(); // Refresh events
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
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date).toISOString().split("T")[0];
      return eventDate === dateStr;
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
      />

      {/* Task Details Sidebar */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => setIsTaskSidebarOpen(false)}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />

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
