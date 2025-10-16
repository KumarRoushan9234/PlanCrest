import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Settings,
  MoreHorizontal,
  FolderPlus,
  Users,
  BarChart3,
  Calendar,
  FileText,
  Star,
  Clock,
  Bell,
  X,
  Edit,
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
    { id: "export", label: "Export", icon: FileText },
    { id: "import", label: "Import", icon: FileText },
    { id: "settings", label: "Project Settings", icon: Settings },
  ];

  return (
    <motion.nav
      className="w-full px-6 py-4 border-b border-gray-800"
      style={{ backgroundColor: "#0f0f11" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Search and Filters */}
        <div className="flex items-center gap-4">
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
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
            />
          </motion.div>

          {/* Filter Options */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("filter")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <motion.div
                animate={{ rotate: expandedSections.filter ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {expandedSections.filter && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50"
              >
                {filterOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => {
                      setFilterStatus(option.id);
                      toggleSection("filter");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      filterStatus === option.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex-1 text-left">{option.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <motion.button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Grid3X3 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <List className="w-4 h-4" />
            </motion.button>
          </div>

          {/* More Actions */}
          <div className="relative">
            <motion.button
              onClick={() => toggleSection("actions")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
              <motion.div
                animate={{ rotate: expandedSections.actions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {expandedSections.actions && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50"
              >
                {actionOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => {
                        toggleSection("actions");
                        // Handle action
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      whileHover={{ x: 5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{option.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Create Project Button */}
          <motion.button
            onClick={onCreateProject}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-green-500/25 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Project</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default ProjectsTopNav;
