import React, { createContext, useContext, useState, useEffect } from "react";
import { workspaceService } from "../services/workspaceService";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserWorkspaces();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchWorkspaceMembers(currentWorkspace._id);
    }
  }, [currentWorkspace?._id]);

  const fetchUserWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspaceService.getUserWorkspaces();
      setWorkspaces(response.data || []);

      // Set first workspace as current if no current workspace
      if (!currentWorkspace && response.data && response.data.length > 0) {
        setCurrentWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      toast.error("Failed to fetch workspaces");
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (workspaceData) => {
    try {
      setLoading(true);
      const response = await workspaceService.createWorkspace(workspaceData);
      const newWorkspace = response.data;

      setWorkspaces((prev) => [...prev, newWorkspace]);
      setCurrentWorkspace(newWorkspace);

      toast.success("Workspace created successfully!");
      return newWorkspace;
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error(error.error || "Failed to create workspace");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspace = async (workspaceId, updateData) => {
    try {
      setLoading(true);
      const response = await workspaceService.updateWorkspace(
        workspaceId,
        updateData
      );
      const updatedWorkspace = response.data;

      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === workspaceId ? updatedWorkspace : ws))
      );

      if (currentWorkspace?._id === workspaceId) {
        setCurrentWorkspace(updatedWorkspace);
      }

      toast.success("Workspace updated successfully!");
      return updatedWorkspace;
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error(error.error || "Failed to update workspace");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      setLoading(true);
      await workspaceService.deleteWorkspace(workspaceId);

      setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));

      if (currentWorkspace?._id === workspaceId) {
        setCurrentWorkspace(workspaces[0] || null);
      }

      toast.success("Workspace archived successfully!");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error(error.error || "Failed to archive workspace");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspace) => {
    try {
      setCurrentWorkspace(workspace);
      toast.success(`Switched to ${workspace.name}`);
    } catch (error) {
      console.error("Error switching workspace:", error);
      toast.error("Failed to switch workspace");
    }
  };

  const fetchWorkspaceMembers = async (workspaceId) => {
    try {
      const response = await workspaceService.getWorkspaceMembers(workspaceId);
      setWorkspaceMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      // Don't show toast for this as it might be called frequently
    }
  };

  const inviteToWorkspace = async (workspaceId, inviteData) => {
    try {
      setLoading(true);
      const response = await workspaceService.inviteToWorkspace(
        workspaceId,
        inviteData
      );
      toast.success("Invitation sent successfully!");
      return response;
    } catch (error) {
      console.error("Error inviting to workspace:", error);
      toast.error(error.error || "Failed to send invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addWorkspaceMember = async (workspaceId, memberData) => {
    try {
      setLoading(true);
      const response = await workspaceService.addWorkspaceMember(
        workspaceId,
        memberData
      );

      // Refresh members list
      await fetchWorkspaceMembers(workspaceId);

      toast.success("Member added successfully!");
      return response;
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(error.error || "Failed to add member");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeWorkspaceMember = async (workspaceId, userId) => {
    try {
      setLoading(true);
      await workspaceService.removeWorkspaceMember(workspaceId, userId);

      // Refresh members list
      await fetchWorkspaceMembers(workspaceId);

      toast.success("Member removed successfully!");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error.error || "Failed to remove member");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspaceMember = async (workspaceId, userId, updateData) => {
    try {
      setLoading(true);
      await workspaceService.updateWorkspaceMember(
        workspaceId,
        userId,
        updateData
      );

      // Refresh members list
      await fetchWorkspaceMembers(workspaceId);

      toast.success("Member updated successfully!");
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(error.error || "Failed to update member");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    workspaces,
    currentWorkspace,
    workspaceMembers,
    loading,
    fetchUserWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    fetchWorkspaceMembers,
    inviteToWorkspace,
    addWorkspaceMember,
    removeWorkspaceMember,
    updateWorkspaceMember,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
