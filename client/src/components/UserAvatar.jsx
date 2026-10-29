import React, { useState, useMemo } from "react";

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

const deriveAvatarUrl = (user) => {
  if (!user) return null;
  if (typeof user.avatar === "string") return user.avatar;
  if (user.avatar?.url) return user.avatar.url;
  if (user.picture && user.picture !== "null") return user.picture;
  if (user.photoURL) return user.photoURL;
  return null;
};

const UserAvatar = ({ user, size = "md" }) => {
  const [imageError, setImageError] = useState(false);

  const avatarUrl = useMemo(() => deriveAvatarUrl(user), [user]);
  const hasValidPicture = avatarUrl && !imageError;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (hasValidPicture) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || "User"}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
