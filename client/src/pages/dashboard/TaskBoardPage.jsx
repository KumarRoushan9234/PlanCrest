import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/common-afterauth";
import { TaskSidebar } from "../../components/sidebar";
import { AuthLoader } from "../../components/loaders";
import { taskService } from "../../services";
import toast from "react-hot-toast";
import {
  RefreshCw,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  User,
} from "lucide-react";

const TaskBoardPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { projects, currentProject } = useProject();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(() => {
    const saved = localStorage.getItem("taskboard-stats-open");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    project: "all",
    dueDate: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    assignedToMe: 0,
  });

  // Load tasks when component mounts or workspace changes
  useEffect(() => {
    if (currentWorkspace?._id) {
      loadTasks();
    }
  }, [currentWorkspace, currentProject]);

  // Filter tasks when filters or search change
  useEffect(() => {
    filterTasks();
  }, [tasks, filters, searchQuery]);

  // Save stats state to localStorage
  useEffect(() => {
    localStorage.setItem("taskboard-stats-open", JSON.stringify(isStatsOpen));
  }, [isStatsOpen]);

  // Calculate stats when tasks change
  useEffect(() => {
    calculateStats();
  }, [filteredTasks, user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      let response;

      // If a specific project is selected, fetch its tasks
      if (currentProject?._id) {
        response = await taskService.getProjectTasks(currentProject._id);
      }
      // Otherwise fetch all tasks in the workspace
      else if (currentWorkspace?._id) {
        response = await taskService.getWorkspaceTasks(currentWorkspace._id);
      }

      if (response?.success && response?.data) {
        // Transform the data to include assignment information
        const tasksWithAssignments = await Promise.all(
          response.data.map(async (task) => {
            try {
              const assignmentsRes = await taskService.getTaskAssignments(
                task._id
              );
              const primaryAssignee = assignmentsRes?.data?.find(
                (a) => a.role === "assignee"
              );

              return {
                ...task,
                assignee: primaryAssignee?.user || null,
                assignments: assignmentsRes?.data || [],
              };
            } catch (err) {
              console.error(
                `Error fetching assignments for task ${task._id}:`,
                err
              );
              return task;
            }
          })
        );

        setTasks(tasksWithAssignments);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = useCallback(() => {
    let filtered = [...tasks];

    if (filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.assignee === "me") {
      filtered = filtered.filter((task) => task.assignee?._id === user?._id);
    } else if (filters.assignee !== "all") {
      filtered = filtered.filter(
        (task) => task.assignee?._id === filters.assignee
      );
    }

    if (filters.project !== "all") {
      filtered = filtered.filter(
        (task) => task.project?._id === filters.project
      );
    }

    if (filters.dueDate === "overdue") {
      filtered = filtered.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "completed" &&
          task.status !== "done"
      );
    } else if (filters.dueDate === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          new Date(task.dueDate) < tomorrow
      );
    } else if (filters.dueDate === "thisWeek") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          new Date(task.dueDate) < nextWeek
      );
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchTerm) ||
          task.description?.toLowerCase().includes(searchTerm) ||
          task.taskKey?.toLowerCase().includes(searchTerm) ||
          (task.labels &&
            task.labels.some((label) =>
              label.toLowerCase().includes(searchTerm)
            ))
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filters, searchQuery, user]);

  const calculateStats = useCallback(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(
      (task) => task.status === "completed" || task.status === "done"
    ).length;
    const inProgress = filteredTasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const overdue = filteredTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed" &&
        task.status !== "done"
    ).length;
    const assignedToMe = filteredTasks.filter(
      (task) => task.assignee?._id === user?._id
    ).length;

    setStats({
      total,
      completed,
      inProgress,
      overdue,
      assignedToMe,
    });
  }, [filteredTasks, user]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleTaskUpdate = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === taskId ? { ...task, ...updates } : task))
    );
  };

  const handleTaskMove = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;

    try {
      // Find the column ID for the new status
      const task = tasks.find((t) => t._id === draggableId);
      if (!task) return;

      // Update task status via API
      await taskService.updateTask(draggableId, {
        status: newStatus,
        column: destination.droppableId,
      });

      // Update local state
      handleTaskUpdate(draggableId, { status: newStatus });
      toast.success("Task moved successfully");
    } catch (error) {
      console.error("Error moving task:", error);
      toast.error("Failed to move task");
    }
  };

  const refreshTasks = () => {
    loadTasks();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskSidebarOpen(true);
  };

  const handleTaskSidebarUpdate = async (updatedTask) => {
    try {
      await taskService.updateTask(updatedTask._id, updatedTask);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
      setSelectedTask(updatedTask);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      setIsTaskSidebarOpen(false);
      setSelectedTask(null);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const toggleStats = () => {
    setIsStatsOpen(!isStatsOpen);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      priority: "all",
      assignee: "all",
      project: "all",
      dueDate: "all",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.assignee !== "all" ||
    filters.project !== "all" ||
    filters.dueDate !== "all" ||
    searchQuery !== "";

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading tasks..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Action Bar */}
          <motion.div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Left Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New Task</span>
              </motion.button>

              <motion.button
                onClick={refreshTasks}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh tasks"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-64"
                />
              </div>

              {/* Filter Button */}
              <motion.button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  hasActiveFilters
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    •
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Kanban Board - Scrollable */}
          <div className="flex-1 overflow-hidden px-6 py-4">
            <KanbanBoard
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              currentUser={user}
            />
          </div>
        </div>

        {/* Right Sidebar - Collapsible Stats */}
        <AnimatePresence>
          {isStatsOpen && (
            <motion.div
              className="w-72 border-l border-gray-900 overflow-y-auto flex-shrink-0"
              style={{ backgroundColor: "#0a0a0a" }}
              initial={{ x: 288, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 288, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-5 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Statistics
                  </h3>
                  <motion.button
                    onClick={toggleStats}
                    className="p-1.5 hover:bg-gray-900 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {[
                    {
                      label: "Total",
                      value: stats.total,
                      icon: BarChart3,
                      color: "text-blue-400",
                      bg: "bg-blue-500/10",
                    },
                    {
                      label: "Completed",
                      value: stats.completed,
                      icon: CheckCircle2,
                      color: "text-green-400",
                      bg: "bg-green-500/10",
                    },
                    {
                      label: "In Progress",
                      value: stats.inProgress,
                      icon: Clock,
                      color: "text-yellow-400",
                      bg: "bg-yellow-500/10",
                    },
                    {
                      label: "Overdue",
                      value: stats.overdue,
                      icon: AlertCircle,
                      color: "text-red-400",
                      bg: "bg-red-500/10",
                    },
                    {
                      label: "Assigned to Me",
                      value: stats.assignedToMe,
                      icon: Users,
                      color: "text-purple-400",
                      bg: "bg-purple-500/10",
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className={`flex items-center justify-between p-4 ${stat.bg} rounded-xl border border-gray-900`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}
                        >
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-300 font-medium">
                          {stat.label}
                        </span>
                      </div>
                      <span className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Stats Button (when closed) */}
        {!isStatsOpen && (
          <motion.button
            onClick={toggleStats}
            className="fixed right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-900 border-l border-t border-b border-gray-800 rounded-l-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all z-10"
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={applyFilters}
        onClear={clearFilters}
        projects={projects}
      />

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => setIsTaskSidebarOpen(false)}
        task={selectedTask}
        onUpdate={handleTaskSidebarUpdate}
        onDelete={handleTaskDelete}
      />
    </Layout>
  );
};

// Kanban Board Component
const KanbanBoard = ({ tasks, onTaskClick, onTaskMove, currentUser }) => {
  const columns = [
    { id: "todo", title: "To Do", count: 0 },
    { id: "in_progress", title: "In Progress", count: 0 },
    { id: "completed", title: "Completed", count: 0 },
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={onTaskMove}>
      <div className="flex gap-6 h-full">
        {columns.map((column, idx) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className={`flex-1 flex flex-col min-w-[300px] ${
                idx < columns.length - 1 ? "border-r border-gray-900 pr-6" : ""
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  {column.title}
                </h3>
                <span className="px-2 py-1 bg-gray-900 rounded-full text-xs text-gray-500 font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Content - Scrollable */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto overflow-x-hidden space-y-3 p-2 rounded-lg transition-colors scrollbar-hide ${
                      snapshot.isDraggingOver
                        ? "bg-gray-900/50"
                        : "bg-transparent"
                    }`}
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onClick={() => onTaskClick(task)}
                              isDragging={snapshot.isDragging}
                              currentUser={currentUser}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

// Task Card Component
const TaskCard = ({ task, onClick, isDragging, currentUser }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "border-red-900/30";
      case "medium":
        return "border-yellow-900/30";
      case "low":
        return "border-blue-900/30";
      default:
        return "border-gray-900";
    }
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  const isAssignedToMe = task.assignee?._id === currentUser?._id;

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <motion.div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${getPriorityColor(
        task.priority
      )} ${
        isAssignedToMe
          ? "bg-gray-900 border-gray-700"
          : "bg-gray-950 border-gray-900"
      } ${isDragging ? "shadow-2xl rotate-2 scale-105" : "hover:bg-gray-900"}`}
      style={{
        minHeight: "140px",
        maxHeight: "140px",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Title */}
      <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">
        {truncateText(task.title, 60)}
      </h4>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {truncateText(task.description, 80)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-900">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.assignee?.avatar ? (
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="w-5 h-5 rounded-full border border-gray-800"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600" />
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-red-400" : "text-gray-600"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Filter Modal Component
const FilterModal = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onClear,
  projects,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl z-[201] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-900">
              <h2 className="text-lg font-semibold text-white">Filter Tasks</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-900 rounded-lg transition-colors"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={localFilters.status}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Priority
                </label>
                <select
                  value={localFilters.priority}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      priority: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Due Date
                </label>
                <select
                  value={localFilters.dueDate}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Assignee
                </label>
                <select
                  value={localFilters.assignee}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      assignee: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="me">Assigned to Me</option>
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Project
                </label>
                <select
                  value={localFilters.project}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      project: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Projects</option>
                  {projects?.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-900">
              <motion.button
                onClick={() => {
                  onClear();
                  setLocalFilters({
                    status: "all",
                    priority: "all",
                    assignee: "all",
                    project: "all",
                    dueDate: "all",
                  });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear All
              </motion.button>
              <motion.button
                onClick={() => onApply(localFilters)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskBoardPage;
