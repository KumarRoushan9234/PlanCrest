import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  FolderOpen,
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
  HardDrive,
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { SiGoogledrive } from "react-icons/si";
import IntegrationSidebar from "../../components/integration/IntegrationSidebar";

const GoogleDrivePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedScope, setSelectedScope] = useState("personal");
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncOnUpload: true,
    syncOnModify: true,
    maxFileSize: "100",
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
      icon: FolderOpen,
      description: "Specific to a project",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      requiresAdmin: true,
    },
  ];

  const features = [
    {
      icon: Upload,
      title: "File Upload",
      description: "Upload files directly to Google Drive from PlanCrest",
    },
    {
      icon: Download,
      title: "File Access",
      description:
        "Access and download files from Google Drive within PlanCrest",
    },
    {
      icon: Users,
      title: "Team Sharing",
      description: "Share files and folders with team members seamlessly",
    },
    {
      icon: RefreshCw,
      title: "Auto Sync",
      description:
        "Automatically sync files between Google Drive and PlanCrest",
    },
  ];

  const stats = [
    {
      label: "Files Synced",
      value: "1,247",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "Storage Used",
      value: "8.2 GB",
      icon: HardDrive,
      color: "text-green-500",
    },
    {
      label: "Folders",
      value: "24",
      icon: FolderOpen,
      color: "text-purple-500",
    },
    {
      label: "Last Sync",
      value: "5m ago",
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  const recentFiles = [
    {
      name: "Project Proposal.pdf",
      type: "PDF",
      size: "2.4 MB",
      modified: "2 hours ago",
      icon: FileText,
    },
    {
      name: "Design Mockups.fig",
      type: "Figma",
      size: "12.8 MB",
      modified: "5 hours ago",
      icon: ImageIcon,
    },
    {
      name: "Team Meeting.mp4",
      type: "Video",
      size: "145 MB",
      modified: "1 day ago",
      icon: Film,
    },
    {
      name: "Budget 2025.xlsx",
      type: "Excel",
      size: "890 KB",
      modified: "2 days ago",
      icon: FileText,
    },
  ];

  const handleConnect = () => {
    console.log("Connecting to Google Drive with scope:", selectedScope);
    setTimeout(() => {
      setIsConnected(true);
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleSyncNow = () => {
    console.log("Syncing files...");
  };

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-4" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/integrations")}
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
                <SiGoogledrive className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  Google Drive
                </h1>
                <p className="text-gray-400 text-xs">
                  Store, share, and collaborate on files seamlessly
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
                    Storage
                  </span>
                </div>
              </div>
            </div>

            {isConnected && (
              <motion.button
                onClick={handleSyncNow}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
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
                Connect Google Drive
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
                Connect Google Drive
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Connected - Settings and Files */}
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
                    {/* Auto Sync Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Auto Sync
                        </p>
                        <p className="text-xs text-gray-400">
                          Automatically sync files in real-time
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSyncSettings({
                            ...syncSettings,
                            autoSync: !syncSettings.autoSync,
                          })
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                          syncSettings.autoSync
                            ? "bg-purple-600"
                            : "bg-gray-700"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                          animate={{ x: syncSettings.autoSync ? 24 : 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      </button>
                    </div>

                    {/* Max File Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">
                        Max File Size (MB)
                      </label>
                      <input
                        type="number"
                        value={syncSettings.maxFileSize}
                        onChange={(e) =>
                          setSyncSettings({
                            ...syncSettings,
                            maxFileSize: e.target.value,
                          })
                        }
                        className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        max="1000"
                      />
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
                              Sync on Upload
                            </p>
                            <p className="text-xs text-gray-400">
                              Sync immediately when uploading files
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSyncSettings({
                                ...syncSettings,
                                syncOnUpload: !syncSettings.syncOnUpload,
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              syncSettings.syncOnUpload
                                ? "bg-purple-600"
                                : "bg-gray-700"
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                              animate={{
                                x: syncSettings.syncOnUpload ? 24 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Sync on Modify
                            </p>
                            <p className="text-xs text-gray-400">
                              Sync when files are modified
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSyncSettings({
                                ...syncSettings,
                                syncOnModify: !syncSettings.syncOnModify,
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              syncSettings.syncOnModify
                                ? "bg-purple-600"
                                : "bg-gray-700"
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                              animate={{
                                x: syncSettings.syncOnModify ? 24 : 0,
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

                {/* Recent Files */}
                <motion.div
                  className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    Recent Files
                  </h2>
                  <div className="space-y-3">
                    {recentFiles.map((file, index) => {
                      const Icon = file.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 px-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Icon className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {file.type} • {file.size}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {file.modified}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium">
                    View All Files →
                  </button>
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
                        user@example.com
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Scope</p>
                      <p className="text-sm text-white font-medium capitalize">
                        {selectedScope}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        Storage Quota
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">
                            8.2 GB of 15 GB used
                          </span>
                          <span className="text-white font-medium">55%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: "55%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
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
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
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
                      <FolderOpen className="w-4 h-4" />
                      Browse Files
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

export default GoogleDrivePage;
