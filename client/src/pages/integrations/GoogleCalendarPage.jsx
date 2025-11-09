import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  FileText,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import connectorService from "../../services/connectorService";
import { calendarService } from "../../services";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const GoogleCalendarPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();

  const [isConnected, setIsConnected] = useState(false);
  const [selectedScope, setSelectedScope] = useState("personal");
  const [connector, setConnector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [syncSettings, setSyncSettings] = useState({
    syncDirection: "bidirectional",
    syncFrequency: "15",
    syncPastEvents: false,
    syncFutureEvents: true,
  });
  const [showSyncSettings, setShowSyncSettings] = useState(false);

  const scopeOptions = [
    {
      id: "personal",
      label: "Personal",
      icon: User,
      description: "Only you can access",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: Building2,
      description: "All workspace members",
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
      description: "Auto-sync events between Google Calendar and PlanCrest",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Instant notifications when events are created or modified",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share calendars with team members seamlessly",
    },
    {
      icon: Zap,
      title: "Smart Scheduling",
      description: "AI-powered scheduling based on availability",
    },
  ];

  // Calculate real stats from connector data
  const calculateStats = () => {
    if (!connector) return [];

    const lastSync = connector.metadata?.lastSync
      ? new Date(connector.metadata.lastSync)
      : null;

    const timeAgo = lastSync
      ? `${Math.floor((Date.now() - lastSync.getTime()) / 60000)}m ago`
      : "Never";

    return [
      {
        label: "Events Synced",
        value: connector.metadata?.stats?.syncedEvents?.toString() || "0",
        icon: Calendar,
        color: "text-blue-500",
      },
      {
        label: "Last Sync",
        value: timeAgo,
        icon: RefreshCw,
        color: "text-green-500",
      },
      {
        label: "Calendars",
        value: connector.metadata?.stats?.calendars?.toString() || "1",
        icon: Users,
        color: "text-purple-500",
      },
      {
        label: "Status",
        value: connector.status === "active" ? "Active" : "Inactive",
        icon: CheckCircle2,
        color:
          connector.status === "active" ? "text-green-500" : "text-gray-500",
      },
    ];
  };

  const stats = calculateStats();

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

  // Fetch recent activity from calendar events
  const fetchRecentActivity = async (showAll = false) => {
    if (!currentWorkspace?._id) return;

    try {
      setLoadingActivity(true);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await calendarService.getEvents(currentWorkspace._id, {
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      });

      if (response?.success && response?.data) {
        // Sort by creation/update time
        const sortedEvents = response.data
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.startDate) -
              new Date(a.createdAt || a.startDate)
          )
          .slice(0, showAll ? undefined : 5);

        const formattedActivity = sortedEvents.map((event) => ({
          action: event.lastEditedBy ? "Event updated" : "Event created",
          event: event.title,
          time: formatTimeAgo(event.createdAt || event.startDate),
          category: event.category,
          id: event._id,
        }));

        setRecentActivity(formattedActivity);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Check for OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setIsConnected(true);
      fetchConnector();
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

  // Fetch recent activity when connected
  useEffect(() => {
    if (isConnected && currentWorkspace?._id) {
      fetchRecentActivity(showAllActivity);
    }
  }, [isConnected, currentWorkspace, showAllActivity]);

  const handleConnect = async () => {
    try {
      console.log("Connecting to Google Calendar with scope:", selectedScope);
      const response = await connectorService.connectGoogleCalendar(
        selectedScope,
        null
      );

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
        setRecentActivity([]);
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      alert("Failed to disconnect. Please try again.");
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const response = await connectorService.syncGoogleCalendar(
        selectedScope,
        null
      );

      if (response.success) {
        setSyncStats(response.stats);

        const message =
          `✅ Sync Complete!\n\n` +
          `📥 Imported: ${response.stats.imported} events\n` +
          `🔄 Updated: ${response.stats.updated} events\n` +
          `📤 Exported: ${response.stats.exported} events\n` +
          `📊 Total: ${response.stats.total} events`;

        alert(message);
        await fetchConnector();
        await fetchRecentActivity(showAllActivity);
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

  const handleViewAllActivity = () => {
    navigate("/calendar");
  };

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-3" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/connectors")}
          className="flex items-center gap-1 text-gray-400 hover:text-white mb-3 transition-colors duration-200"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="text-xs font-medium">Back</span>
        </motion.button>

        {/* Header */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <SiGooglecalendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">
                  Google Calendar
                </h1>
                <p className="text-gray-400 text-[10px]">
                  Sync calendar events and manage schedules
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {isConnected ? (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] text-green-500 font-medium">
                        Connected
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-800 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-gray-500" />
                      <span className="text-[9px] text-gray-400 font-medium">
                        Not Connected
                      </span>
                    </div>
                  )}
                  <span className="px-1.5 py-0.5 bg-blue-500/20 rounded-full text-[9px] text-blue-400 font-medium">
                    Productivity
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected && (
                <motion.button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className={`px-2 py-1 ${
                    syncing
                      ? "bg-blue-600/50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white rounded-md text-[10px] font-medium flex items-center gap-1`}
                  whileHover={syncing ? {} : { scale: 1.05 }}
                  whileTap={syncing ? {} : { scale: 0.95 }}
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
                  />
                  {syncing ? "Syncing..." : "Sync"}
                </motion.button>
              )}

              <motion.button
                onClick={() =>
                  navigate("/connectors/google-calendar/documentation")
                }
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-[10px] font-medium flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-3 h-3" />
                Docs
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats - Only show when connected */}
        {isConnected && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="bg-[#0d0d0e] border border-gray-800 rounded-md p-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.02, borderColor: "#374151" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-[9px] mb-0.5">
                        {stat.label}
                      </p>
                      <p className="text-sm font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-1 rounded bg-gray-800/50">
                      <Icon className={`w-3 h-3 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isConnected ? (
          <>
            {/* Features - Compact */}
            <div className="mb-3">
              <h2 className="text-sm font-bold text-white mb-2">
                Key Features
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, borderColor: "#374151" }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                          <Icon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-white mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-[10px] text-gray-400">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Connection Setup - Compact */}
            <motion.div
              className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="text-base font-bold text-white mb-3">
                Connect Google Calendar
              </h2>

              {/* Scope Selection - Compact */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Integration Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {scopeOptions.map((scope) => {
                    const Icon = scope.icon;
                    return (
                      <motion.button
                        key={scope.id}
                        onClick={() => setSelectedScope(scope.id)}
                        className={`p-2 rounded-lg border transition-all duration-200 text-left ${
                          selectedScope === scope.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={scope.requiresAdmin}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded ${scope.bgColor}`}>
                            <Icon className={`w-3 h-3 ${scope.color}`} />
                          </div>
                          {selectedScope === scope.id && (
                            <CheckCircle2 className="w-3 h-3 text-purple-500 ml-auto" />
                          )}
                        </div>
                        <h3 className="text-white font-medium text-[10px] mb-0.5">
                          {scope.label}
                        </h3>
                        <p className="text-[9px] text-gray-400">
                          {scope.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Security Notice - Compact */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-semibold text-white mb-0.5">
                      Secure Connection
                    </h4>
                    <p className="text-[9px] text-gray-400">
                      We use OAuth 2.0 for secure authentication. Your
                      credentials are never stored.
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <motion.button
                onClick={handleConnect}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LinkIcon className="w-4 h-4" />
                Connect Google Calendar
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Left Column - Larger */}
              <div className="lg:col-span-2 space-y-3">
                {/* Recent Activity */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white">
                      Recent Activity
                    </h2>
                    <motion.button
                      onClick={handleViewAllActivity}
                      className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                      whileHover={{ x: 2 }}
                    >
                      View All
                      <ExternalLink className="w-2.5 h-2.5" />
                    </motion.button>
                  </div>

                  {loadingActivity ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="space-y-1.5">
                      {recentActivity.slice(0, 5).map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <div>
                              <p className="text-[10px] text-white font-medium">
                                {activity.action}
                              </p>
                              <p className="text-[9px] text-gray-400">
                                {activity.event}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-500">
                            {activity.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </motion.div>

                {/* Sync Settings Dropdown */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                >
                  <button
                    onClick={() => setShowSyncSettings(!showSyncSettings)}
                    className="w-full flex items-center justify-between text-sm font-bold text-white mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Sync Settings</span>
                    </div>
                    {showSyncSettings ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showSyncSettings && (
                      <motion.div
                        className="space-y-3 pt-2 border-t border-gray-800"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {/* Sync Direction */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1.5">
                            Sync Direction
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              "bidirectional",
                              "to_external",
                              "to_internal",
                            ].map((direction) => (
                              <button
                                key={direction}
                                onClick={() =>
                                  setSyncSettings({
                                    ...syncSettings,
                                    syncDirection: direction,
                                  })
                                }
                                className={`py-1 px-2 rounded text-[9px] font-medium transition-all duration-200 ${
                                  syncSettings.syncDirection === direction
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                              >
                                {direction === "bidirectional"
                                  ? "Both"
                                  : direction === "to_external"
                                  ? "To Google"
                                  : "From Google"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sync Frequency */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1.5">
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
                            className="w-full py-1 px-2 text-[10px] bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="5">Every 5 minutes</option>
                            <option value="15">Every 15 minutes</option>
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every hour</option>
                            <option value="manual">Manual only</option>
                          </select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-medium text-white">
                                Sync Past Events
                              </p>
                              <p className="text-[8px] text-gray-400">
                                Include past events
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setSyncSettings({
                                  ...syncSettings,
                                  syncPastEvents: !syncSettings.syncPastEvents,
                                })
                              }
                              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                                syncSettings.syncPastEvents
                                  ? "bg-purple-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              <motion.div
                                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
                                animate={{
                                  x: syncSettings.syncPastEvents ? 20 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-medium text-white">
                                Sync Future Events
                              </p>
                              <p className="text-[8px] text-gray-400">
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
                              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                                syncSettings.syncFutureEvents
                                  ? "bg-purple-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              <motion.div
                                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
                                animate={{
                                  x: syncSettings.syncFutureEvents ? 20 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Save Button */}
                        <motion.button
                          className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Save Settings
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Right Column - Connection Info & Actions */}
              <div className="space-y-3">
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xs font-bold text-white mb-2">
                    Connection Info
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">Account</p>
                      <p className="text-[10px] text-white font-medium truncate">
                        {connector?.metadata?.userInfo?.email ||
                          connector?.config?.email ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">Scope</p>
                      <p className="text-[10px] text-white font-medium capitalize">
                        {selectedScope}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">
                        Connected
                      </p>
                      <p className="text-[10px] text-white font-medium">
                        {connector?.metadata?.connectedAt
                          ? new Date(
                              connector.metadata.connectedAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">Status</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] text-green-500 font-medium">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                >
                  <h3 className="text-xs font-bold text-white mb-2">Actions</h3>
                  <div className="space-y-2">
                    <motion.button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className={`w-full py-1.5 ${
                        syncing
                          ? "bg-blue-600/50 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded text-[10px] font-medium flex items-center justify-center gap-1.5`}
                      whileHover={syncing ? {} : { scale: 1.02 }}
                      whileTap={syncing ? {} : { scale: 0.98 }}
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
                      />
                      {syncing ? "Syncing..." : "Sync Now"}
                    </motion.button>
                    <motion.button
                      onClick={handleDisconnect}
                      className="w-full py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded text-[10px] font-medium flex items-center justify-center gap-1.5 border border-red-500/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Unlink className="w-3 h-3" />
                      Disconnect
                    </motion.button>
                  </div>
                </motion.div>

                {/* Help - Compact */}
                <motion.div
                  className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <AlertCircle className="w-4 h-4 text-purple-400 mb-2" />
                  <h4 className="text-[10px] font-semibold text-white mb-1">
                    Need Help?
                  </h4>
                  <p className="text-[9px] text-gray-400 mb-2">
                    Check our documentation for guides.
                  </p>
                  <button
                    onClick={() =>
                      navigate("/connectors/google-calendar/documentation")
                    }
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-0.5"
                  >
                    View Documentation
                    <ExternalLink className="w-2.5 h-2.5" />
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
