import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  Dock,
  CalendarFold,
  Container,
  MessageSquareDot,
  ChartBarBig,
  Blocks,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  HelpCircle,
  Search,
  X,
  Crown,
  UserPlus,
  Video,
  FileText,
  FileSpreadsheet,
  Grid3X3,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import {
  DashboardSidebar,
  CalendarSidebar,
  AIModeSidebar,
} from "./page-sidebars";
import InviteMemberModal from "../modals/InviteMemberModal";

const Sidebar = ({ isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [selectedButton, setSelectedButton] = useState("Home");
  const [wasSidebarOpenBeforeIntegration, setWasSidebarOpenBeforeIntegration] =
    useState(false);
  const { currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize page sidebar based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const pageMap = {
      "/dashboard": {
        name: "Home",
        href: "/dashboard",
        icon: House,
        features: [],
      },
      "/documents": {
        name: "Documents",
        href: "/documents",
        icon: Dock,
        features: [],
      },
      "/calendar": {
        name: "Calendar",
        href: "/calendar",
        icon: CalendarFold,
        features: [],
      },
      "/ai-mode": {
        name: "AI Mode",
        href: "/ai-mode",
        icon: Container,
        features: [],
      },
      "/chat": {
        name: "Chat Channel",
        href: "/chat",
        icon: MessageSquareDot,
        features: [],
      },
      "/analytics": {
        name: "Analytics",
        href: "/analytics",
        icon: ChartBarBig,
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

  // Handle window resize to ensure proper sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // On desktop, always ensure sidebar is open
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    // Set initial state
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mainNavigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: House,
      features: [
        "Dashboard Overview",
        "Quick Stats",
        "Recent Activity",
        "Quick Actions",
      ],
    },
    {
      name: "Documents",
      href: "/documents",
      icon: Dock,
      features: ["Create Document", "Recent Docs", "Templates", "Share"],
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: CalendarFold,
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
      icon: Container,
      features: [
        "AI Assistant",
        "Smart Suggestions",
        "Auto Responses",
        "AI Analytics",
      ],
    },
    {
      name: "Chat Channel",
      href: "/chat",
      icon: MessageSquareDot,
      features: ["Team Chat", "Direct Messages", "Channels", "File Sharing"],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartBarBig,
      features: [
        "Performance Metrics",
        "Usage Statistics",
        "Reports",
        "Insights",
      ],
    },
  ];

  const integrationItems = [
    {
      name: "Google Workspace",
      href: "/integrations/google",
      icon: FileSpreadsheet,
      features: ["Gmail", "Drive", "Calendar", "Docs"],
    },
    {
      name: "GitHub/GitLab",
      href: "/integrations/git",
      icon: Grid3X3,
      features: ["Repositories", "Issues", "Pull Requests", "CI/CD"],
    },
    {
      name: "Figma",
      href: "/integrations/figma",
      icon: FileText,
      features: ["Design Files", "Prototypes", "Components", "Comments"],
    },
    {
      name: "Slack",
      href: "/integrations/slack",
      icon: MessageSquareDot,
      features: ["Channels", "Messages", "Notifications", "Bots"],
    },
    {
      name: "Zoom",
      href: "/integrations/zoom",
      icon: Video,
      features: ["Meetings", "Webinars", "Recordings", "Settings"],
    },
    {
      name: "Cloud Storage",
      href: "/integrations/storage",
      icon: Dock,
      features: ["Dropbox", "OneDrive", "Box", "Google Drive"],
    },
    {
      name: "CI/CD",
      href: "/integrations/cicd",
      icon: Blocks,
      features: ["Jenkins", "GitHub Actions", "GitLab CI", "Azure DevOps"],
    },
    {
      name: "Calendar",
      href: "/integrations/calendar",
      icon: CalendarFold,
      features: ["Google Calendar", "Outlook", "Apple Calendar", "Calendly"],
    },
  ];

  const handleButtonClick = (item) => {
    setActivePage(item);
    setSelectedButton(item.name);
    setIsSecondarySidebarOpen(true);
    navigate(item.href);
    // Close mobile sidebar when navigating (only on mobile screens)
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(false);
    }
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
      <motion.div
        className="fixed top-5 left-0.6 bottom-0.5 z-40 rounded-lg"
        style={{
          backgroundColor: "#0d0d0e",
          width: "64px",
          maxWidth: "64px",
          minWidth: "64px",
          overflow: "visible",
          boxSizing: "border-box",
          position: "fixed",
        }}
        initial={false}
        animate={{
          // Desktop: always visible, Mobile: toggle based on state
          x: window.innerWidth >= 768 ? 0 : isMobileSidebarOpen ? 0 : -100,
          opacity: window.innerWidth >= 768 ? 1 : isMobileSidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div
          className="flex flex-col h-full"
          style={{
            width: "64px",
            maxWidth: "64px",
            boxSizing: "border-box",
            paddingTop: "48px",
            overflow: "visible",
          }}
        >
          {/* Main Navigation */}
          <div
            className="flex-1"
            style={{ width: "64px", maxWidth: "64px", overflow: "visible" }}
          >
            <div
              className="space-y-2"
              style={{ padding: "4px", width: "64px", boxSizing: "border-box" }}
            >
              {/* Main Navigation Items */}
              {mainNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedButton === item.name;
                return (
                  <motion.div
                    key={item.name}
                    className="relative group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <motion.button
                      onClick={() => handleButtonClick(item)}
                      className={`flex items-center justify-center text-sm font-medium rounded-xl transition-colors ${
                        isSelected
                          ? "bg-gray-900 text-white shadow-lg border border-gray-700"
                          : "text-gray-500 hover:bg-gray-700 hover:text-white"
                      }`}
                      style={{
                        width: "56px",
                        height: "48px",
                        margin: "0 auto",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        animate={{ rotate: isSelected ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      </motion.div>
                    </motion.button>

                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[99999]">
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Integration Button */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  onClick={() => {
                    if (!isIntegrationOpen) {
                      // Opening integration popup
                      if (window.innerWidth < 768) {
                        // Remember if sidebar was open before opening integration
                        setWasSidebarOpenBeforeIntegration(isMobileSidebarOpen);
                        // Don't close sidebar when opening integration popup
                      }
                    } else {
                      // Closing integration popup
                      if (
                        window.innerWidth < 768 &&
                        wasSidebarOpenBeforeIntegration
                      ) {
                        // Restore sidebar state if it was open before
                        setIsMobileSidebarOpen(true);
                      }
                    }
                    setIsIntegrationOpen(!isIntegrationOpen);
                  }}
                  className="flex items-center justify-center text-sm font-medium rounded-xl transition-colors text-gray-500 hover:bg-gray-700 hover:text-white"
                  style={{ width: "56px", height: "48px", margin: "0 auto" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: isIntegrationOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Blocks className="w-5 h-5 flex-shrink-0" />
                  </motion.div>
                </motion.button>

                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[99999]">
                  Integration
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Section */}
          <div
            className="space-y-2"
            style={{ padding: "4px", width: "64px", boxSizing: "border-box" }}
          >
            {/* Settings Button */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <motion.button
                onClick={() => {
                  navigate("/profile-settings");
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 768) {
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className="flex items-center justify-center text-sm font-medium rounded-xl transition-colors text-gray-500 hover:bg-gray-700 hover:text-white"
                style={{ width: "56px", height: "48px", margin: "0 auto" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
              </motion.button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[99999]">
                Settings
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </motion.div>

            {/* Invite Button */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center justify-center text-sm font-medium rounded-xl transition-colors text-gray-500 hover:bg-gray-700 hover:text-white"
                style={{ width: "56px", height: "48px", margin: "0 auto" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="w-5 h-5 flex-shrink-0" />
              </motion.button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[99999]">
                Invite
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </motion.div>

            {/* Upgrade Button */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <motion.button
                onClick={() => setIsUpgradeOpen(!isUpgradeOpen)}
                className="flex items-center justify-center text-sm font-medium rounded-xl transition-colors text-gray-500 hover:bg-gray-700 hover:text-white"
                style={{ width: "56px", height: "48px", margin: "0 auto" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown className="w-5 h-5 flex-shrink-0" />
              </motion.button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[99999]">
                Upgrade
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </motion.div>

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
      </motion.div>

      {/* Mobile Overlay - Only on mobile screens */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Integration Popup */}
      <AnimatePresence>
        {isIntegrationOpen && (
          <motion.div
            className="fixed top-5 left-20 bottom-5 w-72 z-50 rounded-2xl overflow-hidden md:block"
            style={{ backgroundColor: "#0d0d0e" }}
            initial={{ opacity: 0, x: -300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Blocks className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Integrations
                    </h2>
                    <p className="text-xs text-gray-400">Connect your tools</p>
                  </div>
                </div>
              </div>

              {/* Integration Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-3">
                  {integrationItems.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = selectedButton === item.name;

                    // Professional brand colors for each integration
                    const getBrandColor = (name) => {
                      const colors = {
                        "Google Workspace": "bg-blue-500",
                        "GitHub/GitLab": "bg-gray-600",
                        Figma: "bg-purple-500",
                        Slack: "bg-green-500",
                        Zoom: "bg-blue-600",
                        "Cloud Storage": "bg-indigo-500",
                        "CI/CD": "bg-orange-500",
                        Calendar: "bg-green-600",
                      };
                      return colors[name] || "bg-gray-600";
                    };

                    return (
                      <motion.div
                        key={item.name}
                        className="relative group"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          type: "spring",
                          stiffness: 100,
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.button
                          onClick={() => handleButtonClick(item)}
                          className={`w-full p-3 rounded-lg transition-all duration-300 ${
                            isSelected
                              ? "bg-gray-800 border border-blue-500 shadow-lg shadow-blue-500/20"
                              : "bg-gray-800/30 hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <motion.div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected
                                  ? getBrandColor(item.name)
                                  : "bg-gray-700"
                              }`}
                              whileHover={{ rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </motion.div>
                            <h3 className="text-xs font-medium text-white text-center leading-tight">
                              {item.name}
                            </h3>
                          </div>
                        </motion.button>

                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <motion.div
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-700">
                <motion.button
                  className="w-full flex items-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-4 h-4" />
                  Customize integrations
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Click outside to close popups */}
      <AnimatePresence>
        {(isIntegrationOpen || isInviteOpen) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (isIntegrationOpen) {
                // When closing integration popup, restore sidebar state if needed (mobile only)
                if (
                  window.innerWidth < 768 &&
                  wasSidebarOpenBeforeIntegration
                ) {
                  setIsMobileSidebarOpen(true);
                }
              }
              setIsIntegrationOpen(false);
              setIsInviteOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </>
  );
};

export default Sidebar;
