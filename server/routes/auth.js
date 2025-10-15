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
  updateProfile,
  changePassword,
} from "../controllers/auth.js";
import { requireSignin, handleAuthError } from "../middlewares/index.js";

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser, handleAuthError);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.put("/update-profile", requireSignin, updateProfile, handleAuthError);
router.put("/change-password", requireSignin, changePassword, handleAuthError);

// Add error handler for auth-related errors
router.use(handleAuthError);

export default router;
