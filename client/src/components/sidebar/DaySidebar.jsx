import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ChevronRight,
  Flag,
  Users,
  MoreVertical,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from "lucide-react";

const DaySidebar = ({ isOpen, onClose, selectedDate, tasks = [], events = [], onTaskClick }) => {
  const [activeSection, setActiveSection] = useState("all"); // all, tasks, events

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!selectedDate) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeOfDay = (hour) => {
    if (hour < 6) return { label: "Night", icon: Moon, color: "text-indigo-400" };
    if (hour < 12) return { label: "Morning", icon: Sunrise, color: "text-orange-400" };
    if (hour < 18) return { label: "Afternoon", icon: Sun, color: "text-yellow-400" };
    return { label: "Evening", icon: Sunset, color: "text-purple-400" };
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const groupItemsByTime = () => {
    const allItems = [
      ...tasks.map(t => ({ ...t, type: 'task' })),
      ...events.map(e => ({ ...e, type: 'event' }))
    ];

    const grouped = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
      noTime: []
    };

    allItems.forEach(item => {
      if (item.time) {
        const hour = parseInt(item.time.split(':')[0]);
        if (hour < 6) grouped.night.push(item);
        else if (hour < 12) grouped.morning.push(item);
        else if (hour < 18) grouped.afternoon.push(item);
        else grouped.evening.push(item);
      } else {
        grouped.noTime.push(item);
      }
    });

    return grouped;
  };

  const groupedItems = groupItemsByTime();

  const stats = {
    total: tasks.length + events.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[600px] bg-[#0a0a0b] border-l border-gray-800 shadow-2xl z-[101] flex flex-col rounded-l-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {formatDate(selectedDate)}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {stats.total} items • {stats.completed} completed
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Stats */}
              <div className="flex gap-2">
                {[
                  { label: "All", value: stats.total, active: activeSection === "all" },
                  { label: "Tasks", value: tasks.length, active: activeSection === "tasks" },
                  { label: "Events", value: events.length, active: activeSection === "events" },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    onClick={() => setActiveSection(item.label.toLowerCase())}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      item.active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-gray-400 hover:text-white"
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {item.label} ({item.value})
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Add New Button */}
                <motion.button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Task or Event</span>
                </motion.button>

                {/* Timeline by Time of Day */}
                {Object.entries(groupedItems).map(([timeOfDay, items]) => {
                  if (items.length === 0) return null;

                  const timeInfo = timeOfDay === 'noTime' 
                    ? { label: "No Time Set", icon: Clock, color: "text-gray-400" }
                    : getTimeOfDay(timeOfDay === 'morning' ? 8 : timeOfDay === 'afternoon' ? 14 : timeOfDay === 'evening' ? 19 : 2);

                  return (
                    <div key={timeOfDay} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <timeInfo.icon className={`w-4 h-4 ${timeInfo.color}`} />
                        <h3 className={`text-sm font-semibold ${timeInfo.color} uppercase tracking-wider`}>
                          {timeInfo.label}
                        </h3>
                        <div className="flex-1 h-px bg-gray-800" />
                      </div>

                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <motion.div
                            key={`${item.type}-${item._id || index}`}
                            onClick={() => item.type === 'task' && onTaskClick?.(item)}
                            className={`p-4 rounded-lg border transition-all duration-200 ${
                              item.type === 'task' 
                                ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-900 cursor-pointer'
                                : 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 cursor-pointer'
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3 flex-1">
                                {item.type === 'task' && (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Toggle task completion
                                    }}
                                    className="mt-0.5"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {item.status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-gray-500" />
                                    )}
                                  </motion.button>
                                )}
                                <div className="flex-1">
                                  <h4 className={`text-sm font-medium mb-1 ${
                                    item.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'
                                  }`}>
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-3">
                                {item.priority && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                              <div className="flex items-center gap-3 text-xs">
                                {item.time && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.time}</span>
                                  </div>
                                )}
                                {item.project && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Flag className="w-3 h-3" />
                                    <span>{item.project.name || item.project}</span>
                                  </div>
                                )}
                              </div>

                              {item.assignee && (
                                <div className="flex items-center gap-1">
                                  {item.assignee.avatar ? (
                                    <img
                                      src={item.assignee.avatar}
                                      alt={item.assignee.name}
                                      className="w-5 h-5 rounded-full border border-gray-700"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                                      <Users className="w-3 h-3 text-gray-600" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {stats.total === 0 && (
                  <motion.div
                    className="flex flex-col items-center justify-center py-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="p-4 bg-gray-900 rounded-full mb-4">
                      <Calendar className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      No plans for this day
                    </h3>
                    <p className="text-xs text-gray-600">
                      Add tasks or events to get started
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DaySidebar;

