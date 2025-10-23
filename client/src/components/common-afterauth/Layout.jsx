import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import {
  DashboardTopNav,
  CalendarTopNav,
  AIModeTopNav,
  ProjectsTopNav,
  ProjectDetailTopNav,
} from "../top-nav";
import { CreateProjectModal } from "../modals";

const Layout = ({ children, projectsPageProps, projectDetailPageProps }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const location = useLocation();

  const handleCreateProject = () => {
    setIsCreateProjectOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#171819" }}>
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
      </div>

      <div className="flex pt-5">
        {" "}
        {/* Add top padding to account for fixed navbar */}
        {/* Sidebar */}
        <Sidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 relative z-10 mt-9 ml-0 md:ml-16 lg:ml-16">
          {/* Page-specific top navigation */}
          {(location.pathname === "/dashboard" ||
            location.pathname.startsWith("/dashboard/")) && (
            <DashboardTopNav onCreateProject={handleCreateProject} />
          )}
          {location.pathname === "/projects" && projectsPageProps && (
            <ProjectsTopNav
              onCreateProject={handleCreateProject}
              {...projectsPageProps}
            />
          )}
          {location.pathname.startsWith("/project/") &&
            projectDetailPageProps && (
              <ProjectDetailTopNav {...projectDetailPageProps} />
            )}
          {location.pathname === "/calendar" && <CalendarTopNav />}
          {location.pathname === "/ai-mode" && <AIModeTopNav />}
          <div
            className={
              location.pathname === "/projects" ||
              location.pathname.startsWith("/project/") ||
              location.pathname.startsWith("/dashboard")
                ? ""
                : "p-6"
            }
          >
            {children}
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
};

export default Layout;
