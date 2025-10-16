const SALT = "plancrest_2024"; 

/**
 * Mask a MongoDB ObjectId to a URL-friendly string
 * @param {string} id - MongoDB ObjectId
 * @returns {string} - Masked ID
 */
export const maskId = (id) => {
  if (!id) return "";
  
  // Simple base64 encoding with URL-safe characters
  const combined = `${SALT}_${id}`;
  const encoded = btoa(combined)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return encoded;
};

/**
 * Unmask a masked ID back to MongoDB ObjectId
 * @param {string} maskedId - Masked ID from URL
 * @returns {string} - Original MongoDB ObjectId
 */
export const unmaskId = (maskedId) => {
  if (!maskedId) return "";
  
  try {
    // Reverse the URL-safe encoding
    const base64 = maskedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const decoded = atob(padded);
    const id = decoded.replace(`${SALT}_`, '');
    
    return id;
  } catch (error) {
    console.error("Error unmasking ID:", error);
    return "";
  }
};

