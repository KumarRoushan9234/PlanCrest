import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicNavbar from './PublicNavbar';
import AuthNavbar from './AuthNavbar';
import LoadingSpinner from './LoadingSpinner';

const Navbar = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Don't show navbar on auth pages
  const authPages = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white ml-2">ClientFlow</span>
            </div>
            
            {/* Loading indicator */}
            <div className="flex items-center">
              <LoadingSpinner size="sm" text="Loading..." />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Show appropriate navbar based on authentication status
  if (isAuthenticated) {
    return <AuthNavbar />;
  }

  return <PublicNavbar />;
};

export default Navbar;