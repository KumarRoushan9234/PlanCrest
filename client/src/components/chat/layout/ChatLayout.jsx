import { motion } from "framer-motion";
import React from "react";

/**
 * Chat Layout Component
 * Main layout wrapper for chat interface
 */
const ChatLayout = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`flex h-full w-full bg-gray-900 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
};

export default ChatLayout;
