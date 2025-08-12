import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { adminLogin, getAllUsers, getUserById, deleteUser } from "../controllers/adminAuthController";
import { authenticateAdminToken } from "../middleware/adminMiddleware"; // Assuming you create this middleware

const router: Router = express.Router();

// Rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: { status: "error", message: "Too many requests, please try again later" },
});

// Rate limiting for sensitive admin actions
const sensitiveAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit
  message: { status: "error", message: "Too many attempts, please try again later" },
});

/**
 * @route POST /admin/login
 * @desc Authenticate an admin and issue a JWT token
 * @access Public
 */
router.post("/admin/login", adminLimiter, adminLogin);

/**
 * @route GET /admin/users
 * @desc Get all users
 * @access Private (Admin)
 */
router.get("/admin/users", authenticateAdminToken, sensitiveAdminLimiter, getAllUsers);

/**
 * @route GET /admin/users/:id
 * @desc Get a user by ID
 * @access Private (Admin)
 */
router.get("/admin/users/:id", authenticateAdminToken, sensitiveAdminLimiter, getUserById);

/**
 * @route DELETE /admin/users/:id
 * @desc Delete a user by ID
 * @access Private (Admin)
 */
router.delete("/admin/users/:id", authenticateAdminToken, sensitiveAdminLimiter, deleteUser);

export default router;