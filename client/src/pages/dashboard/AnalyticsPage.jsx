import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";
import { Layout } from "../../components/common-afterauth";
import { AuthLoader } from "../../components/loaders";
import {
  analyticsService,
  taskService,
  workspaceService,
} from "../../services";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  CheckCircle2,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { projects } = useProject();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchAnalyticsData();
    }
  }, [currentWorkspace, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch tasks and members for analytics
      const [tasksResponse, membersResponse] = await Promise.all([
        taskService.getWorkspaceTasks(currentWorkspace._id),
        workspaceService.getWorkspaceMembers(currentWorkspace._id),
      ]);

      if (tasksResponse?.success && tasksResponse?.data) {
        setTasks(tasksResponse.data);
      }

      if (membersResponse?.success && membersResponse?.data) {
        setMembers(membersResponse.data);
      }

      // Try to fetch analytics from backend if endpoint exists
      try {
        // Map timeRange to appropriate query param
        const timeRangeMap = {
          week: "7d",
          month: "30d",
          quarter: "90d",
          year: "365d",
        };

        const analyticsResponse = await analyticsService.getWorkspaceAnalytics(
          currentWorkspace._id,
          timeRangeMap[timeRange] || "30d"
        );
        if (analyticsResponse?.success && analyticsResponse?.data) {
          setAnalytics(analyticsResponse.data);
        }
      } catch (error) {
        console.log("Analytics endpoint not available, calculating from tasks");
        // If analytics endpoint doesn't exist, calculate from tasks
        calculateAnalytics(
          tasksResponse?.data || [],
          membersResponse?.data || []
        );
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (taskList, memberList) => {
    // Calculate basic analytics from tasks
    const completedTasks = taskList.filter(
      (t) => t.status === "done" || t.status === "completed"
    );
    const inProgressTasks = taskList.filter((t) => t.status === "in-progress");
    const todoTasks = taskList.filter(
      (t) => t.status === "todo" || t.status === "backlog"
    );

    const stats = {
      totalTasks: taskList.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      todoTasks: todoTasks.length,
      completionRate:
        taskList.length > 0
          ? Math.round((completedTasks.length / taskList.length) * 100)
          : 0,
      totalMembers: memberList.length,
      totalProjects: projects.length,
    };

    setAnalytics(stats);
  };

  const stats = analytics
    ? {
        tasks: {
          value: analytics.totalTasks?.toString() || "0",
          change: "+12.3%",
          trend: "up",
        },
        completed: {
          value: analytics.completedTasks?.toString() || "0",
          change: `${analytics.completionRate || 0}%`,
          trend: "up",
        },
        members: {
          value: analytics.totalMembers?.toString() || "0",
          change: "+8.7%",
          trend: "up",
        },
        projects: {
          value: analytics.totalProjects?.toString() || "0",
          change: "+5.2%",
          trend: "up",
        },
      }
    : {
        tasks: { value: "0", change: "0%", trend: "up" },
        completed: { value: "0", change: "0%", trend: "up" },
        members: { value: "0", change: "0%", trend: "up" },
        projects: { value: "0", change: "0%", trend: "up" },
      };

  // Generate chart data from tasks (simplified for now)
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (5 - i));
    const monthName = monthDate.toLocaleString("default", { month: "short" });

    // Filter tasks completed in this month
    const monthTasks = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const taskDate = new Date(task.completedAt);
      return (
        taskDate.getMonth() === monthDate.getMonth() &&
        taskDate.getFullYear() === monthDate.getFullYear()
      );
    });

    return {
      month: monthName,
      tasks: monthTasks.length,
      hours: monthTasks.length * 4, // Estimated 4 hours per task
    };
  });

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading analytics..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-6 py-6" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Top Actions */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <motion.button
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </motion.button>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              onClick={fetchAnalyticsData}
              className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            <motion.button
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            {
              label: "Total Tasks",
              value: stats.tasks.value,
              icon: Target,
              color: "text-blue-500",
              change: stats.tasks.change,
              trend: stats.tasks.trend,
            },
            {
              label: "Completed Tasks",
              value: stats.completed.value,
              icon: CheckCircle2,
              color: "text-green-500",
              change: stats.completed.change,
              trend: stats.completed.trend,
            },
            {
              label: "Team Members",
              value: stats.members.value,
              icon: Users,
              color: "text-purple-500",
              change: stats.members.change,
              trend: stats.members.trend,
            },
            {
              label: "Active Projects",
              value: stats.projects.value,
              icon: BarChart3,
              color: "text-orange-500",
              change: stats.projects.change,
              trend: stats.projects.trend,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gray-700 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Revenue Trend
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.map((data, index) => (
                  <div
                    key={data.month}
                    className="flex-1 flex flex-col items-center"
                  >
                    <motion.div
                      className="w-full bg-blue-600 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.revenue / 6000) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    />
                    <p className="text-xs text-gray-400 mt-2">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tasks Chart */}
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Task Completion
                </h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.map((data, index) => (
                  <div
                    key={data.month}
                    className="flex-1 flex flex-col items-center"
                  >
                    <motion.div
                      className="w-full bg-green-600 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.tasks / 36) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    />
                    <p className="text-xs text-gray-400 mt-2">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performers */}
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Top Performers
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { name: "John Doe", tasks: 24, avatar: "JD" },
                { name: "Jane Smith", tasks: 20, avatar: "JS" },
                { name: "Mike Johnson", tasks: 18, avatar: "MJ" },
              ].map((member, index) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {member.tasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-500">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Project Status */}
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Project Status
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  {
                    name: "Website Redesign",
                    progress: 75,
                    status: "On Track",
                    color: "bg-green-600",
                  },
                  {
                    name: "Mobile App",
                    progress: 45,
                    status: "In Progress",
                    color: "bg-blue-600",
                  },
                  {
                    name: "API Development",
                    progress: 90,
                    status: "Almost Done",
                    color: "bg-purple-600",
                  },
                  {
                    name: "Marketing Campaign",
                    progress: 30,
                    status: "Starting",
                    color: "bg-orange-600",
                  },
                ].map((project) => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {project.status}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-300">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`${project.color} h-2 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
