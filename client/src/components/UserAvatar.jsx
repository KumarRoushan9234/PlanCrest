import React, { useState } from 'react';

const UserAvatar = ({ user, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const hasValidPicture = user?.picture && 
    user.picture !== 'null' && 
    user.picture !== '' && 
    !imageError;

  // Fallback: Show first letter of name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  if (hasValidPicture) {
    return (
      <img
        src={user.picture}
        alt={user?.name || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-600 flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
