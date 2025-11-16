import React from "react";
import { motion } from "framer-motion";

/**
 * Chat Layout Component
 * Main layout wrapper for chat interface
 */
const ChatLayout = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`flex h-full bg-[#171819] ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default ChatLayout;
