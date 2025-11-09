import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import connectorService from "../../services/connectorService";
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
  SiGmail,
  SiGooglemeet,
  SiMixpanel,
} from "react-icons/si";

const IntegrationLandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState("personal");
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mapping for connector types to display info
  const connectorTypeMap = {
    google_calendar: {
      name: "Google Calendar",
      icon: SiGooglecalendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      path: "/connectors/google-calendar",
    },
    github: {
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      path: "/connectors/github",
    },
    google_drive: {
      name: "Google Drive",
      icon: SiGoogledrive,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      path: "/connectors/google-drive",
    },
    google_meet: {
      name: "Google Meet",
      icon: SiGooglemeet,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      path: "/connectors/google-meet",
    },
    gmail: {
      name: "Gmail",
      icon: SiGmail,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      path: "/connectors/gmail",
    },
  };

  // Fetch connected integrations
  useEffect(() => {
    fetchConnectors();
  }, [selectedScope]);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const scope = selectedScope === "all" ? "personal" : selectedScope;
      const { connectors } = await connectorService.getAllConnectors(
        scope,
        null
      );

      const mapped = connectors.map((connector) => {
        const typeInfo = connectorTypeMap[connector.type] || {
          name: connector.name || connector.type,
          icon: Cloud,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          path: `/connectors/${connector.type}`,
        };

        return {
          id: connector._id,
          type: connector.type,
          name: typeInfo.name,
          icon: typeInfo.icon,
          color: typeInfo.color,
          bgColor: typeInfo.bgColor,
          status: connector.status,
          lastSync: connector.metadata?.lastSync
            ? new Date(connector.metadata.lastSync).toLocaleString()
            : "Never",
          scope: connector.scope,
          path: typeInfo.path,
          email: connector.metadata?.userInfo?.email || connector.config?.email,
        };
      });

      setConnectedIntegrations(mapped);
    } catch (error) {
      console.error("Error fetching connectors:", error);
      setConnectedIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const availableIntegrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      icon: SiGooglecalendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      category: "Productivity",
      description: "Sync events and manage schedules",
      popular: true,
      path: "/connectors/google-calendar",
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: SiGoogledrive,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      category: "Storage",
      description: "Store and share files",
      popular: true,
      path: "/connectors/google-drive",
    },
    {
      id: "google-meet",
      name: "Google Meet",
      icon: SiGooglemeet,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      category: "Communication",
      description: "Video conferencing and meetings",
      popular: true,
      path: "/connectors/google-meet",
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: SiGmail,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      category: "Communication",
      description: "Email management and automation",
      popular: true,
      path: "/connectors/gmail",
    },
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      category: "Development",
      description: "Version control and code collaboration",
      popular: true,
      path: "/connectors/github",
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

  // Filter out already connected integrations
  const connectedTypes = connectedIntegrations.map((c) => c.type);
  const filteredAvailable = availableIntegrations.filter(
    (integration) => !connectedTypes.includes(integration.id.replace(/-/g, "_"))
  );

  // Get most recent sync time
  const getMostRecentSync = () => {
    if (connectedIntegrations.length === 0) return "Never";
    const mostRecent = connectedIntegrations.reduce((latest, current) => {
      if (!current.lastSync || current.lastSync === "Never") return latest;
      if (!latest || latest === "Never") return current.lastSync;
      const currentTime = new Date(current.lastSync).getTime();
      const latestTime = new Date(latest).getTime();
      return currentTime > latestTime ? current.lastSync : latest;
    }, null);

    if (!mostRecent || mostRecent === "Never") return "Never";
    const timeDiff = Date.now() - new Date(mostRecent).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

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
      value: filteredAvailable.length,
      icon: Plus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Last Sync",
      value: getMostRecentSync(),
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Scope",
      value: selectedScope.charAt(0).toUpperCase() + selectedScope.slice(1),
      icon:
        selectedScope === "personal"
          ? User
          : selectedScope === "workspace"
          ? Building2
          : FolderKanban,
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
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Loading connections...</p>
              </div>
            ) : connectedIntegrations.length === 0 ? (
              <div className="col-span-full text-center py-8 bg-gray-900/20 rounded-lg border border-dashed border-gray-700">
                <p className="text-sm text-gray-400 mb-2">
                  No integrations connected yet
                </p>
                <p className="text-xs text-gray-500">
                  Connect your first integration below
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {connectedIntegrations.map((integration, index) => {
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
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white text-xs">
                              {integration.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {integration.email || integration.scope}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {integration.lastSync !== "Never"
                            ? `Synced ${integration.lastSync}`
                            : "Never synced"}
                        </span>
                        <span className="text-purple-400 capitalize px-2 py-0.5 bg-purple-500/10 rounded">
                          {integration.scope}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Integrations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Available</h2>
              <span className="text-sm text-gray-400">
                {filteredAvailable.length} integrations
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAvailable.map((integration, index) => {
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
