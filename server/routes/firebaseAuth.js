import express from "express";
const router = express.Router();
import { firebaseAuth } from "../controllers/firebaseAuth.js";

router.post("/firebase-auth", firebaseAuth);

export default router; 