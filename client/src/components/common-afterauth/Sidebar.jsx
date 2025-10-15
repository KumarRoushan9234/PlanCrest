import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Calendar,
  Bot,
  Video,
  FileText,
  FileSpreadsheet,
  Grid3X3,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  HelpCircle,
  Search,
  Sparkles,
  X,
  Crown,
  UserPlus,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  DashboardSidebar,
  CalendarSidebar,
  AIModeSidebar,
} from "./page-sidebars";

const Sidebar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [selectedButton, setSelectedButton] = useState("Home");
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize page sidebar based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const pageMap = {
      "/dashboard": {
        name: "Home",
        href: "/dashboard",
        icon: Home,
        features: [],
      },
      "/calendar": {
        name: "Calendar",
        href: "/calendar",
        icon: Calendar,
        features: [],
      },
      "/ai-mode": {
        name: "AI Mode",
        href: "/ai-mode",
        icon: Sparkles,
        features: [],
      },
    };

    const currentPage = pageMap[currentPath];
    if (currentPage) {
      setActivePage(currentPage);
      setSelectedButton(currentPage.name);
      setIsSecondarySidebarOpen(true);
    }
  }, [location.pathname]);

  const mainNavigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      features: [
        "Dashboard Overview",
        "Quick Stats",
        "Recent Activity",
        "Quick Actions",
      ],
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
      features: [
        "Today's Schedule",
        "Upcoming Events",
        "Create Event",
        "Calendar Settings",
      ],
    },
    {
      name: "AI Mode",
      href: "/ai-mode",
      icon: Sparkles,
      features: [
        "AI Assistant",
        "Smart Suggestions",
        "Auto Responses",
        "AI Analytics",
      ],
    },
  ];

  const dropdownItems = [
    {
      name: "Zoom Meeting",
      href: "/zoom-meeting",
      icon: Video,
      features: [
        "Schedule Meeting",
        "Join Meeting",
        "Meeting History",
        "Settings",
      ],
    },
    {
      name: "Whiteboard",
      href: "/whiteboard",
      icon: FileText,
      features: ["Create Board", "Collaborate", "Templates", "Export"],
    },
    {
      name: "Docs",
      href: "/docs",
      icon: FileSpreadsheet,
      features: ["Create Document", "Recent Docs", "Templates", "Share"],
    },
    {
      name: "Apps",
      href: "/apps",
      icon: Grid3X3,
      features: ["App Store", "Installed Apps", "Manage Apps", "App Settings"],
    },
  ];

  const settingsMenuOptions = [
    { name: "Settings", icon: Settings },
    { name: "Help & Support", icon: HelpCircle },
    { name: "Log out", icon: LogOut, isDestructive: true },
  ];

  const handleButtonClick = (item) => {
    setActivePage(item);
    setSelectedButton(item.name);
    setIsSecondarySidebarOpen(true);
    navigate(item.href);
  };

  const renderPageSidebar = () => {
    if (!isSecondarySidebarOpen || !activePage) return null;

    switch (activePage.name) {
      case "Home":
        return <DashboardSidebar onClose={closeSecondarySidebar} />;
      case "Calendar":
        return <CalendarSidebar onClose={closeSecondarySidebar} />;
      case "AI Mode":
        return <AIModeSidebar onClose={closeSecondarySidebar} />;
      default:
        return null;
    }
  };

  const closeSecondarySidebar = () => {
    setIsSecondarySidebarOpen(false);
    setActivePage(null);
  };

  return (
    <>
      {/* Main Sidebar */}
      <div
        className="fixed top-5 left-0.6 bottom-0.5 w-16 z-40 rounded-2xl"
        style={{ backgroundColor: "#0d0d0e" }}
      >
        <div className="flex flex-col h-full pt-12">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-1 space-y-2">
              {/* Main Navigation Items */}
              {mainNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedButton === item.name;
                return (
                  <motion.button
                    key={item.name}
                    onClick={() => handleButtonClick(item)}
                    className={`group flex flex-col items-center gap-2 px-1 py-2 text-sm font-medium rounded-xl transition-colors w-full ${
                      isSelected
                        ? "bg-gray-800 text-white shadow-lg"
                        : "text-gray-500 hover:bg-gray-600 hover:text-white"
                    }`}
                    title={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{ rotate: isSelected ? 360 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                    </motion.div>
                    <span className="text-sm text-center leading-tight">
                      {item.name}
                    </span>
                  </motion.button>
                );
              })}

              {/* More Button */}
              <motion.button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex flex-col items-center gap-1 px-1 py-2 text-sm font-medium rounded-xl transition-colors text-gray-300 hover:bg-gray-600 hover:text-white"
                title="More"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Grid3X3 className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <span className="text-xs text-center leading-tight">More</span>
              </motion.button>

              {/* Dropdown Items */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    className="space-y-1 mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {dropdownItems.map((item, index) => {
                      const Icon = item.icon;
                      const isSelected = selectedButton === item.name;
                      return (
                        <motion.button
                          key={item.name}
                          onClick={() => handleButtonClick(item)}
                          className={`w-full flex flex-col items-center gap-1 px-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                            isSelected
                              ? "bg-gray-800 text-white shadow-lg"
                              : "text-gray-300 hover:bg-gray-600 hover:text-white"
                          }`}
                          title={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs text-center leading-tight">
                            {item.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-1 space-y-2">
            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full flex flex-col items-center gap-1 px-1 py-2 text-sm font-medium rounded-xl transition-colors text-gray-300 hover:bg-gray-600 hover:text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs text-center leading-tight">
                Settings
              </span>
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute left-full -top-32 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 ml-4">
                <div className="p-2">
                  {settingsMenuOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.name}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          option.isDestructive
                            ? "text-gray-700 hover:bg-gray-900"
                            : "text-gray-400 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          console.log(`${option.name} clicked`);
                          setIsSettingsOpen(false);
                        }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {option.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invite Button */}
            <button
              onClick={() => setIsInviteOpen(!isInviteOpen)}
              className="w-full flex flex-col items-center gap-1 px-1 py-2 text-sm font-medium rounded-xl transition-colors text-gray-300 hover:bg-gray-600 hover:text-white"
              title="Invite"
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs text-center leading-tight">Invite</span>
            </button>

            {/* Invite Dropdown */}
            {isInviteOpen && (
              <div className="absolute left-full -top-32 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 ml-4">
                <div className="p-2">
                  <div className="p-3 text-center">
                    <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Invite Team Members
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Share your workspace
                    </p>
                    <button className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                      Send Invite
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Button */}
            <button
              onClick={() => setIsUpgradeOpen(!isUpgradeOpen)}
              className="w-full flex flex-col items-center gap-1 px-1 py-2 text-sm font-medium rounded-xl transition-colors text-gray-300 hover:bg-gray-600 hover:text-white"
              title="Upgrade"
            >
              <Crown className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs text-center leading-tight">Upgrade</span>
            </button>

            {/* Upgrade Dropdown */}
            {isUpgradeOpen && (
              <div className="absolute left-full -top-32 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 ml-4">
                <div className="p-2">
                  <div className="p-3 text-center">
                    <Crown className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Upgrade to Pro
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Unlock premium features
                    </p>
                    <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page-Specific Sidebar */}
      <AnimatePresence>
        {isSecondarySidebarOpen && activePage && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderPageSidebar()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
