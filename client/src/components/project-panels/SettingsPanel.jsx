import React, { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  AlertTriangle,
  Palette,
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  Folder,
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
import { projectService } from "../../services/projectService";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SettingsPanel = ({
  project,
  isAdmin,
  onProjectUpdated,
  onProjectDeleted,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    status: "active",
    visibility: "private",
    color: "#3B82F6",
    icon: "Folder",
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        key: project.key || "",
        description: project.description || "",
        status: project.status || "active",
        visibility: project.visibility || "private",
        color: project.color || "#3B82F6",
        icon: project.icon || "Folder",
      });
    }
  }, [project]);

  const iconOptions = [
    { name: "Folder", icon: Folder },
    { name: "Globe", icon: Globe },
    { name: "Smartphone", icon: Smartphone },
    { name: "Palette", icon: Palette },
    { name: "BarChart3", icon: BarChart3 },
    { name: "PenTool", icon: PenTool },
    { name: "Megaphone", icon: Megaphone },
    { name: "Wrench", icon: Wrench },
    { name: "Rocket", icon: Rocket },
    { name: "Lightbulb", icon: Lightbulb },
    { name: "Target", icon: Target },
    { name: "Activity", icon: Activity },
    { name: "Building", icon: Building },
    { name: "Database", icon: Database },
    { name: "Bug", icon: Bug },
    { name: "Map", icon: Map },
    { name: "Zap", icon: Zap },
  ];

  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setLoading(true);
      await projectService.updateProject(project._id, formData);
      if (onProjectUpdated) onProjectUpdated();
      alert("Project settings updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      await projectService.deleteProject(project._id);
      if (onProjectDeleted) onProjectDeleted();
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-xs text-gray-500">
          You don't have permission to modify these settings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - SMALLER & DARKER */}
      <div>
        <h2 className="text-sm font-bold text-white">Project Settings</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Configure and manage your project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information - SMALLER & DARKER */}
        <motion.div
          className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-4 space-y-3"
          whileHover={{ borderColor: "rgb(55, 65, 81)" }}
        >
          <h3 className="text-sm font-bold text-white">Basic Information</h3>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white focus:border-blue-600 focus:outline-none transition-colors"
              placeholder="Enter project name"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Project Key
              </label>
              <input
                type="text"
                name="key"
                value={formData.key}
                disabled
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-800 rounded-lg text-xs text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-600 mt-0.5">
                Project key cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white focus:border-blue-600 focus:outline-none transition-colors"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition-colors resize-none"
              placeholder="Enter project description"
            />
          </div>
        </motion.div>

        {/* Appearance Settings - SMALLER & DARKER */}
        <motion.div
          className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-4 space-y-3"
          whileHover={{ borderColor: "rgb(55, 65, 81)" }}
        >
          <h3 className="text-sm font-bold text-white">Appearance</h3>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Project Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <motion.button
                    key={option.name}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, icon: option.name })
                    }
                    className={`p-2 rounded-lg border-2 transition-all ${
                      formData.icon === option.name
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 hover:border-gray-600 bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-white mx-auto" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Project Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colorOptions.map((color) => (
                <motion.button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? "border-white scale-110"
                      : "border-gray-700 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Danger Zone - SMALLER & DARKER */}
        <motion.div
          className="bg-gradient-to-br from-red-900/20 to-red-900/10 border border-red-800/50 rounded-lg p-4"
          whileHover={{ borderColor: "rgb(153, 27, 27)" }}
        >
          <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Danger Zone
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Deleting this project will remove all associated data. This action
            cannot be undone.
          </p>
          <motion.button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-3 h-3" />
            Delete Project
          </motion.button>
        </motion.div>

        {/* Action Buttons - SMALLER & DARKER */}
        <div className="flex items-center gap-2 sticky bottom-0 bg-gray-950 p-3 -mx-4 -mb-4 rounded-b-lg">
          <motion.button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Project?
              </h3>
              <p className="text-gray-400 mb-6">
                This will permanently delete "{formData.name}" and all its data.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "Deleting..." : "Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPanel;
