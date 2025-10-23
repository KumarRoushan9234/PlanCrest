import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { Layout } from "../../components/common-afterauth";
import { AuthLoader } from "../../components/loaders";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Target,
  Filter,
} from "lucide-react";

const TeamPage = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Mock team data
  const teamMembers = [
    {
      id: 1,
      name: "John Doe",
      role: "Team Lead",
      email: "john@example.com",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      status: "online",
      tasksCompleted: 45,
      hoursLogged: 120,
      performance: 95,
      joinedDate: "Jan 2023",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "Senior Developer",
      email: "jane@example.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      status: "online",
      tasksCompleted: 38,
      hoursLogged: 105,
      performance: 92,
      joinedDate: "Mar 2023",
    },
    {
      id: 3,
      name: "Mike Johnson",
      role: "Designer",
      email: "mike@example.com",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      status: "away",
      tasksCompleted: 32,
      hoursLogged: 95,
      performance: 88,
      joinedDate: "Feb 2023",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      role: "Project Manager",
      email: "sarah@example.com",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      status: "offline",
      tasksCompleted: 40,
      hoursLogged: 110,
      performance: 94,
      joinedDate: "Dec 2022",
    },
    {
      id: 5,
      name: "Alex Brown",
      role: "Developer",
      email: "alex@example.com",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      status: "online",
      tasksCompleted: 35,
      hoursLogged: 98,
      performance: 90,
      joinedDate: "Apr 2023",
    },
    {
      id: 6,
      name: "Emily Davis",
      role: "QA Engineer",
      email: "emily@example.com",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      status: "online",
      tasksCompleted: 42,
      hoursLogged: 115,
      performance: 93,
      joinedDate: "Jan 2023",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading team..." />
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <motion.button
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </motion.button>
          </div>

          <motion.button
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Member</span>
          </motion.button>
        </motion.div>

        {/* Team Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            {
              label: "Total Members",
              value: teamMembers.length,
              icon: Users,
              color: "text-blue-500",
            },
            {
              label: "Online Now",
              value: teamMembers.filter((m) => m.status === "online").length,
              icon: CheckCircle2,
              color: "text-green-500",
            },
            {
              label: "Tasks This Month",
              value: teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0),
              icon: Target,
              color: "text-purple-500",
            },
            {
              label: "Avg Performance",
              value: "92%",
              icon: TrendingUp,
              color: "text-orange-500",
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Team Members Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              {/* Card Header */}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(
                          member.status
                        )} rounded-full border-2 border-gray-800`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  <motion.button
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {member.joinedDate}</span>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Performance</span>
                    <span className="text-xs font-medium text-white">
                      {member.performance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${member.performance}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.05 }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Tasks</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {member.tasksCompleted}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Hours</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {member.hoursLogged}h
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
};

export default TeamPage;
