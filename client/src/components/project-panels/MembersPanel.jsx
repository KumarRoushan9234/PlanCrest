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

  return (
    <div className="space-y-3">
      {/* Header - SMALLER & DARKER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Team Members</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Manage project team and collaboration
          </p>
        </div>
        {isAdmin && !isAddingMembers && (
          <motion.button
            onClick={() => setIsAddingMembers(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-xs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Members
          </motion.button>
        )}
      </div>

      {/* Search - SMALLER & DARKER */}
      <div className="relative">
        <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition-colors"
        />
      </div>

      {/* Add Members Section - SMALLER & DARKER */}
      <AnimatePresence>
        {isAddingMembers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                Add Workspace Members
              </h3>
              <button
                onClick={() => {
                  setIsAddingMembers(false);
                  setSelectedMembers([]);
                }}
                className="text-gray-500 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {availableMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-xs">
                All workspace members are already part of this project.
              </p>
            ) : (
              <>
                <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
                  {availableMembers.map((member) => {
                    const user = member.user || member;
                    const memberId = member._id || member.user?._id;
                    return (
                      <label
                        key={memberId}
                        className="flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(memberId)}
                          onChange={() => toggleMemberSelection(memberId)}
                          className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-xs">
                            {user.name || "Unknown"}
                          </p>
                          <p className="text-gray-500 text-[10px]">
                            {user.email || "No email"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <motion.button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 text-white px-3 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add {selectedMembers.length} Member
                  {selectedMembers.length !== 1 ? "s" : ""}
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members List - SMALLER & DARKER */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            {searchTerm ? "No members found" : "No members yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredMembers.map((member) => {
            const user = member.user || member;
            return (
              <motion.div
                key={member._id}
                className="bg-gradient-to-r from-black/60 to-gray-900/40 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-all group"
                whileHover={{ x: 2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-xs">
                        {user.name || "Unknown"}
                      </h3>
                      <p className="text-[10px] text-gray-500">
                        {user.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-medium text-gray-400">
                        {member.role || "Member"}
                      </span>
                    </div>
                    {isAdmin && (
                      <motion.button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
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
