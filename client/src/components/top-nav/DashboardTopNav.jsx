import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Inbox,
  MessageCircle,
  User,
  Calendar,
  MoreHorizontal,
  Star,
  Users,
  Snowflake,
  Filter,
  CheckCircle,
  Clock,
  List,
  Bell,
  Settings,
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  Activity,
  CalendarDays,
} from "lucide-react";
import ProjectSelector from "./ProjectSelector";

const DashboardTopNav = ({ onCreateProject }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    myTasks: false,
    spaces: false,
  });

  // Determine active item based on current route
  const getActiveItem = () => {
    if (location.pathname === "/dashboard") return "overview";
    if (location.pathname === "/dashboard/tasks") return "tasks";
    if (location.pathname === "/dashboard/analytics") return "analytics";
    if (location.pathname === "/dashboard/team") return "team";
    if (location.pathname === "/dashboard/calendar") return "calendar";
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

  const myTasksItems = [
    {
      name: "Assigned to me",
      icon: CheckCircle,
      color: "text-red-500",
      count: 5,
    },
    {
      name: "Today & Overdue",
      icon: Calendar,
      color: "text-orange-500",
      count: 2,
    },
    { name: "Personal List", icon: User, color: "text-blue-500", count: 3 },
  ];

  const spacesItems = [
    {
      name: "All Tasks - Kumar Roushan's W...",
      icon: Snowflake,
      color: "text-gray-400",
    },
    { name: "Team Space", icon: Users, color: "text-blue-500" },
    { name: "New Space", icon: Plus, color: "text-gray-400" },
  ];

  const favoritesItems = [
    { name: "Important Tasks", icon: Star, color: "text-yellow-500" },
  ];

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
      case "calendar":
        navigate("/dashboard/calendar");
        break;
      case "activity":
        navigate("/dashboard/activity");
        break;
      default:
        break;
    }
  };

  return (
    <motion.nav
      className="w-full px-6 py-4 border-b border-gray-800"
      style={{ backgroundColor: "#0f0f11" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Navigation Items */}
        <div className="flex items-center space-x-1">
          {/* Overview */}
          <motion.button
            onClick={() => handleItemClick("overview")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
              activeItem === "overview"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-medium text-xs">Overview</span>
          </motion.button>

          {/* Tasks */}
          <motion.button
            onClick={() => handleItemClick("tasks")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "tasks"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <List className="w-4 h-4" />
            <span className="font-medium text-xs">Tasks</span>
            <motion.div
              className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              12
            </motion.div>
          </motion.button>

          {/* Analytics */}
          <motion.button
            onClick={() => handleItemClick("analytics")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "analytics"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-xs">Analytics</span>
          </motion.button>

          {/* Team */}
          <motion.button
            onClick={() => handleItemClick("team")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "team"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium text-xs">Team</span>
          </motion.button>

          {/* Calendar */}
          <motion.button
            onClick={() => handleItemClick("calendar")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "calendar"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium text-xs">Calendar</span>
          </motion.button>

          {/* Activity */}
          <motion.button
            onClick={() => handleItemClick("activity")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "activity"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Activity className="w-4 h-4" />
            <span className="font-medium text-xs">Activity</span>
          </motion.button>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex items-center justify-center">
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in Home..."
              className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 w-80"
            />
          </motion.div>
        </div>

        {/* Right Section - Actions and Favorites */}
        <div className="flex items-center space-x-4">
          {/* Chat Button */}
          <motion.button
            onClick={() => handleItemClick("chat")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "chat"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 8 }}
            >
              <MessageCircle className="w-4 h-4" />
            </motion.div>
            <span className="font-medium text-xs">Chat</span>
          </motion.button>

          {/* Client Button */}
          <motion.button
            onClick={() => handleItemClick("client")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "client"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 9 }}
            >
              <Users className="w-4 h-4" />
            </motion.div>
            <span className="font-medium text-xs">Client</span>
          </motion.button>

          {/* Project Selector */}
          <ProjectSelector onCreateProject={onCreateProject} />

          {/* Create New Task Button */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
              <span>Create New Task</span>
            </motion.button>
          </motion.div>

          {/* Favorites Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("spaces")}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">Favorites</span>
              <motion.div
                animate={{ rotate: expandedSections.spaces ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Favorites Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.spaces && (
                <motion.div
                  className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-[9999]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-2">
                      Favorites
                    </div>
                    {favoritesItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </motion.button>
                    ))}
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-t border-gray-700 mt-2">
                      Workspaces
                    </div>
                    {spacesItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 1) * 0.1, duration: 0.3 }}
                        whileHover={{ x: -5 }}
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
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(expandedSections.myTasks || expandedSections.spaces) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setExpandedSections({ myTasks: false, spaces: false });
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default DashboardTopNav;
