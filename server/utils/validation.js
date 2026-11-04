// Validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  if (password.length > 64) {
    return { valid: false, message: "Password must be less than 64 characters" };
  }
  return { valid: true };
};

export const validateRequired = (fields, data) => {
  const missing = [];
  fields.forEach((field) => {
    if (!data[field] || data[field].toString().trim() === "") {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }
  return { valid: true };
};

export const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: "Invalid date format" };
  }

  if (start > end) {
    return { valid: false, message: "Start date must be before end date" };
  }

  return { valid: true };
};

export const validateTaskStatus = (status) => {
  const validStatuses = [
    "to_do",
    "in_progress",
    "in_review",
    "complete",
    "blocked",
    "cancelled",
  ];
  return validStatuses.includes(status);
};

export const validateTaskPriority = (priority) => {
  const validPriorities = ["urgent", "high", "normal", "low"];
  return validPriorities.includes(priority);
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateObjectId,
  validateURL,
  validateDateRange,
  validateTaskStatus,
  validateTaskPriority,
  sanitizeInput,
};

