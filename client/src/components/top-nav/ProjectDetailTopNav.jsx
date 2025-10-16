import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  StarOff,
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
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

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
      className="w-full px-6 py-4 border-b border-gray-800"
      style={{ backgroundColor: "#0f0f11" }}
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
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700"></div>

          {/* Project Info */}
          <div className="flex items-center gap-4">
            {/* Project Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: project.color }}
            >
              {renderIcon(project.icon, 20)}
            </div>

            {/* Project Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">
                  {project.name}
                </h1>
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                  {project.key}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{project.members?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
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
            className={`p-2 rounded-lg transition-colors ${
              isStarred
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
          <motion.button
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
          </motion.button>

          {/* More Actions */}
          <div className="relative">
            <motion.button
              onClick={() => setShowActions(!showActions)}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreVertical className="w-4 h-4" />
            </motion.button>

            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
              >
                <button
                  onClick={() => {
                    setShowActions(false);
                    if (onEdit) onEdit();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors rounded-t-lg"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={() => {
                    setShowActions(false);
                    if (onSettings) onSettings();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowActions(false);
                    // Archive functionality can be added later
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
                <div className="border-t border-gray-700"></div>
                <button
                  onClick={() => {
                    setShowActions(false);
                    if (onDelete) onDelete();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default ProjectDetailTopNav;
