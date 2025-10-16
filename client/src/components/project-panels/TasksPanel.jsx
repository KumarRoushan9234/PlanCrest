import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { CreateTaskModal, TaskDetailsModal } from "../modals";

const TasksPanel = ({ project, isAdmin }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (project?._id) {
      fetchTasks();
    }
  }, [project?._id]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectTasks(project._id);
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
  };

  const handleTaskCreated = () => {
    fetchTasks();
    setIsCreateModalOpen(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Create Task Button - Only for Admin */}
        {isAdmin && (
          <motion.button
            onClick={handleCreateTask}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </motion.button>
        )}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm || filterStatus !== "all"
              ? "No tasks found"
              : "No tasks yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter"
              : "Start by creating your first task for this project"}
          </p>
          {isAdmin && !searchTerm && filterStatus === "all" && (
            <button
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Task Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(task.status)}
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">
                          {task.title}
                        </h4>
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(
                            task.priority
                          )}`}
                        ></div>
                      </div>
                      {task.description && (
                        <p className="text-gray-400 text-sm truncate mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.assignedTo && task.assignedTo.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{task.assignedTo.length}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {
                                task.subtasks.filter((st) => st.completed)
                                  .length
                              }
                              /{task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        project={project}
        onSuccess={handleTaskCreated}
      />

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={selectedTask}
          project={project}
          isCreating={false}
          isAdmin={isAdmin}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default TasksPanel;
