import React from "react";
import { motion } from "framer-motion";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { Plus, MoreHorizontal } from "lucide-react";

const TaskColumn = ({
  column,
  tasks,
  stats,
  index,
  onTaskUpdate,
  currentUser,
}) => {
  const getColumnColor = (color) => {
    const colors = {
      blue: "border-blue-500 bg-blue-500/10",
      yellow: "border-yellow-500 bg-yellow-500/10",
      green: "border-green-500 bg-green-500/10",
    };
    return colors[color] || colors.blue;
  };

  const getColumnHeaderColor = (color) => {
    const colors = {
      blue: "text-blue-400",
      yellow: "text-yellow-400",
      green: "text-green-400",
    };
    return colors[color] || colors.blue;
  };

  return (
    <motion.div
      className="bg-gray-800 rounded-xl border border-gray-700 min-h-[600px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      {/* Column Header */}
      <div
        className={`p-6 border-b border-gray-700 ${getColumnColor(
          column.color
        )}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{column.icon}</span>
            <div>
              <h3
                className={`font-semibold ${getColumnHeaderColor(
                  column.color
                )}`}
              >
                {column.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{stats.total} tasks</span>
                {stats.overdue > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-400">
                      {stats.overdue} overdue
                    </span>
                  </>
                )}
                {stats.assignedToMe > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-purple-400">
                      {stats.assignedToMe} mine
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
            <motion.button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-6 min-h-[500px] transition-all duration-200 ${
              snapshot.isDraggingOver ? "bg-gray-700/50" : "bg-gray-800"
            }`}
          >
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-12 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">{column.icon}</span>
                  </div>
                  <p className="text-sm font-medium">
                    No tasks in {column.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Drag tasks here or create a new one
                  </p>
                </motion.div>
              ) : (
                tasks.map((task, taskIndex) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={taskIndex}
                    onTaskUpdate={onTaskUpdate}
                    currentUser={currentUser}
                  />
                ))
              )}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </motion.div>
  );
};

export default TaskColumn;
