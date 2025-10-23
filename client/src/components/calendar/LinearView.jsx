import React from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const LinearView = ({
  currentDate,
  tasks = [],
  events = [],
  onTaskClick,
  onNavigate,
}) => {
  // Generate 7 days (current day + 6 following days)
  const getDaysToShow = () => {
    const days = [];
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getItemsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dateTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
    const dateEvents = events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
    return { tasks: dateTasks, events: dateEvents };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
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

  const days = getDaysToShow();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getWeekRange = () => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setDate(startDate.getDate() + 6);

    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getWeekNumber = () => {
    const startDate = new Date(currentDate);
    const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (startDate - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handlePrevWeek = () => {
    onNavigate("prev-week");
  };

  const handleNextWeek = () => {
    onNavigate("next-week");
  };

  const handleToday = () => {
    onNavigate("today");
  };

  return (
    <div className="h-full flex flex-col px-3 py-2">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handlePrevWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <div className="text-center">
            <h3 className="text-sm font-semibold text-white">
              {getWeekRange()}
            </h3>
            <p className="text-xs text-gray-500">
              Week {getWeekNumber()}, {currentDate.getFullYear()}
            </p>
          </div>

          <motion.button
            onClick={handleNextWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        <motion.button
          onClick={handleToday}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Today
        </motion.button>
      </div>

      {/* Days Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
        {days.map((date, dayIndex) => {
          const { tasks: dayTasks, events: dayEvents } = getItemsForDate(date);
          const today = isToday(date);
          const past = isPast(date);
          const future = isFuture(date);
          const totalItems = dayTasks.length + dayEvents.length;

          return (
            <motion.div
              key={date.toISOString()}
              className={`rounded-xl border transition-all duration-200 ${
                today
                  ? "border-blue-500 bg-blue-500/5"
                  : past
                  ? "border-gray-800 bg-gray-900/50 opacity-75"
                  : future
                  ? "border-gray-800 bg-gray-950"
                  : "border-gray-900 bg-gray-950"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05, duration: 0.3 }}
            >
              {/* Day Header */}
              <div
                className={`px-4 py-3 border-b ${
                  today
                    ? "border-blue-500/30"
                    : past
                    ? "border-gray-700"
                    : "border-gray-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-center ${
                        today
                          ? "text-blue-400"
                          : past
                          ? "text-gray-500"
                          : "text-white"
                      }`}
                    >
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      <div className="text-[10px] font-medium text-gray-500 uppercase">
                        {monthNames[date.getMonth()]}
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          today
                            ? "text-blue-400"
                            : past
                            ? "text-gray-500"
                            : "text-white"
                        }`}
                      >
                        {dayNames[date.getDay()]}
                      </h3>
                      <p className="text-[10px] text-gray-500">
                        {totalItems} {totalItems === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {past && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-400 text-[10px] font-medium rounded-full">
                        Past
                      </span>
                    )}
                    {today && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded-full">
                        Today
                      </span>
                    )}
                    {future && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 text-[10px] font-medium rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks and Events */}
              <div className="p-4 space-y-2">
                {/* Tasks */}
                {dayTasks.length > 0 && (
                  <div className="space-y-1.5">
                    {dayTasks.map((task, idx) => (
                      <motion.div
                        key={task._id || idx}
                        onClick={() => onTaskClick?.(task)}
                        className="p-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-900 cursor-pointer transition-all duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        whileHover={{ x: 4, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start gap-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle completion
                            }}
                            className="mt-0.5"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-500" />
                            )}
                          </motion.button>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4
                                className={`text-xs font-medium ${
                                  task.status === "completed"
                                    ? "text-gray-500 line-through"
                                    : "text-white"
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.priority && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[10px]">
                              {task.time && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{task.time}</span>
                                </div>
                              )}
                              {task.project && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Flag className="w-2.5 h-2.5" />
                                  <span>
                                    {task.project.name || task.project}
                                  </span>
                                </div>
                              )}
                              {task.assignee && (
                                <div className="flex items-center gap-1">
                                  {task.assignee.avatar ? (
                                    <img
                                      src={task.assignee.avatar}
                                      alt={task.assignee.name}
                                      className="w-3 h-3 rounded-full border border-gray-700"
                                    />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-gray-800 flex items-center justify-center">
                                      <Users className="w-2 h-2 text-gray-600" />
                                    </div>
                                  )}
                                  <span className="text-gray-500">
                                    {task.assignee.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Events */}
                {dayEvents.length > 0 && (
                  <div className="space-y-1.5">
                    {dayEvents.map((event, idx) => (
                      <motion.div
                        key={event._id || idx}
                        className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer transition-all duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.1 + (dayTasks.length + idx) * 0.05,
                        }}
                        whileHover={{ x: 4, scale: 1.01 }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-purple-500/10 rounded-lg">
                            <CalendarIcon className="w-3 h-3 text-purple-400" />
                          </div>

                          <div className="flex-1">
                            <h4 className="text-xs font-medium text-white mb-1">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-[10px] text-gray-500 mb-1">
                                {event.description}
                              </p>
                            )}
                            {event.time && (
                              <div className="flex items-center gap-1 text-[10px] text-purple-400">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{event.time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {totalItems === 0 && (
                  <div className="py-4 text-center text-gray-600 text-xs">
                    No tasks or events scheduled
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LinearView;
