import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Settings,
  Download,
  Share2,
  Zap,
  Brain,
  Lightbulb,
  Target,
  ChevronDown,
  MoreVertical,
  Plus,
} from "lucide-react";

const AIModeTopNav = () => {
  const [aiMode, setAiMode] = useState("assistant");
  const [showModes, setShowModes] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const aiModes = [
    {
      id: "assistant",
      label: "AI Assistant",
      icon: Sparkles,
      description: "General purpose assistance",
    },
    {
      id: "analyzer",
      label: "Code Analyzer",
      icon: Brain,
      description: "Analyze and review code",
    },
    {
      id: "suggestions",
      label: "Smart Suggestions",
      icon: Lightbulb,
      description: "Get intelligent recommendations",
    },
    {
      id: "optimizer",
      label: "Task Optimizer",
      icon: Target,
      description: "Optimize workflows and tasks",
    },
  ];

  const actionOptions = [
    { id: "export", label: "Export Conversation", icon: Download },
    { id: "share", label: "Share Session", icon: Share2 },
    { id: "settings", label: "AI Settings", icon: Settings },
  ];

  const currentMode = aiModes.find((mode) => mode.id === aiMode);

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
        {/* Left Section - AI Mode Selector */}
        <div className="flex items-center gap-4">
          {/* AI Mode Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowModes(!showModes)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                showModes
                  ? "bg-gray-800 text-white"
                  : "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white hover:from-purple-600/30 hover:to-blue-600/30"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {currentMode && (
                <>
                  <currentMode.icon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">
                      {currentMode.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {currentMode.description}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: showModes ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {showModes && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      AI Modes
                    </div>
                    {aiModes.map((mode, index) => {
                      const IconComponent = mode.icon;
                      return (
                        <motion.button
                          key={mode.id}
                          onClick={() => {
                            setAiMode(mode.id);
                            setShowModes(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-all duration-200 rounded-lg ${
                            aiMode === mode.id
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              aiMode === mode.id
                                ? "bg-purple-500"
                                : "bg-gray-800"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col items-start flex-1">
                            <span className="font-semibold">{mode.label}</span>
                            <span className="text-xs text-gray-400">
                              {mode.description}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs text-gray-400">AI Active</span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <motion.button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

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

          {/* New Chat Button */}
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">New Chat</span>
          </motion.button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(showModes || showActions) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModes(false);
              setShowActions(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default AIModeTopNav;
