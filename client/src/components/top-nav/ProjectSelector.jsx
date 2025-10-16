import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Grid3X3,
} from "lucide-react";
import { useProject } from "../../contexts/ProjectContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const ProjectSelector = ({ onCreateProject }) => {
  const { projects, currentProject, switchProject, loading } = useProject();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleProjectSelect = (project) => {
    switchProject(project);
    setIsOpen(false);
  };

  const getProjectIcon = (icon) => {
    return icon || "📁";
  };

  const getProjectColor = (color) => {
    return color || "#6366f1";
  };

  const displayedProjects = showAll ? projects : projects.slice(0, 5);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 group"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
        >
          <Folder className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </motion.div>
        <span className="font-medium text-sm">
          {currentProject ? currentProject.name : "Select Project"}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50"
            style={{
              backgroundColor: "#0a0a0a",
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Projects</h3>
                <span className="text-xs text-gray-400">
                  {projects.length} project{projects.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Projects List */}
            <div className="max-h-64 overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="p-4 text-gray-400 text-sm text-center">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-gray-400 text-sm mb-3">
                    No projects yet
                  </div>
                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      onCreateProject();
                    }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-green-500/25 text-sm mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Project</span>
                  </motion.button>
                </div>
              ) : (
                <>
                  {displayedProjects.map((project, index) => (
                    <motion.button
                      key={project._id}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                        currentProject?._id === project._id
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ x: 5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: getProjectColor(project.color),
                        }}
                      >
                        {getProjectIcon(project.icon)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {project.description || "No description"}
                        </div>
                      </div>
                      {project.status === "on_hold" && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      )}
                      {project.status === "completed" && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </motion.button>
                  ))}

                  {projects.length > 5 && (
                    <motion.button
                      onClick={() => setShowAll(!showAll)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                      whileHover={{ x: 5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="font-medium">
                        {showAll
                          ? "Show Less"
                          : `Show All (${projects.length})`}
                      </span>
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {projects.length > 0 && (
              <div className="p-3 border-t border-gray-600 space-y-2">
                <motion.button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/projects");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>View All Projects</span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsOpen(false);
                    onCreateProject();
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-green-500/25 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create New Project</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectSelector;
