"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.verifyOtpSchema = joi_1.default.object({
    otp: joi_1.default.string().length(6).pattern(/^\d+$/).required().messages({
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only digits',
        'any.required': 'OTP is required',
    }),
});
