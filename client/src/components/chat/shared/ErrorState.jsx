import { motion } from "framer-motion";
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Error State Component
 * Displays error message with retry button
 */
const ErrorState = ({
  title = "Something went wrong",
  message = "Failed to load. Please try again.",
  onRetry,
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
        className="mb-4 p-4 bg-red-500/10 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <AlertCircle className="w-8 h-8 text-red-500" />
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
        className="text-sm text-gray-500 text-center max-w-md mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorState;

