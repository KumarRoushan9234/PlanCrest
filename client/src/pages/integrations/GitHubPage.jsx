import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  GitBranch,
  CheckCircle2,
  Clock,
  Settings,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
  User,
  Shield,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitPullRequest,
  AlertTriangle,
  Code,
  Star,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import IntegrationSidebar from "../../components/integration/IntegrationSidebar";
import connectorService from "../../services/connectorService";

const GitHubPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedScope, setSelectedScope] = useState("personal");
  const [connector, setConnector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncSettings, setSyncSettings] = useState({
    syncIssues: true,
    syncPullRequests: true,
    syncCommits: false,
    webhookEnabled: true,
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const scopeOptions = [
    {
      id: "personal",
      label: "Personal",
      icon: User,
      description: "Only you can access this integration",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: Building2,
      description: "Available to all workspace members",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      requiresAdmin: true,
    },
    {
      id: "project",
      label: "Project",
      icon: GitBranch,
      description: "Specific to a project",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      requiresAdmin: true,
    },
  ];

  const features = [
    {
      icon: GitPullRequest,
      title: "Pull Request Tracking",
      description: "Track and manage pull requests directly from PlanCrest",
    },
    {
      icon: AlertTriangle,
      title: "Issue Management",
      description: "Sync GitHub issues with your project tasks",
    },
    {
      icon: GitCommit,
      title: "Commit History",
      description: "View commit history and link commits to tasks",
    },
    {
      icon: RefreshCw,
      title: "Real-time Webhooks",
      description: "Get instant notifications for repository events",
    },
  ];

  const stats = [
    { label: "Repositories", value: "12", icon: Code, color: "text-blue-500" },
    {
      label: "Pull Requests",
      value: "8",
      icon: GitPullRequest,
      color: "text-green-500",
    },
    {
      label: "Open Issues",
      value: "24",
      icon: AlertTriangle,
      color: "text-orange-500",
    },
    {
      label: "Commits Today",
      value: "47",
      icon: GitCommit,
      color: "text-purple-500",
    },
  ];

  const recentActivity = [
    {
      type: "pull_request",
      title: "Feature: Add dark mode support",
      repo: "plancrest/frontend",
      author: "john-doe",
      time: "10 minutes ago",
      status: "open",
    },
    {
      type: "issue",
      title: "Bug: Login form validation",
      repo: "plancrest/backend",
      author: "jane-smith",
      time: "1 hour ago",
      status: "open",
    },
    {
      type: "commit",
      title: "Fix: Update dependencies",
      repo: "plancrest/api",
      author: "dev-team",
      time: "3 hours ago",
      status: "merged",
    },
  ];

  const repositories = [
    {
      name: "plancrest/frontend",
      stars: 124,
      language: "React",
      private: false,
    },
    {
      name: "plancrest/backend",
      stars: 89,
      language: "Node.js",
      private: false,
    },
    { name: "plancrest/api", stars: 56, language: "Python", private: true },
  ];

  // Fetch connector status
  const fetchConnector = async () => {
    try {
      setLoading(true);
      const { connectors } = await connectorService.getAllConnectors(selectedScope, null);
      const githubConnector = connectors?.find((c) => c.type === "github");

      if (githubConnector) {
        setIsConnected(true);
        setConnector(githubConnector);
      } else {
        setIsConnected(false);
        setConnector(null);
      }
    } catch (error) {
      console.error("Error fetching connector:", error);
      setIsConnected(false);
      setConnector(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setIsConnected(true);
      fetchConnector();
      window.history.replaceState({}, "", "/connectors/github");
    } else if (error === "true") {
      alert("Failed to connect GitHub. Please try again.");
      window.history.replaceState({}, "", "/connectors/github");
    }
  }, [searchParams]);

  // Fetch connector on mount and when scope changes
  useEffect(() => {
    fetchConnector();
  }, [selectedScope]);

  const handleConnect = async () => {
    try {
      console.log("Connecting to GitHub with scope:", selectedScope);
      await connectorService.connectGitHub(selectedScope, null);
      await fetchConnector();
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      alert("Failed to initiate connection. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub?")) {
      return;
    }

    try {
      if (connector) {
        await connectorService.deleteConnector(connector._id);
      setIsConnected(false);
        setConnector(null);
        alert("GitHub disconnected successfully");
      }
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      alert("Failed to disconnect. Please try again.");
    }
  };

  const handleSyncNow = async () => {
    try {
      console.log("Syncing GitHub data...");
      const result = await connectorService.getGitHubRepositories(selectedScope, null);
      console.log("Repositories synced:", result);
    } catch (error) {
      console.error("Error syncing GitHub data:", error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "pull_request":
        return GitPullRequest;
      case "issue":
        return AlertTriangle;
      case "commit":
        return GitCommit;
      default:
        return Code;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "pull_request":
        return "text-green-500";
      case "issue":
        return "text-orange-500";
      case "commit":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-4" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/connectors")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Back to Integrations</span>
        </motion.button>

        {/* Header */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-xl">
                <FaGithub className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">GitHub</h1>
                <p className="text-gray-400 text-xs">
                  Sync repositories, issues, and pull requests seamlessly
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {isConnected ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-green-500 font-medium">
                        Connected
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      <span className="text-xs text-gray-400 font-medium">
                        Not Connected
                      </span>
                    </div>
                  )}
                  <span className="px-2 py-0.5 bg-blue-500/20 rounded-full text-xs text-blue-400 font-medium">
                    Development
                  </span>
                </div>
              </div>
            </div>

            {isConnected && (
              <motion.button
                onClick={handleSyncNow}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Now
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Stats - Only show when connected */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, borderColor: "#374151" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isConnected ? (
          <>
            {/* Features */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Key Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, borderColor: "#374151" }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Connection Setup */}
            <motion.div
              className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">
                Connect GitHub
              </h2>

              {/* Scope Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Integration Scope
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scopeOptions.map((scope) => {
                    const Icon = scope.icon;
                    return (
                      <motion.button
                        key={scope.id}
                        onClick={() => setSelectedScope(scope.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          selectedScope === scope.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={scope.requiresAdmin}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${scope.bgColor}`}>
                            <Icon className={`w-5 h-5 ${scope.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">
                              {scope.label}
                            </h3>
                            {scope.requiresAdmin && (
                              <span className="text-xs text-orange-400">
                                Admin Only
                              </span>
                            )}
                          </div>
                          {selectedScope === scope.id && (
                            <CheckCircle2 className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {scope.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Notice */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Required Permissions
                    </h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Read repository metadata and content</li>
                      <li>• Read and write issues and pull requests</li>
                      <li>• Receive webhook notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <motion.button
                onClick={handleConnect}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LinkIcon className="w-5 h-5" />
                Connect GitHub
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Connected - Settings and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sync Settings */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                      Sync Settings
                    </h2>
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="space-y-6">
                    {/* Sync Options */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Sync Issues
                          </p>
                          <p className="text-xs text-gray-400">
                            Automatically sync GitHub issues
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSyncSettings({
                              ...syncSettings,
                              syncIssues: !syncSettings.syncIssues,
                            })
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                            syncSettings.syncIssues
                              ? "bg-purple-600"
                              : "bg-gray-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                            animate={{ x: syncSettings.syncIssues ? 24 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Sync Pull Requests
                          </p>
                          <p className="text-xs text-gray-400">
                            Track pull requests in real-time
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSyncSettings({
                              ...syncSettings,
                              syncPullRequests: !syncSettings.syncPullRequests,
                            })
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                            syncSettings.syncPullRequests
                              ? "bg-purple-600"
                              : "bg-gray-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                            animate={{
                              x: syncSettings.syncPullRequests ? 24 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Webhook Notifications
                          </p>
                          <p className="text-xs text-gray-400">
                            Get instant updates via webhooks
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setSyncSettings({
                              ...syncSettings,
                              webhookEnabled: !syncSettings.webhookEnabled,
                            })
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                            syncSettings.webhookEnabled
                              ? "bg-purple-600"
                              : "bg-gray-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                            animate={{
                              x: syncSettings.webhookEnabled ? 24 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <button
                      onClick={() =>
                        setShowAdvancedSettings(!showAdvancedSettings)
                      }
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
                    >
                      {showAdvancedSettings ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      Advanced Settings
                    </button>

                    {/* Advanced Settings */}
                    {showAdvancedSettings && (
                      <motion.div
                        className="space-y-4 pt-4 border-t border-gray-800"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Sync Commits
                            </p>
                            <p className="text-xs text-gray-400">
                              Track commit history
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSyncSettings({
                                ...syncSettings,
                                syncCommits: !syncSettings.syncCommits,
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              syncSettings.syncCommits
                                ? "bg-purple-600"
                                : "bg-gray-700"
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                              animate={{ x: syncSettings.syncCommits ? 24 : 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Save Button */}
                  <motion.button
                    className="w-full mt-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save Settings
                  </motion.button>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    Recent Activity
                  </h2>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => {
                      const Icon = getActivityIcon(activity.type);
                      const color = getActivityColor(activity.type);
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-3 px-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className={`p-2 bg-gray-800 rounded-lg`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium mb-1">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{activity.repo}</span>
                              <span>•</span>
                              <span>{activity.author}</span>
                              <span>•</span>
                              <span>{activity.time}</span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              activity.status === "open"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-purple-500/20 text-purple-500"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Repositories */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    Connected Repositories
                  </h2>
                  <div className="space-y-3">
                    {repositories.map((repo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 px-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Code className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              {repo.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {repo.language}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {repo.private && (
                            <span className="px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-400">
                              Private
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-gray-400">
                              {repo.stars}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg font-bold text-white mb-4">
                    Connection Info
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Account</p>
                      <p className="text-sm text-white font-medium">
                        {connector?.metadata?.userInfo?.username || connector?.config?.username || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Scope</p>
                      <p className="text-sm text-white font-medium capitalize">
                        {selectedScope}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Connected</p>
                      <p className="text-sm text-white font-medium">
                        {connector?.metadata?.connectedAt
                          ? new Date(connector.metadata.connectedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-sm text-green-500 font-medium">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <motion.button
                      onClick={handleSyncNow}
                      className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </motion.button>
                    <motion.button
                      className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Code className="w-4 h-4" />
                      View Repositories
                    </motion.button>
                    <motion.button
                      onClick={handleDisconnect}
                      className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg font-medium flex items-center justify-center gap-2 border border-red-500/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Unlink className="w-4 h-4" />
                      Disconnect
                    </motion.button>
                  </div>
                </motion.div>

                {/* Help */}
                <motion.div
                  className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <AlertCircle className="w-6 h-6 text-purple-400 mb-3" />
                  <h4 className="text-sm font-semibold text-white mb-2">
                    Need Help?
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">
                    Check our documentation for setup guides and
                    troubleshooting.
                  </p>
                  <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                    View Documentation →
                  </button>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </IntegrationLayout>
  );
};

export default GitHubPage;
