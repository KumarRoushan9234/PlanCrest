/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../config/firebase";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { API_BASE_URL } from "../config/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  useEffect(() => {
    // Without Firebase configured, sessions come only from the backend
    const unsubscribe = auth
      ? onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            handleFirebaseAuth(firebaseUser);
          } else {
            checkAuthStatus();
          }
        })
      : (checkAuthStatus(), () => {});

    // Set a timeout to ensure loading doesn't stay true forever
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/current-user`);
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseAuth = async (firebaseUser) => {
    try {
      // The server verifies this token; it never trusts profile fields from the client
      const idToken = await firebaseUser.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/firebase-auth`, { idToken });

      setUser(response.data);
      setIsAuthenticated(true);

      // Store token in localStorage for SSE and other uses
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      // Don't show success toast on page refresh - only show on actual login
    } catch (error) {
      console.error("Firebase auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/register`, userData);
    toast.success(
      "Registration successful! Please check your email for verification."
    );
    return response.data;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    setUser(response.data);
    setIsAuthenticated(true);

    // Store token in localStorage for SSE and other uses
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    toast.success("Successfully logged in!");
    return response.data;
  };

  const loginWithGoogle = async () => {
    try {
      if (!isFirebaseConfigured) {
        toast.error("Google sign-in is not configured");
        return;
      }
      await signInWithPopup(auth, googleProvider);
      // Firebase auth state change will handle the rest
      toast.success("Successfully signed in with Google!");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
    }
  };

  const verifyEmail = async (email, code) => {
    const response = await axios.post(`${API_BASE_URL}/verify-email`, {
      email,
      code,
    });
    toast.success("Email verified successfully!");
    return response.data;
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resend-verification`, { email });
      toast.success(response.data?.message || "A new code is on its way.");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Couldn't resend the code");
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email,
    });
    toast.success("Password reset code sent to your email!");
    return response.data;
  };

  const resetPassword = async (email, code, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, {
      email,
      code,
      newPassword,
    });
    toast.success("Password reset successfully!");
    return response.data;
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/update-profile`,
        profileData
      );
      setUser(response.data.user);
      toast.success("Profile updated successfully!");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data ||
        "Profile update failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/change-password`,
        passwordData
      );
      toast.success("Password changed successfully!");
      return response.data;
    } catch (error) {
      console.error("Password change error details:", error.response?.data);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data ||
        "Password change failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    // Clear token from localStorage
    localStorage.removeItem("token");
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      if (auth) await firebaseSignOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if backend logout fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const setUserData = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser);
      setIsAuthenticated(true);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    setUserData,
    register,
    login,
    loginWithGoogle,
    isGoogleSignInEnabled: isFirebaseConfigured,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
