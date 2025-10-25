import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import IntegrationSidebar from "../integration/IntegrationSidebar";

const IntegrationLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#171819" }}>
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
      </div>

      <div className="flex pt-14">
        {/* Main Sidebar - Fixed */}
        <Sidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Integration Sidebar - Fixed, positioned after main sidebar */}
        <IntegrationSidebar />

        {/* Main Content - Starts after both sidebars */}
        <main
          className="flex-1"
          style={{
            marginLeft: "280px",
            minHeight: "calc(100vh - 56px)",
          }}
        >
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default IntegrationLayout;
