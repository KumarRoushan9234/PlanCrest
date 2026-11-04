import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FolderPlus,
  Eye,
  EyeOff,
  PenTool,
  Palette as PaletteIcon,
  BarChart3,
  Folder,
  Globe,
  Smartphone,
  Target,
  Database,
  Wrench,
  Rocket,
  Lightbulb,
  Search,
  Zap as ZapIcon,
  Activity,
  Building,
  Megaphone,
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";
import { projectService } from "../../services/projectService";

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentWorkspace } = useWorkspace();
  const { fetchWorkspaceProjects } = useProject();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    icon: "Folder",
    color: "#6366f1",
    privacy: "public",
  });

  // Predefined color options
  const colorOptions = [
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
    { name: "Green", value: "#10b981", bg: "bg-green-500" },
    { name: "Purple", value: "#8b5cf6", bg: "bg-purple-500" },
    { name: "Orange", value: "#f59e0b", bg: "bg-orange-500" },
    { name: "Red", value: "#ef4444", bg: "bg-red-500" },
    { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
    { name: "Pink", value: "#ec4899", bg: "bg-pink-500" },
    { name: "Indigo", value: "#6366f1", bg: "bg-indigo-500" },
  ];

  // Predefined icon options
  const iconOptions = [
    { name: "Folder", component: Folder },
    { name: "Globe", component: Globe },
    { name: "Smartphone", component: Smartphone },
    { name: "Palette", component: PaletteIcon },
    { name: "BarChart3", component: BarChart3 },
    { name: "PenTool", component: PenTool },
    { name: "Megaphone", component: Megaphone },
    { name: "Wrench", component: Wrench },
    { name: "Rocket", component: Rocket },
    { name: "Lightbulb", component: Lightbulb },
    { name: "Target", component: Target },
    { name: "Activity", component: Activity },
    { name: "Search", component: Search },
    { name: "Zap", component: ZapIcon },
    { name: "Building", component: Building },
    { name: "Database", component: Database },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        key: "",
        description: "",
        icon: "Folder",
        color: "#6366f1",
        privacy: "public",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        key: formData.key,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        privacy: formData.privacy,
      };

      const data = await projectService.createProject(
        currentWorkspace._id,
        payload
      );

      if (data.success) {
        // Refresh projects list
        await fetchWorkspaceProjects();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        // Reset form
        setFormData({
          name: "",
          key: "",
          description: "",
          icon: "Folder",
          color: "#6366f1",
          privacy: "public",
        });
      } else {
        throw new Error(data.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(error.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper function to render icon components
  const renderIcon = (iconName, size = 24) => {
    const iconMap = {
      Folder,
      Globe,
      Smartphone,
      Palette: PaletteIcon,
      BarChart3,
      PenTool,
      Megaphone,
      Wrench,
      Rocket,
      Lightbulb,
      Target,
      Activity,
      Search,
      Zap: ZapIcon,
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50"
          ></motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-2xl border w-full max-w-5xl max-h-[80vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                backdropFilter: "blur(100px)",
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <FolderPlus className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-lg font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Create New Project
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    In{" "}
                    <span className="font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {currentWorkspace?.name || "Workspace"}
                    </span>
                  </span>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6">
                      {/* Project Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g., My Awesome Project"
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                      </div>

                      {/* Project Key */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Key
                        </label>
                        <input
                          type="text"
                          name="key"
                          value={formData.key}
                          onChange={handleChange}
                          required
                          placeholder="e.g., MAP"
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all backdrop-blur-sm uppercase"
                          maxLength={10}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Short identifier for your project (max 10 characters)
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Brief description of your project..."
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    {/* Right Column - Appearance & Settings */}
                    <div className="space-y-6">
                      {/* Icon Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Icon
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon.name}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  icon: icon.name,
                                }))
                              }
                              className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                                formData.icon === icon.name
                                  ? "border-green-500 bg-green-500/20"
                                  : "border-gray-600 hover:border-gray-500"
                              }`}
                            >
                              <div className="text-gray-300">
                                {renderIcon(icon.name, 20)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Color
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  color: color.value,
                                }))
                              }
                              className={`p-3 rounded-lg border-2 transition-all ${
                                formData.color === color.value
                                  ? "border-white scale-110"
                                  : "border-gray-600 hover:border-gray-500"
                              }`}
                              style={{ backgroundColor: color.value }}
                            >
                              <div className="w-4 h-4 bg-white rounded-full mx-auto"></div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Privacy Setting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Privacy
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 bg-gray-800 bg-opacity-50 rounded-lg cursor-pointer">
                            <input
                              type="radio"
                              name="privacy"
                              value="public"
                              checked={formData.privacy === "public"}
                              onChange={handleChange}
                              className="text-green-500"
                            />
                            <Eye className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-white font-medium">
                                Public
                              </div>
                              <div className="text-sm text-gray-400">
                                Visible to all workspace members
                              </div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-800 bg-opacity-50 rounded-lg cursor-pointer">
                            <input
                              type="radio"
                              name="privacy"
                              value="private"
                              checked={formData.privacy === "private"}
                              onChange={handleChange}
                              className="text-green-500"
                            />
                            <EyeOff className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-white font-medium">
                                Private
                              </div>
                              <div className="text-sm text-gray-400">
                                Only visible to project members
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-600 border-opacity-50">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.name || !formData.key}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? "Creating..." : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateProjectModal;
