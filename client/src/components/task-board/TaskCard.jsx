import React, { useState } from "react";
import { motion } from "framer-motion";
import { Draggable } from "@hello-pangea/dnd";
import {
  Clock,
  User,
  Flag,
  Calendar,
  MoreHorizontal,
  MessageCircle,
  Paperclip,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

const TaskCard = ({ task, index, onTaskUpdate, currentUser, onTaskClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isAssignedToMe = task.assignee._id === currentUser?._id;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";
  const isDueSoon =
    task.dueDate &&
    new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) &&
    task.status !== "completed";

  const getPriorityColor = (priority) => {
    const colors = {
      high: "text-red-500 bg-red-500/20",
      medium: "text-yellow-500 bg-yellow-500/20",
      low: "text-green-500 bg-green-500/20",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      high: <AlertTriangle className="w-3 h-3" />,
      medium: <AlertCircle className="w-3 h-3" />,
      low: <CheckCircle2 className="w-3 h-3" />,
    };
    return icons[priority] || icons.medium;
  };

  const getDueDateColor = () => {
    if (isOverdue) return "text-red-400";
    if (isDueSoon) return "text-yellow-400";
    return "text-gray-400";
  };

  const formatDueDate = (date) => {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return dueDate.toLocaleDateString();
  };

  const getProgressPercentage = () => {
    if (!task.estimatedTime || !task.actualTime) return 0;
    return Math.min((task.actualTime / task.estimatedTime.value) * 100, 100);
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative bg-gray-700 rounded-xl border transition-all duration-200 cursor-pointer group ${
            isAssignedToMe
              ? "border-blue-500 shadow-lg shadow-blue-500/20"
              : "border-gray-600 hover:border-gray-500"
          } ${
            snapshot.isDragging
              ? "shadow-2xl shadow-blue-500/30 rotate-1 scale-105"
              : ""
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onTaskClick?.(task)}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          {/* Priority Indicator */}
          <div
            className={`absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
              task.priority
            )}`}
          >
            {getPriorityIcon(task.priority)}
            <span className="capitalize">{task.priority}</span>
          </div>

          {/* Assigned to Me Badge */}
          {isAssignedToMe && (
            <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Assigned to Me
            </div>
          )}

          {/* Card Content */}
          <div className="p-4 pt-8">
            {/* Title */}
            <h4 className="font-semibold text-white text-sm mb-2 line-clamp-2">
              {task.title}
            </h4>

            {/* Description */}
            {task.description && (
              <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.labels.slice(0, 3).map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full"
                  >
                    {label}
                  </span>
                ))}
                {task.labels.length > 3 && (
                  <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                    +{task.labels.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {task.estimatedTime && task.actualTime > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <motion.div
                    className="bg-blue-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
            )}

            {/* Task Info */}
            <div className="space-y-2">
              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center space-x-2 text-xs">
                  <Calendar className={`w-3 h-3 ${getDueDateColor()}`} />
                  <span className={getDueDateColor()}>
                    {formatDueDate(task.dueDate)}
                  </span>
                  {isOverdue && (
                    <span className="text-red-400 font-medium">OVERDUE</span>
                  )}
                </div>
              )}

              {/* Assignee */}
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs text-gray-400">
                    {task.assignee.name}
                  </span>
                </div>
              </div>

              {/* Project */}
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Flag className="w-3 h-3" />
                <span>{task.project.name}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div
              className={`flex items-center justify-between mt-3 pt-3 border-t border-gray-600 ${
                isHovered ? "opacity-100" : "opacity-0"
              } transition-opacity duration-200`}
            >
              <div className="flex items-center space-x-3">
                <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200">
                  <MessageCircle className="w-3 h-3" />
                </button>
                <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200">
                  <Paperclip className="w-3 h-3" />
                </button>
                <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200">
                  <Eye className="w-3 h-3" />
                </button>
              </div>

              <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200">
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </motion.div>
          </div>

          {/* Drag Handle */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </motion.div>
      )}
    </Draggable>
  );
};

export default TaskCard;
