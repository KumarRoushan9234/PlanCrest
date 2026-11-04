import { motion } from "framer-motion";
import React from "react";

/**
 * Channel Sidebar Component
 * Left sidebar for channel list
 */
const ChannelSidebar = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`w-80 border-r border-gray-800/50 bg-gray-950 flex flex-col ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default ChannelSidebar;
