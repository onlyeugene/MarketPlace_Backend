"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.updatePasswordSchema = exports.updateUserDetailsSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.userSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const userSchema = joi_1.default.object({
    username: joi_1.default.string()
        .trim()
        .lowercase()
        .min(3)
        .max(30)
        .pattern(/^[a-z0-9_]+$/)
        .required()
        .messages({
        'string.base': 'Username must be a string',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'string.pattern.base': 'Username can only contain lowercase letters, numbers, and underscores',
        'any.required': 'Username is required',
    }),
    firstname: joi_1.default.string()
        .trim()
        .max(50)
        .pattern(/^[A-Za-z\s-]+$/)
        .required()
        .messages({
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, and hyphens',
        'any.required': 'First name is required',
    }),
    lastname: joi_1.default.string()
        .trim()
        .max(50)
        .pattern(/^[A-Za-z\s-]+$/)
        .required()
        .messages({
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, and hyphens',
        'any.required': 'Last name is required',
    }),
    dob: joi_1.default.date()
        .less('now')
        .required()
        .messages({
        'date.base': 'Date of birth must be a valid date',
        'date.less': 'Date of birth cannot be in the future',
        'any.required': 'Date of birth is required',
    }),
    email: joi_1.default.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .min(8)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
    }),
    phone: joi_1.default.string()
        .trim()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .allow(null)
        .messages({
        'string.pattern.base': 'Please enter a valid phone number',
    }),
    address: joi_1.default.object({
        street: joi_1.default.string().trim().max(100).allow(null),
        city: joi_1.default.string().trim().max(50).allow(null),
        state: joi_1.default.string().trim().max(50).allow(null),
        country: joi_1.default.string().trim().max(50).allow(null),
        postalCode: joi_1.default.string().trim().max(20).allow(null),
    }).default(null),
    role: joi_1.default.string()
        .valid('user', 'admin', 'moderator')
        .default('user')
        .messages({
        'any.only': 'Role must be one of: user, admin, moderator',
    }),
});
exports.userSchema = userSchema;
const loginSchema = joi_1.default.object({
    identifier: joi_1.default.string().required().messages({
        'any.required': 'Email or username is required',
    }),
    password: joi_1.default.string().required().messages({
        'any.required': 'Password is required',
    }),
}).strict();
exports.loginSchema = loginSchema;
const forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
    }),
});
exports.forgotPasswordSchema = forgotPasswordSchema;
const resetPasswordSchema = joi_1.default.object({
    password: joi_1.default.string()
        .min(8)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
    }),
});
exports.resetPasswordSchema = resetPasswordSchema;
const updateUserDetailsSchema = joi_1.default.object({
    username: joi_1.default.string().optional(),
    email: joi_1.default.string().email().optional(),
    firstname: joi_1.default.string().optional(),
    lastname: joi_1.default.string().optional(),
}).or('username', 'email', 'firstname', 'lastname');
exports.updateUserDetailsSchema = updateUserDetailsSchema;
const updatePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'any.required': 'Current password is required',
    }),
    newPassword: joi_1.default.string().required().min(8).messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required',
    }),
});
exports.updatePasswordSchema = updatePasswordSchema;
const verifyOtpSchema = joi_1.default.object({
    userId: joi_1.default.string().required().messages({
        'any.required': 'User ID is required',
    }),
    otp: joi_1.default.string().length(6).pattern(/^\d+$/).required().messages({
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only digits',
        'any.required': 'OTP is required',
    }),
    type: joi_1.default.string().valid('registration', 'email-update').required().messages({
        'any.only': 'Type must be either "registration" or "email-update"',
        'any.required': 'Type is required',
    }),
});
exports.verifyOtpSchema = verifyOtpSchema;
