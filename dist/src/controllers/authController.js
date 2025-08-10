"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const user_model_1 = __importDefault(require("../models/user-model"));
const passwordResetTemplate_1 = __importDefault(require("../templates/passwordResetTemplate"));
const registrationTemplate_1 = __importDefault(require("../templates/registrationTemplate"));
const userValidation_1 = require("../validations/userValidation");
const rateLimitService_1 = __importDefault(require("../services/rateLimitService"));
const emailValidationService_1 = require("../services/emailValidationService");
const passwordCheckService_1 = require("../services/passwordCheckService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * @module controllers/authController
 * @description Handles authentication-related operations with enhanced security
 */
/**
 * Validate environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Default to '1d' if undefined
const APP_URL = process.env.APP_URL || 'http://localhost:9540';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
/**
 * Generate JWT token
 * @private
 */
const signToken = (id) => {
    const options = {
    // expiresIn: JWT_EXPIRES_IN // Explicitly cast to string
    };
    return jsonwebtoken_1.default.sign({ id }, JWT_SECRET, options);
};
/**
 * Create nodemailer transporter
 */
const createTransporter = () => nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        minVersion: 'TLSv1.2',
    },
});
/**
 * Register a new user with enhanced security checks
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ip = req.ip || 'unknown'; // Fallback for undefined req.ip
        // Rate limit registration attempts if Redis is connected
        if (rateLimitService_1.default.isConnected() && (yield rateLimitService_1.default.isRateLimited(ip, 'register', 5, 3600))) {
            res.status(429).json({
                status: 'error',
                message: 'Too many registration attempts. Try again later.',
            });
            return;
        }
        // Validate request body
        const { error, value } = userValidation_1.userSchema.validate(req.body, { abortEarly: false });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'register', 3600);
            }
            res.status(400).json({
                status: 'error',
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        // Sanitize inputs
        value.username = (0, sanitize_html_1.default)(value.username);
        value.email = (0, sanitize_html_1.default)(value.email);
        value.firstname = (0, sanitize_html_1.default)(value.firstname);
        value.lastname = (0, sanitize_html_1.default)(value.lastname);
        // Check for disposable email
        if (yield (0, emailValidationService_1.checkDisposableEmail)(value.email)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'register', 3600);
            }
            res.status(400).json({
                status: 'error',
                message: 'Disposable email addresses are not allowed',
            });
            return;
        }
        // Check for compromised password
        if (yield (0, passwordCheckService_1.checkCompromisedPassword)(value.password)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'register', 3600);
            }
            res.status(400).json({
                status: 'error',
                message: 'This password has been compromised in a data breach. Please choose a different password.',
            });
            return;
        }
        // Check for existing user
        const existingUser = yield user_model_1.default.findOne({
            $or: [{ username: value.username }, { email: value.email }],
        });
        if (existingUser) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'register', 3600);
            }
            res.status(400).json({ status: 'error', message: 'Account already exists' });
            return;
        }
        // Create and save new user
        const user = new user_model_1.default(value);
        yield user.save();
        const token = signToken(user._id); // Convert _id to string
        // Send welcome email
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const message = (0, registrationTemplate_1.default)(nameForTemplate);
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: user.email,
                subject: 'Registration Successful',
                text: `Welcome ${nameForTemplate}, your account has been created successfully!`,
                html: message,
            });
        }
        catch (emailErr) {
            console.error('Email sending failed:', emailErr.message);
        }
        // Reset rate limit on successful registration
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, 'register');
        }
        res.status(201).json({
            status: 'success',
            token,
            data: { username: user.username, email: user.email, fullName: user.fullName },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(req.ip || 'unknown', 'register', 3600);
        }
        console.error('Register error:', err);
        res.status(400).json({ status: 'error', message: err.message || 'Registration failed' });
    }
});
exports.register = register;
/**
 * Login a user with enhanced security checks
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ip = req.ip || 'unknown'; // Fallback for undefined req.ip
        // Rate limit login attempts
        if (rateLimitService_1.default.isConnected() && (yield rateLimitService_1.default.isRateLimited(ip, 'login', 5, 900))) {
            res.status(429).json({
                status: 'error',
                message: 'Too many login attempts. Please try again later.',
            });
            return;
        }
        const { error, value } = userValidation_1.loginSchema.validate(req.body, { abortEarly: false });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'login', 900);
            }
            res.status(400).json({
                status: 'error',
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { identifier, password } = value;
        if (!identifier || !password) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'login', 900);
            }
            res.status(400).json({ status: 'error', message: 'Identifier and password are required' });
            return;
        }
        // Sanitize identifier
        const sanitizedIdentifier = (0, sanitize_html_1.default)(identifier);
        // Check if identifier is a valid email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedIdentifier);
        const query = isEmail ? { email: sanitizedIdentifier } : { username: sanitizedIdentifier };
        const user = (yield user_model_1.default.findOne(query).select('+password'));
        if (!user || !user.isActive || !(yield user.comparePassword(password))) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, 'login', 900);
            }
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }
        // Check for MFA (if enabled)
        if (user.mfaEnabled && user.verifyMfaCode) {
            const mfaCode = req.body.mfaCode || '';
            if (!mfaCode || !(yield user.verifyMfaCode(mfaCode))) {
                if (rateLimitService_1.default.isConnected()) {
                    yield rateLimitService_1.default.incrementFailedAttempt(ip, 'login', 900);
                }
                res.status(401).json({ status: 'error', message: 'Invalid MFA code' });
                return;
            }
        }
        // Log IP address for security monitoring
        yield user.logLoginAttempt(ip, true);
        // Invalidate previous sessions
        yield user.invalidateOtherSessions();
        yield user.updateLastLogin();
        const token = signToken(user._id); // Convert _id to string
        // Reset rate limit on successful login
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, 'login');
        }
        res.status(200).json({
            status: 'success',
            token,
            data: {
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                lastLogin: user.lastLogin,
            },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(req.ip || 'unknown', 'login', 900);
        }
        console.error('Login error:', err);
        res.status(400).json({ status: 'error', message: err.message || 'Login failed' });
    }
});
exports.login = login;
/**
 * Send a password reset email
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = userValidation_1.forgotPasswordSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                status: 'error',
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { email } = value;
        const user = (yield user_model_1.default.findOne({ email }));
        if (!user || !user.isActive) {
            res.status(404).json({ status: 'error', message: 'No user found with that email' });
            return;
        }
        const resetToken = user.createPasswordResetToken();
        yield user.save({ validateBeforeSave: false });
        const resetURL = `${APP_URL}/api/auth/reset-password/${resetToken}`;
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const message = (0, passwordResetTemplate_1.default)(resetURL, nameForTemplate);
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: user.email,
                subject: 'Password Reset Request',
                html: message,
            });
        }
        catch (emailErr) {
            console.error('Email sending failed:', emailErr.message);
            res.status(500).json({ status: 'error', message: 'Failed to send reset email' });
            return;
        }
        res.status(200).json({ status: 'success', message: 'Password reset email sent' });
    }
    catch (err) {
        console.error('ForgotPassword error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to send reset email' });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset password using a token
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = userValidation_1.resetPasswordSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                status: 'error',
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const tokenParam = String(req.params.token || '');
        if (!tokenParam) {
            res.status(400).json({ status: 'error', message: 'Token is required' });
            return;
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(tokenParam).digest('hex');
        const user = (yield user_model_1.default.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select('+password'));
        if (!user) {
            res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
            return;
        }
        const { password } = value;
        if (yield (0, passwordCheckService_1.checkCompromisedPassword)(password)) {
            res.status(400).json({
                status: 'error',
                message: 'This password has been compromised in a data breach. Please choose a different password.',
            });
            return;
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save();
        const token = signToken(user._id); // Convert _id to string
        res.status(200).json({
            status: 'success',
            token,
            data: { username: user.username, email: user.email, fullName: user.fullName },
        });
    }
    catch (err) {
        console.error('ResetPassword error:', err);
        res.status(400).json({ status: 'error', message: err.message || 'Failed to reset password' });
    }
});
exports.resetPassword = resetPassword;
