import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '', text = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const spinner = (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
      
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
      
      {/* Inner dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {spinner}
          </div>
          {text && (
            <p className="text-white text-lg font-medium mb-2">{text}</p>
          )}
          <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{text}</span>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
