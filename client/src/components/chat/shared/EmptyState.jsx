import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

/**
 * Empty State Component
 * Displays empty state with icon and message
 */
const EmptyState = ({
  icon: Icon = MessageSquare,
  title = "No messages yet",
  description = "Start the conversation below",
  className = "",
}) => {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="mb-4 p-4 bg-gray-900/50 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <Icon className="w-8 h-8 text-gray-500" />
      </motion.div>
      <motion.h3
        className="text-lg font-semibold text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-sm text-gray-500 text-center max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default EmptyState;
