import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Upload } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";

const CreateWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const { createWorkspace, loading } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    companyInfo: {
      industry: "",
      size: "",
      website: "",
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWorkspace(formData);
      onClose();
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      // Reset form
      setFormData({
        name: "",
        description: "",
        companyInfo: { industry: "", size: "", website: "" },
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("companyInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50"
          ></motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-2xl border w-full max-w-4xl max-h-[70vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))", // lower opacity
                backdropFilter: "blur(100px)", // keep strong blur for glass effect
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                {/* Left - Logo and Company Name */}
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-sm"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                    ></motion.div>
                  </motion.div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    PlanCrest
                  </span>
                </div>

                {/* Middle - Tagline */}
                {/* <div className="absolute inset-x-0 top-6 flex justify-center -translate-y-1/2 z-50">
                  <div
                    className="px-6 py-2 rounded-2xl border border-gray-600 backdrop-blur-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(50,40,30,0.6), rgba(255,180,50,0.15))",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <span className="text-sm font-medium">
                      Set up a new workspace for your team
                    </span>
                  </div>
                </div> */}

                {/* Right - Welcome Message and Close Button */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    Welcome,{" "}
                    <span className="font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {currentUser?.name || "User"}
                    </span>
                  </span>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Workspace Name and Description */}
                  <div className="space-y-6">
                    {/* Workspace Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Acme Corporation"
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={8}
                        placeholder="Brief description of your workspace..."
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Right Column - Company Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Company Information (Optional)
                      </h3>

                      <div className="space-y-4">
                        {/* Industry */}
                        <div>
                          <label
                            htmlFor="companyInfo.industry"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Industry
                          </label>
                          <input
                            type="text"
                            id="companyInfo.industry"
                            name="companyInfo.industry"
                            value={formData.companyInfo.industry}
                            onChange={handleChange}
                            placeholder="e.g., Technology, Finance, Healthcare"
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                          />
                        </div>

                        {/* Company Size */}
                        <div>
                          <label
                            htmlFor="companyInfo.size"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Company Size
                          </label>
                          <select
                            id="companyInfo.size"
                            name="companyInfo.size"
                            value={formData.companyInfo.size}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                          >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </div>

                        {/* Website */}
                        <div>
                          <label
                            htmlFor="companyInfo.website"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Website
                          </label>
                          <input
                            type="url"
                            id="companyInfo.website"
                            name="companyInfo.website"
                            value={formData.companyInfo.website}
                            onChange={handleChange}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions - Bottom Right */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-600 border-opacity-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.name}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? "Creating..." : "Create Workspace"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;
