// Import external libraries
import express from "express";

// Import local modules
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  updateProfile,
} from "../controllers/auth_ctrl.mjs";
import { verifyToken } from "../services/fetch_auth.mjs";

const router = express.Router();

// Public routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/refresh", refresh);

// Protected routes
router.get("/auth/me", verifyToken, getMe);
router.put("/auth/profile", verifyToken, updateProfile);

export default router;