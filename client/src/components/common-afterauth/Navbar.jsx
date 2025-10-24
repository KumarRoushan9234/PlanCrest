import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  ChevronDown,
  Users,
  Plus,
  Cog,
  Grid3X3,
  FileText,
  Zap,
  UserPlus,
  Building2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import CreateWorkspaceModal from "../modals/CreateWorkspaceModal";
import InviteMemberModal from "../modals/InviteMemberModal";
import WorkspaceMembersModal from "../modals/WorkspaceMembersModal";
import NotificationBell from "../NotificationBell";

const Navbar = ({ isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { workspaces, currentWorkspace, workspaceMembers, switchWorkspace } =
    useWorkspace();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isWorkspaceMembersOpen, setIsWorkspaceMembersOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };


  // Truncate text helper
  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Get workspace color/initials
  const getWorkspaceInitials = (name) => {
    if (!name) return "W";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWorkspaceColor = (index) => {
    const colors = [
      "from-blue-600 to-purple-600",
      "from-green-600 to-teal-600",
      "from-orange-600 to-red-600",
      "from-pink-600 to-purple-600",
      "from-indigo-600 to-blue-600",
      "from-yellow-600 to-orange-600",
    ];
    return colors[index % colors.length];
  };

  const handleSwitchWorkspace = (workspace) => {
    switchWorkspace(workspace);
    setIsWorkspaceOpen(false);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <nav
      className="px-4 py-1 relative z-30"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Workspace */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="flex items-center gap-2 group cursor-pointer md:cursor-default"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Only handle click on mobile screens
              if (window.innerWidth < 768) {
                handleMobileSidebarToggle();
              }
            }}
          >
            <motion.div
              className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <motion.div
                className="w-4 h-4 bg-white rounded-sm"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              ></motion.div>
            </motion.div>
          </motion.div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center gap-2 px-3 py-1 text-white hover:bg-gray-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Workspace Icon/Logo */}
              {currentWorkspace?.logo ? (
                <img
                  src={currentWorkspace.logo}
                  alt={currentWorkspace.name}
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <div
                  className={`w-6 h-6 bg-gradient-to-r ${getWorkspaceColor(
                    0
                  )} rounded flex items-center justify-center`}
                >
                  <span className="text-xs font-bold text-white">
                    {getWorkspaceInitials(currentWorkspace?.name)}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">
                {truncateText(currentWorkspace?.name || "Select Workspace", 25)}
              </span>
              <motion.div
                animate={{ rotate: isWorkspaceOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Workspace Dropdown Menu */}
            <AnimatePresence>
              {isWorkspaceOpen && (
                <motion.div
                  className="absolute left-0 mt-2 w-80 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: "#0a0a0a" }}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Current Workspace Header */}
                  {currentWorkspace && (
                    <div className="p-4 border-b border-gray-600">
                      <div className="flex items-start gap-3">
                        {/* Workspace Icon */}
                        {currentWorkspace.logo ? (
                          <img
                            src={currentWorkspace.logo}
                            alt={currentWorkspace.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${getWorkspaceColor(
                              0
                            )} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-lg font-bold text-white">
                              {getWorkspaceInitials(currentWorkspace.name)}
                            </span>
                          </div>
                        )}

                        {/* Workspace Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {currentWorkspace.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {workspaceMembers.length}{" "}
                            {workspaceMembers.length === 1
                              ? "member"
                              : "members"}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-2">
                            <motion.button
                              onClick={() => {
                                setIsWorkspaceOpen(false);
                                navigate("/workspace/settings");
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Settings className="w-3 h-3" />
                              Settings
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setIsWorkspaceOpen(false);
                                setIsWorkspaceMembersOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Users className="w-3 h-3" />
                              People
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Switch Workspace Section */}
                  {workspaces.length > 1 && (
                    <div className="p-2 border-b border-gray-600">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                        Switch Workspace
                      </div>
                      <div className="max-h-48 overflow-y-auto scrollbar-hide">
                        {workspaces.map((workspace, index) => {
                          const isActive =
                            workspace._id === currentWorkspace?._id;
                          if (isActive) return null;

                          return (
                            <motion.button
                              key={workspace._id}
                              onClick={() => handleSwitchWorkspace(workspace)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-gray-300 hover:bg-gray-700"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: index * 0.05,
                                duration: 0.3,
                              }}
                              whileHover={{ x: 5, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {workspace.logo ? (
                                <img
                                  src={workspace.logo}
                                  alt={workspace.name}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div
                                  className={`w-8 h-8 bg-gradient-to-r ${getWorkspaceColor(
                                    index + 1
                                  )} rounded flex items-center justify-center flex-shrink-0`}
                                >
                                  <span className="text-xs font-bold text-white">
                                    {getWorkspaceInitials(workspace.name)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-medium truncate">
                                  {workspace.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {workspace.role}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Invite & Create Actions */}
                  <div className="p-2">
                    <motion.button
                      onClick={() => {
                        setIsWorkspaceOpen(false);
                        setIsInviteMemberOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-gray-700"
                      whileHover={{ x: 5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <UserPlus className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">Invite People</span>
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        setIsWorkspaceOpen(false);
                        setIsCreateWorkspaceOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-blue-400 hover:bg-blue-900 hover:bg-opacity-30"
                      whileHover={{ x: 5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">Create Workspace</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Center - Search Bar */}
        <motion.div
          className="hidden md:flex flex-1 max-w-md mx-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div className="relative w-full" whileFocus={{ scale: 1.02 }}>
            <motion.div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 4,
              }}
            >
              <Search className="h-4 w-4 text-gray-400" />
            </motion.div>
            <motion.input
              type="text"
              placeholder="Search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </motion.div>

        {/* Right side - Actions and Profile */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Notifications */}
          <NotificationBell />

          {/* Settings */}
          {/* <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button> */}

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                console.log("Current user data:", currentUser);
                console.log("User picture:", currentUser?.picture);
                setIsProfileOpen(!isProfileOpen);
              }}
              className="flex items-center gap-2 p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {currentUser?.picture ? (
                  <img
                    src={`https://images.weserv.nl/?url=${encodeURIComponent(
                      currentUser.picture
                    )}&w=32&h=32&fit=cover&mask=circle`}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      console.log(
                        "Image failed to load, showing fallback:",
                        currentUser.picture
                      );
                      // Hide the image and show the fallback icon
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                    onLoad={() => {
                      console.log("Image loaded successfully");
                    }}
                  />
                ) : null}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentUser?.picture ? "hidden" : "flex"
                  }`}
                  style={{ display: currentUser?.picture ? "none" : "flex" }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="hidden md:block text-left max-w-[150px]">
                <p
                  className="text-sm font-medium text-white truncate"
                  title={currentUser?.name}
                >
                  {truncateText(currentUser?.name || "User", 18)}
                </p>
                <p
                  className="text-xs text-gray-300 truncate"
                  title={currentUser?.email}
                >
                  {truncateText(
                    currentUser?.email ||
                      (currentUser?.role?.includes("admin") ? "Admin" : "User"),
                    18
                  )}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50"
                  style={{ backgroundColor: "#0a0a0a" }}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-b border-gray-600">
                    <p
                      className="text-sm font-medium text-white truncate"
                      title={currentUser?.name}
                    >
                      {truncateText(currentUser?.name || "User", 25)}
                    </p>
                    <p
                      className="text-xs text-gray-300 truncate"
                      title={currentUser?.email}
                    >
                      {truncateText(currentUser?.email, 30)}
                    </p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate("/profile-settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      Profile Settings
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                      Billing
                    </button>
                  </div>
                  <div className="border-t border-gray-600 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(isProfileOpen || isWorkspaceOpen) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsProfileOpen(false);
              setIsWorkspaceOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />
      <InviteMemberModal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
      />
      <WorkspaceMembersModal
        isOpen={isWorkspaceMembersOpen}
        onClose={() => setIsWorkspaceMembersOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
