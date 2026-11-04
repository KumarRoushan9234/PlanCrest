import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import "./TaskBoard.css";
import {
  Plus,
  MoreHorizontal,
  Filter,
  Search,
  Calendar,
  Users,
  AlertTriangle,
} from "lucide-react";

const TaskBoard = ({ tasks, onTaskUpdate, onTaskMove, currentUser, onTaskClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const columns = [
    {
      id: "todo",
      title: "To Do",
      color: "blue",
      icon: "📋",
      tasks: tasks.filter((task) => task.status === "todo"),
    },
    {
      id: "in_progress",
      title: "In Progress",
      color: "yellow",
      icon: "⚡",
      tasks: tasks.filter((task) => task.status === "in_progress"),
    },
    {
      id: "completed",
      title: "Completed",
      color: "green",
      icon: "✅",
      tasks: tasks.filter((task) => task.status === "completed"),
    },
  ];

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    onTaskMove(draggableId, newStatus, newPosition);
  };

  const getColumnStats = (columnId) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column) return { total: 0, overdue: 0, assignedToMe: 0 };

    const total = column.tasks.length;
    const overdue = column.tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed"
    ).length;
    const assignedToMe = column.tasks.filter(
      (task) => task.assignee._id === currentUser?._id
    ).length;

    return { total, overdue, assignedToMe };
  };

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">All Tasks</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{tasks.length} tasks</span>
            <span>•</span>
            <span>
              {columns.reduce((acc, col) => acc + col.tasks.length, 0)} total
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
            />
          </div>

          {/* Filters */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </motion.button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignee
                </label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="all">All Assignees</option>
                  <option value="me">Assigned to Me</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="all">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project
                </label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="all">All Projects</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column, index) => {
            const stats = getColumnStats(column.id);
            const filteredTasks = column.tasks.filter(
              (task) =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            );

            return (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={filteredTasks}
                stats={stats}
                index={index}
                onTaskUpdate={onTaskUpdate}
                currentUser={currentUser}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
