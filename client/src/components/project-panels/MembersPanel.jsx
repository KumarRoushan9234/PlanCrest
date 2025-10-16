import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  UserMinus,
  Mail,
  Calendar,
  Shield,
  User,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const MembersPanel = ({ project, isAdmin, onMembersUpdated }) => {
  const { currentWorkspace } = useWorkspace();
  const [projectMembers, setProjectMembers] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (project?._id) {
      fetchMembers();
    }
  }, [project?._id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const [projectRes, workspaceRes] = await Promise.all([
        projectService.getProjectMembers(project._id),
        projectService.getWorkspaceMembers(currentWorkspace._id),
      ]);
      setProjectMembers(projectRes.data || []);
      setWorkspaceMembers(workspaceRes.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;

    try {
      // Extract user IDs from workspace members
      const userIds = selectedMembers
        .map((memberId) => {
          const member = workspaceMembers.find(
            (m) => m._id === memberId || m.user?._id === memberId
          );
          return member?.user?._id || member?._id;
        })
        .filter(Boolean);

      await projectService.addProjectMembers(project._id, userIds);
      setSelectedMembers([]);
      setIsAddingMembers(false);
      fetchMembers();
      if (onMembersUpdated) onMembersUpdated();
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Failed to add members. Please try again.");
    }
  };

  const handleRemoveMember = async (member) => {
    if (
      !confirm("Are you sure you want to remove this member from the project?")
    )
      return;

    try {
      // Extract the actual user ID from the member object
      const userId = member.user?._id || member._id;
      await projectService.removeProjectMember(project._id, userId);
      fetchMembers();
      if (onMembersUpdated) onMembersUpdated();
    } catch (error) {
      console.error("Error removing member:", error);
      const errorMessage =
        error.error || "Failed to remove member. Please try again.";
      alert(errorMessage);
    }
  };

  const toggleMemberSelection = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const availableMembers = workspaceMembers.filter((wm) => {
    const workspaceUserId = wm.user?._id || wm._id;
    return !projectMembers.some((pm) => {
      const projectUserId = pm.user?._id || pm._id;
      return projectUserId === workspaceUserId;
    });
  });

  const filteredMembers = projectMembers.filter((member) => {
    const user = member.user || member;
    const name = user.name || "";
    const email = user.email || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        {isAdmin && !isAddingMembers && (
          <motion.button
            onClick={() => setIsAddingMembers(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Members</span>
          </motion.button>
        )}
      </div>

      {/* Add Members Section */}
      <AnimatePresence>
        {isAddingMembers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add Workspace Members
              </h3>
              <button
                onClick={() => {
                  setIsAddingMembers(false);
                  setSelectedMembers([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {availableMembers.length === 0 ? (
              <p className="text-gray-400 text-sm">
                All workspace members are already part of this project.
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {availableMembers.map((member) => {
                    const user = member.user || member;
                    const memberId = member._id || member.user?._id;
                    return (
                      <label
                        key={memberId}
                        className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(memberId)}
                          onChange={() => toggleMemberSelection(memberId)}
                          className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.name || "Unknown"}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedMembers.length} Member
                  {selectedMembers.length !== 1 ? "s" : ""}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? "No members found" : "No members yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "Try adjusting your search"
              : "Add workspace members to this project to get started"}
          </p>
          {isAdmin && !searchTerm && !isAddingMembers && (
            <button
              onClick={() => setIsAddingMembers(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Members</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const user = member.user || member;
            const memberId = member._id || member.user?._id;
            return (
              <motion.div
                key={memberId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">
                        {user.name || "Unknown"}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {member.role || "Member"}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{user.email || "No email"}</span>
                  </div>
                  {member.joinedAt && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembersPanel;
