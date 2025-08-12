"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const profileUpdateController_1 = require("../controllers/profileUpdateController");
/**
 * @module routes/authRoutes
 * @description Express router for authentication-related endpoints
 */
const router = express_1.default.Router();
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per window
    message: {
        status: "error",
        message: "Too many requests, please try again later",
    },
});
// Rate limiting for sensitive actions (e.g., forgot-password, verify-otp, resend-otp)
const sensitiveActionLimiter = (0, express_rate_limit_1.default)({
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
router.post("/register", authLimiter, authController_1.register);
/**
 * @route POST /verify-otp
 * @desc Verify OTP for registration or email update
 * @access Public
 */
router.post("/verify-otp", sensitiveActionLimiter, authController_1.verifyOtp);
/**
 * @route POST /resend-otp
 * @desc Resend OTP for registration or email update
 * @access Public
 */
router.post("/resend-otp", sensitiveActionLimiter, authController_1.resendOtp);
/**
 * @route POST /login
 * @desc Authenticate a user and issue a JWT token
 * @access Public
 */
router.post("/login", authLimiter, authController_1.login);
/**
 * @route POST /forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post("/forgot-password", sensitiveActionLimiter, authController_1.forgotPassword);
/**
 * @route POST /reset-password/:token
 * @desc Reset the user's password using a reset token
 * @access Public
 */
router.post("/reset-password/:token", sensitiveActionLimiter, authController_1.resetPassword);
/**
 * @route PUT /update-details/:id
 * @desc Update user details (username, dob)
 * @access Private
 */
router.put("/update-details/:id", authMiddleware_1.authenticateToken, authLimiter, profileUpdateController_1.updateUserDetails);
/**
 * @route GET /whoami
 * @desc Get currently authenticated user's profile
 * @access Private
 */
router.get("/whoami", authMiddleware_1.authenticateToken, authLimiter, profileUpdateController_1.getMyProfile);
/**
 * @route GET /users/:id
 * @desc Get another user's profile by ID
 * @access Public
 */
router.get("/users/:id", authLimiter, profileUpdateController_1.getUserProfileById);
/**
 * @route PUT /update-email
 * @desc Initiate email update with OTP verification
 * @access Private
 */
router.put("/update-email", authMiddleware_1.authenticateToken, sensitiveActionLimiter, authController_1.updateEmail);
/**
 * @route POST /update-password
 * @desc Update the user's password
 * @access Private
 */
router.post("/update-password", authMiddleware_1.authenticateToken, authLimiter, authController_1.updatePassword);
/**
 * @route POST /refresh
 * @desc Refresh access token
 * @access Public
 */
router.post("/refresh", authLimiter, authController_1.refresh);
/**
 * @route POST /deactivate
 * @desc Deactivate current user's account with optional reason
 * @access Private
 */
router.post("/deactivate", authMiddleware_1.authenticateToken, authLimiter, profileUpdateController_1.deactivateAccount);
/**
 * @route DELETE /delete-account
 * @desc Permanently delete current user's account
 * @access Private
 */
router.delete("/delete-account", authMiddleware_1.authenticateToken, sensitiveActionLimiter, profileUpdateController_1.deleteAccount);
/**
 * @route POST /logout
 * @desc Logout user by revoking refresh token
 * @access Private
 */
router.post("/logout", authMiddleware_1.authenticateToken, sensitiveActionLimiter, authController_1.logout);
exports.default = router;
