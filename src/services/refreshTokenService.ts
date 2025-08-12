import Redis from "ioredis";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

type StoredRefresh = {
  userId: string;
  expiresAt: number; // epoch ms
};

class RefreshTokenService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    this.redis.on("error", (err) => {
      console.error("Redis (refresh) error:", err.message);
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private keyForToken(hash: string): string {
    return `rt:${hash}`;
  }

  private setKeyForUser(userId: string): string {
    return `rtu:${userId}`;
  }

  async issue(
    userId: string,
    ttlDays: number = 30
  ): Promise<{ refreshToken: string; expiresAt: number }> {
    const refreshToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = this.hashToken(refreshToken);
    const key = this.keyForToken(tokenHash);
    const userSetKey = this.setKeyForUser(userId);
    const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
    const ttlSeconds = Math.ceil((expiresAt - Date.now()) / 1000);

    const payload: StoredRefresh = { userId, expiresAt };
    await this.redis.set(key, JSON.stringify(payload), "EX", ttlSeconds);
    await this.redis.sadd(userSetKey, tokenHash);
    await this.redis.expire(userSetKey, ttlSeconds);
    return { refreshToken, expiresAt };
  }

  async verifyAndRotate(
    refreshToken: string,
    ttlDays: number = 30
  ): Promise<{
    userId: string;
    newRefreshToken: string;
    expiresAt: number;
  } | null> {
    const tokenHash = this.hashToken(refreshToken);
    const key = this.keyForToken(tokenHash);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredRefresh;
    if (parsed.expiresAt < Date.now()) {
      await this.revoke(refreshToken);
      return null;
    }

    // Rotate: revoke old and issue new
    await this.revoke(refreshToken);
    const { refreshToken: newRefreshToken, expiresAt } = await this.issue(
      parsed.userId,
      ttlDays
    );
    return { userId: parsed.userId, newRefreshToken, expiresAt };
  }

  async revoke(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const key = this.keyForToken(tokenHash);
    const raw = await this.redis.get(key);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredRefresh;
      const userSetKey = this.setKeyForUser(parsed.userId);
      await this.redis.srem(userSetKey, tokenHash);
    }
    await this.redis.del(key);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const userSetKey = this.setKeyForUser(userId);
    const members = await this.redis.smembers(userSetKey);
    if (members && members.length) {
      const keys = members.map((h) => this.keyForToken(h));
      await this.redis.del(...keys);
    }
    await this.redis.del(userSetKey);
  }
}

export default new RefreshTokenService();
