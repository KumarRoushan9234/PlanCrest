import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Hash,
  Users,
  FolderKanban,
  Building2,
  ChevronDown,
  Check,
  UserPlus,
} from "lucide-react";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { useAuth } from "../../../contexts/AuthContext";
import chatService from "../../../services/chatService";
import { workspaceService } from "../../../services/workspaceService";
import toast from "react-hot-toast";
import { Avatar } from "../shared";

/**
 * Create Channel Modal Component
 * Modal for creating new channels with updated categories
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
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "feature",
    type: "public",
    projectId: selectedProject?._id || null,
    members: [],
  });

  useEffect(() => {
    if (isOpen && currentWorkspace?._id) {
      fetchProjects();
      fetchWorkspaceMembers();
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

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await workspaceService.getWorkspaceMembers(
        currentWorkspace._id
      );
      const members = response.data?.data || response.data || [];
      // Filter out current user
      setWorkspaceMembers(
        members.filter(
          (m) => m.user?._id?.toString() !== user?._id?.toString()
        )
      );
    } catch (err) {
      console.error("Error fetching workspace members:", err);
    }
  };

  const categories = [
    {
      value: "feature",
      label: "Personal",
      icon: Hash,
      description: "Select members from workspace",
    },
    {
      value: "project",
      label: "Project",
      icon: FolderKanban,
      description: "All project members included",
    },
    {
      value: "workspace",
      label: "Workspace",
      icon: Building2,
      description: "All workspace members",
    },
  ];

  const filteredMembers = workspaceMembers.filter((member) => {
    const userName = member.user?.name || "";
    const userEmail = member.user?.email || "";
    const query = memberSearchQuery.toLowerCase();
    return (
      userName.toLowerCase().includes(query) ||
      userEmail.toLowerCase().includes(query)
    );
  });

  const toggleMember = (memberId) => {
    setFormData((prev) => {
      const isSelected = prev.members.includes(memberId);
      return {
        ...prev,
        members: isSelected
          ? prev.members.filter((id) => id !== memberId)
          : [...prev.members, memberId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    // Validate category-specific requirements
    if (formData.category === "project" && !formData.projectId) {
      toast.error("Please select a project");
      return;
    }

    if (formData.category === "feature" && formData.members.length === 0) {
      toast.error("Please select at least one member");
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
        members: formData.members,
      });

      toast.success("Channel created successfully");
      setFormData({
        name: "",
        description: "",
        category: "feature",
        type: "public",
        projectId: null,
        members: [],
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
          className="relative bg-[#1a1b1d] rounded-xl border border-gray-800/50 shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50 sticky top-0 bg-[#1a1b1d] z-10">
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
                          projectId: cat.value === "project" ? formData.projectId : null,
                          members: cat.value === "feature" ? formData.members : [],
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
              <p className="text-xs text-gray-500 mt-1">
                {categories.find((c) => c.value === formData.category)?.description}
              </p>
            </div>

            {/* Project Selection (for project category) */}
            {formData.category === "project" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project <span className="text-red-400">*</span>
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
                          : "Select project"}
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
                      {projects.map((project) => (
                        <button
                          key={project._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, projectId: project._id });
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
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

            {/* Member Selection (for feature/personal category) */}
            {formData.category === "feature" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Members <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white text-sm hover:border-gray-700/50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {formData.members.length > 0
                          ? `${formData.members.length} member${formData.members.length > 1 ? "s" : ""} selected`
                          : "Select members"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>

                  {showMemberDropdown && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="p-2 border-b border-gray-800/50">
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => {
                            const isSelected = formData.members.includes(
                              member.user?._id?.toString()
                            );
                            return (
                              <button
                                key={member.user?._id}
                                type="button"
                                onClick={() =>
                                  toggleMember(member.user?._id?.toString())
                                }
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                              >
                                <Avatar user={member.user} size="sm" />
                                <span className="flex-1">
                                  {member.user?.name || "Unknown"}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500 text-center">
                            No members found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
                {formData.members.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.members.map((memberId) => {
                      const member = workspaceMembers.find(
                        (m) => m.user?._id?.toString() === memberId
                      );
                      if (!member) return null;
                      return (
                        <div
                          key={memberId}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-300"
                        >
                          <Avatar user={member.user} size="xs" />
                          <span>{member.user?.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleMember(memberId)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              />
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
                      : "border-gray-800/50 bg-gray-900/50 text-gray-400 hover:border-gray-700/50"
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
                      : "border-gray-800/50 bg-gray-900/50 text-gray-400 hover:border-gray-700/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Private
                </motion.button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-[#1a1b1d] pb-2">
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
