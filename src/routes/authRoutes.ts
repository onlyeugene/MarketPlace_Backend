import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateEmail,
  verifyOtp,
  resendOtp,
  refresh,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  updateUserDetails,
  getMyProfile,
  getUserProfileById,
  deactivateAccount,
  deleteAccount,
} from "../controllers/profileUpdateController";

/**
 * @module routes/authRoutes
 * @description Express router for authentication-related endpoints
 */
const router: Router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: {
    status: "error",
    message: "Too many requests, please try again later",
  },
});

// Rate limiting for sensitive actions (e.g., forgot-password, verify-otp, resend-otp)
const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for sensitive actions
  message: {
    status: "error",
    message: "Too many attempts, please try again later",
  },
});

/**
 * @route POST /register
 * @desc Register a new user and send OTP for verification
 * @access Public
 */
router.post("/register", authLimiter, register);

/**
 * @route POST /verify-otp
 * @desc Verify OTP for registration or email update
 * @access Public
 */
router.post("/verify-otp", sensitiveActionLimiter, verifyOtp);

/**
 * @route POST /resend-otp
 * @desc Resend OTP for registration or email update
 * @access Public
 */
router.post("/resend-otp", sensitiveActionLimiter, resendOtp);

/**
 * @route POST /login
 * @desc Authenticate a user and issue a JWT token
 * @access Public
 */
router.post("/login", authLimiter, login);

/**
 * @route POST /forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post("/forgot-password", sensitiveActionLimiter, forgotPassword);

/**
 * @route POST /reset-password/:token
 * @desc Reset the user's password using a reset token
 * @access Public
 */
router.post("/reset-password/:token", sensitiveActionLimiter, resetPassword);

/**
 * @route PUT /update-details/:id
 * @desc Update user details (username, dob)
 * @access Private
 */
router.put(
  "/update-details/:id",
  authenticateToken,
  authLimiter,
  updateUserDetails
);

/**
 * @route GET /whoami
 * @desc Get currently authenticated user's profile
 * @access Private
 */
router.get("/whoami", authenticateToken, authLimiter, getMyProfile);

/**
 * @route GET /users/:id
 * @desc Get another user's profile by ID
 * @access Public
 */
router.get("/users/:id", authLimiter, getUserProfileById);

/**
 * @route PUT /update-email
 * @desc Initiate email update with OTP verification
 * @access Private
 */
router.put(
  "/update-email",
  authenticateToken,
  sensitiveActionLimiter,
  updateEmail
);

/**
 * @route POST /update-password
 * @desc Update the user's password
 * @access Private
 */
router.post("/update-password", authenticateToken, authLimiter, updatePassword);

/**
 * @route POST /refresh
 * @desc Refresh access token
 * @access Public
 */
router.post("/refresh", authLimiter, refresh);

/**
 * @route POST /deactivate
 * @desc Deactivate current user's account with optional reason
 * @access Private
 */
router.post("/deactivate", authenticateToken, authLimiter, deactivateAccount);

/**
 * @route DELETE /delete-account
 * @desc Permanently delete current user's account
 * @access Private
 */
router.delete(
  "/delete-account",
  authenticateToken,
  sensitiveActionLimiter,
  deleteAccount
);

export default router;
