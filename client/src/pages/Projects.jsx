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
  const { projects, loading, fetchWorkspaceProjects } = useProject();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("list"); // list or grid - list is default
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch projects when component mounts
  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchWorkspaceProjects();
    }
  }, [currentWorkspace?._id, fetchWorkspaceProjects]);

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
      <div className="text-white px-4 py-6">
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
                  ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
                  : "space-y-4 w-full"
              }
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project._id}
                  className={`bg-gray-900 border border-gray-800 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "list"
                      ? "flex items-center justify-between p-6 hover:bg-gray-800 hover:border-gray-700"
                      : "p-8 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 min-h-[280px] flex flex-col"
                  }`}
                  onClick={() => handleProjectClick(project)}
                  whileHover={viewMode === "grid" ? { y: -4, scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Grid View - Enhanced */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-gray-300 shadow-lg"
                            style={{ backgroundColor: project.color + "20" }}
                          >
                            {renderIcon(project.icon, 28)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-xl mb-1">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono">
                              {project.key}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.status
                            )} text-white`}
                          >
                            {getStatusText(project.status)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.privacy === "private"
                              ? "🔒 Private"
                              : "🌐 Public"}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {project.description || "No description provided"}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">
                            Progress
                          </span>
                          <span className="text-xs text-gray-400">
                            {project.progress || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">
                              {typeof project.members === "number"
                                ? project.members
                                : project.members?.length || 0}{" "}
                              members
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>
                              {project.updatedAt
                                ? new Date(
                                    project.updatedAt
                                  ).toLocaleDateString()
                                : "Never updated"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">
                            {project.priority || "Medium"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View - Enhanced */}
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0 shadow-lg"
                          style={{ backgroundColor: project.color + "20" }}
                        >
                          {renderIcon(project.icon, 24)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-bold text-white text-lg truncate">
                              {project.name}
                            </h3>
                            <span className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">
                              {project.key}
                            </span>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                project.status
                              )} text-white flex-shrink-0`}
                            >
                              {getStatusText(project.status)}
                            </div>
                            <div className="text-xs text-gray-500 flex-shrink-0">
                              {project.privacy === "private"
                                ? "🔒 Private"
                                : "🌐 Public"}
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                            {project.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {typeof project.members === "number"
                                  ? project.members
                                  : project.members?.length || 0}{" "}
                                members
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Created{" "}
                                {new Date(
                                  project.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>
                                {project.priority || "Medium"} priority
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress and Stats */}
                      <div className="flex items-center gap-8 text-sm text-gray-500 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-400">
                            Progress
                          </span>
                          <div className="w-20 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {project.progress || 0}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-400">Tasks</span>
                          <span className="font-medium">
                            {project.taskCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-400">
                            Last Activity
                          </span>
                          <span className="text-xs">
                            {project.lastActivityAt
                              ? new Date(
                                  project.lastActivityAt
                                ).toLocaleDateString()
                              : "Never"}
                          </span>
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
