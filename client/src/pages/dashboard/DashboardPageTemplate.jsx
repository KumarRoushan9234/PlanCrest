import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../../components/common-afterauth";
import { AuthLoader } from "../../components/loaders";

/**
 * Template for Dashboard Pages
 *
 * This template provides the standard structure for all pages under the dashboard/ folder.
 * It includes:
 * - Layout wrapper with sidebar and navbar
 * - DashboardTopNav for consistent navigation
 * - Standard dark theme styling
 * - Loading state handling
 * - Proper animations and transitions
 *
 * Usage:
 * 1. Copy this template
 * 2. Replace the content section with your specific page content
 * 3. Update the header section with your page title and description
 * 4. Add your specific components and logic
 */

const DashboardPageTemplate = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Handle loading state
  if (loading) {
    return (
      <Layout>
        <AuthLoader fullScreen text="Loading..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        style={{ backgroundColor: "#171819" }}
      >
        {/* Header Section - Customize for each page */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Your Page Title
              </h2>
              <p className="text-gray-400">Your page description goes here.</p>
            </div>

            {/* Action buttons - customize as needed */}
            <div className="flex items-center space-x-3">
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 border border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm">Action 1</span>
              </motion.button>

              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm font-medium">Primary Action</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Section - Optional, customize as needed */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Add your stats components here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Example stat card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    Example Stat
                  </p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Section - Replace with your specific content */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">
                  Main Content
                </h3>
              </div>
              <div className="p-6">
                {/* Add your main content here */}
                <p className="text-gray-400">
                  Replace this with your specific page content.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div>
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Sidebar</h3>
              </div>
              <div className="p-6">
                {/* Add your sidebar content here */}
                <p className="text-gray-400">
                  Add sidebar content or widgets here.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default DashboardPageTemplate;
