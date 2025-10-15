import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";
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
} from "lucide-react";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from your backend
  const stats = [
    {
      name: "Total Clients",
      value: user?.totalProspectsFetched || 0,
      icon: Users,
      change: "+12%",
      changeType: "positive",
    },
    {
      name: "Emails Sent",
      value: user?.totalProspectsMailed || 0,
      icon: Mail,
      change: "+8%",
      changeType: "positive",
    },
    {
      name: "Active Projects",
      value: user?.totalProject || 0,
      icon: Target,
      change: "+3%",
      changeType: "positive",
    },
    {
      name: "Revenue",
      value: "$12,345",
      icon: DollarSign,
      change: "+15%",
      changeType: "positive",
    },
  ];

  const recentClients = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      company: "Tech Corp",
      status: "Active",
      lastContact: "2 days ago",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      company: "Design Studio",
      status: "Pending",
      lastContact: "1 week ago",
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      company: "StartupXYZ",
      status: "Active",
      lastContact: "3 days ago",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      company: "Marketing Pro",
      status: "Inactive",
      lastContact: "2 weeks ago",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "New client added",
      client: "John Smith",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      action: "Email sent",
      client: "Sarah Johnson",
      time: "4 hours ago",
      type: "info",
    },
    {
      id: 3,
      action: "Project updated",
      client: "Mike Chen",
      time: "1 day ago",
      type: "warning",
    },
    {
      id: 4,
      action: "Meeting scheduled",
      client: "Emily Davis",
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
      case "Inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "info":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "warning":
        return <Settings className="w-4 h-4 text-yellow-500" />;
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
            Welcome back, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-gray-400">
            Here's what's happening with your clients today.
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
          {/* Recent Clients */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Clients
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {recentClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {client.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {client.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {client.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              client.status
                            )}`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {client.lastContact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-400 hover:text-blue-300 p-1 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-300 p-1 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-300 p-1 rounded">
                              <MoreVertical className="w-4 h-4" />
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

          {/* Recent Activity */}
          <div>
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
                        <p className="text-sm text-gray-400">
                          {activity.client}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Client
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email Campaign
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
