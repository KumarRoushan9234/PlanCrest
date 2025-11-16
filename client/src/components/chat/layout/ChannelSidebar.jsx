import React from "react";
import { motion } from "framer-motion";

/**
 * Channel Sidebar Component
 * Left sidebar container for channel list
 */
const ChannelSidebar = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`w-64 border-r border-gray-800 bg-gray-900 flex flex-col ${className}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default ChannelSidebar;

