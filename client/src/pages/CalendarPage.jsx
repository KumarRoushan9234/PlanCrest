import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/common-afterauth";
import { AuthLoader } from "../components/loaders";
import { MonthView, LinearView } from "../components/calendar";
import { TaskSidebar, DaySidebar } from "../components/sidebar";
import CalendarTopNav from "../components/top-nav/CalendarTopNav";

const CalendarPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // "month" or "linear"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDaySidebarOpen, setIsDaySidebarOpen] = useState(false);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);

  // Mock data - replace with actual API calls
  const mockTasks = [
    {
      _id: "1",
      title: "Design new landing page",
      description:
        "Create a modern, responsive landing page for the new product launch",
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      time: "09:00",
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
    },
    {
      _id: "2",
      title: "Team meeting",
      description: "Weekly sync with the development team",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      time: "14:00",
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
    },
    {
      _id: "3",
      title: "Review pull requests",
      description: "Review and merge pending PRs",
      status: "completed",
      priority: "low",
      dueDate: new Date(),
      time: "10:30",
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj2",
        name: "API Development",
      },
    },
    {
      _id: "4",
      title: "Client presentation",
      description: "Present Q4 progress to stakeholders",
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      time: "15:00",
      assignee: {
        _id: "user2",
        name: "Jane Smith",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
    },
  ];

  const mockEvents = [
    {
      _id: "e1",
      title: "Company All-Hands",
      description: "Quarterly company meeting",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: "11:00",
      type: "meeting",
    },
    {
      _id: "e2",
      title: "Product Launch",
      description: "Official product release event",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      time: "13:00",
      type: "event",
    },
    {
      _id: "e3",
      title: "Team Standup",
      description: "Daily team sync",
      date: new Date(),
      time: "09:30",
      type: "meeting",
    },
    {
      _id: "e4",
      title: "Client Demo",
      description: "Product demonstration for client",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      time: "15:00",
      type: "meeting",
    },
    {
      _id: "e5",
      title: "Workshop",
      description: "Technical workshop session",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: "10:00",
      type: "event",
    },
  ];

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
    return mockTasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return mockEvents.filter((e) => {
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
            onCreateEvent={() => console.log("Create new event")}
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
                    tasks={mockTasks}
                    events={mockEvents}
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
                    tasks={mockTasks}
                    events={mockEvents}
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
    </Layout>
  );
};

export default CalendarPage;
