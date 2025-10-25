import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Star,
  ArrowRight,
  User,
  Building2,
  FolderKanban,
  Cloud,
} from "lucide-react";
import {
  FaGoogle,
  FaGithub,
  FaGitlab,
  FaFigma,
  FaSlack,
  FaDropbox,
  FaMicrosoft,
  FaJira,
  FaTrello,
} from "react-icons/fa";
import {
  SiZoom,
  SiGooglecalendar,
  SiGoogledrive,
  SiMixpanel,
} from "react-icons/si";

const IntegrationLandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState("all");

  // Mock data - replace with actual API calls
  const connectedIntegrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      icon: SiGooglecalendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      status: "connected",
      lastSync: "2 minutes ago",
      scope: "personal",
    },
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      status: "connected",
      lastSync: "1 hour ago",
      scope: "workspace",
    },
  ];

  const availableIntegrations = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: SiGoogledrive,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      category: "Storage",
      description: "Store and share files",
      popular: true,
      path: "/integrations/google-drive",
    },
    {
      id: "slack",
      name: "Slack",
      icon: FaSlack,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      category: "Communication",
      description: "Team messaging and collaboration",
      popular: true,
      path: "/integrations/slack",
    },
    {
      id: "figma",
      name: "Figma",
      icon: FaFigma,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      category: "Design",
      description: "Design and prototype tools",
      popular: false,
      path: "/integrations/figma",
    },
    {
      id: "jira",
      name: "Jira",
      icon: FaJira,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      category: "Project Management",
      description: "Issue and project tracking",
      popular: true,
      path: "/integrations/jira",
    },
    {
      id: "aws-s3",
      name: "AWS S3",
      icon: Cloud,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      category: "Storage",
      description: "Enterprise cloud storage solution",
      popular: false,
      path: "/integrations/aws-s3",
    },
  ];

  const stats = [
    {
      label: "Connected",
      value: connectedIntegrations.length,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Available",
      value: availableIntegrations.length,
      icon: Plus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Last Sync",
      value: "2m ago",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Automations",
      value: "12",
      icon: Zap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const scopeFilters = [
    { id: "all", label: "All", icon: Star },
    { id: "personal", label: "Personal", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "project", label: "Project", icon: FolderKanban },
  ];

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-4" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Header */}
        <div className="mb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold text-white mb-1">Integrations</h1>
            <p className="text-gray-400 text-xs">
              Connect your favorite tools and automate your workflow
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, borderColor: "#374151" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div className="flex gap-1.5">
              {scopeFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.id}
                    onClick={() => setSelectedScope(filter.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedScope === filter.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-3 h-3" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Connected Integrations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Connected</h2>
              <span className="text-sm text-gray-400">
                {connectedIntegrations.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connectedIntegrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <motion.div
                    key={integration.id}
                    className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${integration.bgColor}`}
                        >
                          <Icon className={`w-4 h-4 ${integration.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-xs">
                            {integration.name}
                          </h3>
                          <p className="text-xs text-gray-400 capitalize">
                            {integration.scope}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-400">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last sync: {integration.lastSync}</span>
                      <motion.button
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Manage
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Available Integrations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Available</h2>
              <span className="text-sm text-gray-400">
                {availableIntegrations.length} integrations
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableIntegrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <motion.div
                    key={integration.id}
                    className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-all duration-200 cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(integration.path)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${integration.bgColor}`}
                        >
                          <Icon className={`w-4 h-4 ${integration.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-xs">
                            {integration.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {integration.category}
                          </p>
                        </div>
                      </div>
                      {integration.popular && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">
                            Popular
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {integration.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Click to connect
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Integration Scope Info */}
          <div className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-white mb-2">
              Integration Scopes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-400">
              <div className="flex items-start gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                <span>
                  <strong className="text-white">Personal:</strong> Only visible
                  to you
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400 mt-0.5" />
                <span>
                  <strong className="text-white">Workspace:</strong> Shared with
                  workspace members (Admin/Owner only)
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-green-400 mt-0.5" />
                <span>
                  <strong className="text-white">Project:</strong> Specific to
                  individual projects (Admin/Owner only)
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </IntegrationLayout>
  );
};

export default IntegrationLandingPage;
