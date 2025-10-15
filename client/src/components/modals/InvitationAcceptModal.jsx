import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, CheckCircle, XCircle, PartyPopper } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";

const InvitationAcceptModal = ({
  isOpen,
  onClose,
  invitationToken,
  workspaceInfo,
}) => {
  const { acceptInvitation, loading } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleAccept = async () => {
    try {
      await acceptInvitation(invitationToken);
      setAccepted(true);
      setShowAnimation(true);

      // Show animation for 3 seconds then close
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  const handleReject = () => {
    setRejected(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      setRejected(false);
      setShowAnimation(false);
    }
  }, [isOpen]);

  if (accepted) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                className="rounded-2xl border w-full max-w-md overflow-hidden shadow-inner shadow-black/20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                  backdropFilter: "blur(100px)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Success Animation */}
                <div className="relative p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>

                  {/* Party Popper Animation */}
                  {showAnimation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{
                            x: 0,
                            y: 0,
                            rotate: 0,
                            scale: 0,
                          }}
                          animate={{
                            x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                            y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                            rotate: 360,
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: 0.1 * i,
                            ease: "easeOut",
                          }}
                          className="absolute"
                        >
                          <PartyPopper className="w-6 h-6 text-yellow-400" />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome to {workspaceInfo?.name}!
                  </h2>
                  <p className="text-gray-300 mb-6">
                    You've successfully joined the workspace. Let's get started!
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-800 bg-opacity-50 rounded-lg p-4"
                  >
                    <p className="text-sm text-gray-400">
                      Redirecting you to the workspace...
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (rejected) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                className="rounded-2xl border w-full max-w-md overflow-hidden shadow-inner shadow-black/20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                  backdropFilter: "blur(100px)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    Invitation Declined
                  </h2>
                  <p className="text-gray-300">
                    You've declined the invitation to join {workspaceInfo?.name}
                    .
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

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
              className="rounded-2xl border w-full max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                backdropFilter: "blur(100px)",
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

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    You're Invited!
                  </h2>
                  <p className="text-gray-300">
                    You've been invited to join a workspace
                  </p>
                </div>

                {/* Workspace Information */}
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Workspace Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">
                        Workspace Name
                      </label>
                      <p className="text-white font-medium">
                        {workspaceInfo?.name}
                      </p>
                    </div>
                    {workspaceInfo?.description && (
                      <div>
                        <label className="text-sm text-gray-400">
                          Description
                        </label>
                        <p className="text-white">
                          {workspaceInfo.description}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-400">
                        Invited by
                      </label>
                      <p className="text-white">
                        {workspaceInfo?.invitedBy?.name || "Workspace Admin"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Your Role</label>
                      <p className="text-white capitalize">
                        {workspaceInfo?.role || "Member"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleReject}
                    className="px-6 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? "Accepting..." : "Accept Invitation"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvitationAcceptModal;
