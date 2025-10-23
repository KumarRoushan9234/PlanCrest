import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthLoader } from "./loaders";
import WorkspaceGuard from "./WorkspaceGuard";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoader fullScreen text="Verifying access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.role?.includes("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <WorkspaceGuard>{children}</WorkspaceGuard>;
};

export default ProtectedRoute;
