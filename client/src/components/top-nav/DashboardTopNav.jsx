import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  ChevronDown,
  MessageCircle,
  Users,
  Star,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Activity,
  FolderKanban,
  ExternalLink,
  List,
} from "lucide-react";
import CreateTaskModal from "../modals/CreateTaskModal";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";

const DashboardTopNav = ({ onCreateProject }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace } = useWorkspace();
  const { projects } = useProject();
  const [expandedSections, setExpandedSections] = useState({
    favorites: false,
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Determine active item based on current route
  const getActiveItem = () => {
    if (location.pathname === "/dashboard") return "overview";
    if (location.pathname === "/dashboard/tasks") return "tasks";
    if (location.pathname === "/dashboard/analytics") return "analytics";
    if (location.pathname === "/dashboard/team") return "team";
    if (location.pathname === "/dashboard/activity") return "activity";
    return "overview";
  };

  const [activeItem, setActiveItem] = useState(getActiveItem());

  // Update active item when location changes
  React.useEffect(() => {
    setActiveItem(getActiveItem());
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleItemClick = (itemName) => {
    setActiveItem(itemName);

    // Navigate to specific pages
    switch (itemName) {
      case "overview":
        navigate("/dashboard");
        break;
      case "tasks":
        navigate("/dashboard/tasks");
        break;
      case "analytics":
        navigate("/dashboard/analytics");
        break;
      case "team":
        navigate("/dashboard/team");
        break;
      case "activity":
        navigate("/dashboard/activity");
        break;
      case "projects":
        navigate("/projects");
        break;
      default:
        break;
    }
  };

  const handleCreateTask = () => {
    // Open the modal - project selection will be handled within the modal
    setIsCreateTaskOpen(true);
  };

  const handleTaskCreated = () => {
    setIsCreateTaskOpen(false);
    // Optionally refresh data or show success message
  };

  const mainNavItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: List, badge: 12 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "team", label: "Team", icon: Users },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const favoritesItems = [
    { name: "Important Tasks", icon: Star, color: "text-yellow-500" },
    { name: "Team Space", icon: Users, color: "text-blue-500" },
  ];

  return (
    <motion.nav
      className="w-full px-6 py-3 border-b border-gray-800/50 backdrop-blur-xl z-50"
      style={{
        backgroundColor: "rgba(10, 10, 11, 0.95)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Main Navigation */}
        <div className="flex items-center space-x-2">
          {mainNavItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 group ${
                activeItem === item.id
                  ? "bg-gradient-to-br from-gray-800 to-gray-800/80 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-xs">{item.label}</span>
              {item.badge && (
                <motion.div
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeItem === item.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  {item.badge}
                </motion.div>
              )}
              {activeItem === item.id && (
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  layoutId="activeIndicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Chat Button */}
          <motion.button
            onClick={() => handleItemClick("chat")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 group"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium text-xs">Chat</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          {/* Client Button */}
          <motion.button
            onClick={() => handleItemClick("client")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 group"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium text-xs">Client</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          {/* Projects Button */}
          <motion.button
            onClick={() => handleItemClick("projects")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 group"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <FolderKanban className="w-4 h-4" />
            <span className="font-medium text-xs">Projects</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-800" />

          {/* Create New Task Button */}
          <motion.button
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/30"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">New Task</span>
          </motion.button>

          {/* Favorites Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("favorites")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 ${
                expandedSections.favorites
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Star className="w-4 h-4 text-yellow-500" />
              <motion.div
                animate={{ rotate: expandedSections.favorites ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>

            {/* Favorites Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.favorites && (
                <motion.div
                  className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 z-50text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Favorites
                    </div>
                    {favoritesItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Button */}
          <motion.button
            className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {expandedSections.favorites && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setExpandedSections({ favorites: false });
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSuccess={handleTaskCreated}
      />
    </motion.nav>
  );
};

export default DashboardTopNav;
