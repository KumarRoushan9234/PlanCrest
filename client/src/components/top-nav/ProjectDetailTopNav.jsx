import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Share2,
  MoreVertical,
  Edit,
  Settings,
  Archive,
  Trash2,
  Users,
  Calendar,
  Clock,
  Folder,
  Globe,
  Smartphone,
  Palette,
  BarChart3,
  PenTool,
  Megaphone,
  Wrench,
  Rocket,
  Lightbulb,
  Target,
  Activity,
  Building,
  Database,
  Bug,
  Map,
  Zap,
} from "lucide-react";

const ProjectDetailTopNav = ({
  project,
  onBack,
  onEdit,
  onDelete,
  onSettings,
  onArchive,
  onShare,
  onWhatsAppShare,
  onTwitterShare,
  onLinkedInShare,
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isStarred, setIsStarred] = useState(project?.isStarred || false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/projects");
    }
  };

  // Helper function to render icon components
  const renderIcon = (iconName, size = 20) => {
    const iconMap = {
      Folder,
      Globe,
      Smartphone,
      Palette,
      BarChart3,
      PenTool,
      Megaphone,
      Wrench,
      Rocket,
      Lightbulb,
      Target,
      Activity,
      Building,
      Database,
      Bug,
      Map,
      Zap,
    };

    const IconComponent = iconMap[iconName] || Folder;
    return <IconComponent size={size} />;
  };

  if (!project) return null;

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
        {/* Left Section - Back and Project Info */}
        <div className="flex items-center gap-6">
          {/* Back Button */}
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back</span>
          </motion.button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-800"></div>

          {/* Project Info */}
          <div className="flex items-center gap-3">
            {/* Project Icon */}
            <motion.div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: project.color }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {renderIcon(project.icon, 20)}
            </motion.div>

            {/* Project Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white">
                  {project.name}
                </h1>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-medium rounded uppercase tracking-wide">
                  {project.key}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {typeof project.members === "number"
                      ? project.members
                      : Array.isArray(project.members)
                      ? project.members.length
                      : project.members || 0}{" "}
                    members
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Created{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Star Button */}
          <motion.button
            onClick={() => setIsStarred(!isStarred)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isStarred
                ? "bg-yellow-500/20 text-yellow-500"
                : "text-gray-400 hover:text-yellow-500 hover:bg-gray-800/50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isStarred ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <Star className="w-4 h-4" />
            )}
          </motion.button>

          {/* Share Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showShareMenu
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="fixed w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    zIndex: 999999,
                    right: "16px",
                    top: "80px",
                  }}
                >
                  <div className="p-1.5">
                    <motion.button
                      onClick={() => {
                        setShowShareMenu(false);
                        if (onShare) onShare();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Copy Link</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowShareMenu(false);
                        if (onWhatsAppShare) onWhatsAppShare();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="font-medium">WhatsApp</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowShareMenu(false);
                        if (onTwitterShare) onTwitterShare();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Twitter</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowShareMenu(false);
                        if (onLinkedInShare) onLinkedInShare();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="font-medium">LinkedIn</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Actions */}
          <div className="relative">
            <motion.button
              onClick={() => setShowActions(!showActions)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showActions
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreVertical className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="fixed w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    zIndex: 999999,
                    right: "16px",
                    top: "70px",
                  }}
                >
                  <div className="p-1.5">
                    <motion.button
                      onClick={() => {
                        setShowActions(false);
                        if (onEdit) onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="font-medium">Edit Project</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowActions(false);
                        if (onSettings) onSettings();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="font-medium">Settings</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowActions(false);
                        if (onArchive) onArchive();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span className="font-medium">Archive</span>
                    </motion.button>
                    <div className="my-0.5 border-t border-gray-800"></div>
                    <motion.button
                      onClick={() => {
                        setShowActions(false);
                        if (onDelete) onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded"
                      whileHover={{ x: 1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Delete Project</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(showActions || showShareMenu) && (
          <motion.div
            className="fixed inset-0 z-[999998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowActions(false);
              setShowShareMenu(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default ProjectDetailTopNav;
