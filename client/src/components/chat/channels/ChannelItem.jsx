import React from "react";
import { motion } from "framer-motion";
import { Hash, Users } from "lucide-react";

/**
 * Channel Item Component
 * Single channel item in the channel list
 */
const ChannelItem = ({
  channel,
  isSelected = false,
  onClick,
  unreadCount = 0,
}) => {
  const isDirect = channel.category === "direct";

  return (
    <motion.button
      className={`
        w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1
        transition-all duration-200
        ${
          isSelected
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            : "text-gray-300 hover:bg-gray-800"
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
    </motion.button>
  );
};

export default ChannelItem;

