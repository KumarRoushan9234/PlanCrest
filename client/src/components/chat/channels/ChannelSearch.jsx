import { motion } from "framer-motion";
import React from "react";
import { Search, X } from "lucide-react";

/**
 * Channel Search Component
 * Search input for filtering channels
 */
const ChannelSearch = ({ value, onChange, onClear, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search channels..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-8 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
      />
      {value && (
        <motion.button
          onClick={onClear}
          className="absolute right-2 top-2.5 p-1 text-gray-500 hover:text-white rounded transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default ChannelSearch;
