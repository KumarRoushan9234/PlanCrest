import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MessageCircle,
  User,
  Calendar,
  MoreHorizontal,
  Star,
  Users,
  Snowflake,
  Filter,
  CheckCircle,
  Clock,
  List,
  X,
} from "lucide-react";

const DashboardSidebar = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    myTasks: true,
    spaces: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const myTasksItems = [
    { name: "Assigned to me", icon: CheckCircle, color: "text-red-500" },
    { name: "Today & Overdue", icon: Calendar, color: "text-orange-500" },
    { name: "Personal List", icon: User, color: "text-blue-500" },
  ];

  const spacesItems = [
    {
      name: "All Tasks - Kumar Roushan's W...",
      icon: Snowflake,
      color: "text-gray-400",
    },
    { name: "Team Space", icon: Users, color: "text-blue-500" },
    { name: "New Space", icon: Plus, color: "text-gray-400" },
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
              Home
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
              placeholder="Search in Home..."
              className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
              <span>Create New Task</span>
            </motion.button>
          </motion.div>

          {/* Navigation Sections */}
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {/* Inbox Section */}
            <motion.button
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Inbox className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
              <span className="font-medium text-sm">Inbox</span>
              <motion.div
                className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                3
              </motion.div>
            </motion.button>

            {/* Assigned Comments Section */}
            <motion.button
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
              <span className="font-medium text-sm">Assigned Comments</span>
              <motion.div
                className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
              >
                1
              </motion.div>
            </motion.button>
          </motion.div>

          {/* My Tasks Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <motion.button
              onClick={() => toggleSection("myTasks")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
                >
                  <User className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-semibold text-sm">My Tasks</span>
                <motion.div
                  className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 4 }}
                >
                  12
                </motion.div>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.myTasks ? -90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expandedSections.myTasks ? (
                  <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.myTasks && (
                <motion.div
                  className="mt-1 ml-3 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {myTasksItems.map((item, index) => (
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
                      <motion.div
                        className="ml-auto bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          repeatDelay: 6 + index,
                        }}
                      >
                        {index === 0 ? "5" : index === 1 ? "2" : "3"}
                      </motion.div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* More Section */}
          <div className="mt-4">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group">
              <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="font-medium text-sm">More Tools</span>
            </button>
          </div>

          {/* Favorites Section */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Favorites
            </h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium">Important Tasks</span>
              </button>
            </div>
          </div>

          {/* Spaces Section */}
          <div className="mt-4">
            <button
              onClick={() => toggleSection("spaces")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Workspaces
              </h3>
              <Plus className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
            </button>

            {expandedSections.spaces && (
              <div className="mt-1 space-y-1">
                {spacesItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                  >
                    <item.icon
                      className={`w-3 h-3 ${item.color} group-hover:text-white transition-colors`}
                    />
                    <span className="text-xs font-medium">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
