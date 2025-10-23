import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Settings,
  Download,
  Upload,
  MoreVertical,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Tag,
  ChevronDown,
} from "lucide-react";

const CalendarTopNav = ({ 
  currentDate = new Date(), 
  onNavigate = () => {}, 
  viewMode = "month", 
  onViewModeChange = () => {}, 
  onCreateEvent = () => {} 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  const prevMonth = () => {
    onNavigate("prev");
  };

  const nextMonth = () => {
    onNavigate("next");
  };

  const goToToday = () => {
    onNavigate("today");
  };

  const filterOptions = [
    { id: "all", label: "All Events", icon: CalendarIcon },
    { id: "meetings", label: "Meetings", icon: Users },
    { id: "deadlines", label: "Deadlines", icon: Clock },
    { id: "tasks", label: "Tasks", icon: Tag },
  ];

  const actionOptions = [
    { id: "export", label: "Export Calendar", icon: Download },
    { id: "import", label: "Import Events", icon: Upload },
    { id: "settings", label: "Calendar Settings", icon: Settings },
  ];

  return (
    <motion.nav
      className="w-full px-6 py-3 border-b border-gray-800/50 backdrop-blur-xl z-50"
      style={{
        backgroundColor: "rgba(10, 10, 11, 0.95)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Navigation */}
        <div className="flex items-center gap-3">
          {/* Today Button */}
          <motion.button
            onClick={goToToday}
            className="px-3.5 py-2 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 text-xs font-medium"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Today
          </motion.button>

          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-lg p-1">
            <motion.button
              onClick={prevMonth}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <div className="px-3 text-white font-medium text-sm min-w-[120px] text-center">
              {currentDate ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Loading...'}
            </div>
            <motion.button
              onClick={nextMonth}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-900/50 border border-gray-800 rounded-lg p-1">
            {[
              { id: "month", label: "Month", icon: Grid3X3 },
              { id: "linear", label: "Week", icon: List }
            ].map((mode) => (
              <motion.button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === mode.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-gray-400 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <mode.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{mode.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 ${
                showFilters
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">Filter</span>
              <motion.div
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Event Types
                    </div>
                    {filterOptions.map((option, index) => {
                      const IconComponent = option.icon;
                      return (
                        <motion.button
                          key={option.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded-lg"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="font-medium">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* More Actions */}
          <div className="relative">
            <motion.button
              onClick={() => setShowActions(!showActions)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 ${
                showActions
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <MoreVertical className="w-4 h-4" />
              <span className="text-xs font-medium">More</span>
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    {actionOptions.map((option, index) => {
                      const IconComponent = option.icon;
                      return (
                        <motion.button
                          key={option.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded-lg"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="font-medium">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Create Event Button */}
          <motion.button
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/30"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">New Event</span>
          </motion.button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(showFilters || showActions) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowFilters(false);
              setShowActions(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default CalendarTopNav;
