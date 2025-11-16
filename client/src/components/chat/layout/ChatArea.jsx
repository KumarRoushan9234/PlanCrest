import React from "react";
import { motion } from "framer-motion";

/**
 * Chat Area Component
 * Main chat area container
 */
const ChatArea = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`flex-1 flex flex-col bg-gray-950 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export default ChatArea;

