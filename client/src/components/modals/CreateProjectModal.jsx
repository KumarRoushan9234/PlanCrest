import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus, Palette, Eye, EyeOff, Sparkles } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import { projectService } from "../../services/projectService";

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { fetchProjects } = useProject();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    icon: "📁",
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

  // Pre-created project templates
  const preCreatedProjects = [
    {
      name: "Web Development",
      key: "WEB",
      description:
        "Complete web application development project with frontend and backend components",
      icon: "🌐",
      color: "#3b82f6",
      privacy: "public",
      features: [
        "Frontend Development",
        "Backend API",
        "Database Design",
        "Testing",
        "Deployment",
      ],
    },
    {
      name: "Mobile App",
      key: "MOBILE",
      description:
        "Mobile application development for iOS and Android platforms",
      icon: "📱",
      color: "#10b981",
      privacy: "public",
      features: [
        "UI/UX Design",
        "Cross-platform Development",
        "App Store Submission",
        "Push Notifications",
      ],
    },
    {
      name: "Marketing Campaign",
      key: "MARKET",
      description:
        "Digital marketing campaign with content creation and social media management",
      icon: "📢",
      color: "#f59e0b",
      privacy: "public",
      features: [
        "Content Strategy",
        "Social Media",
        "Email Marketing",
        "Analytics",
        "SEO",
      ],
    },
    {
      name: "Product Design",
      key: "DESIGN",
      description:
        "UI/UX design project with user research and prototyping phases",
      icon: "🎨",
      color: "#8b5cf6",
      privacy: "public",
      features: [
        "User Research",
        "Wireframing",
        "Prototyping",
        "Visual Design",
        "Usability Testing",
      ],
    },
    {
      name: "Data Analysis",
      key: "DATA",
      description:
        "Data science project with collection, analysis, and visualization",
      icon: "📊",
      color: "#ef4444",
      privacy: "public",
      features: [
        "Data Collection",
        "Data Cleaning",
        "Statistical Analysis",
        "Visualization",
        "Reporting",
      ],
    },
    {
      name: "Content Creation",
      key: "CONTENT",
      description:
        "Content marketing project with blog posts, videos, and social media content",
      icon: "✍️",
      color: "#06b6d4",
      privacy: "public",
      features: [
        "Blog Writing",
        "Video Production",
        "Social Media",
        "SEO",
        "Content Calendar",
      ],
    },
  ];

  // Predefined icon options
  const iconOptions = [
    "📁",
    "🌐",
    "📱",
    "🎨",
    "📊",
    "✍️",
    "📢",
    "🔧",
    "🚀",
    "💡",
    "🎯",
    "📈",
    "🔍",
    "⚡",
    "🎪",
    "🏗️",
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        key: "",
        description: "",
        icon: "📁",
        color: "#6366f1",
        privacy: "public",
      });
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const payload = selectedTemplate
        ? {
            templateId: selectedTemplate.key,
            name: formData.name || selectedTemplate.name,
            key: formData.key || selectedTemplate.key,
            description: formData.description || selectedTemplate.description,
            icon: formData.icon || selectedTemplate.icon,
            color: formData.color || selectedTemplate.color,
            privacy: formData.privacy || selectedTemplate.privacy,
          }
        : formData;

      const data = selectedTemplate
        ? await projectService.createProjectFromTemplate(
            currentWorkspace._id,
            payload
          )
        : await projectService.createProject(currentWorkspace._id, payload);

      if (data.success) {
        // Refresh projects list
        await fetchProjects();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        // Reset form
        setFormData({
          name: "",
          key: "",
          description: "",
          icon: "📁",
          color: "#6366f1",
          privacy: "public",
        });
        setSelectedTemplate(null);
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

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      key: template.key,
      description: template.description,
      icon: template.icon,
      color: template.color,
      privacy: template.privacy,
    });
  };

  const handleCustomProject = () => {
    setSelectedTemplate(null);
    setFormData({
      name: "",
      key: "",
      description: "",
      icon: "📁",
      color: "#6366f1",
      privacy: "public",
    });
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
                {/* Template Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Choose a Template or Start Custom
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Custom Project Option */}
                    <motion.button
                      onClick={handleCustomProject}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !selectedTemplate
                          ? "border-green-500 bg-green-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📁</div>
                        <div className="font-medium text-white">
                          Custom Project
                        </div>
                        <div className="text-sm text-gray-400">
                          Start from scratch
                        </div>
                      </div>
                    </motion.button>

                    {/* Template Options */}
                    {preCreatedProjects.map((template) => (
                      <motion.button
                        key={template.key}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTemplate?.key === template.key
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">{template.icon}</div>
                          <div className="font-medium text-white">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {template.description}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

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
                              key={icon}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, icon }))
                              }
                              className={`p-2 text-lg rounded-lg border transition-all ${
                                formData.icon === icon
                                  ? "border-green-500 bg-green-500/20"
                                  : "border-gray-600 hover:border-gray-500"
                              }`}
                            >
                              {icon}
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
