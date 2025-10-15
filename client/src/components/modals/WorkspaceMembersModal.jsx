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
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import UserAvatar from "../UserAvatar";

const WorkspaceMembersModal = ({ isOpen, onClose }) => {
  const {
    currentWorkspace,
    workspaceMembers,
    removeWorkspaceMember,
    updateWorkspaceMember,
    loading,
  } = useWorkspace();
  const [activeDropdown, setActiveDropdown] = useState(null);

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
            // className="fixed inset-0 bg-black bg-opacity-30 z-50"
            // style={{ backdropFilter: "blur(12px)" }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-xl shadow-2xl border w-full max-w-6xl max-h-[75vh] overflow-hidden flex flex-col"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10, 10, 12, 0.92) 0%, rgba(5, 5, 8, 0.95) 50%, rgba(3, 3, 5, 0.92) 100%)",
                backdropFilter: "blur(20px)",
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Workspace Members
                    </h2>
                    <p className="text-sm text-gray-400">
                      {workspaceMembers.length}{" "}
                      {workspaceMembers.length === 1 ? "member" : "members"} in{" "}
                      {currentWorkspace?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {loading && workspaceMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : workspaceMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workspaceMembers.map((member, index) => (
                      <motion.div
                        key={member._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-gray-750 transition-colors backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <UserAvatar user={member.user} size="lg" />

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white truncate">
                                {member.user?.name || "Unknown User"}
                              </h3>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {member.user?.email || "No email"}
                            </p>
                          </div>

                          {/* Role Badge */}
                          <div
                            className={`px-3 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(
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
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
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
                                    className="absolute right-0 mt-2 w-48 bg-gray-800 bg-opacity-95 border border-gray-700 rounded-lg shadow-xl z-10 backdrop-blur-md"
                                  >
                                    <div className="py-2">
                                      <div className="px-3 py-2 text-xs text-gray-400 font-semibold">
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
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
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
                                      <div className="border-t border-gray-700 my-2"></div>
                                      <button
                                        onClick={() =>
                                          handleRemoveMember(member.user._id)
                                        }
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition-colors flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Remove Member
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

              {/* Footer */}
              <div className="p-6 border-t border-gray-600 border-opacity-50">
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkspaceMembersModal;
