import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/common-afterauth";
import TaskBoard from "../../components/task-board/TaskBoard";
import TaskFilters from "../../components/task-board/TaskFilters";
import TaskStats from "../../components/task-board/TaskStats";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  Calendar,
  Users,
  Filter,
  RefreshCw,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  Search,
} from "lucide-react";

const TaskBoardPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { projects, currentProject } = useProject();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    project: "all",
    dueDate: "all",
    search: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    assignedToMe: 0,
  });

  // Mock data for demonstration - replace with actual API calls
  const mockTasks = [
    {
      _id: "1",
      title: "Design new landing page",
      description:
        "Create a modern, responsive landing page for the new product launch",
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
      labels: ["design", "frontend"],
      estimatedTime: { value: 8, unit: "hours" },
      actualTime: 0,
      createdBy: user?._id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: "2",
      title: "Implement user authentication",
      description: "Set up secure user authentication with JWT tokens",
      status: "in_progress",
      priority: "medium",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      assignee: {
        _id: "user2",
        name: "Jane Smith",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
      labels: ["backend", "security"],
      estimatedTime: { value: 12, unit: "hours" },
      actualTime: 4,
      createdBy: user?._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      _id: "3",
      title: "Write API documentation",
      description: "Document all API endpoints with examples and use cases",
      status: "completed",
      priority: "low",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj2",
        name: "API Development",
      },
      labels: ["documentation"],
      estimatedTime: { value: 4, unit: "hours" },
      actualTime: 6,
      createdBy: user?._id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      _id: "4",
      title: "Fix responsive layout issues",
      description: "Resolve mobile responsiveness problems on the dashboard",
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days overdue
      assignee: {
        _id: user?._id,
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj1",
        name: "Website Redesign",
      },
      labels: ["bug", "frontend"],
      estimatedTime: { value: 6, unit: "hours" },
      actualTime: 0,
      createdBy: user?._id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      _id: "5",
      title: "Database optimization",
      description: "Optimize database queries for better performance",
      status: "in_progress",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignee: {
        _id: "user3",
        name: "Mike Johnson",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      },
      project: {
        _id: "proj2",
        name: "API Development",
      },
      labels: ["database", "performance"],
      estimatedTime: { value: 16, unit: "hours" },
      actualTime: 8,
      createdBy: user?._id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  // Load tasks when component mounts or workspace changes
  useEffect(() => {
    loadTasks();
  }, [currentWorkspace, currentProject]);

  // Filter tasks when filters change
  useEffect(() => {
    filterTasks();
  }, [tasks, filters]);

  // Calculate stats when tasks change
  useEffect(() => {
    calculateStats();
  }, [filteredTasks, user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTasks(mockTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = useCallback(() => {
    let filtered = [...tasks];

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    // Filter by assignee
    if (filters.assignee === "me") {
      filtered = filtered.filter((task) => task.assignee._id === user?._id);
    } else if (filters.assignee !== "all") {
      filtered = filtered.filter(
        (task) => task.assignee._id === filters.assignee
      );
    }

    // Filter by project
    if (filters.project !== "all") {
      filtered = filtered.filter(
        (task) => task.project._id === filters.project
      );
    }

    // Filter by due date
    if (filters.dueDate === "overdue") {
      filtered = filtered.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "completed"
      );
    } else if (filters.dueDate === "today") {
      const today = new Date();
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
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          new Date(task.dueDate) < nextWeek
      );
    }

    // Filter by search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm) ||
          task.labels.some((label) => label.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filters, user]);

  const calculateStats = useCallback(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = filteredTasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const overdue = filteredTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed"
    ).length;
    const assignedToMe = filteredTasks.filter(
      (task) => task.assignee._id === user?._id
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

  const handleTaskMove = (taskId, newStatus, newPosition) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? { ...task, status: newStatus, position: newPosition }
          : task
      )
    );
  };

  const refreshTasks = () => {
    loadTasks();
  };

  if (loading) {
    return (
      <Layout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#171819" }}
        >
          <LoadingSpinner fullScreen text="Loading tasks..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        style={{ backgroundColor: "#171819" }}
      >
        {/* Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Task Board</h2>
              <p className="text-gray-400">
                Manage and track your tasks across all projects.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                onClick={refreshTasks}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </motion.button>

              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Task</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TaskStats stats={stats} />
        </motion.div>

        {/* Filters Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TaskFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            projects={projects}
            currentWorkspace={currentWorkspace}
          />
        </motion.div>

        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <TaskBoard
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskMove={handleTaskMove}
            currentUser={user}
          />
        </motion.div>
      </div>
    </Layout>
  );
};

export default TaskBoardPage;
