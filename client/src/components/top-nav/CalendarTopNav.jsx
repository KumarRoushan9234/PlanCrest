import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Users,
  Settings,
  Filter,
  Star,
  MoreHorizontal,
  Bell,
  X,
} from "lucide-react";

const CalendarTopNav = () => {
  const [expandedSections, setExpandedSections] = useState({
    views: false,
    calendars: false,
  });
  const [activeItem, setActiveItem] = useState("today");

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

  const quickActionsItems = [
    { name: "Schedule Meeting", icon: Clock },
    { name: "Team Availability", icon: Users },
  ];

  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  return (
    <motion.nav
      className="w-full px-6 py-4 border-b border-gray-800"
      style={{ backgroundColor: "#0f0f11" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Main Navigation */}
        <div className="flex items-center space-x-6">
          {/* Page Title */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-xl font-semibold text-white">Calendar</h1>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
        </div>

        {/* Center Section - Navigation Items */}
        <div className="flex items-center space-x-1">
          {/* Views Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("views")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
                activeItem === "views"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
              >
                <Calendar className="w-4 h-4" />
              </motion.div>
              <span className="font-semibold text-sm">Views</span>
              <motion.div
                animate={{ rotate: expandedSections.views ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Views Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.views && (
                <motion.div
                  className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-[9999]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    {viewItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          item.active
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleItemClick(item.name.toLowerCase())}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Calendars Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("calendars")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
                activeItem === "calendars"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 7 }}
              >
                <Calendar className="w-4 h-4" />
              </motion.div>
              <span className="font-semibold text-sm">Calendars</span>
              <motion.div
                animate={{ rotate: expandedSections.calendars ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Calendars Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.calendars && (
                <motion.div
                  className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-[9999]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    {calendarItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-full ${item.color}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 5 + index,
                          }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <motion.button
            onClick={() => handleItemClick("quickActions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "quickActions"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">Quick Actions</span>
          </motion.button>

          {/* More Tools */}
          <motion.button
            onClick={() => handleItemClick("more")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "more"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="font-medium text-sm">More Tools</span>
          </motion.button>
        </div>

        {/* Right Section - Actions and Favorites */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("quickActions")}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">Quick Actions</span>
              <motion.div
                animate={{ rotate: expandedSections.quickActions ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Quick Actions Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.quickActions && (
                <motion.div
                  className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-[9999]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-2">
                      Quick Actions
                    </div>
                    {quickActionsItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 8 + index,
                          }}
                        >
                          <item.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </motion.div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Additional Actions */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-4 h-4" />
            </motion.button>
            <motion.button
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(expandedSections.views ||
          expandedSections.calendars ||
          expandedSections.quickActions) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setExpandedSections({
                views: false,
                calendars: false,
                quickActions: false,
              });
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default CalendarTopNav;
