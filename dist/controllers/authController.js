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
exports.resendOtp = exports.updateEmail = exports.verifyOtp = exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const user_model_1 = __importDefault(require("../models/user-model"));
const otp_models_1 = __importDefault(require("../models/otp-models"));
const passwordResetTemplate_1 = __importDefault(require("../templates/passwordResetTemplate"));
const registrationTemplate_1 = __importDefault(require("../templates/registrationTemplate"));
const otpTemplate_1 = __importDefault(require("../templates/otpTemplate"));
const userValidation_1 = require("../validations/userValidation");
const rateLimitService_1 = __importDefault(require("../services/rateLimitService"));
const emailValidationService_1 = require("../services/emailValidationService");
const passwordCheckService_1 = require("../services/passwordCheckService");
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
function isStringValue(value) {
    return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const APP_URL = process.env.APP_URL || "http://localhost:9540";
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
/**
 * Generate JWT token
 * @private
 */
const signToken = (id) => {
    const options = {
        expiresIn: JWT_EXPIRES_IN,
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
        minVersion: "TLSv1.2",
    },
});
/**
 * Generate OTP
 * @private
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};
/**
 * Register a new user with OTP verification
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let ip = req.ip || "unknown";
    try {
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "register", 5, 3600))) {
            res.status(429).json({
                status: "error",
                message: "Too many registration attempts. Try again later.",
            });
            return;
        }
        const { error, value } = userValidation_1.userSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "register", 3600);
            }
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        value.username = (0, sanitize_html_1.default)(value.username);
        value.email = (0, sanitize_html_1.default)(value.email);
        value.firstname = (0, sanitize_html_1.default)(value.firstname);
        value.lastname = (0, sanitize_html_1.default)(value.lastname);
        if (yield (0, emailValidationService_1.checkDisposableEmail)(value.email)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "register", 3600);
            }
            res.status(400).json({
                status: "error",
                message: "Disposable email addresses are not allowed",
            });
            return;
        }
        if (yield (0, passwordCheckService_1.checkCompromisedPassword)(value.password)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "register", 3600);
            }
            res.status(400).json({
                status: "error",
                message: "This password has been compromised in a data breach. Please choose a different password.",
            });
            return;
        }
        const existingUser = yield user_model_1.default.findOne({
            $or: [{ username: value.username }, { email: value.email }],
        });
        if (existingUser) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "register", 3600);
            }
            res.status(400).json({ status: "error", message: "Account already exists" });
            return;
        }
        const user = new user_model_1.default(Object.assign(Object.assign({}, value), { isActive: false })); // Set isActive to false until OTP verified
        yield user.save();
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        yield otp_models_1.default.create({
            userId: user._id,
            code: otp,
            type: 'registration',
            expiresAt: otpExpires,
        });
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const message = (0, otpTemplate_1.default)(otp, nameForTemplate);
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: user.email,
                subject: "Verify Your Registration",
                html: message,
            });
        }
        catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
            yield user_model_1.default.deleteOne({ _id: user._id }); // Rollback user creation
            res.status(500).json({ status: "error", message: "Failed to send OTP" });
            return;
        }
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "register");
        }
        res.status(201).json({
            status: "success",
            message: "Registration successful, please verify OTP sent to your email",
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "register", 3600);
        }
        console.error("Register error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.register = register;
/**
 * Resend OTP for registration or email update
 */
const resendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let ip = req.ip || "unknown";
    try {
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "resendOtp", 3, 3600))) {
            res.status(429).json({
                status: "error",
                message: "Too many OTP resend attempts. Try again later.",
            });
            return;
        }
        const { error, value } = joi_1.default.object({
            userId: joi_1.default.string().required(),
            type: joi_1.default.string().valid('registration', 'email-update').required(),
        }).validate(req.body, { abortEarly: false });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "resendOtp", 3600);
            }
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { userId, type } = value;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "resendOtp", 3600);
            }
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        // Delete any existing OTP for this user and type
        yield otp_models_1.default.deleteOne({ userId, type });
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        yield otp_models_1.default.create({
            userId: user._id,
            code: otp,
            type,
            expiresAt: otpExpires,
        });
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const email = type === 'email-update' ? user.tempEmail || user.email : user.email;
        const subject = type === 'registration' ? "Verify Your Registration" : "Verify Your New Email";
        const message = (0, otpTemplate_1.default)(otp, nameForTemplate);
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: email,
                subject,
                html: message,
            });
        }
        catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
            yield otp_models_1.default.deleteOne({ userId: user._id, type });
            res.status(500).json({ status: "error", message: "Failed to send OTP" });
            return;
        }
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "resendOtp");
        }
        res.status(200).json({
            status: "success",
            message: "OTP resent successfully",
            data: { userId: user._id },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "resendOtp", 3600);
        }
        console.error("ResendOtp error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.resendOtp = resendOtp;
/**
 * Verify OTP for registration or email update
 */
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure verifyOtpSchema allows userId, otp, and type
        const { error, value } = userValidation_1.verifyOtpSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { otp, userId, type } = value;
        const otpRecord = yield otp_models_1.default.findOne({
            userId,
            code: otp,
            type,
            expiresAt: { $gt: Date.now() },
        });
        if (!otpRecord) {
            res.status(400).json({ status: "error", message: "Invalid or expired OTP" });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        if (type === 'registration') {
            user.isActive = true;
            yield user.save();
            const token = signToken(user._id);
            const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
            const message = (0, registrationTemplate_1.default)(nameForTemplate);
            const transporter = createTransporter();
            try {
                yield transporter.sendMail({
                    from: '"Market Place" <no-reply@yourapp.com>',
                    to: user.email,
                    subject: "Registration Successful",
                    text: `Welcome ${nameForTemplate}, your account has been created successfully!`,
                    html: message,
                });
            }
            catch (emailErr) {
                console.error("Email sending failed:", emailErr.message);
            }
            yield otp_models_1.default.deleteOne({ _id: otpRecord._id });
            res.status(200).json({
                status: "success",
                token,
                data: {
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                },
            });
        }
        else if (type === 'email-update') {
            user.email = user.tempEmail || user.email;
            user.tempEmail = undefined;
            yield user.save();
            yield otp_models_1.default.deleteOne({ _id: otpRecord._id });
            res.status(200).json({
                status: "success",
                data: {
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                },
            });
        }
    }
    catch (err) {
        console.error("VerifyOtp error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.verifyOtp = verifyOtp;
/**
 * Update user email with OTP verification
 */
const updateEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let ip = req.ip || "unknown";
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ status: "error", message: "Unauthorized" });
            return;
        }
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "updateEmail", 3, 3600))) {
            res.status(429).json({
                status: "error",
                message: "Too many email update attempts. Try again later.",
            });
            return;
        }
        const { error, value } = joi_1.default.object({
            email: joi_1.default.string().email().required(),
        }).validate(req.body, { abortEarly: false });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updateEmail", 3600);
            }
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { email } = value;
        if (yield (0, emailValidationService_1.checkDisposableEmail)(email)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updateEmail", 3600);
            }
            res.status(400).json({
                status: "error",
                message: "Disposable email addresses are not allowed",
            });
            return;
        }
        const existingUser = yield user_model_1.default.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updateEmail", 3600);
            }
            res.status(400).json({ status: "error", message: "Email already in use" });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        user.tempEmail = email;
        yield user.save();
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        yield otp_models_1.default.create({
            userId: user._id,
            code: otp,
            type: 'email-update',
            expiresAt: otpExpires,
        });
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const message = (0, otpTemplate_1.default)(otp, nameForTemplate);
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: email,
                subject: "Verify Your New Email",
                html: message,
            });
        }
        catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
            yield otp_models_1.default.deleteOne({ userId: user._id, type: 'email-update' });
            user.tempEmail = undefined;
            yield user.save();
            res.status(500).json({ status: "error", message: "Failed to send OTP" });
            return;
        }
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "updateEmail");
        }
        res.status(200).json({
            status: "success",
            message: "OTP sent to new email for verification",
            data: { userId: user._id },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "updateEmail", 3600);
        }
        console.error("UpdateEmail error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.updateEmail = updateEmail;
/**
 * Login a user with enhanced security checks
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let ip = req.ip || "unknown";
    try {
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "login", 5, 900))) {
            res.status(429).json({
                status: "error",
                message: "Too many login attempts. Please try again later.",
            });
            return;
        }
        const { error, value } = userValidation_1.loginSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "login", 900);
            }
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { identifier, password } = value;
        if (!identifier || !password) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "login", 900);
            }
            res
                .status(400)
                .json({
                status: "error",
                message: "Identifier and password are required",
            });
            return;
        }
        const sanitizedIdentifier = (0, sanitize_html_1.default)(identifier);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedIdentifier);
        const query = isEmail
            ? { email: sanitizedIdentifier }
            : { username: sanitizedIdentifier };
        const user = (yield user_model_1.default.findOne(query).select("+password"));
        if (!user || !user.isActive || !(yield user.comparePassword(password))) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "login", 900);
            }
            res.status(401).json({ status: "error", message: "Invalid credentials" });
            return;
        }
        if (user.mfaEnabled && user.verifyMfaCode) {
            const mfaCode = req.body.mfaCode || "";
            if (!mfaCode || !(yield user.verifyMfaCode(mfaCode))) {
                if (rateLimitService_1.default.isConnected()) {
                    yield rateLimitService_1.default.incrementFailedAttempt(ip, "login", 900);
                }
                res.status(401).json({ status: "error", message: "Invalid MFA code" });
                return;
            }
        }
        yield user.logLoginAttempt(ip, true);
        yield user.invalidateOtherSessions();
        yield user.updateLastLogin();
        const token = signToken(user._id);
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "login");
        }
        res.status(200).json({
            status: "success",
            token,
            _id: user._id,
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
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "login", 900);
        }
        console.error("Login error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.login = login;
/**
 * Send a password reset email
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = userValidation_1.forgotPasswordSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { email } = value;
        const user = (yield user_model_1.default.findOne({ email }));
        if (!user || !user.isActive) {
            res
                .status(404)
                .json({ status: "error", message: "No user found with that email" });
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
                subject: "Password Reset Request",
                html: message,
            });
        }
        catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
            res
                .status(500)
                .json({ status: "error", message: "Internal server error" });
            return;
        }
        res
            .status(200)
            .json({ status: "success", message: "Password reset email sent" });
    }
    catch (err) {
        console.error("ForgotPassword error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset password using a token
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = userValidation_1.resetPasswordSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const tokenParam = String(req.params.token || "");
        if (!tokenParam) {
            res.status(400).json({ status: "error", message: "Token is required" });
            return;
        }
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(tokenParam)
            .digest("hex");
        const user = (yield user_model_1.default.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select("+password"));
        if (!user) {
            res
                .status(400)
                .json({ status: "error", message: "Invalid or expired token" });
            return;
        }
        const { password } = value;
        if (yield (0, passwordCheckService_1.checkCompromisedPassword)(password)) {
            res.status(400).json({
                status: "error",
                message: "This password has been compromised in a data breach. Please choose a different password.",
            });
            return;
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save();
        const token = signToken(user._id);
        res.status(200).json({
            status: "success",
            token,
            data: {
                username: user.username,
                email: user.email,
                fullName: user.fullName,
            },
        });
    }
    catch (err) {
        console.error("ResetPassword error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
/**
 * Update user password
 */
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let ip = req.ip || "unknown";
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ status: "error", message: "Unauthorized" });
            return;
        }
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "updatePassword", 3, 3600))) {
            res.status(429).json({
                status: "error",
                message: "Too many password update attempts. Try again later.",
            });
            return;
        }
        const { error, value } = userValidation_1.updatePasswordSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updatePassword", 3600);
            }
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { currentPassword, newPassword } = value;
        const user = (yield user_model_1.default.findById(userId).select("+password"));
        if (!user || !(yield user.comparePassword(currentPassword))) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updatePassword", 3600);
            }
            res.status(401).json({ status: "error", message: "Invalid current password" });
            return;
        }
        if (yield (0, passwordCheckService_1.checkCompromisedPassword)(newPassword)) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "updatePassword", 3600);
            }
            res.status(400).json({
                status: "error",
                message: "This password has been compromised in a data breach. Please choose a different password.",
            });
            return;
        }
        user.password = newPassword;
        yield user.save();
        const nameForTemplate = user.fullName || `${user.firstname} ${user.lastname}`.trim();
        const message = `Dear ${nameForTemplate},\n\nYour password has been successfully updated. If you did not request this change, please contact support immediately.\n\nBest,\nMarket Place Team`;
        const transporter = createTransporter();
        try {
            yield transporter.sendMail({
                from: '"Market Place" <no-reply@yourapp.com>',
                to: user.email,
                subject: "Password Updated",
                text: message,
            });
        }
        catch (emailErr) {
            console.error("Email sending failed:", emailErr.message);
        }
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "updatePassword");
        }
        res.status(200).json({
            status: "success",
            message: "Password updated successfully",
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "updatePassword", 3600);
        }
        console.error("UpdatePassword error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.updatePassword = updatePassword;
