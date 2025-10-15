import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot,
  Zap,
  Brain,
  Settings,
  Filter,
  Star,
  MoreHorizontal,
  MessageSquare,
  Lightbulb,
  BarChart3,
  X,
} from "lucide-react";

const AIModeSidebar = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    aiTools: true,
    analytics: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const aiToolsItems = [
    { name: "AI Assistant", icon: Bot, active: true },
    { name: "Smart Suggestions", icon: Lightbulb },
    { name: "Auto Responses", icon: MessageSquare },
    { name: "Content Generator", icon: Zap },
  ];

  const analyticsItems = [
    { name: "AI Analytics", icon: BarChart3 },
    { name: "Performance Metrics", icon: BarChart3 },
    { name: "Usage Reports", icon: BarChart3 },
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
              AI Mode
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
              placeholder="Search AI tools..."
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
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>New AI Task</span>
            </motion.button>
          </motion.div>

          {/* AI Tools Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={() => toggleSection("aiTools")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
                >
                  <Bot className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-semibold text-sm">AI Tools</span>
                <motion.div
                  className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 4 }}
                >
                  4
                </motion.div>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.aiTools ? -90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expandedSections.aiTools ? (
                  <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.aiTools && (
                <motion.div
                  className="mt-1 ml-3 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {aiToolsItems.map((item, index) => (
                    <motion.button
                      key={index}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        item.active
                          ? "bg-purple-600 text-white shadow-lg"
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

          {/* Analytics Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <motion.button
              onClick={() => toggleSection("analytics")}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 7 }}
                >
                  <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-semibold text-sm">Analytics</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.analytics ? -90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {expandedSections.analytics ? (
                  <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.analytics && (
                <motion.div
                  className="mt-1 ml-3 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {analyticsItems.map((item, index) => (
                    <motion.button
                      key={index}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="w-3 h-3 group-hover:text-white transition-colors" />
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
                  <Brain className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-medium text-sm">Smart Insights</span>
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
                  <Zap className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="font-medium text-sm">Auto Optimize</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIModeSidebar;
