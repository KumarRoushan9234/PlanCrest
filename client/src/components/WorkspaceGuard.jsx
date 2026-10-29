import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { CreateWorkspaceModal } from "./modals";
import { AuthLoader } from "./loaders";

const WorkspaceGuard = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { workspaces, loading: workspaceLoading } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Show create workspace modal if user has no workspaces
    if (!workspaceLoading && isAuthenticated && workspaces.length === 0) {
      setShowCreateModal(true);
    }
  }, [workspaceLoading, isAuthenticated, workspaces.length]);

  const handleCreateWorkspaceSuccess = () => {
    setShowCreateModal(false);
  };

  // Show loading spinner while checking workspaces
  if (workspaceLoading) {
    return (
      <AuthLoader fullScreen text="Loading your workspaces..." />
    );
  }

  // If user has no workspaces, show create workspace modal
  if (isAuthenticated && workspaces.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to PlanCrest!
            </h2>
            <p className="text-gray-300 mb-6">
              You need to create or join a workspace to get started.
            </p>
            <p className="text-sm text-gray-400">
              The workspace creation modal will open automatically...
            </p>
          </div>
        </div>
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => {}} // Prevent closing - user must create a workspace
          onSuccess={handleCreateWorkspaceSuccess}
        />
      </>
    );
  }

  // User has workspaces, render children
  return children;
};

export default WorkspaceGuard;
