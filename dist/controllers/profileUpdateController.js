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
exports.updateUserDetails = void 0;
const user_model_1 = __importDefault(require("../models/user-model"));
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
            res.status(403).json({ status: "error", message: "Forbidden: Cannot update another user's details" });
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
        // Sanitize only provided fields
        if (value.username)
            value.username = (0, sanitize_html_1.default)(value.username);
        if (value.dob)
            value.dob = new Date(value.dob);
        const existingUser = yield user_model_1.default.findOne({
            $and: [
                { _id: { $ne: userId } },
                { username: value.username },
            ],
        });
        if (existingUser) {
            res.status(400).json({ status: "error", message: "Username already in use" });
            return;
        }
        const user = yield user_model_1.default.findByIdAndUpdate(userId, { $set: value }, { new: true, runValidators: true });
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
