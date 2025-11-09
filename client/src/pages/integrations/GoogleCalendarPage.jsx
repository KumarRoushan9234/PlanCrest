import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Settings,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
  User,
  Zap,
  Shield,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import IntegrationSidebar from "../../components/integration/IntegrationSidebar";
import connectorService from "../../services/connectorService";
import AccountSelector from "../../components/integration/AccountSelector";

const GoogleCalendarPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedScope, setSelectedScope] = useState("personal");
  const [connector, setConnector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  const [syncSettings, setSyncSettings] = useState({
    syncDirection: "bidirectional",
    syncFrequency: "15",
    syncPastEvents: false,
    syncFutureEvents: true,
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
      icon: Calendar,
      description: "Specific to a project",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      requiresAdmin: true,
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: "Event Sync",
      description:
        "Automatically sync events between Google Calendar and PlanCrest",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description:
        "Get instant notifications when events are created or modified",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Share calendars with team members and collaborate seamlessly",
    },
    {
      icon: Zap,
      title: "Smart Scheduling",
      description: "AI-powered scheduling suggestions based on availability",
    },
  ];

  const stats = [
    {
      label: "Events Synced",
      value: "124",
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      label: "Last Sync",
      value: "2m ago",
      icon: RefreshCw,
      color: "text-green-500",
    },
    { label: "Calendars", value: "3", icon: Users, color: "text-purple-500" },
    { label: "Upcoming", value: "12", icon: Clock, color: "text-orange-500" },
  ];

  // Fetch connector status
  const fetchConnector = async () => {
    try {
      setLoading(true);
      const { connectors } = await connectorService.getAllConnectors(
        selectedScope,
        null
      );
      const calendarConnector = connectors?.find(
        (c) => c.type === "google_calendar"
      );

      if (calendarConnector) {
        setIsConnected(true);
        setConnector(calendarConnector);
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
      // Remove query params
      window.history.replaceState({}, "", "/connectors/google-calendar");
    } else if (error === "true") {
      alert("Failed to connect Google Calendar. Please try again.");
      window.history.replaceState({}, "", "/connectors/google-calendar");
    }
  }, [searchParams]);

  // Fetch connector on mount and when scope changes
  useEffect(() => {
    fetchConnector();
  }, [selectedScope]);

  const handleConnect = async () => {
    try {
      console.log("Connecting to Google Calendar with scope:", selectedScope);
      const response = await connectorService.connectGoogleCalendar(
        selectedScope,
        null
      );

      // Redirect to OAuth URL
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch (error) {
      console.error("Error connecting Google Calendar:", error);
      alert("Failed to initiate connection. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }

    try {
      if (connector) {
        await connectorService.deleteConnector(connector._id);
        setIsConnected(false);
        setConnector(null);
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      alert("Failed to disconnect. Please try again.");
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      console.log("Syncing calendar...");
      const response = await connectorService.syncGoogleCalendar(
        selectedScope,
        null
      );

      if (response.success) {
        setSyncStats(response.stats);

        // Show success message with stats
        const message =
          `✅ Sync Complete!\n\n` +
          `📥 Imported: ${response.stats.imported} events\n` +
          `🔄 Updated: ${response.stats.updated} events\n` +
          `📤 Exported: ${response.stats.exported} events\n` +
          `📊 Total: ${response.stats.total} events`;

        alert(message);

        // Refresh connector data
        await fetchConnector();
      }
    } catch (error) {
      console.error("Error syncing calendar:", error);
      alert(
        `❌ Failed to sync calendar:\n${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setSyncing(false);
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
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <SiGooglecalendar className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  Google Calendar
                </h1>
                <p className="text-gray-400 text-xs">
                  Sync your calendar events and manage schedules seamlessly
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
                    Productivity
                  </span>
                </div>
              </div>
            </div>

            {isConnected && (
              <motion.button
                onClick={handleSyncNow}
                disabled={syncing}
                className={`px-3 py-1.5 ${
                  syncing
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-lg text-xs font-medium flex items-center gap-1.5`}
                whileHover={syncing ? {} : { scale: 1.05 }}
                whileTap={syncing ? {} : { scale: 0.95 }}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Syncing..." : "Sync Now"}
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
                    <div className="p-1.5 rounded-lg bg-gray-800/50">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
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
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-3">
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
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Icon className="w-6 h-6 text-blue-500" />
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
                Connect Google Calendar
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

              {/* Security Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Secure Connection
                    </h4>
                    <p className="text-sm text-gray-400">
                      We use OAuth 2.0 for secure authentication. Your
                      credentials are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <motion.button
                onClick={handleConnect}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LinkIcon className="w-5 h-5" />
                Connect Google Calendar
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Connected - Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sync Settings */}
              <div className="lg:col-span-2 space-y-6">
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
                    {/* Sync Direction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">
                        Sync Direction
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["bidirectional", "to_external", "to_internal"].map(
                          (direction) => (
                            <button
                              key={direction}
                              onClick={() =>
                                setSyncSettings({
                                  ...syncSettings,
                                  syncDirection: direction,
                                })
                              }
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                syncSettings.syncDirection === direction
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                              }`}
                            >
                              {direction === "bidirectional"
                                ? "Both Ways"
                                : direction === "to_external"
                                ? "To Google"
                                : "From Google"}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Sync Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">
                        Sync Frequency
                      </label>
                      <select
                        value={syncSettings.syncFrequency}
                        onChange={(e) =>
                          setSyncSettings({
                            ...syncSettings,
                            syncFrequency: e.target.value,
                          })
                        }
                        className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                        <option value="60">Every hour</option>
                        <option value="manual">Manual only</option>
                      </select>
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
                              Sync Past Events
                            </p>
                            <p className="text-xs text-gray-400">
                              Include events from the past
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSyncSettings({
                                ...syncSettings,
                                syncPastEvents: !syncSettings.syncPastEvents,
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              syncSettings.syncPastEvents
                                ? "bg-purple-600"
                                : "bg-gray-700"
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                              animate={{
                                x: syncSettings.syncPastEvents ? 24 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Sync Future Events
                            </p>
                            <p className="text-xs text-gray-400">
                              Include upcoming events
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSyncSettings({
                                ...syncSettings,
                                syncFutureEvents:
                                  !syncSettings.syncFutureEvents,
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              syncSettings.syncFutureEvents
                                ? "bg-purple-600"
                                : "bg-gray-700"
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                              animate={{
                                x: syncSettings.syncFutureEvents ? 24 : 0,
                              }}
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
                    {[
                      {
                        action: "Event synced",
                        event: "Team Meeting",
                        time: "2 minutes ago",
                      },
                      {
                        action: "Event created",
                        event: "Project Review",
                        time: "1 hour ago",
                      },
                      {
                        action: "Event updated",
                        event: "Client Call",
                        time: "3 hours ago",
                      },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div>
                            <p className="text-sm text-white font-medium">
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-400">
                              {activity.event}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Connection Info & Actions */}
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
                        {connector?.metadata?.userInfo?.email || connector?.config?.email || "N/A"}
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
                      disabled={syncing}
                      className={`w-full py-2 ${
                        syncing
                          ? "bg-blue-600/50 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded-lg font-medium flex items-center justify-center gap-2`}
                      whileHover={syncing ? {} : { scale: 1.02 }}
                      whileTap={syncing ? {} : { scale: 0.98 }}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                      />
                      {syncing ? "Syncing Calendar..." : "Sync Now"}
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

export default GoogleCalendarPage;
