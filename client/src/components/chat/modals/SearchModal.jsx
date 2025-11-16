import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Hash, User, Link as LinkIcon, File, Users } from "lucide-react";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import chatService from "../../../services/chatService";
import { formatMessageTime } from "../../../utils/dateFormatter";
import { Avatar } from "../shared";

/**
 * Search Modal Component
 * Search interface for messages and people
 */
const SearchModal = ({ isOpen, onClose }) => {
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageResults, setMessageResults] = useState([]);
  const [peopleResults, setPeopleResults] = useState([]);
  const [activeTab, setActiveTab] = useState("messages"); // "messages" | "people"
  const [filters, setFilters] = useState({
    channelId: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    hasLinks: false,
    hasFiles: false,
  });

  // Fetch workspace members for people search
  const fetchPeople = async () => {
    if (!currentWorkspace?._id || !query.trim()) {
      setPeopleResults([]);
      return;
    }

    try {
      const { workspaceService } = await import("../../../services/workspaceService");
      const response = await workspaceService.getWorkspaceMembers(currentWorkspace._id);
      const members = response.data || [];
      
      const queryLower = query.toLowerCase();
      const filtered = members.filter(
        (member) =>
          member.user?.name?.toLowerCase().includes(queryLower) ||
          member.user?.email?.toLowerCase().includes(queryLower)
      );
      setPeopleResults(filtered);
    } catch (error) {
      console.error("Error fetching people:", error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || !currentWorkspace?._id) return;

    try {
      setLoading(true);
      const searchParams = {
        query: query.trim(),
        ...filters,
      };

      // Remove empty filters
      Object.keys(searchParams).forEach((key) => {
        if (searchParams[key] === "" || searchParams[key] === false) {
          delete searchParams[key];
        }
      });

      const response = await chatService.searchMessages(
        currentWorkspace._id,
        searchParams
      );
      setMessageResults(response.data || []);
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (activeTab === "messages") {
        handleSearch();
      } else {
        fetchPeople();
      }
    }
  };

  useEffect(() => {
    if (isOpen && query.trim()) {
      const debounceTimer = setTimeout(() => {
        if (activeTab === "messages") {
          handleSearch();
        } else {
          fetchPeople();
        }
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [query, filters, isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-[#1a1b1d] rounded-xl border border-gray-800/50 shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-white">Search</h2>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "messages"
                  ? "text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "people"
                  ? "text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              People
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeTab === "messages" ? "Search messages..." : "Search people..."}
                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Filters - Only for messages */}
            {activeTab === "messages" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  onClick={() => setFilters({ ...filters, hasLinks: !filters.hasLinks })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    filters.hasLinks
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-gray-900/50 text-gray-400 border border-gray-800/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LinkIcon className="w-4 h-4" />
                  Has Links
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setFilters({ ...filters, hasFiles: !filters.hasFiles })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    filters.hasFiles
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-gray-900/50 text-gray-400 border border-gray-800/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <File className="w-4 h-4" />
                  Has Files
                </motion.button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === "messages" ? (
              messageResults.length === 0 && query ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                  <p>No messages found</p>
                </div>
              ) : messageResults.length > 0 ? (
                <div className="space-y-4">
                  {messageResults.map((message) => (
                    <motion.div
                      key={message._id}
                      className="p-4 bg-gray-900/30 rounded-lg border border-gray-800/50 hover:border-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex gap-3">
                        <Avatar user={message.sender} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {message.sender?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {message.channel && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {message.channel.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                  <p>Enter a search query to find messages</p>
                </div>
              )
            ) : (
              peopleResults.length === 0 && query ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                  <p>No people found</p>
                </div>
              ) : peopleResults.length > 0 ? (
                <div className="space-y-2">
                  {peopleResults.map((member) => (
                    <motion.div
                      key={member._id}
                      className="p-3 bg-gray-900/30 rounded-lg border border-gray-800/50 hover:border-gray-700/50 transition-colors flex items-center gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Avatar user={member.user} size="md" />
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">
                          {member.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{member.user?.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                  <p>Enter a search query to find people</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchModal;
