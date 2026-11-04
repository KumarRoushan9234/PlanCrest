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
import { CreateTaskModal } from "../modals";
import TaskSidebar from "../sidebar/TaskSidebar";

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


  const handleTaskCreated = () => {
    fetchTasks();
    setIsCreateModalOpen(false);
  };

  const handleTaskUpdated = (updatedTask) => {
    console.log("📝 Task updated from sidebar:", updatedTask);
    // If updatedTask is null, it means sidebar is closing, so refresh
    if (updatedTask === null) {
      console.log("🔄 Refreshing tasks list after sidebar close");
      setTimeout(() => {
        fetchTasks();
      }, 500);
    } else {
      // Update the task in the list immediately
      setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    }
  };

  const handleTaskDeleted = (taskId) => {
    console.log("🗑️  Task deleted:", taskId);
    fetchTasks();
    setIsTaskModalOpen(false);
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await projectService.updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
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

  return (
    <div className="space-y-3">
      {/* Header - SMALLER & DARKER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Tasks</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Manage and track project tasks
          </p>
        </div>
        {isAdmin && (
          <motion.button
            onClick={handleCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-xs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </motion.button>
        )}
      </div>

      {/* Search and Filters - SMALLER & DARKER */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white focus:border-blue-600 focus:outline-none transition-colors"
        >
          <option value="all">All Status</option>
          <option value="to-do">To Do</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tasks List - SMALLER & DARKER */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <motion.div
              key={task._id}
              onClick={() => handleTaskClick(task)}
              className="bg-gradient-to-r from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3 hover:border-gray-700 hover:from-black/80 hover:to-gray-900/60 transition-all cursor-pointer group"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskStatusChange(
                      task._id,
                      task.status === "done" ? "to-do" : "done"
                    );
                  }}
                  className="flex-shrink-0"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600 group-hover:text-gray-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-xs font-semibold ${
                      task.status === "done"
                        ? "line-through text-gray-600"
                        : "text-white"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-600">
                    {task.assignedTo && (
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        Assigned
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      task.priority === "high"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : task.priority === "medium"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        project={project}
        onSuccess={handleTaskCreated}
      />

      {/* Task Sidebar */}
      {selectedTask && (
        <TaskSidebar
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          project={project}
          onUpdate={handleTaskUpdated}
          onDelete={handleTaskDeleted}
        />
      )}
    </div>
  );
};

export default TasksPanel;
