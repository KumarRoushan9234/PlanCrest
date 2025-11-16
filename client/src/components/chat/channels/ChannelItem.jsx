import React from "react";
import { motion } from "framer-motion";
import { Hash, Users, MoreVertical, Trash2 } from "lucide-react";

/**
 * Channel Item Component
 * Single channel item in the channel list
 */
const ChannelItem = ({
  channel,
  isSelected = false,
  onClick,
  unreadCount = 0,
  onDelete,
  showMenu = false,
  onMenuClick,
}) => {
  const isDirect = channel.category === "direct";

  return (
    <div className="relative group">
      <motion.div
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1
          transition-all duration-200 cursor-pointer
          ${
            isSelected
              ? "bg-blue-600/20 text-white border border-blue-500/30"
              : "text-gray-300 hover:bg-gray-800/50"
          }
        `}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={onClick}
      >
        {isDirect ? (
          <Users className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Hash className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-sm font-medium truncate">
          {channel.name}
        </span>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-semibold"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick?.(channel._id);
          }}
          className="p-1 rounded hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MoreVertical className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {showMenu && (
        <motion.div
          className="absolute top-0 right-0 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 p-1 min-w-[120px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(channel._id);
              onMenuClick?.(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ChannelItem;
