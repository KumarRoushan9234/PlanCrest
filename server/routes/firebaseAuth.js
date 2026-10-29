import express from "express";
const router = express.Router();
import { firebaseAuth, authConfig } from "../controllers/firebaseAuth.js";
import { authLimiter } from "../middlewares/security.js";

router.get("/auth/config", authConfig);
router.post("/firebase-auth", authLimiter, firebaseAuth);

export default router;
