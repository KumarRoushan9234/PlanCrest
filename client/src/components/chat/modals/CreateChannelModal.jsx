import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Hash,
  Users,
  FolderKanban,
  Building2,
  ChevronDown,
} from "lucide-react";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { useAuth } from "../../../contexts/AuthContext";
import chatService from "../../../services/chatService";
import toast from "react-hot-toast";

/**
 * Create Channel Modal Component
 * Modal for creating new channels
 */
const CreateChannelModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProject,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "feature",
    type: "public",
    projectId: selectedProject?._id || null,
  });

  useEffect(() => {
    if (isOpen && currentWorkspace?._id) {
      fetchProjects();
    }
  }, [isOpen, currentWorkspace?._id]);

  const fetchProjects = async () => {
    try {
      const { projectService } = await import(
        "../../../services/projectService"
      );
      const response = await projectService.getWorkspaceProjects(
        currentWorkspace._id
      );
      setProjects(response.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const categories = [
    {
      value: "feature",
      label: "Feature",
      icon: Hash,
      description: "Cross-project feature discussions",
    },
    {
      value: "team",
      label: "Team",
      icon: Users,
      description: "Department or role-based channels",
    },
    {
      value: "workspace",
      label: "Workspace",
      icon: Building2,
      description: "Workspace-wide discussions",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await chatService.createChannel(currentWorkspace._id, {
        name: formData.name.startsWith("#")
          ? formData.name
          : `#${formData.name}`,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        projectId: formData.projectId,
      });

      toast.success("Channel created successfully");
      setFormData({
        name: "",
        description: "",
        category: "feature",
        type: "public",
        projectId: null,
      });
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error(error.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-[#1a1b1d] rounded-xl border border-gray-800/50 shadow-2xl w-full max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-white">Create Channel</h2>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="#channel-name"
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What is this channel about?"
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Project Selection (if workspace category) */}
            {formData.category === "workspace" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project (optional)
                </label>
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white text-sm hover:border-gray-700/50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4" />
                      <span>
                        {formData.projectId
                          ? projects.find((p) => p._id === formData.projectId)
                              ?.name || "Select project"
                          : "All Projects"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>

                  {showProjectDropdown && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, projectId: null });
                          setShowProjectDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                      >
                        All Projects
                      </button>
                      {projects.map((project) => (
                        <button
                          key={project._id}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              projectId: project._id,
                            });
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <FolderKanban className="w-4 h-4" />
                          {project.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          category: cat.value,
                          projectId:
                            cat.value === "workspace"
                              ? formData.projectId
                              : null,
                        });
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.category === cat.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-800/50 bg-gray-900/50 hover:border-gray-700/50"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon
                        className={`w-5 h-5 mx-auto mb-1 ${
                          formData.category === cat.value
                            ? "text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      <div className="text-xs font-medium text-white">
                        {cat.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Privacy
              </label>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "public" })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.type === "public"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Public
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "private" })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.type === "private"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Private
                </motion.button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Creating..." : "Create Channel"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateChannelModal;
