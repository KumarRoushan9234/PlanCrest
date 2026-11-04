import { motion } from "framer-motion";
import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading State Component
 * Displays loading skeleton or spinner
 */
const LoadingState = ({ type = "spinner", count = 3, className = "" }) => {
  if (type === "spinner") {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-6 h-6 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  // Skeleton loader
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="flex gap-3 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="w-8 h-8 rounded-full bg-gray-900/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-gray-900/50 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-900/50 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-900/50 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LoadingState;

