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
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RefreshTokenService {
    constructor() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        });
        this.redis.on("error", (err) => {
            console.error("Redis (refresh) error:", err.message);
        });
    }
    hashToken(token) {
        return crypto_1.default.createHash("sha256").update(token).digest("hex");
    }
    keyForToken(hash) {
        return `rt:${hash}`;
    }
    setKeyForUser(userId) {
        return `rtu:${userId}`;
    }
    issue(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, ttlDays = 30) {
            const refreshToken = crypto_1.default.randomBytes(48).toString("hex");
            const tokenHash = this.hashToken(refreshToken);
            const key = this.keyForToken(tokenHash);
            const userSetKey = this.setKeyForUser(userId);
            const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
            const ttlSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
            const payload = { userId, expiresAt };
            yield this.redis.set(key, JSON.stringify(payload), "EX", ttlSeconds);
            yield this.redis.sadd(userSetKey, tokenHash);
            yield this.redis.expire(userSetKey, ttlSeconds);
            return { refreshToken, expiresAt };
        });
    }
    verifyAndRotate(refreshToken_1) {
        return __awaiter(this, arguments, void 0, function* (refreshToken, ttlDays = 30) {
            const tokenHash = this.hashToken(refreshToken);
            const key = this.keyForToken(tokenHash);
            const raw = yield this.redis.get(key);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            if (parsed.expiresAt < Date.now()) {
                yield this.revoke(refreshToken);
                return null;
            }
            // Rotate: revoke old and issue new
            yield this.revoke(refreshToken);
            const { refreshToken: newRefreshToken, expiresAt } = yield this.issue(parsed.userId, ttlDays);
            return { userId: parsed.userId, newRefreshToken, expiresAt };
        });
    }
    revoke(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenHash = this.hashToken(refreshToken);
            const key = this.keyForToken(tokenHash);
            const raw = yield this.redis.get(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                const userSetKey = this.setKeyForUser(parsed.userId);
                yield this.redis.srem(userSetKey, tokenHash);
            }
            yield this.redis.del(key);
        });
    }
    revokeAllForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userSetKey = this.setKeyForUser(userId);
            const members = yield this.redis.smembers(userSetKey);
            if (members && members.length) {
                const keys = members.map((h) => this.keyForToken(h));
                yield this.redis.del(...keys);
            }
            yield this.redis.del(userSetKey);
        });
    }
}
exports.default = new RefreshTokenService();
