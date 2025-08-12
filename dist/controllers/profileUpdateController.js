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
exports.deleteAccount = exports.deactivateAccount = exports.getUserProfileById = exports.getMyProfile = exports.updateUserDetails = void 0;
const user_model_1 = __importDefault(require("../models/user-model"));
// import Joi from "joi";
// import { checkDisposableEmail } from "../services/emailValidationService";
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const userValidation_1 = require("../validations/userValidation");
const updateUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ip = req.ip || "unknown";
        const userId = req.params.id;
        if (!userId) {
            res.status(400).json({ status: "error", message: "User ID is required" });
            return;
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId) {
            console.log("Mismatch: req.user.id =", (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, "vs userId =", userId);
            res.status(403).json({
                status: "error",
                message: "Forbidden: Cannot update another user's details",
            });
            return;
        }
        const { error, value } = userValidation_1.updateUserDetailsSchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            res.status(400).json({
                status: "error",
                message: error.details.map((detail) => detail.message),
            });
            return;
        }
        // Sanitize and normalize provided fields
        if (value.username)
            value.username = (0, sanitize_html_1.default)(value.username);
        if (value.firstname)
            value.firstname = (0, sanitize_html_1.default)(value.firstname);
        if (value.lastname)
            value.lastname = (0, sanitize_html_1.default)(value.lastname);
        if (value.phone)
            value.phone = (0, sanitize_html_1.default)(value.phone);
        if (value.address) {
            value.address.street = value.address.street
                ? (0, sanitize_html_1.default)(value.address.street)
                : value.address.street;
            value.address.city = value.address.city
                ? (0, sanitize_html_1.default)(value.address.city)
                : value.address.city;
            value.address.state = value.address.state
                ? (0, sanitize_html_1.default)(value.address.state)
                : value.address.state;
            value.address.country = value.address.country
                ? (0, sanitize_html_1.default)(value.address.country)
                : value.address.country;
            value.address.postalCode = value.address.postalCode
                ? (0, sanitize_html_1.default)(value.address.postalCode)
                : value.address.postalCode;
        }
        if (value.dob)
            value.dob = new Date(value.dob);
        const existingUser = value.username
            ? yield user_model_1.default.findOne({
                $and: [{ _id: { $ne: userId } }, { username: value.username }],
            })
            : null;
        if (existingUser) {
            res
                .status(400)
                .json({ status: "error", message: "Username already in use" });
            return;
        }
        const user = (yield user_model_1.default.findByIdAndUpdate(userId, { $set: value }, { new: true, runValidators: true }));
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        res.status(200).json({
            status: "success",
            data: {
                username: user.username,
                dob: user.dob,
                fullName: user.fullName,
            },
        });
    }
    catch (err) {
        console.error("UpdateUserDetails error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.updateUserDetails = updateUserDetails;
// Get profile of the currently authenticated user
const getMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ status: "error", message: "Unauthorized" });
            return;
        }
        const user = (yield user_model_1.default.findById(userId));
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        res.status(200).json({
            status: "success",
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                dob: user.dob,
                phone: user.phone,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (err) {
        console.error("GetMyProfile error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.getMyProfile = getMyProfile;
// Get another user's public profile by ID
const getUserProfileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ status: "error", message: "User ID is required" });
            return;
        }
        const user = (yield user_model_1.default.findById(id));
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        res.status(200).json({
            status: "success",
            data: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                dob: user.dob,
            },
        });
    }
    catch (err) {
        console.error("GetUserProfileById error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.getUserProfileById = getUserProfileById;
// Deactivate account (auth required)
const deactivateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ status: "error", message: "Unauthorized" });
            return;
        }
        const reason = typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.reason) === "string"
            ? (0, sanitize_html_1.default)(req.body.reason)
            : undefined;
        const user = (yield user_model_1.default.findById(userId));
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        user.isDeactivated = true;
        user.deactivationReason = reason;
        user.deactivatedAt = new Date();
        yield user.save();
        res.status(200).json({ status: "success", message: "Account deactivated" });
    }
    catch (err) {
        console.error("DeactivateAccount error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.deactivateAccount = deactivateAccount;
// Delete account (auth required)
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ status: "error", message: "Unauthorized" });
            return;
        }
        const user = (yield user_model_1.default.findById(userId));
        if (!user) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }
        yield user_model_1.default.deleteOne({ _id: userId });
        res.status(200).json({ status: "success", message: "Account deleted" });
    }
    catch (err) {
        console.error("DeleteAccount error:", err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.deleteAccount = deleteAccount;
