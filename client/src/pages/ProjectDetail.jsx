import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Users,
  Activity,
  Settings,
} from "lucide-react";
import Layout from "../components/common-afterauth/Layout";
import { useProject } from "../contexts/ProjectContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { unmaskId } from "../utils/idMasker";
import { projectService } from "../services/projectService";
import {
  TasksPanel,
  MembersPanel,
  ActivityPanel,
  SettingsPanel,
} from "../components/project-panels";

const ProjectDetail = () => {
  const { maskedId } = useParams();
  const navigate = useNavigate();
  const projectId = unmaskId(maskedId);
  const { currentWorkspace } = useWorkspace();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchProjectStats();
    }
  }, [projectId]);

  useEffect(() => {
    if (project && currentWorkspace) {
      // Check if user is admin/owner
      const userRole = currentWorkspace.members?.find(
        (m) => m.user?._id === currentWorkspace.owner
      );
      setIsAdmin(
        currentWorkspace.owner === currentWorkspace.currentUser ||
          userRole?.role === "admin"
      );
    }
  }, [project, currentWorkspace]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProject(projectId);
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const response = await projectService.getProjectStats(projectId);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      // Set default stats if fetching fails
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        progressRate: 0,
        totalMembers: 0,
        activeMembers: 0,
      });
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

  const handleProjectUpdated = () => {
    fetchProjectDetails();
  };

  const handleProjectDeleted = () => {
    // Refresh projects and navigate
    fetchProjects();
    navigate("/projects", { replace: true });
  };

  const handleEdit = () => {
    setActiveTab("settings");
  };

  const handleSettings = () => {
    setActiveTab("settings");
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await projectService.deleteProject(project._id);
      // Refresh projects and navigate
      fetchProjects();
      navigate("/projects", { replace: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
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

  if (!project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              The project you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/projects")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      projectDetailPageProps={{
        project,
        onEdit: handleEdit,
        onSettings: handleSettings,
        onDelete: isAdmin ? handleDelete : null,
      }}
    >
      <div className="min-h-screen bg-gray-900">
        {/* Project Description Section - Full Width */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="w-full px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  ></div>
                  <span className="text-sm text-gray-400 font-medium">
                    {getStatusText(project.status)}
                  </span>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                  {project.description ||
                    "No description provided for this project."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Full Width */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="w-full px-6">
            <div className="flex items-center gap-8">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "tasks", label: "Tasks", icon: CheckCircle2 },
                { id: "members", label: "Members", icon: Users },
                { id: "activity", label: "Activity", icon: Activity },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "text-blue-400 border-blue-400"
                        : "text-gray-400 border-transparent hover:text-white hover:border-gray-600"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area - Full Width */}
        <div className="w-full px-6 py-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-medium uppercase">
                      Total Tasks
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {stats?.totalTasks || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    {stats?.completedTasks || 0} completed
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-medium uppercase">
                      Team Members
                    </h3>
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {stats?.totalMembers || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    {stats?.activeMembers || 0} active
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-medium uppercase">
                      Progress
                    </h3>
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {stats?.progressRate || 0}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {stats?.progressRate >= 70
                      ? "On track"
                      : stats?.progressRate >= 40
                      ? "In progress"
                      : "Getting started"}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-medium uppercase">
                      Created
                    </h3>
                    <Activity className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(project.createdAt).getFullYear()}
                  </p>
                </motion.div>
              </div>

              {/* Recent Activity Placeholder */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Overview
                </h3>
                <div className="text-gray-400 text-sm">
                  <p>
                    This project was created on{" "}
                    {new Date(project.createdAt).toLocaleDateString()}. Use the
                    tabs above to manage tasks, members, view activity, and
                    configure settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <TasksPanel project={project} isAdmin={isAdmin} />
          )}

          {activeTab === "members" && (
            <MembersPanel
              project={project}
              isAdmin={isAdmin}
              onMembersUpdated={handleProjectUpdated}
            />
          )}

          {activeTab === "activity" && <ActivityPanel project={project} />}

          {activeTab === "settings" && (
            <SettingsPanel
              project={project}
              isAdmin={isAdmin}
              onProjectUpdated={handleProjectUpdated}
              onProjectDeleted={handleProjectDeleted}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;
