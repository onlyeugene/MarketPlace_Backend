"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const adminAuthController_1 = require("../controllers/adminAuthController");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const router = express_1.default.Router();
// Rate limiting for admin routes
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per window
    message: { status: "error", message: "Too many requests, please try again later" },
});
// Rate limiting for sensitive admin actions
const sensitiveAdminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Stricter limit
    message: { status: "error", message: "Too many attempts, please try again later" },
});
/**
 * @route POST /api/v1/admin/register
 * @desc Register a new admin
 * @access Private (Admin)
 */
router.post("/admin/register", adminMiddleware_1.authenticateAdminToken, sensitiveAdminLimiter, adminAuthController_1.registerAdmin);
/**
 * @route POST /api/v1/admin/login
 * @desc Authenticate an admin and issue a JWT token
 * @access Public
 */
router.post("/admin/login", adminLimiter, adminAuthController_1.adminLogin);
/**
 * @route GET /api/v1/admin/users
 * @desc Get all users
 * @access Private (Admin)
 */
router.get("/admin/users", adminMiddleware_1.authenticateAdminToken, sensitiveAdminLimiter, adminAuthController_1.getAllUsers);
/**
 * @route GET /api/v1/admin/users/:id
 * @desc Get a user by ID
 * @access Private (Admin)
 */
router.get("/admin/users/:id", adminMiddleware_1.authenticateAdminToken, sensitiveAdminLimiter, adminAuthController_1.getUserById);
/**
 * @route DELETE /api/v1/admin/users/:id
 * @desc Delete a user by ID
 * @access Private (Admin)
 */
router.delete("/admin/users/:id", adminMiddleware_1.authenticateAdminToken, sensitiveAdminLimiter, adminAuthController_1.deleteUser);
exports.default = router;
