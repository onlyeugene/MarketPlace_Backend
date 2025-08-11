"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err)
            return res.status(403).json({ status: 'error', message: 'Invalid token' });
        // Type assertion to JwtPayload with _id property
        const user = payload;
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
