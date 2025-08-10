declare class RateLimitService {
    private redis;
    constructor();
    isRateLimited(ip: string, action: string, maxAttempts: number, windowSeconds: number): Promise<boolean>;
    incrementFailedAttempt(ip: string, action: string, windowSeconds?: number): Promise<void>;
    resetRateLimit(ip: string, action: string): Promise<void>;
    isConnected(): boolean;
}
declare const _default: RateLimitService;
export default _default;
