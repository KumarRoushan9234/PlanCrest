import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { Avatar } from "../shared";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { useAuth } from "../../../contexts/AuthContext";
import { workspaceService } from "../../../services/workspaceService";

/**
 * Mention Autocomplete Component
 * Shows a dropdown list of users when @ is typed
 */
const MentionAutocomplete = ({
  query = "",
  position = null,
  onSelect,
  onClose,
  channelMembers = [],
}) => {
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!query && !channelMembers.length) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      if (!currentWorkspace?._id) return;

      try {
        setLoading(true);
        const response = await workspaceService.getWorkspaceMembers(
          currentWorkspace._id
        );
        const members = response.data?.data || response.data || [];

        // Filter out current user and filter by query
        const queryLower = query.toLowerCase();
        let filtered = members
          .filter((m) => {
            const userId = m.user?._id?.toString() || m._id?.toString();
            return userId !== currentUser?._id?.toString();
          })
          .map((m) => m.user || m);

        // If channelMembers provided, prioritize them
        if (channelMembers.length > 0) {
          const channelMemberIds = channelMembers.map((m) =>
            m._id?.toString()
          );
          const channelUsers = filtered.filter((u) =>
            channelMemberIds.includes(u._id?.toString())
          );
          const otherUsers = filtered.filter(
            (u) => !channelMemberIds.includes(u._id?.toString())
          );
          filtered = [...channelUsers, ...otherUsers];
        }

        // Filter by query
        if (queryLower) {
          filtered = filtered.filter(
            (u) =>
              u.name?.toLowerCase().includes(queryLower) ||
              u.email?.toLowerCase().includes(queryLower)
          );
        }

        // Limit to 10 results
        setUsers(filtered.slice(0, 10));
        setSelectedIndex(0);
      } catch (error) {
        console.error("Error fetching users for mentions:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 200);
    return () => clearTimeout(debounceTimer);
  }, [query, currentWorkspace?._id, currentUser?._id, channelMembers]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!users.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (users[selectedIndex]) {
          handleSelect(users[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose?.();
      }
    };

    if (position !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [users, selectedIndex, position, onClose]);

  const handleSelect = (user) => {
    onSelect?.(user);
    onClose?.();
  };

  if (position === null || (!users.length && !loading)) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        className="absolute z-50 bg-gray-800 border border-gray-800/50 rounded-lg shadow-xl max-h-64 overflow-y-auto min-w-[250px]"
        style={{
          bottom: "100%",
          left: position?.left || 0,
          marginBottom: "8px",
        }}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <div className="p-3 text-sm text-gray-400">Loading...</div>
        ) : users.length > 0 ? (
          <div className="p-1">
            {users.map((user, index) => (
              <motion.button
                key={user._id}
                onClick={() => handleSelect(user)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-600/20 text-white"
                    : "text-gray-300 hover:bg-gray-800/50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Avatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user.name}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-3 text-sm text-gray-400 flex items-center gap-2">
            <User className="w-4 h-4" />
            No users found
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MentionAutocomplete;

