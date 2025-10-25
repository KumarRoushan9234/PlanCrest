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
import ProjectSidebar from "../components/sidebar/ProjectSidebar";

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
  const [memberCount, setMemberCount] = useState(0);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("edit"); // edit or settings

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchProjectStats();
      fetchMemberCount();
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

  const fetchMemberCount = async () => {
    try {
      const response = await projectService.getProjectMembers(projectId);
      setMemberCount(response.data?.length || 0);
    } catch (error) {
      console.error("Error fetching member count:", error);
      setMemberCount(0);
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
    // Navigate back to projects page
    navigate("/projects", { replace: true });
  };

  const handleEdit = () => {
    setSidebarMode("edit");
    setShowProjectSidebar(true);
  };

  const handleSettings = () => {
    setSidebarMode("settings");
    setShowProjectSidebar(true);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/project/${maskedId}`;
    try {
      await navigator.clipboard.writeText(url);
      // You can add a toast notification here
      console.log("Project link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/project/${maskedId}`;
    const text = `Check out this project: ${project.name}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      text + " " + url
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleTwitterShare = () => {
    const url = `${window.location.origin}/project/${maskedId}`;
    const text = `Check out this project: ${project.name}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank");
  };

  const handleLinkedInShare = () => {
    const url = `${window.location.origin}/project/${maskedId}`;
    const text = `Check out this project: ${project.name}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}&title=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, "_blank");
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
      // Navigate back to projects page
      navigate("/projects", { replace: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleArchive = async () => {
    if (
      !confirm(
        "Are you sure you want to archive this project? You can unarchive it later."
      )
    ) {
      return;
    }

    try {
      await projectService.updateProject(project._id, { status: "archived" });
      // Refresh project details to show updated status
      fetchProjectDetails();
      alert("Project archived successfully!");
    } catch (error) {
      console.error("Error archiving project:", error);
      alert("Failed to archive project. Please try again.");
    }
  };

  const handleTaskRefresh = () => {
    console.log("🔄 Refreshing project data after task changes");
    // Refresh project data to show updated task counts
    fetchProjectDetails();
    fetchProjectStats();
    fetchMemberCount();
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
        project: { ...project, members: memberCount },
        onEdit: handleEdit,
        onSettings: handleSettings,
        onDelete: isAdmin ? handleDelete : null,
        onArchive: isAdmin ? handleArchive : null,
        onShare: handleShare,
        onWhatsAppShare: handleWhatsAppShare,
        onTwitterShare: handleTwitterShare,
        onLinkedInShare: handleLinkedInShare,
      }}
    >
      <div className="min-h-screen bg-gray-950">
        {/* Project Description Section - SMALLER */}
        <div className="border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
          <div className="w-full px-4 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg`}
                    style={{ backgroundColor: project.color }}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white mb-0.5">
                      {project.name}
                    </h1>
                    <p className="text-[10px] text-gray-400">
                      Key:{" "}
                      <span className="font-mono text-gray-300">
                        {project.key}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
                      project.status
                    )} text-white`}
                  >
                    {getStatusText(project.status)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed max-w-4xl">
                  {project.description ||
                    "No description provided for this project."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - SMALLER */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-16 z-10">
          <div className="w-full px-4">
            <div className="flex items-center gap-0.5">
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
                    className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium transition-all border-b-2 ${
                      activeTab === tab.id
                        ? "text-blue-400 border-blue-400 bg-blue-500/5"
                        : "text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/30"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area - SMALLER */}
        <div className="w-full px-4 py-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Stats Overview - SMALLER */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <motion.div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                      Total Tasks
                    </h3>
                    <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">
                    {stats?.totalTasks || 0}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {stats?.completedTasks || 0} completed
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                      Team Members
                    </h3>
                    <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-green-400" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">
                    {stats?.totalMembers || 0}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {stats?.activeMembers || 0} active
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                      Progress
                    </h3>
                    <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">
                    {stats?.progressRate || 0}%
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {stats?.progressRate >= 70
                      ? "On track"
                      : stats?.progressRate >= 40
                      ? "In progress"
                      : "Getting started"}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                      Created
                    </h3>
                    <div className="w-7 h-7 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white mb-1">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(project.createdAt).getFullYear()}
                  </p>
                </motion.div>
              </div>

              {/* Quick Overview - SMALLER */}
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4"
                whileHover={{ borderColor: "rgb(55, 65, 81)" }}
              >
                <h3 className="text-sm font-bold text-white mb-3">
                  Quick Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Project Lead
                    </p>
                    <p className="text-xs text-white font-semibold">
                      {project.lead?.name || "Not assigned"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Privacy
                    </p>
                    <p className="text-xs text-white font-semibold flex items-center gap-1.5">
                      {project.privacy === "private"
                        ? "🔒 Private"
                        : "🌐 Public"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </p>
                    <p className="text-xs text-white font-semibold">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "tasks" && (
            <TasksPanel
              project={project}
              isAdmin={isAdmin}
              onTaskRefresh={handleTaskRefresh}
            />
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

      {/* Project Sidebar */}
      <ProjectSidebar
        isOpen={showProjectSidebar}
        onClose={() => setShowProjectSidebar(false)}
        project={project}
        mode={sidebarMode}
        onUpdate={(updatedProject) => {
          setProject(updatedProject);
          fetchProjectDetails();
        }}
        onDelete={handleProjectDeleted}
      />
    </Layout>
  );
};

export default ProjectDetail;
