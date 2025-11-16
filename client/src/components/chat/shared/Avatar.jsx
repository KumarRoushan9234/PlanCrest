import React from "react";
import { motion } from "framer-motion";

/**
 * Avatar Component
 * Displays user avatar with optional status indicator
 */
const Avatar = ({
  user,
  size = "md",
  showStatus = false,
  status = "offline",
  className = "",
}) => {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
  };

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    offline: "bg-gray-500",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = user?.avatar;
  const userName = user?.name || "User";
  const initials = getInitials(userName);

  return (
    <div className={`relative inline-flex ${className}`}>
      {avatarUrl ? (
        <motion.img
          src={avatarUrl}
          alt={userName}
          className={`${sizes[size]} rounded-full object-cover border-2 border-gray-800/50`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        />
      ) : (
        <motion.div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold border-2 border-gray-800/50`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {initials}
        </motion.div>
      )}

      {showStatus && (
        <motion.div
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-gray-900`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  );
};

export default Avatar;

