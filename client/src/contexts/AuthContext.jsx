/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'http://localhost:8000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        handleFirebaseAuth(firebaseUser);
      } else {
        // Check if user is authenticated via backend
        checkAuthStatus();
      }
    });

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
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseAuth = async (firebaseUser) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/firebase-auth`, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        picture: firebaseUser.photoURL
      });
      
      setUser(response.data);
      setIsAuthenticated(true);
      // Don't show success toast on page refresh - only show on actual login
    } catch (error) {
      console.error('Firebase auth error:', error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      toast.success('Registration successful! Please check your email for verification.');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      setUser(response.data);
      setIsAuthenticated(true);
      toast.success('Successfully logged in!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      // Firebase auth state change will handle the rest
      toast.success('Successfully signed in with Google!');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed');
      setLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/verify-email`, { email, code });
      toast.success('Email verified successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Email verification failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
      toast.success('Password reset code sent to your email!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Failed to send reset code';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/reset-password`, { 
        email, 
        code, 
        newPassword 
      });
      toast.success('Password reset successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Password reset failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/update-profile`, profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      console.log('Sending password data:', passwordData);
      const response = await axios.put(`${API_BASE_URL}/change-password`, passwordData);
      toast.success('Password changed successfully!');
      return response.data;
    } catch (error) {
      console.error('Password change error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data || 'Password change failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await axios.get(`${API_BASE_URL}/logout`);
      await firebaseSignOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if backend logout fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    loginWithGoogle,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
