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
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user-model"));
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = payload.id || payload._id;
        if (!userId) {
            return res
                .status(403)
                .json({ status: "error", message: "Invalid token" });
        }
        const user = yield user_model_1.default.findById(userId).select("_id isDeactivated");
        if (!user) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }
        if (user.isDeactivated) {
            return res.status(403).json({
                status: "error",
                message: "Account is deactivated. Please login to reactivate.",
            });
        }
        req.user = { id: String(user._id) };
        next();
    }
    catch (err) {
        return res.status(403).json({ status: "error", message: "Invalid token" });
    }
});
exports.authenticateToken = authenticateToken;
