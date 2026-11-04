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
import { ChatProvider } from "./contexts/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthLoader } from "./components/loaders";
import NotFoundPage from "./pages/NotFoundPage";
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
import TeamPage from "./pages/dashboard/TeamPage";
import ActivityPage from "./pages/dashboard/ActivityPage";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import TaskDetailPage from "./pages/TaskDetailPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AIModePage from "./pages/AIModePage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import GoalsPage from "./pages/GoalsPage";
import WorkloadPage from "./pages/WorkloadPage";
import TimesheetPage from "./pages/TimesheetPage";
import CalendarPage from "./pages/CalendarPage";
import DocumentsPage from "./pages/DocumentsPage";
import ChatChannelsPage from "./pages/ChatChannelsPage";
import InvitationHandler from "./components/InvitationHandler";

// Integration Pages
import IntegrationLandingPage from "./pages/integrations/IntegrationLandingPage";
import IntegrationPage from "./pages/integrations/IntegrationPage";

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoader fullScreen text="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ProjectProvider>
          <ChatProvider>
            <Router>
              <div className="App">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#181a21",
                      color: "#ececef",
                      border: "1px solid #2a2e39",
                      borderRadius: "10px",
                      fontSize: "13px",
                      boxShadow: "0 16px 40px rgba(0,0,0,.45)",
                    },
                    success: {
                      iconTheme: { primary: "#3fb97f", secondary: "#08090c" },
                    },
                    error: {
                      iconTheme: { primary: "#e5675f", secondary: "#08090c" },
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

                  <Route path="/dashboard/analytics" element={<Navigate to="/dashboard" replace />} />

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
                    path="/documents"
                    element={
                      <ProtectedRoute>
                        <DocumentsPage />
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

                  <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                  <Route path="/workload" element={<ProtectedRoute><WorkloadPage /></ProtectedRoute>} />
                  <Route path="/timesheet" element={<ProtectedRoute><TimesheetPage /></ProtectedRoute>} />

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
                    path="/integrations"
                    element={
                      <ProtectedRoute>
                        <IntegrationLandingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/integrations/:provider"
                    element={
                      <ProtectedRoute>
                        <IntegrationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* Old URLs */}
                  <Route path="/connectors" element={<Navigate to="/integrations" replace />} />
                  <Route path="/connectors/*" element={<Navigate to="/integrations" replace />} />

                  {/* Invitation Route */}
                  <Route
                    path="/invite/:token"
                    element={<InvitationHandler />}
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </Router>
          </ChatProvider>
        </ProjectProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
