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
exports.deleteUser = exports.getUserById = exports.getAllUsers = exports.adminLogin = exports.registerAdmin = void 0;
const admin_model_1 = __importDefault(require("../models/admin-model"));
const user_model_1 = __importDefault(require("../models/user-model"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const rateLimitService_1 = __importDefault(require("../services/rateLimitService"));
const userValidation_1 = require("../validations/userValidation");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function isStringValue(value) {
    return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
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
const registerAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = userValidation_1.adminRegisterSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        const { username, firstname, lastname, email, password, role } = value;
        // Check for existing admin with same username or email
        const existingAdmin = yield admin_model_1.default.findOne({
            $or: [
                { username: (0, sanitize_html_1.default)(username) },
                { email: (0, sanitize_html_1.default)(email) },
            ],
        });
        if (existingAdmin) {
            res.status(400).json({
                status: "error",
                message: "Username or email already in use",
            });
            return;
        }
        // Check for existing user with same username or email to avoid conflicts
        const existingUser = yield user_model_1.default.findOne({
            $or: [
                { username: (0, sanitize_html_1.default)(username) },
                { email: (0, sanitize_html_1.default)(email) },
            ],
        });
        if (existingUser) {
            res.status(400).json({
                status: "error",
                message: "Username or email already in use by a user",
            });
            return;
        }
        const admin = new admin_model_1.default({
            username: (0, sanitize_html_1.default)(username),
            firstname: (0, sanitize_html_1.default)(firstname),
            lastname: (0, sanitize_html_1.default)(lastname),
            email: (0, sanitize_html_1.default)(email),
            password,
            role: role || "admin",
            isActive: true,
        });
        yield admin.save();
        const token = signToken(admin._id);
        res.status(201).json({
            status: "success",
            token,
            data: {
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
            },
        });
    }
    catch (err) {
        console.error("Admin Register error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.registerAdmin = registerAdmin;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let ip = req.ip || "unknown";
    try {
        if (rateLimitService_1.default.isConnected() &&
            (yield rateLimitService_1.default.isRateLimited(ip, "adminLogin", 5, 900))) {
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
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "adminLogin", 900);
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
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "adminLogin", 900);
            }
            res.status(400).json({
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
        const admin = yield admin_model_1.default.findOne(query).select("+password");
        if (!admin || !admin.isActive || !(yield admin.comparePassword(password))) {
            if (rateLimitService_1.default.isConnected()) {
                yield rateLimitService_1.default.incrementFailedAttempt(ip, "adminLogin", 900);
            }
            res.status(401).json({ status: "error", message: "Invalid credentials" });
            return;
        }
        yield admin.logLoginAttempt(ip, true);
        yield admin.invalidateOtherSessions();
        yield admin.updateLastLogin();
        const token = signToken(admin._id);
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.resetRateLimit(ip, "adminLogin");
        }
        res.status(200).json({
            status: "success",
            token,
            data: {
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                lastLogin: admin.lastLogin,
            },
        });
    }
    catch (err) {
        if (rateLimitService_1.default.isConnected()) {
            yield rateLimitService_1.default.incrementFailedAttempt(ip, "adminLogin", 900);
        }
        console.error("Admin Login error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.adminLogin = adminLogin;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        if (page < 1 || limit < 1) {
            res.status(400).json({
                status: "error",
                message: "Page and limit must be positive integers",
            });
            return;
        }
        const totalCount = yield user_model_1.default.countDocuments();
        const users = yield user_model_1.default.find({})
            .skip(skip)
            .limit(limit)
            .select("username email fullName dob role isActive lastLogin");
        res.status(200).json({
            status: "success",
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            data: { users },
        });
    }
    catch (err) {
        console.error("Get All Users error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.getAllUsers = getAllUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1;
        if (page < 1 || limit < 1) {
            res.status(400).json({
                status: "error",
                message: "Page and limit must be positive integers",
            });
            return;
        }
        const user = yield user_model_1.default.findById(req.params.id).select("username email fullName dob role isActive lastLogin");
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        res.status(200).json({
            status: "success",
            totalCount: 1,
            page,
            limit,
            totalPages: 1,
            data: { user },
        });
    }
    catch (err) {
        console.error("Get User By ID error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.getUserById = getUserById;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        res.status(204).json({
            status: "success",
            message: "User deleted successfully",
        });
    }
    catch (err) {
        console.error("Delete User error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.deleteUser = deleteUser;
