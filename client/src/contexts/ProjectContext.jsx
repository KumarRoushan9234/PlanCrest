import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { projectService } from "../services/projectService";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch projects when workspace changes
  useEffect(() => {
    if (isAuthenticated && currentWorkspace?._id) {
      fetchWorkspaceProjects();
    }
  }, [isAuthenticated, currentWorkspace?._id]);

  // Fetch templates when component mounts
  // Removed fetchTemplates call since we're using pre-created projects in the modal

  const fetchWorkspaceProjects = useCallback(async () => {
    if (!currentWorkspace?._id) return;

    try {
      setLoading(true);
      const response = await projectService.getWorkspaceProjects(
        currentWorkspace._id
      );
      setProjects(response.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  // Removed fetchTemplates function since we're using pre-created projects in the modal

  const createProject = async (projectData) => {
    if (!currentWorkspace?._id) {
      throw new Error("No workspace selected");
    }

    try {
      setLoading(true);
      const response = await projectService.createProject(
        currentWorkspace._id,
        projectData
      );
      const newProject = response.data;

      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);

      toast.success("Project created successfully!");
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.error || "Failed to create project");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProjectFromTemplate = async (templateData) => {
    if (!currentWorkspace?._id) {
      throw new Error("No workspace selected");
    }

    try {
      setLoading(true);
      const response = await projectService.createProjectFromTemplate(
        currentWorkspace._id,
        templateData
      );
      const newProject = response.data;

      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);

      toast.success("Project created from template successfully!");
      return newProject;
    } catch (error) {
      console.error("Error creating project from template:", error);
      toast.error(error.error || "Failed to create project from template");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updateData) => {
    try {
      setLoading(true);
      const response = await projectService.updateProject(
        projectId,
        updateData
      );
      const updatedProject = response.data;

      setProjects((prev) =>
        prev.map((project) =>
          project._id === projectId ? updatedProject : project
        )
      );

      if (currentProject?._id === projectId) {
        setCurrentProject(updatedProject);
      }

      toast.success("Project updated successfully!");
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error.error || "Failed to update project");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      await projectService.deleteProject(projectId);

      setProjects((prev) =>
        prev.filter((project) => project._id !== projectId)
      );

      if (currentProject?._id === projectId) {
        setCurrentProject(projects[0] || null);
      }

      toast.success("Project archived successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.error || "Failed to archive project");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchProject = async (project) => {
    try {
      setCurrentProject(project);

      // Fetch project members when switching projects
      if (project?._id) {
        await fetchProjectMembers(project._id);
      }
    } catch (error) {
      console.error("Error switching project:", error);
      toast.error("Failed to switch project");
    }
  };

  const fetchProjectMembers = async (projectId) => {
    try {
      const response = await projectService.getProjectMembers(projectId);
      setProjectMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching project members:", error);
      toast.error("Failed to fetch project members");
    }
  };

  const addProjectMember = async (projectId, memberData) => {
    try {
      const response = await projectService.addProjectMember(
        projectId,
        memberData
      );
      const newMember = response.data;

      setProjectMembers((prev) => [...prev, newMember]);
      toast.success("Member added successfully!");
      return newMember;
    } catch (error) {
      console.error("Error adding project member:", error);
      toast.error(error.error || "Failed to add member");
      throw error;
    }
  };

  const updateProjectMember = async (projectId, userId, updateData) => {
    try {
      const response = await projectService.updateProjectMember(
        projectId,
        userId,
        updateData
      );
      const updatedMember = response.data;

      setProjectMembers((prev) =>
        prev.map((member) =>
          member.user._id === userId ? updatedMember : member
        )
      );

      toast.success("Member updated successfully!");
      return updatedMember;
    } catch (error) {
      console.error("Error updating project member:", error);
      toast.error(error.error || "Failed to update member");
      throw error;
    }
  };

  const removeProjectMember = async (projectId, userId) => {
    try {
      await projectService.removeProjectMember(projectId, userId);

      setProjectMembers((prev) =>
        prev.filter((member) => member.user._id !== userId)
      );
      toast.success("Member removed successfully!");
    } catch (error) {
      console.error("Error removing project member:", error);
      toast.error(error.error || "Failed to remove member");
      throw error;
    }
  };

  const getProjectBoards = async (projectId) => {
    try {
      const response = await projectService.getProjectBoards(projectId);
      return response.data;
    } catch (error) {
      console.error("Error fetching project boards:", error);
      toast.error("Failed to fetch project boards");
      throw error;
    }
  };

  const createBoard = async (projectId, boardData) => {
    try {
      const response = await projectService.createBoard(projectId, boardData);
      toast.success("Board created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error(error.error || "Failed to create board");
      throw error;
    }
  };

  const updateProjectSettings = async (projectId, settingsData) => {
    try {
      setLoading(true);
      const response = await projectService.updateProjectSettings(
        projectId,
        settingsData
      );
      const updatedProject = response.data;

      setProjects((prev) =>
        prev.map((project) =>
          project._id === projectId ? updatedProject : project
        )
      );

      if (currentProject?._id === projectId) {
        setCurrentProject(updatedProject);
      }

      toast.success("Project settings updated successfully!");
      return updatedProject;
    } catch (error) {
      console.error("Error updating project settings:", error);
      toast.error(error.error || "Failed to update project settings");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addProjectMembersBulk = async (projectId, userIds) => {
    try {
      const response = await projectService.addProjectMembersBulk(
        projectId,
        userIds
      );
      const addedMembers = response.data;

      setProjectMembers((prev) => [...prev, ...addedMembers]);
      toast.success(`${addedMembers.length} member(s) added successfully!`);
      return addedMembers;
    } catch (error) {
      console.error("Error adding project members:", error);
      toast.error(error.error || "Failed to add members");
      throw error;
    }
  };

  const getProjectTemplates = async (workspaceId) => {
    try {
      const response = await projectService.getProjectTemplates(workspaceId);
      return response.data || { global: [], workspace: [] };
    } catch (error) {
      console.error("Error fetching project templates:", error);
      toast.error("Failed to fetch project templates");
      throw error;
    }
  };

  const value = {
    projects,
    currentProject,
    projectMembers,
    loading,
    createProject,
    createProjectFromTemplate,
    updateProject,
    deleteProject,
    switchProject,
    fetchWorkspaceProjects,
    fetchProjectMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    getProjectBoards,
    createBoard,
    updateProjectSettings,
    addProjectMembersBulk,
    getProjectTemplates,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
