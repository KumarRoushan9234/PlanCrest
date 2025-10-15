import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Settings,
  Filter,
  Star,
  MoreHorizontal,
  X,
} from "lucide-react";

const CalendarSidebar = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    views: true,
    calendars: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const viewItems = [
    { name: "Today", icon: Calendar, active: true },
    { name: "Week", icon: Calendar },
    { name: "Month", icon: Calendar },
    { name: "Year", icon: Calendar },
  ];

  const calendarItems = [
    { name: "Personal", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Team Meetings", color: "bg-purple-500" },
  ];

  return (
    <div
      className="fixed top-15 left-18 bottom-2 w-65 z-30 transition-all duration-300 ease-in-out rounded-xl"
      style={{ backgroundColor: "#0d0d0e" }}
    >
      <div className="flex flex-col h-full">
        {/* Header with Page Name and Close Button */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Calendar
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {/* Quick Actions */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
              <span>Create Event</span>
            </motion.button>
          </motion.div>

          {/* Views Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={() => toggleSection("views")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
                >
                  <Calendar className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-semibold text-sm">Views</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.views ? -90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expandedSections.views ? (
                  <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.views && (
                <motion.div
                  className="mt-1 ml-3 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {viewItems.map((item, index) => (
                    <motion.button
                      key={index}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        item.active
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="w-3 h-3" />
                      <span className="text-xs font-medium">{item.name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Calendars Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <motion.button
              onClick={() => toggleSection("calendars")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 7 }}
                >
                  <Calendar className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-semibold text-sm">Calendars</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.calendars ? -90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expandedSections.calendars ? (
                  <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.calendars && (
                <motion.div
                  className="mt-1 ml-3 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {calendarItems.map((item, index) => (
                    <motion.button
                      key={index}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${item.color}`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          repeatDelay: 5 + index,
                        }}
                      ></motion.div>
                      <span className="text-xs font-medium">{item.name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-1">
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 8 }}
                >
                  <Clock className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-medium text-sm">Schedule Meeting</span>
              </motion.button>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 9 }}
                >
                  <Users className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-medium text-sm">Team Availability</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSidebar;
