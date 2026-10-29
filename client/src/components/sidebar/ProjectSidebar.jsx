import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  Flag,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  ChevronRight,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Edit3,
  Settings,
  Shield,
  Archive,
  Share2,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Palette,
  Folder,
  Building,
  Database,
  Rocket,
  Lightbulb,
  Target,
  Activity,
  Search,
  Zap,
  BarChart3,
  PenTool,
  Megaphone,
  Wrench,
  Smartphone,
} from "lucide-react";
import { useProject } from "../../contexts/ProjectContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";

const ProjectSidebar = ({
  isOpen,
  onClose,
  project,
  onUpdate,
  onDelete,
  mode = "edit",
}) => {
  const [isEditing, setIsEditing] = useState({
    name: false,
    description: false,
  });
  const [editedProject, setEditedProject] = useState(project || {});
  const [activeTab, setActiveTab] = useState("details"); // details, settings, members
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { updateProject, deleteProject } = useProject();
  const { currentWorkspace } = useWorkspace();

  // Update edited project when project prop changes
  useEffect(() => {
    setEditedProject(project || {});
  }, [project]);

  // Close sidebar when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!project) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "paused":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "completed":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "archived":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    try {
      await updateProject(project._id, editedProject);
      onUpdate?.(editedProject);
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteProject(project._id);
      onDelete?.(project._id);
      onClose();
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleArchive = async () => {
    try {
      await updateProject(project._id, { status: "archived" });
      onUpdate?.({ ...project, status: "archived" });
      toast.success("Project archived successfully!");
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Failed to archive project");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/project/${project._id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Project link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/project/${project._id}`;
    const text = `Check out this project: ${project.name}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      text + " " + url
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleTwitterShare = () => {
    const url = `${window.location.origin}/project/${project._id}`;
    const text = `Check out this project: ${project.name}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank");
  };

  const handleLinkedInShare = () => {
    const url = `${window.location.origin}/project/${project._id}`;
    const text = `Check out this project: ${project.name}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}&title=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, "_blank");
  };

  // Helper function to render icon components
  const renderIcon = (iconName, size = 24) => {
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
      Search,
      Zap,
      Building,
      Database,
    };

    const IconComponent = iconMap[iconName] || Folder;
    return <IconComponent size={size} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          {/* Sidebar - SMALLER */}
          <motion.div
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[500px] bg-gray-950 border-l border-gray-800 shadow-2xl z-[101] flex flex-col rounded-l-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header - SMALLER */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300"
                  style={{ backgroundColor: project.color + "20" }}
                >
                  {renderIcon(project.icon, 16)}
                </div>
                <h2 className="text-xs font-medium text-gray-400">
                  {mode === "edit" ? "Edit Project" : "Project Settings"}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Save Button - SMALLER */}
                {mode === "edit" && (
                  <motion.button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Save
                  </motion.button>
                )}
                {/* More Menu - SMALLER */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showMoreMenu
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </motion.button>

                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        className="absolute top-full right-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-[9999] overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-1">
                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleShare();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Copy className="w-3 h-3" />
                            <span className="font-medium">Copy link</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleWhatsAppShare();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span className="font-medium">WhatsApp</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleTwitterShare();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span className="font-medium">Twitter</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleLinkedInShare();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span className="font-medium">LinkedIn</span>
                          </motion.button>

                          <div className="my-0.5 border-t border-gray-800"></div>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleArchive();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Archive className="w-3 h-3" />
                            <span className="font-medium">Archive</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowMoreMenu(false);
                              handleDelete();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="font-medium">Delete</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Tabs - SMALLER */}
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-800 bg-gray-900/30">
              {[
                { id: "details", label: "Details" },
                { id: "settings", label: "Settings" },
                { id: "members", label: "Members" },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Content - Scrollable - SMALLER */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Project Name - SMALLER */}
                <div>
                  {isEditing.name ? (
                    <input
                      type="text"
                      value={editedProject.name}
                      onChange={(e) =>
                        setEditedProject({
                          ...editedProject,
                          name: e.target.value,
                        })
                      }
                      onBlur={() => {
                        setIsEditing({ ...isEditing, name: false });
                        handleSave();
                      }}
                      className="w-full text-sm font-bold text-white bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                  ) : (
                    <motion.h1
                      className="text-sm font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => setIsEditing({ ...isEditing, name: true })}
                      whileHover={{ x: 2 }}
                    >
                      {project.name}
                    </motion.h1>
                  )}
                </div>

                {/* Status and Priority - SMALLER */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">Priority:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(
                        project.priority
                      )}`}
                    >
                      {project.priority || "Medium"}
                    </span>
                  </div>
                </div>

                {/* Description - SMALLER */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-300">
                      Description
                    </h3>
                    <motion.button
                      onClick={() =>
                        setIsEditing({ ...isEditing, description: true })
                      }
                      className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </motion.button>
                  </div>
                  {isEditing.description ? (
                    <textarea
                      value={editedProject.description}
                      onChange={(e) =>
                        setEditedProject({
                          ...editedProject,
                          description: e.target.value,
                        })
                      }
                      onBlur={() => {
                        setIsEditing({ ...isEditing, description: false });
                        handleSave();
                      }}
                      className="w-full text-xs text-gray-300 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {project.description || "No description provided"}
                    </p>
                  )}
                </div>

                {/* Project Properties - SMALLER */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-300">
                    Properties
                  </h3>

                  {/* Project Key - SMALLER */}
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Project Key</p>
                        <p className="text-xs text-white font-medium font-mono">
                          {project.key}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workspace - SMALLER */}
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Workspace</p>
                        <p className="text-xs text-white font-medium">
                          {currentWorkspace?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Created Date - SMALLER */}
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <div>
                        <p className="text-[10px] text-gray-500">Created</p>
                        <p className="text-xs text-white font-medium">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Privacy - SMALLER */}
                  <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {project.privacy === "private" ? (
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-[10px] text-gray-500">Privacy</p>
                        <p className="text-xs text-white font-medium">
                          {project.privacy === "private" ? "Private" : "Public"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Tab Content - SMALLER */}
                {activeTab === "settings" && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-300">
                      Project Settings
                    </h3>

                    {/* Icon Selection - SMALLER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500">
                        Project Icon
                      </label>
                      <div className="grid grid-cols-8 gap-1.5">
                        {[
                          "Folder",
                          "Globe",
                          "Smartphone",
                          "Palette",
                          "BarChart3",
                          "PenTool",
                          "Megaphone",
                          "Wrench",
                          "Rocket",
                          "Lightbulb",
                          "Target",
                          "Activity",
                          "Search",
                          "Zap",
                          "Building",
                          "Database",
                        ].map((iconName) => (
                          <motion.button
                            key={iconName}
                            onClick={() => {
                              setEditedProject({
                                ...editedProject,
                                icon: iconName,
                              });
                              handleSave();
                            }}
                            className={`p-1.5 rounded-lg border-2 transition-all ${
                              project.icon === iconName
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-gray-600 hover:border-gray-500"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {renderIcon(iconName, 14)}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection - SMALLER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500">
                        Project Color
                      </label>
                      <div className="grid grid-cols-8 gap-1.5">
                        {[
                          "#6366f1",
                          "#8b5cf6",
                          "#ec4899",
                          "#ef4444",
                          "#f59e0b",
                          "#10b981",
                          "#06b6d4",
                          "#84cc16",
                        ].map((color) => (
                          <motion.button
                            key={color}
                            onClick={() => {
                              setEditedProject({
                                ...editedProject,
                                color: color,
                              });
                              handleSave();
                            }}
                            className={`w-6 h-6 rounded-lg border-2 transition-all ${
                              project.color === color
                                ? "border-white scale-110"
                                : "border-gray-600 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Status Selection - SMALLER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500">
                        Project Status
                      </label>
                      <select
                        value={editedProject.status}
                        onChange={(e) => {
                          setEditedProject({
                            ...editedProject,
                            status: e.target.value,
                          });
                          handleSave();
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* Priority Selection - SMALLER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500">Priority</label>
                      <select
                        value={editedProject.priority}
                        onChange={(e) => {
                          setEditedProject({
                            ...editedProject,
                            priority: e.target.value,
                          });
                          handleSave();
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    {/* Privacy Selection - SMALLER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500">Privacy</label>
                      <select
                        value={editedProject.privacy}
                        onChange={(e) => {
                          setEditedProject({
                            ...editedProject,
                            privacy: e.target.value,
                          });
                          handleSave();
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Members Tab Content - SMALLER */}
                {activeTab === "members" && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-300">
                      Project Members
                    </h3>
                    <div className="text-xs text-gray-400">
                      Member management functionality will be implemented here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Click outside to close more menu */}
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                className="fixed inset-0 z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMoreMenu(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectSidebar;
