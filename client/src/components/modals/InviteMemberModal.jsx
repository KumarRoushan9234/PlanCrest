import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Mail, Shield } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const InviteMemberModal = ({ isOpen, onClose }) => {
  const { currentWorkspace, inviteToWorkspace, loading } = useWorkspace();
  const [formData, setFormData] = useState({
    email: "",
    role: "employee",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace?._id) return;

    try {
      await inviteToWorkspace(currentWorkspace._id, formData);
      onClose();
      // Reset form
      setFormData({ email: "", role: "employee", message: "" });
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const roles = [
    {
      value: "admin",
      label: "Admin",
      description: "Can manage workspace settings and members",
    },
    {
      value: "employee",
      label: "Employee",
      description: "Can create and manage projects and tasks",
    },
    {
      value: "client",
      label: "Client",
      description: "Limited access to view assigned projects",
    },
  ];

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
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Invite Member
                    </h2>
                    <p className="text-sm text-gray-400">
                      Invite someone to {currentWorkspace?.name}
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
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="colleague@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.role === role.value
                            ? "bg-blue-900 bg-opacity-30 border-blue-500"
                            : "bg-gray-800 border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={handleChange}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-white">
                              {role.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {role.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Personal Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add a personal message to the invitation..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg p-4">
                  <p className="text-sm text-blue-200">
                    <strong>Note:</strong> An invitation email will be sent to
                    the provided address. The invitation will expire in 14 days.
                  </p>
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
                    disabled={loading || !formData.email}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Invitation"}
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

export default InviteMemberModal;
