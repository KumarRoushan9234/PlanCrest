import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          Project Settings
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!isAdmin}
            />
          </div>

          {/* Project Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  key: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PROJ"
              maxLength={10}
              required
              disabled={!isAdmin}
            />
            <p className="text-gray-500 text-xs mt-1">
              A short identifier for the project (2-10 characters)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isAdmin}
            />
          </div>

          {/* Status and Visibility */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isAdmin}
              >
                <option value="private">
                  Private - Workspace members only
                </option>
                <option value="public">Public - Anyone can view</option>
              </select>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() =>
                      isAdmin && setFormData({ ...formData, icon: option.name })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === option.name
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    disabled={!isAdmin}
                  >
                    <IconComponent
                      className={`w-6 h-6 mx-auto ${
                        formData.icon === option.name
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => isAdmin && setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? "border-white scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={!isAdmin}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          {isAdmin && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </form>
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Once you delete a project, there is no going back. Please be
            certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-white font-medium">
                Are you absolutely sure you want to delete this project?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Delete Project</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
