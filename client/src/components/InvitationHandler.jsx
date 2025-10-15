import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { InvitationAcceptModal } from "./modals";
import LoadingSpinner from "./LoadingSpinner";

const InvitationHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getInvitationDetails } = useWorkspace();
  const [invitationData, setInvitationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token || hasFetched) {
        if (!token) {
          setError("No invitation token provided");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setHasFetched(true);
        const response = await getInvitationDetails(token);
        setInvitationData(response.data.invitation);
        setShowModal(true);
      } catch (error) {
        console.error("Error fetching invitation details:", error);
        setError(error.error || "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token, hasFetched]); // Removed getInvitationDetails to prevent infinite loop

  const handleModalClose = () => {
    setShowModal(false);
    // Redirect to dashboard or login page
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-300 mb-6">
            Please log in to accept this invitation to join{" "}
            {invitationData?.workspace?.name}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <InvitationAcceptModal
        isOpen={showModal}
        onClose={handleModalClose}
        invitationToken={token}
        workspaceInfo={invitationData?.workspace}
        role={invitationData?.role}
        invitedBy={invitationData?.invitedBy}
      />
    </>
  );
};

export default InvitationHandler;
