import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Users,
  Calendar,
  Star,
  Folder,
  Globe,
  Smartphone,
  Palette,
  PenTool,
  Megaphone,
  Wrench,
  Rocket,
  Lightbulb,
  Target,
  Activity,
  Building,
  Database,
  Bug,
  Map,
  Zap,
  BarChart3,
} from "lucide-react";
import { useProject } from "../contexts/ProjectContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import Layout from "../components/common-afterauth/Layout";
import { maskId } from "../utils/idMasker";

const Projects = () => {
  const { projects, loading } = useProject();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("list"); // list or grid - list is default
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Helper function to render icon components
  const renderIcon = (iconName, size = 24) => {
    const iconMap = {
      Folder,
      Globe,
      Smartphone,
      Palette,
      BarChart3,
      PenTool,
      Megaphone,
      Wrench,
      Rocket,
      Lightbulb,
      Target,
      Activity,
      Building,
      Database,
      Bug,
      Map,
      Zap,
    };

    const IconComponent = iconMap[iconName] || Folder;
    return <IconComponent size={size} />;
  };

  // Filter projects based on search and filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleProjectClick = (project) => {
    const maskedId = maskId(project._id);
    navigate(`/project/${maskedId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "completed":
        return "Completed";
      case "archived":
        return "Archived";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      projectsPageProps={{
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        viewMode,
        setViewMode,
      }}
    >
      <div className="text-white px-6 py-6">
        {/* Projects Grid/List */}
        <div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderPlus className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No projects found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first project using the Create Project button above"}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-3 max-w-4xl"
              }
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project._id}
                  className={`bg-gray-900 border border-gray-800 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "list"
                      ? "flex items-center justify-between p-4 hover:bg-gray-800"
                      : "p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
                  }`}
                  onClick={() => handleProjectClick(project)}
                  whileHover={viewMode === "grid" ? { y: -2, scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-300"
                            style={{ backgroundColor: project.color + "20" }}
                          >
                            {renderIcon(project.icon, 24)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-lg truncate">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {project.key}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(
                              project.status
                            )}`}
                          ></div>
                          <span className="text-xs text-gray-400">
                            {getStatusText(project.status)}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {project.description || "No description provided"}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{project.members?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{project.priority || "Medium"}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0"
                          style={{ backgroundColor: project.color + "20" }}
                        >
                          {renderIcon(project.icon, 20)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {project.name}
                            </h3>
                            <span className="text-sm text-gray-400 flex-shrink-0">
                              ({project.key})
                            </span>
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(
                                project.status
                              )}`}
                            ></div>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {getStatusText(project.status)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm truncate">
                            {project.description || "No description provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{project.members?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{project.priority || "Medium"}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
