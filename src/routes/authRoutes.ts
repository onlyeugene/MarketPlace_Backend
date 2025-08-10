import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController';

/**
 * @module routes/authRoutes
 * @description Express router for authentication-related endpoints
 */
const router: Router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { status: 'error', message: 'Too many requests, please try again later' },
});

/**
 * @route POST /register
 * @desc Register a new user and issue a JWT token
 * @access Public
 */
router.post('/register', authLimiter, register);

/**
 * @route POST /login
 * @desc Authenticate a user and issue a JWT token
 * @access Public
 */
router.post('/login', authLimiter, login);

/**
 * @route POST /forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post('/forgot-password', authLimiter, forgotPassword);

/**
 * @route POST /reset-password/:token
 * @desc Reset the user's password using a reset token
 * @access Public
 */
router.post('/reset-password/:token', authLimiter, resetPassword);

export default router;