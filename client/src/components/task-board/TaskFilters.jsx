import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Flag, 
  X,
  ChevronDown,
  Clock,
  AlertTriangle
} from "lucide-react";

const TaskFilters = ({ filters, onFilterChange, projects, currentWorkspace }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const filterOptions = {
    status: [
      { value: "all", label: "All Status", icon: "📋" },
      { value: "todo", label: "To Do", icon: "📝" },
      { value: "in_progress", label: "In Progress", icon: "⚡" },
      { value: "completed", label: "Completed", icon: "✅" }
    ],
    priority: [
      { value: "all", label: "All Priorities", icon: "🔍" },
      { value: "high", label: "High Priority", icon: "🔴", color: "text-red-500" },
      { value: "medium", label: "Medium Priority", icon: "🟡", color: "text-yellow-500" },
      { value: "low", label: "Low Priority", icon: "🟢", color: "text-green-500" }
    ],
    assignee: [
      { value: "all", label: "All Assignees", icon: "👥" },
      { value: "me", label: "Assigned to Me", icon: "👤", color: "text-purple-500" },
      { value: "unassigned", label: "Unassigned", icon: "❓", color: "text-gray-500" }
    ],
    dueDate: [
      { value: "all", label: "All Dates", icon: "📅" },
      { value: "overdue", label: "Overdue", icon: "⚠️", color: "text-red-500" },
      { value: "today", label: "Due Today", icon: "🔥", color: "text-orange-500" },
      { value: "thisWeek", label: "This Week", icon: "📆", color: "text-blue-500" },
      { value: "nextWeek", label: "Next Week", icon: "📅", color: "text-gray-500" }
    ]
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      status: "all",
      priority: "all", 
      assignee: "all",
      project: "all",
      dueDate: "all",
      search: ""
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "all" && value !== "") count++;
    });
    return count;
  };

  const getFilterIcon = (filterType) => {
    const icons = {
      status: "📋",
      priority: "🏷️", 
      assignee: "👤",
      project: "📁",
      dueDate: "📅",
      search: "🔍"
    };
    return icons[filterType] || "🔍";
  };

  const getFilterLabel = (filterType, value) => {
    const options = filterOptions[filterType] || [];
    const option = options.find(opt => opt.value === value);
    return option ? option.label : "All";
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 border border-gray-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>

        {getActiveFilterCount() > 0 && (
          <motion.button
            onClick={clearAllFilters}
            className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear All</span>
          </motion.button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value === "all" || value === "") return null;
            return (
              <motion.div
                key={key}
                className="flex items-center space-x-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <span>{getFilterIcon(key)}</span>
                <span>{getFilterLabel(key, value)}</span>
                <button
                  onClick={() => handleFilterChange(key, "all")}
                  className="hover:text-white transition-colors duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  {filterOptions.status.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange("priority", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  {filterOptions.priority.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={filters.assignee}
                  onChange={(e) => handleFilterChange("assignee", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  {filterOptions.assignee.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <select
                  value={filters.dueDate}
                  onChange={(e) => handleFilterChange("dueDate", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  {filterOptions.dueDate.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Tasks
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, description, or labels..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskFilters;
