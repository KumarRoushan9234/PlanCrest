import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Circle,
  CheckCircle2,
} from "lucide-react";

const MonthView = ({
  currentDate,
  onDateSelect,
  tasks = [],
  events = [],
  onNavigate,
}) => {
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getItemsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dateTasks = tasks.filter((t) => {
      const taskDate = new Date(t.dueDate).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
    const dateEvents = events.filter((e) => {
      const eventDate = new Date(e.date).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
    return { tasks: dateTasks, events: dateEvents };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!currentDate) return false;
    return date.toDateString() === currentDate.toDateString();
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);
  const days = [];

  // Previous month's trailing days
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

  return (
    <div className="h-full flex flex-col px-2 py-1">
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-900 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-7 gap-0 min-h-[500px]">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const { tasks: dayTasks, events: dayEvents } =
              getItemsForDate(date);
            const totalItems = dayTasks.length + dayEvents.length;
            const completedTasks = dayTasks.filter(
              (t) => t.status === "completed"
            ).length;
            const today = isToday(date);
            const selected = isSelected(date);

            return (
              <motion.div
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`aspect-square p-1 border-r border-b transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  today
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                    : selected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-900 bg-gray-950 hover:bg-gray-900 hover:border-gray-800"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.005, duration: 0.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Date Number */}
                <div className="flex items-start justify-between mb-0.5">
                  <span
                    className={`text-xs font-semibold ${
                      today
                        ? "text-blue-400"
                        : selected
                        ? "text-purple-400"
                        : "text-white"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {totalItems > 0 && (
                    <span className="px-1 py-0.5 bg-gray-800 rounded-full text-[8px] font-medium text-gray-400">
                      {totalItems}
                    </span>
                  )}
                </div>

                {/* Items Preview (dots/mini items) */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map((task, idx) => (
                    <motion.div
                      key={task._id || idx}
                      className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] ${
                        task.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : task.priority === "high"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-gray-800 text-gray-400"
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-1.5 h-1.5" />
                      ) : (
                        <Circle className="w-1.5 h-1.5" />
                      )}
                      <span className="truncate flex-1 font-medium">
                        {task.title}
                      </span>
                    </motion.div>
                  ))}

                  {dayEvents.slice(0, 1).map((event, idx) => (
                    <motion.div
                      key={event._id || idx}
                      className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium ${
                        event.type === "meeting"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + (dayTasks.slice(0, 2).length + idx) * 0.05,
                      }}
                    >
                      <CalendarIcon className="w-1.5 h-1.5" />
                      <span className="truncate flex-1">{event.title}</span>
                    </motion.div>
                  ))}

                  {totalItems > 3 && (
                    <div className="text-[7px] text-gray-600 text-center mt-0.5">
                      +{totalItems - 3} more
                    </div>
                  )}
                </div>

                {/* Today indicator */}
                {today && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthView;
