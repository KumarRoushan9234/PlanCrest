import { expressjwt } from "express-jwt";

// Endpoints reachable without a session. Several routers apply requireAuth
// with router.use() while mounted at /api, so every public path must be
// listed here or it would be rejected by those routers.
const PUBLIC_PATHS = [
  "/api/health",
  "/api/login",
  "/api/register",
  "/api/logout",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/verify-email",
  "/api/resend-verification",
  "/api/firebase-auth",
  "/api/auth/config",
  /^\/api\/invitations\/details\/[^/]+$/,
  // OAuth redirects and signed webhooks authenticate themselves (state token / HMAC)
  /^\/api\/integrations\/[\w-]+\/callback$/,
  "/api/integrations/github/webhook",
];

// EventSource cannot send headers, so the realtime stream is the only
// endpoint that accepts a token in the query string.
const QUERY_TOKEN_PATH = /^\/api\/chat\/workspaces\/[^/]+\/events$/;

export const requireSignin = expressjwt({
  getToken: (req) => {
    if (req.headers.authorization?.startsWith("Bearer ")) {
      return req.headers.authorization.slice(7);
    }
    if (req.cookies?.token) {
      return req.cookies.token;
    }
    if (req.query.token && QUERY_TOKEN_PATH.test(req.originalUrl.split("?")[0])) {
      return req.query.token;
    }
    return null;
  },
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
}).unless({ path: PUBLIC_PATHS });

// Custom error handler for auth middleware
export const handleAuthError = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "No authorization token was found",
      code: "UNAUTHORIZED",
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
