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
    max: 100,
    message: { status: 'error', message: 'Too many requests, please try again later' },
});
/**
 * @route POST /register
 * @desc Register a new user and issue a JWT token
 * @access Public
 */
router.post('/register', authLimiter, authController_1.register);
/**
 * @route POST /login
 * @desc Authenticate a user and issue a JWT token
 * @access Public
 */
router.post('/login', authLimiter, authController_1.login);
/**
 * @route POST /forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post('/forgot-password', authLimiter, authController_1.forgotPassword);
/**
 * @route POST /reset-password/:token
 * @desc Reset the user's password using a reset token
 * @access Public
 */
router.post('/reset-password/:token', authLimiter, authController_1.resetPassword);
/**
 * @route POST /update-user-details
 * @desc Update user details (username, email, firstname, lastname)
 * @access Private
 */
router.put('/update-details/:id', authMiddleware_1.authenticateToken, authLimiter, profileUpdateController_1.updateUserDetails);
/**
 * @route POST /update-password
 * @desc Update the user's password
 * @access Private
 */
router.post('/update-password', authMiddleware_1.authenticateToken, authLimiter, authController_1.updatePassword);
exports.default = router;
