import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/common-afterauth";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  MoreVertical,
  Filter,
  Search,
} from "lucide-react";

const CalendarPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // day, week, month

  // Mock events
  const events = [
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(2024, 0, 15, 10, 0),
      duration: "1h",
      type: "meeting",
      color: "bg-blue-600",
    },
    {
      id: 2,
      title: "Project Deadline",
      date: new Date(2024, 0, 20, 17, 0),
      duration: "All day",
      type: "deadline",
      color: "bg-red-600",
    },
    {
      id: 3,
      title: "Client Call",
      date: new Date(2024, 0, 18, 14, 0),
      duration: "30m",
      type: "call",
      color: "bg-green-600",
    },
    {
      id: 4,
      title: "Design Review",
      date: new Date(2024, 0, 22, 15, 0),
      duration: "2h",
      type: "review",
      color: "bg-purple-600",
    },
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <Layout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0a0a0b" }}
        >
          <LoadingSpinner fullScreen text="Loading calendar..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-6 py-6" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Top Actions */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
              <motion.button
                onClick={prevMonth}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <div className="px-4 text-white font-medium">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <motion.button
                onClick={nextMonth}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
              {["day", "week", "month"].map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Event</span>
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <motion.div
            className="lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <motion.div
                    key={day}
                    className={`aspect-square p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isToday
                        ? "border-blue-500 bg-blue-600/20"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`text-sm font-medium ${
                        isToday ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {day}
                    </div>
                    {/* Event indicators */}
                    <div className="mt-1 space-y-1">
                      {events
                        .filter(
                          (event) =>
                            event.date.getDate() === day &&
                            event.date.getMonth() === currentDate.getMonth()
                        )
                        .slice(0, 2)
                        .map((event) => (
                          <div
                            key={event.id}
                            className={`w-full h-1 ${event.color} rounded-full`}
                          />
                        ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Upcoming Events Sidebar */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event, index) => (
                  <motion.div
                    key={event.id}
                    className="p-3 bg-gray-700/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 ${event.color} rounded-full`}
                        />
                        <h4 className="text-sm font-medium text-white">
                          {event.title}
                        </h4>
                      </div>
                      <motion.button
                        className="text-gray-400 hover:text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {event.date.toLocaleDateString()} - {event.duration}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                This Month
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Total Events",
                    value: "12",
                    icon: CalendarIcon,
                    color: "text-blue-400",
                  },
                  {
                    label: "Meetings",
                    value: "8",
                    icon: Users,
                    color: "text-green-400",
                  },
                  {
                    label: "Deadlines",
                    value: "4",
                    icon: Clock,
                    color: "text-red-400",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
