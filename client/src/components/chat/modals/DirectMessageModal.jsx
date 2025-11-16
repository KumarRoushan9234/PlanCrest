import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, MessageSquare } from "lucide-react";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { useAuth } from "../../../contexts/AuthContext";
import chatService from "../../../services/chatService";
import { workspaceService } from "../../../services/workspaceService";
import toast from "react-hot-toast";
import { Avatar } from "../shared";

/**
 * Direct Message Modal Component
 * Modal for selecting a workspace member to start a direct message
 */
const DirectMessageModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && currentWorkspace?._id) {
      fetchWorkspaceMembers();
    }
  }, [isOpen, currentWorkspace?._id]);

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await workspaceService.getWorkspaceMembers(
        currentWorkspace._id
      );
      const members = response.data?.data || response.data || [];
      // Filter out current user
      setWorkspaceMembers(
        members.filter((m) => m.user?._id?.toString() !== user?._id?.toString())
      );
    } catch (err) {
      console.error("Error fetching workspace members:", err);
      toast.error("Failed to load workspace members");
    }
  };

  const filteredMembers = workspaceMembers.filter((member) => {
    const userName = member.user?.name || "";
    const userEmail = member.user?.email || "";
    const query = searchQuery.toLowerCase();
    return (
      userName.toLowerCase().includes(query) ||
      userEmail.toLowerCase().includes(query)
    );
  });

  const handleSelectMember = async (memberId) => {
    try {
      setLoading(true);
      const response = await chatService.getOrCreateDirectMessage(
        currentWorkspace._id,
        memberId
      );
      toast.success("Direct message opened");
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      console.error("Error creating/getting DM:", error);
      toast.error(
        error.response?.data?.message || "Failed to open direct message"
      );
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
          className="relative bg-[#1a1b1d] rounded-xl border border-gray-800/50 shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Direct Messages
              </h2>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search workspace members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : filteredMembers.length > 0 ? (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <motion.button
                    key={member.user?._id}
                    onClick={() => handleSelectMember(member.user?._id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Avatar
                      user={member.user}
                      size="md"
                      showStatus={true}
                      status={member.user?.status}
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {member.user?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {member.user?.email}
                      </p>
                    </div>
                    <UserPlus className="w-4 h-4 text-gray-400" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                {searchQuery ? "No members found" : "No workspace members"}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DirectMessageModal;
