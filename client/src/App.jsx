import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthLoader } from "./components/loaders";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import OverviewPage from "./pages/dashboard/OverviewPage";
import TaskBoardPage from "./pages/dashboard/TaskBoardPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import TeamPage from "./pages/dashboard/TeamPage";
import ActivityPage from "./pages/dashboard/ActivityPage";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import TaskDetailPage from "./pages/TaskDetailPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AIModePage from "./pages/AIModePage";
import CalendarPage from "./pages/CalendarPage";
import ChatChannelsPage from "./pages/ChatChannelsPage";
import InvitationHandler from "./components/InvitationHandler";

// Integration Pages
import IntegrationLandingPage from "./pages/integrations/IntegrationLandingPage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import GoogleCalendarDocumentationPage from "./pages/integrations/GoogleCalendarDocumentationPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import GitHubPage from "./pages/integrations/GitHubPage";
import GoogleMeetPage from "./pages/integrations/GoogleMeetPage";
import GmailPage from "./pages/integrations/GmailPage";

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoader fullScreen text="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ProjectProvider>
          <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1f2937",
                    color: "#fff",
                    border: "1px solid #374151",
                  },
                  success: {
                    style: {
                      background: "#059669",
                    },
                  },
                  error: {
                    style: {
                      background: "#dc2626",
                    },
                  },
                }}
              />

              <Routes>
                {/* Home Route - redirects authenticated users to dashboard */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <HomePage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/verify-email"
                  element={
                    <PublicRoute>
                      <VerifyEmailPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/reset-password"
                  element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <OverviewPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/tasks"
                  element={
                    <ProtectedRoute>
                      <TaskBoardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/team"
                  element={
                    <ProtectedRoute>
                      <TeamPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/activity"
                  element={
                    <ProtectedRoute>
                      <ActivityPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Projects />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/project/:maskedId"
                  element={
                    <ProtectedRoute>
                      <ProjectDetail />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/project/:maskedProjectId/task/:maskedTaskId"
                  element={
                    <ProtectedRoute>
                      <TaskDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Legacy route for backward compatibility */}
                <Route
                  path="/task/:maskedTaskId"
                  element={
                    <ProtectedRoute>
                      <TaskDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile-settings"
                  element={
                    <ProtectedRoute>
                      <ProfileSettingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/ai-mode"
                  element={
                    <ProtectedRoute>
                      <AIModePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatChannelsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Integration Routes */}
                <Route
                  path="/connectors"
                  element={
                    <ProtectedRoute>
                      <IntegrationLandingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/google-calendar"
                  element={
                    <ProtectedRoute>
                      <GoogleCalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/google-calendar/documentation"
                  element={
                    <ProtectedRoute>
                      <GoogleCalendarDocumentationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/google-drive"
                  element={
                    <ProtectedRoute>
                      <GoogleDrivePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/github"
                  element={
                    <ProtectedRoute>
                      <GitHubPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/google-meet"
                  element={
                    <ProtectedRoute>
                      <GoogleMeetPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connectors/gmail"
                  element={
                    <ProtectedRoute>
                      <GmailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Invitation Route */}
                <Route path="/invite/:token" element={<InvitationHandler />} />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ProjectProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
