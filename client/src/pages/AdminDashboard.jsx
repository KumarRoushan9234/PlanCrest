/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/common-afterauth";
import {
  Users,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  Shield,
  UserCheck,
  UserX,
  Activity,
  Database,
  Server,
  Globe,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from your backend
  const stats = [
    {
      name: "Total Users",
      value: "1,234",
      icon: Users,
      change: "+12%",
      changeType: "positive",
    },
    {
      name: "Active Sessions",
      value: "456",
      icon: Activity,
      change: "+8%",
      changeType: "positive",
    },
    {
      name: "Revenue",
      value: "$45,678",
      icon: DollarSign,
      change: "+15%",
      changeType: "positive",
    },
    {
      name: "System Health",
      value: "99.9%",
      icon: Server,
      change: "+0.1%",
      changeType: "positive",
    },
  ];

  const recentUsers = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: "user",
      status: "Active",
      joinDate: "2 days ago",
      lastLogin: "1 hour ago",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "admin",
      status: "Active",
      joinDate: "1 week ago",
      lastLogin: "2 hours ago",
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      role: "user",
      status: "Pending",
      joinDate: "3 days ago",
      lastLogin: "Never",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: "user",
      status: "Suspended",
      joinDate: "2 weeks ago",
      lastLogin: "1 week ago",
    },
  ];

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      message: "High CPU usage detected",
      time: "5 minutes ago",
      severity: "medium",
    },
    {
      id: 2,
      type: "info",
      message: "Database backup completed",
      time: "1 hour ago",
      severity: "low",
    },
    {
      id: 3,
      type: "error",
      message: "Failed login attempts exceeded",
      time: "2 hours ago",
      severity: "high",
    },
    {
      id: 4,
      type: "success",
      message: "New user registration",
      time: "3 hours ago",
      severity: "low",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "User created",
      user: "John Smith",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      action: "System backup",
      user: "System",
      time: "4 hours ago",
      type: "info",
    },
    {
      id: 3,
      action: "User suspended",
      user: "Emily Davis",
      time: "1 day ago",
      type: "warning",
    },
    {
      id: 4,
      action: "Database updated",
      user: "System",
      time: "2 days ago",
      type: "info",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "user":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "success":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "info":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ backgroundColor: "#171819" }}
      >
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-400">
            Monitor and manage your ClientFlow platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <stat.icon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm font-medium">
                  {stat.change}
                </span>
                <span className="text-gray-400 text-sm ml-1">
                  from last month
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users Management */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    User Management
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {recentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              user.status
                            )}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.lastLogin}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-400 hover:text-blue-300 p-1 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-300 p-1 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-400 hover:text-red-300 p-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Alerts & Activity */}
          <div className="space-y-6">
            {/* System Alerts */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  System Alerts
                </h3>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 ${getAlertColor(alert.type)}`}
                      >
                        {alert.type === "error" && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {alert.type === "warning" && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {alert.type === "info" && (
                          <Database className="w-4 h-4" />
                        )}
                        {alert.type === "success" && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">
                  Recent Activity
                </h3>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-sm text-gray-400">{activity.user}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New User
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <Shield className="w-4 h-4 mr-2" />
                  System Settings
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <Database className="w-4 h-4 mr-2" />
                  Database Tools
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
