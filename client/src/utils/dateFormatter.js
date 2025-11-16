/**
 * Date Formatter Utilities
 * Format dates for display in chat messages
 */

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";

  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

/**
 * Format absolute time (e.g., "Jan 15, 2024 3:45 PM")
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted absolute time
 */
export const formatAbsoluteTime = (date) => {
  if (!date) return "";

  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format message time (smart format: relative if <24h, absolute if >24h)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted time
 */
export const formatMessageTime = (date) => {
  if (!date) return "";

  const now = new Date();
  const then = new Date(date);
  const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return formatRelativeTime(date);
  }

  return formatAbsoluteTime(date);
};

/**
 * Check if two dates are on the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} - True if same day
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Format date separator (e.g., "Today", "Yesterday", "Jan 15, 2024")
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date separator
 */
export const formatDateSeparator = (date) => {
  if (!date) return "";

  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) {
    return "Today";
  }

  if (isSameDay(d, yesterday)) {
    return "Yesterday";
  }

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

