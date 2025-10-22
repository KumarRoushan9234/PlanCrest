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
    if (location.pathname === "/tasks") return "allTasks";
    if (location.pathname === "/dashboard") return "inbox";
    return "inbox";
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
    if (itemName === "allTasks") {
      navigate("/tasks");
    } else if (itemName === "inbox") {
      navigate("/dashboard");
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
          {/* Dashboard */}
          <motion.button
            onClick={() => handleItemClick("inbox")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
              activeItem === "inbox"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <BarChart3 className="w-4 h-4" />
            </motion.div>
            <span className="font-medium text-xs">Dashboard</span>
            <motion.div
              className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              3
            </motion.div>
          </motion.button>

          {/* Assigned Comments */}
          <motion.button
            onClick={() => handleItemClick("comments")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "comments"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <MessageCircle className="w-4 h-4" />
            </motion.div>
            <span className="font-medium text-xs">Comments</span>
            <motion.div
              className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              1
            </motion.div>
          </motion.button>

          {/* My Tasks Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("myTasks")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
                activeItem === "myTasks"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
              >
                <User className="w-4 h-4" />
              </motion.div>
              <span className="font-semibold text-xs">My Tasks</span>
              <motion.div
                className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 4 }}
              >
                12
              </motion.div>
              <motion.div
                animate={{ rotate: expandedSections.myTasks ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </motion.button>

            {/* My Tasks Dropdown Menu */}
            <AnimatePresence>
              {expandedSections.myTasks && (
                <motion.div
                  className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-[9999]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2">
                    {myTasksItems.map((item, index) => (
                      <motion.button
                        key={index}
                        className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-full ${item.color}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 5 + index,
                          }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        <motion.div
                          className="ml-auto bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 6 + index,
                          }}
                        >
                          {item.count}
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* All Tasks */}
          <motion.button
            onClick={() => handleItemClick("allTasks")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "allTasks"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 7 }}
            >
              <List className="w-4 h-4" />
            </motion.div>
            <span className="font-medium text-xs">All Tasks</span>
            <motion.div
              className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 4 }}
            >
              12
            </motion.div>
          </motion.button>

          {/* More Tools */}
          <motion.button
            onClick={() => handleItemClick("more")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
              activeItem === "more"
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="font-medium text-xs">More</span>
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
