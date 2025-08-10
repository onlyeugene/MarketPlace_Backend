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
const dotenv_1 = __importDefault(require("dotenv"));
/**
 * @module services/rateLimitService
 * @description Service for rate limiting authentication attempts using Redis
 */
dotenv_1.default.config();
class RateLimitService {
    constructor() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy(times) {
                if (times > 3) {
                    console.error('Redis connection failed after 3 retries');
                    return null;
                }
                return 2000;
            },
        });
        this.redis.on('error', (err) => {
            console.error('Redis error:', err.message);
        });
        this.redis.on('connect', () => {
            console.log('Connected to Redis for rate limiting 🎉');
        });
    }
    isRateLimited(ip, action, maxAttempts, windowSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `rate_limit:${action}:${ip}`;
            try {
                const attempts = yield this.redis.get(key);
                const currentAttempts = attempts ? parseInt(attempts, 10) : 0;
                if (currentAttempts >= maxAttempts) {
                    return true;
                }
                return false;
            }
            catch (err) {
                console.error(`Error checking rate limit for ${key}:`, err.message);
                return false;
            }
        });
    }
    incrementFailedAttempt(ip_1, action_1) {
        return __awaiter(this, arguments, void 0, function* (ip, action, windowSeconds = 900) {
            const key = `rate_limit:${action}:${ip}`;
            try {
                const attempts = yield this.redis.incr(key);
                if (attempts === 1) {
                    yield this.redis.expire(key, windowSeconds);
                }
            }
            catch (err) {
                console.error(`Error incrementing rate limit for ${key}:`, err.message);
            }
        });
    }
    resetRateLimit(ip, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `rate_limit:${action}:${ip}`;
            try {
                yield this.redis.del(key);
            }
            catch (err) {
                console.error(`Error resetting rate limit for ${key}:`, err.message);
            }
        });
    }
    isConnected() {
        return this.redis.status === 'ready';
    }
}
exports.default = new RateLimitService();
