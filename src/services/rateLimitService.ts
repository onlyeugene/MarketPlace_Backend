import Redis from 'ioredis';
import dotenv from 'dotenv';

/**
 * @module services/rateLimitService
 * @description Service for rate limiting authentication attempts using Redis
 */
dotenv.config();

class RateLimitService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
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

  async isRateLimited(ip: string, action: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    const key = `rate_limit:${action}:${ip}`;
    try {
      const attempts = await this.redis.get(key);
      const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

      if (currentAttempts >= maxAttempts) {
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(`Error checking rate limit for ${key}:`, err.message);
      return false;
    }
  }

  async incrementFailedAttempt(ip: string, action: string, windowSeconds: number = 900): Promise<void> {
    const key = `rate_limit:${action}:${ip}`;
    try {
      const attempts = await this.redis.incr(key);
      if (attempts === 1) {
        await this.redis.expire(key, windowSeconds);
      }
    } catch (err: any) {
      console.error(`Error incrementing rate limit for ${key}:`, err.message);
    }
  }

  async resetRateLimit(ip: string, action: string): Promise<void> {
    const key = `rate_limit:${action}:${ip}`;
    try {
      await this.redis.del(key);
    } catch (err: any) {
      console.error(`Error resetting rate limit for ${key}:`, err.message);
    }
  }

  isConnected(): boolean {
    return this.redis.status === 'ready';
  }
}

export default new RateLimitService();