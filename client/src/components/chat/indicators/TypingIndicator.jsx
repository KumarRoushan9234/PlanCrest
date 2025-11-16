import React from "react";
import { motion } from "framer-motion";

/**
 * Typing Indicator Component
 * Shows animated typing dots
 */
const TypingIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;

  const userNames = users.slice(0, 2).join(", ");
  const moreCount = users.length > 2 ? users.length - 2 : 0;
  const text =
    users.length === 1
      ? `${userNames} is typing...`
      : moreCount > 0
      ? `${userNames} and ${moreCount} more are typing...`
      : `${userNames} are typing...`;

  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <span>{text}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default TypingIndicator;

