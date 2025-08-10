"use strict";
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
    async isRateLimited(ip, action, maxAttempts, windowSeconds) {
        const key = `rate_limit:${action}:${ip}`;
        try {
            const attempts = await this.redis.get(key);
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
    }
    async incrementFailedAttempt(ip, action, windowSeconds = 900) {
        const key = `rate_limit:${action}:${ip}`;
        try {
            const attempts = await this.redis.incr(key);
            if (attempts === 1) {
                await this.redis.expire(key, windowSeconds);
            }
        }
        catch (err) {
            console.error(`Error incrementing rate limit for ${key}:`, err.message);
        }
    }
    async resetRateLimit(ip, action) {
        const key = `rate_limit:${action}:${ip}`;
        try {
            await this.redis.del(key);
        }
        catch (err) {
            console.error(`Error resetting rate limit for ${key}:`, err.message);
        }
    }
    isConnected() {
        return this.redis.status === 'ready';
    }
}
exports.default = new RateLimitService();
