import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Hash, User, Calendar, Link as LinkIcon, File } from "lucide-react";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import chatService from "../../../services/chatService";
import { formatMessageTime } from "../../../utils/dateFormatter";
import { Avatar } from "../shared";

/**
 * Search Modal Component
 * Search interface for messages
 */
const SearchModal = ({ isOpen, onClose }) => {
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({
    channelId: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    hasLinks: false,
    hasFiles: false,
  });

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
      setResults(response.data || []);
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    if (isOpen && query.trim()) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [query, filters, isOpen]);

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
          className="relative bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Search Messages</h2>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                type="button"
                onClick={() => setFilters({ ...filters, hasLinks: !filters.hasLinks })}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  filters.hasLinks
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
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
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <File className="w-4 h-4" />
                Has Files
              </motion.button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length === 0 && query ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                <p>No messages found</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((message) => (
                  <motion.div
                    key={message._id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
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
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
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
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchModal;

