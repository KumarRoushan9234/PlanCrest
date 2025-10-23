import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Settings,
  MoreHorizontal,
  FolderPlus,
  ChevronDown,
  FileText,
  Edit,
  Download,
  Upload,
} from "lucide-react";

const ProjectsTopNav = ({
  onCreateProject,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    filter: false,
    actions: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filterOptions = [
    { id: "all", label: "All Status" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "completed", label: "Completed" },
    { id: "archived", label: "Archived" },
  ];

  const actionOptions = [
    { id: "bulk-edit", label: "Bulk Edit", icon: Edit },
    { id: "export", label: "Export", icon: Download },
    { id: "import", label: "Import", icon: Upload },
    { id: "settings", label: "Project Settings", icon: Settings },
  ];

  return (
    <motion.nav
      className="w-full px-6 py-3 border-b border-gray-800/50 backdrop-blur-xl z-50"
      style={{
        backgroundColor: "rgba(10, 10, 11, 0.95)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Search and Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all duration-200 w-64"
            />
          </motion.div>

          {/* Filter Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("filter")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 ${
                expandedSections.filter
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">Filter</span>
              <motion.div
                animate={{ rotate: expandedSections.filter ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expandedSections.filter && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </div>
                    {filterOptions.map((option, index) => (
                      <motion.button
                        key={option.id}
                        onClick={() => {
                          setFilterStatus(option.id);
                          toggleSection("filter");
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-lg ${
                          filterStatus === option.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="flex-1 text-left font-medium">
                          {option.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Mode Toggle */}
          <motion.div
            className="flex items-center bg-gray-900/50 border border-gray-800 rounded-lg p-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Grid3X3 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <List className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* More Actions */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("actions")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 ${
                expandedSections.actions
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-xs font-medium">More</span>
            </motion.button>

            <AnimatePresence>
              {expandedSections.actions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                >
                  <div className="p-2">
                    {actionOptions.map((option, index) => {
                      const IconComponent = option.icon;
                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => {
                            toggleSection("actions");
                            // Handle action
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 rounded-lg"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-left font-medium">
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Create Project Button */}
          <motion.button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/30"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="text-xs font-semibold">Create Project</span>
          </motion.button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      <AnimatePresence>
        {(expandedSections.filter || expandedSections.actions) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setExpandedSections({ filter: false, actions: false });
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default ProjectsTopNav;
