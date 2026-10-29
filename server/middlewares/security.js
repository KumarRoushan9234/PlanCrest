import rateLimit from "express-rate-limit";
import { allowedOrigins, isProduction } from "../config/env.js";

const isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) || (!isProduction && isLocalhost(origin));

export const corsOptions = {
  origin: (origin, callback) => {
    // Non-browser clients (curl, server-to-server, OAuth redirects) send no Origin
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

/**
 * CSRF defence: reject state-changing requests that a browser sent from an
 * origin we don't trust. Browsers always attach Origin to cross-site
 * POST/PUT/PATCH/DELETE requests, so this blocks forged cookie-authenticated
 * requests without needing a token round-trip.
 */
export const verifyOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin || isAllowedOrigin(origin)) return next();
  return res.status(403).json({ error: "Origin not allowed" });
};

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });

/** Brute-force protection for login, code verification, and password reset. */
export const authLimiter = limiter(
  15,
  20,
  "Too many attempts. Please wait a few minutes and try again."
);

/** Limits outgoing email triggered by unauthenticated users. */
export const emailLimiter = limiter(
  60,
  5,
  "Too many email requests. Please try again later."
);

/** General API ceiling per IP. */
export const apiLimiter = limiter(15, 1000, "Too many requests. Please slow down.");
