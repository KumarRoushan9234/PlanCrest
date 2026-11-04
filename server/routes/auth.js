import express from "express";
const router = express.Router();
import {
  register,
  login,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile,
  changePassword,
} from "../controllers/auth.js";
import { requireSignin, handleAuthError } from "../middlewares/index.js";
import { authLimiter, emailLimiter } from "../middlewares/security.js";

router.post("/register", emailLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser, handleAuthError);
router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerification);
router.put("/update-profile", requireSignin, updateProfile, handleAuthError);
router.put("/change-password", requireSignin, authLimiter, changePassword, handleAuthError);

// Add error handler for auth-related errors
router.use(handleAuthError);

export default router;
