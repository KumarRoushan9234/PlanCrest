import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Cloud,
  Code,
  Palette,
  MessageSquare,
  Video,
  GitBranch,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  User,
  Building2,
  FolderKanban,
} from "lucide-react";
import {
  FaGoogle,
  FaGithub,
  FaGitlab,
  FaFigma,
  FaSlack,
  FaDropbox,
  FaMicrosoft,
  FaJira,
  FaTrello,
} from "react-icons/fa";
import {
  SiZoom,
  SiGooglecalendar,
  SiGoogledrive,
  SiGooglemeet,
  SiGmail,
  SiMixpanel,
} from "react-icons/si";

const IntegrationSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    google: true,
    development: false,
    communication: false,
    calendar: false,
    design: false,
    storage: false,
    cicd: false,
    projectManagement: false,
    analytics: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const integrationCategories = [
    {
      id: "google",
      name: "Google Workspace",
      icon: FaGoogle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      items: [
        {
          name: "Google Calendar",
          path: "/connectors/google-calendar",
          icon: SiGooglecalendar,
        },
        {
          name: "Google Drive",
          path: "/connectors/google-drive",
          icon: SiGoogledrive,
        },
        { name: "Google Meet", path: "/connectors/google-meet", icon: SiGooglemeet },
        { name: "Gmail", path: "/connectors/gmail", icon: SiGmail },
      ],
    },
    {
      id: "development",
      name: "Development",
      icon: Code,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      items: [
        { name: "GitHub", path: "/connectors/github", icon: FaGithub },
        { name: "GitLab", path: "/connectors/gitlab", icon: FaGitlab },
        { name: "Bitbucket", path: "/connectors/bitbucket", icon: GitBranch },
      ],
    },
    {
      id: "communication",
      name: "Communication",
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      items: [
        { name: "Slack", path: "/connectors/slack", icon: FaSlack },
        {
          name: "Microsoft Teams",
          path: "/connectors/teams",
          icon: FaMicrosoft,
        },
      ],
    },
    {
      id: "calendar",
      name: "Calendar & Scheduling",
      icon: Calendar,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      items: [
        {
          name: "Google Calendar",
          path: "/connectors/google-calendar",
          icon: SiGooglecalendar,
        },
        {
          name: "Outlook Calendar",
          path: "/connectors/outlook-calendar",
          icon: FaMicrosoft,
        },
      ],
    },
    {
      id: "design",
      name: "Design Tools",
      icon: Palette,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      items: [
        { name: "Figma", path: "/connectors/figma", icon: FaFigma },
        { name: "Adobe Creative", path: "/connectors/adobe", icon: Palette },
      ],
    },
    {
      id: "storage",
      name: "Cloud Storage",
      icon: Cloud,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      items: [
        { name: "AWS S3", path: "/connectors/aws-s3", icon: Cloud },
        { name: "Dropbox", path: "/connectors/dropbox", icon: FaDropbox },
        { name: "OneDrive", path: "/connectors/onedrive", icon: FaMicrosoft },
      ],
    },
    {
      id: "cicd",
      name: "CI/CD & DevOps",
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      items: [
        {
          name: "GitHub Actions",
          path: "/connectors/github-actions",
          icon: FaGithub,
        },
        { name: "GitLab CI", path: "/connectors/gitlab-ci", icon: FaGitlab },
        { name: "Jenkins", path: "/connectors/jenkins", icon: Settings },
      ],
    },
    {
      id: "projectManagement",
      name: "Project Management",
      icon: FolderKanban,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      items: [
        { name: "Jira", path: "/connectors/jira", icon: FaJira },
        { name: "Trello", path: "/connectors/trello", icon: FaTrello },
      ],
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      items: [
        {
          name: "Google Analytics",
          path: "/connectors/google-analytics",
          icon: BarChart3,
        },
        { name: "Mixpanel", path: "/connectors/mixpanel", icon: SiMixpanel },
      ],
    },
  ];

  const scopeItems = [
    {
      name: "Personal",
      path: "/connectors?scope=personal",
      icon: User,
      color: "text-blue-400",
    },
    {
      name: "Workspace",
      path: "/connectors?scope=workspace",
      icon: Building2,
      color: "text-purple-400",
    },
    {
      name: "Project",
      path: "/connectors?scope=project",
      icon: FolderKanban,
      color: "text-green-400",
    },
  ];

  return (
    <div
      className="fixed left-16 z-30"
      style={{
        backgroundColor: "#0d0d0e",
        top: "56px",
        bottom: "0",
        width: "220px",
        height: "calc(100vh - 56px)",
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Integrations
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Connect your tools</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Home Button */}
          <motion.button
            onClick={() => navigate("/connectors")}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
              location.pathname === "/connectors"
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="font-medium text-xs">Overview</span>
          </motion.button>

          {/* Scope Filter Section */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
              Scope
            </h3>
            <div className="space-y-0.5">
              {scopeItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Integration Categories */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
              Categories
            </h3>
            <div className="space-y-0.5">
              {integrationCategories.map((category, categoryIndex) => {
                const CategoryIcon = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: categoryIndex * 0.05,
                      duration: 0.3,
                    }}
                  >
                    {/* Category Header */}
                    <motion.button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-lg ${category.bgColor}`}>
                          <CategoryIcon
                            className={`w-3 h-3 ${category.color}`}
                          />
                        </div>
                        <span className="font-medium text-xs">
                          {category.name}
                        </span>
                      </div>
                      <motion.div
                        animate={{
                          rotate: expandedSections[category.id] ? 90 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </motion.div>
                    </motion.button>

                    {/* Category Items */}
                    <AnimatePresence>
                      {expandedSections[category.id] && (
                        <motion.div
                          className="mt-0.5 ml-2 space-y-0.5"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {category.items.map((item, itemIndex) => {
                            const ItemIcon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <motion.button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 group ${
                                  isActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: itemIndex * 0.05,
                                  duration: 0.2,
                                }}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <ItemIcon className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {item.name}
                                </span>
                                {isActive && (
                                  <motion.div
                                    className="ml-auto w-1 h-1 rounded-full bg-purple-500"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSidebar;
