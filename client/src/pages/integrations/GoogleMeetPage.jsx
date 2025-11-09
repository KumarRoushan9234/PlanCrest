import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  Video,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Unlink,
  Shield,
  Zap,
  Globe,
  Lock,
  User,
  Building2,
  FolderKanban,
} from "lucide-react";
import { SiGooglemeet } from "react-icons/si";
import connectorService from "../../services/connectorService";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";

const GoogleMeetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const { selectedProject } = useProject();

  const [isConnected, setIsConnected] = useState(false);
  const [selectedScope, setSelectedScope] = useState("personal");
  const [connector, setConnector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Fetch connector status
  const fetchConnector = async () => {
    try {
      setLoading(true);
      const scopeId =
        selectedScope === "workspace"
          ? selectedWorkspace?._id
          : selectedScope === "project"
          ? selectedProject?._id
          : null;

      const { connectors } = await connectorService.getAllConnectors(
        selectedScope,
        scopeId
      );
      const meetConnector = connectors?.find((c) => c.type === "google_meet");

      if (meetConnector) {
        setIsConnected(true);
        setConnector(meetConnector);
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
      window.history.replaceState({}, "", "/connectors/google-meet");
    } else if (error === "true") {
      alert("Failed to connect Google Meet. Please try again.");
      window.history.replaceState({}, "", "/connectors/google-meet");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchConnector();
  }, [selectedScope]);

  // Handle connect
  const handleConnect = async () => {
    try {
      setConnecting(true);
      const scopeId =
        selectedScope === "workspace"
          ? selectedWorkspace?._id
          : selectedScope === "project"
          ? selectedProject?._id
          : null;

      console.log("Connecting to Google Meet with scope:", selectedScope);
      const result = await connectorService.connectGoogleMeet(selectedScope, scopeId);
      console.log("Connection result:", result);
      
      // Wait a bit for the database to be updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchConnector();
      alert("✅ Google Meet connected successfully!");
    } catch (error) {
      console.error("Error connecting Google Meet:", error);
      alert("❌ Failed to initiate connection. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Meet?")) {
      return;
    }

    try {
      if (connector) {
        await connectorService.deleteConnector(connector._id);
        setIsConnected(false);
        setConnector(null);
        alert("Google Meet disconnected successfully");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect. Please try again.");
    }
  };

  const features = [
    {
      icon: Video,
      title: "Instant Meetings",
      description: "Create and join meetings directly from your workspace",
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Automatically sync meetings with your calendar",
      color: "text-green-500",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members and collaborate in real-time",
      color: "text-purple-500",
    },
    {
      icon: Clock,
      title: "Scheduled Meetings",
      description: "Schedule meetings and send automatic reminders",
      color: "text-orange-500",
    },
  ];

  const scopeOptions = [
    {
      id: "personal",
      name: "Personal",
      icon: User,
      description: "Only visible to you",
      color: "text-blue-400",
    },
    {
      id: "workspace",
      name: "Workspace",
      icon: Building2,
      description: "Shared with workspace members",
      color: "text-purple-400",
      disabled: !selectedWorkspace,
    },
    {
      id: "project",
      name: "Project",
      icon: FolderKanban,
      description: "Specific to a project",
      color: "text-green-400",
      disabled: !selectedProject,
    },
  ];

  if (loading) {
    return (
      <IntegrationLayout>
        <div
          className="w-full h-full p-4 flex items-center justify-center"
          style={{ backgroundColor: "#0a0a0b" }}
        >
          <div className="text-white">Loading...</div>
        </div>
      </IntegrationLayout>
    );
  }

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
              <div className="p-2 bg-green-500/10 rounded-xl">
                <SiGooglemeet className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  Google Meet
                </h1>
                <p className="text-gray-400 text-xs">
                  Video conferencing and team collaboration
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
                  <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-xs text-green-400 font-medium">
                    Communication
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {!isConnected ? (
          <>
            {/* Features */}
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-3">
                Key Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      className="bg-[#0d0d0e] border border-gray-800 rounded-lg p-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, borderColor: "#374151" }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 rounded-lg bg-gray-800/50">
                          <Icon className={`w-4 h-4 ${feature.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-xs mb-0.5">
                            {feature.title}
                          </h3>
                          <p className="text-gray-400 text-xs">
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
              className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-base font-bold text-white mb-3">
                Connect Google Meet
              </h2>

              {/* Scope Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Integration Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {scopeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          !option.disabled && setSelectedScope(option.id)
                        }
                        disabled={option.disabled}
                        className={`p-2 rounded-lg border transition-all duration-200 ${
                          selectedScope === option.id
                            ? "border-green-500 bg-green-500/10"
                            : option.disabled
                            ? "border-gray-800 bg-gray-800/30 opacity-50 cursor-not-allowed"
                            : "border-gray-800 bg-gray-800/50 hover:border-gray-700"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 mx-auto mb-1 ${
                            selectedScope === option.id
                              ? "text-green-500"
                              : option.color
                          }`}
                        />
                        <p className="text-xs font-medium text-white mb-0.5">
                          {option.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-400 font-medium mb-0.5">
                      Secure Connection
                    </p>
                    <p className="text-xs text-gray-400">
                      We use OAuth 2.0 for secure authentication. Your
                      credentials are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <motion.button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: connecting ? 1 : 1.02 }}
                whileTap={{ scale: connecting ? 1 : 0.98 }}
              >
                <SiGooglemeet className="w-3.5 h-3.5" />
                {connecting ? "Connecting..." : "Connect Google Meet"}
              </motion.button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              className="mt-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <AlertCircle className="w-4 h-4 text-purple-400 mb-2" />
              <h4 className="text-xs font-semibold text-white mb-1">
                Need Help?
              </h4>
              <p className="text-xs text-gray-400 mb-2">
                Check our documentation for setup guides and troubleshooting.
              </p>
              <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                View Documentation →
              </button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Connected View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Connection Info */}
              <motion.div
                className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-sm font-bold text-white mb-3">
                  Connection Info
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Account</p>
                    <p className="text-xs text-white font-medium">
                      {connector?.metadata?.userInfo?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Scope</p>
                    <p className="text-xs text-white font-medium capitalize">
                      {selectedScope}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Connected</p>
                    <p className="text-xs text-white font-medium">
                      {connector?.metadata?.connectedAt
                        ? new Date(
                            connector.metadata.connectedAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-xs text-green-500 font-medium">
                        Active
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleDisconnect}
                  className="w-full mt-4 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-red-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Unlink className="w-3 h-3" />
                  Disconnect
                </motion.button>
              </motion.div>

              {/* Usage Info */}
              <motion.div
                className="lg:col-span-2 bg-[#0d0d0e] border border-gray-800 rounded-xl p-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-sm font-bold text-white mb-3">
                  How to Use
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-green-500 font-bold">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium mb-0.5">
                        Create Instant Meetings
                      </p>
                      <p className="text-xs text-gray-400">
                        Click the "New Meeting" button in your workspace to
                        create instant Google Meet sessions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-green-500 font-bold">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium mb-0.5">
                        Schedule Meetings
                      </p>
                      <p className="text-xs text-gray-400">
                        Schedule meetings from your calendar and automatically
                        generate Meet links.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-green-500 font-bold">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium mb-0.5">
                        Invite Team Members
                      </p>
                      <p className="text-xs text-gray-400">
                        Share meeting links with team members directly from your
                        workspace.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </IntegrationLayout>
  );
};

export default GoogleMeetPage;
