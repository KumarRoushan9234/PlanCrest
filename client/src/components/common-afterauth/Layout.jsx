import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#171819" }}>
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="flex pt-5">
        {" "}
        {/* Add top padding to account for fixed navbar */}
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 relative z-10 ml-20 lg:ml-100">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
