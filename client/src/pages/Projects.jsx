import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderPlus,
  Search,
  Filter,
  Grid3X3,
  List,
  Settings,
  Users,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Calendar,
  BarChart3,
  FileText,
  Star,
  Clock,
} from "lucide-react";
import { useProject } from "../contexts/ProjectContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import Layout from "../components/common-afterauth/Layout";

const Projects = () => {
  const { projects, currentProject, switchProject, deleteProject, loading } =
    useProject();
  const { currentWorkspace } = useWorkspace();
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProjects, setSelectedProjects] = useState([]);

  // Filter projects based on search and filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleProjectSelect = (project) => {
    if (selectedProjects.includes(project._id)) {
      setSelectedProjects(selectedProjects.filter((id) => id !== project._id));
    } else {
      setSelectedProjects([...selectedProjects, project._id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await Promise.all(selectedProjects.map((id) => deleteProject(id)));
        setSelectedProjects([]);
      } catch (error) {
        console.error("Error deleting projects:", error);
        alert("Failed to delete projects");
      }
    }
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
    <Layout>
      <div className="text-white">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 mt-1">
              Manage all your projects in {currentWorkspace?.name}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* View Mode and Actions */}
            <div className="flex items-center gap-4">
              {selectedProjects.length > 0 && (
                <motion.button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-red-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedProjects.length})</span>
                </motion.button>
              )}

              <div className="flex items-center bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
                  : "space-y-4"
              }
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project._id}
                  className={`bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200 cursor-pointer ${
                    selectedProjects.includes(project._id)
                      ? "ring-2 ring-blue-500"
                      : ""
                  } ${
                    viewMode === "list"
                      ? "flex items-center justify-between"
                      : ""
                  }`}
                  onClick={() => handleProjectSelect(project._id)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: project.color + "20" }}
                          >
                            {project.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-400">
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

                      <div className="flex items-center justify-between text-sm text-gray-500">
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
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: project.color + "20" }}
                        >
                          {project.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white">
                              {project.name}
                            </h3>
                            <span className="text-sm text-gray-400">
                              ({project.key})
                            </span>
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(
                                project.status
                              )}`}
                            ></div>
                            <span className="text-xs text-gray-400">
                              {getStatusText(project.status)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {project.description || "No description provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{project.members?.length || 0} members</span>
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
