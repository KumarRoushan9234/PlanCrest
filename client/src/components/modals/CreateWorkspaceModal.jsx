import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Upload } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const { createWorkspace, loading } = useWorkspace();
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
            className="fixed inset-0 bg-black bg-opacity-20 z-50 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-xl shadow-2xl border w-full max-w-4xl max-h-[70vh] overflow-y-auto scrollbar-hide"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Create Workspace
                    </h2>
                    <p className="text-sm text-gray-400">
                      Set up a new workspace for your team
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Workspace Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Workspace Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    rows={3}
                    placeholder="Brief description of your workspace..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Company Info Section */}
                <div className="border-t border-gray-600 pt-6">
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-600">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.name}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
