import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Trash2,
  MoreVertical,
  Search,
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";
import UserAvatar from "../UserAvatar";

const WorkspaceMembersModal = ({ isOpen, onClose }) => {
  const {
    currentWorkspace,
    workspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMember,
    loading,
  } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-yellow-900 text-yellow-300 border-yellow-700";
      case "admin":
        return "bg-blue-900 text-blue-300 border-blue-700";
      case "employee":
        return "bg-green-900 text-green-300 border-green-700";
      case "client":
        return "bg-purple-900 text-purple-300 border-purple-700";
      default:
        return "bg-gray-900 text-gray-300 border-gray-700";
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!currentWorkspace?._id) return;

    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await removeWorkspaceMember(currentWorkspace._id, userId);
        setActiveDropdown(null);
      } catch (error) {
        console.error("Error removing member:", error);
      }
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!currentWorkspace?._id) return;

    try {
      await updateWorkspaceMember(currentWorkspace._id, userId, {
        role: newRole,
      });
      setActiveDropdown(null);
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  // Filter members based on search term
  const filteredMembers = workspaceMembers.filter((member) => {
    const name = member.user?.name || "";
    const email = member.user?.email || "";
    const searchLower = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

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
              className="rounded-2xl border w-full max-w-4xl max-h-[70vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))", // lower opacity
                backdropFilter: "blur(100px)", // keep strong blur for glass effect
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h2 className="text-lg font-bold text-white">
                  Workspace Members
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gray-600">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm text-sm"
                  />
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {loading && workspaceMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {searchTerm
                        ? "No members found matching your search"
                        : "No members found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMembers.map((member, index) => (
                      <motion.div
                        key={member._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-gray-750 transition-colors backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <UserAvatar user={member.user} size="md" />

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white truncate text-sm">
                                {member.user?.name || "Unknown User"}
                              </h3>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-xs text-gray-400 truncate">
                              {member.user?.email || "No email"}
                            </p>
                          </div>

                          {/* Role Badge */}
                          <div
                            className={`px-2 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </div>

                          {/* Actions */}
                          {member.role !== "owner" && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === member._id
                                      ? null
                                      : member._id
                                  )
                                }
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>

                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {activeDropdown === member._id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-40 bg-gray-800 bg-opacity-95 border border-gray-700 rounded-lg shadow-xl z-10 backdrop-blur-md"
                                  >
                                    <div className="py-1">
                                      <div className="px-3 py-1 text-xs text-gray-400 font-semibold">
                                        Change Role
                                      </div>
                                      {["admin", "employee", "client"].map(
                                        (role) => (
                                          <button
                                            key={role}
                                            onClick={() =>
                                              handleChangeRole(
                                                member.user._id,
                                                role
                                              )
                                            }
                                            disabled={member.role === role}
                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                              member.role === role
                                                ? "text-gray-500 cursor-not-allowed"
                                                : "text-gray-300 hover:bg-gray-700"
                                            }`}
                                          >
                                            {role.charAt(0).toUpperCase() +
                                              role.slice(1)}
                                          </button>
                                        )
                                      )}
                                      <div className="border-t border-gray-700 my-1"></div>
                                      <button
                                        onClick={() =>
                                          handleRemoveMember(member.user._id)
                                        }
                                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition-colors flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Remove
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkspaceMembersModal;
