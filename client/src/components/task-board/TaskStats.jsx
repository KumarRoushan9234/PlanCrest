import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  BarChart3,
  TrendingUp,
  Calendar,
  Target
} from "lucide-react";

const TaskStats = ({ stats }) => {
  const statItems = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: BarChart3,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30"
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30"
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30"
    },
    {
      label: "Assigned to Me",
      value: stats.assignedToMe,
      icon: User,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const overdueRate = stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 transition-all duration-200 hover:border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-white">
                  {item.value}
                </p>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <item.icon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <motion.div
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Completion Rate</span>
            </div>
            <span className="text-xl font-bold text-green-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
        </motion.div>

        {/* Overdue Rate */}
        <motion.div
          className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-gray-300">Overdue Rate</span>
            </div>
            <span className="text-xl font-bold text-red-400">{overdueRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-red-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overdueRate}%` }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskStats;
