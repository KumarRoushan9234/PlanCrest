import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";

export const requireSignin = expressjwt({
  getToken: (req, res) => {
    // First try to get token from query parameter (for SSE)
    if (req.query.token) {
      return req.query.token;
    }
    // Then try to get token from cookie
    if (req.cookies.token) {
      return req.cookies.token;
    }
    // Fallback to Authorization header for cross-origin requests
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
      return token;
    }
    return null;
  },
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
}).unless({
  path: [
    '/api/login',
    '/api/register', 
    '/api/forgot-password',
    '/api/reset-password',
    '/api/verify-email',
    '/api/firebase-auth',
    '/api/csrf-token'
  ]
});


// Custom error handler for auth middleware
export const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Don't log expected 401 errors - just return clean response
    return res.status(401).json({ 
      error: 'No authorization token was found',
      code: 'UNAUTHORIZED' 
    });
  }
  next(err);
};

// Export alias for consistency with new routes
export const requireAuth = requireSignin;

// Re-export permission middlewares for convenience
export { 
  requireWorkspaceMember as requireWorkspaceAccess,
  requireProjectAccess,
  requireWorkspaceAdmin,
  requireProjectAdmin,
  canCreateTask,
  canEditTask,
  requireWorkspaceOwnerOrAdmin,
} from "./permissions.js";