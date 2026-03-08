// Simple in-memory rate limiter for edge functions
// Limits requests per user per function within a time window

const requests = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, val] of requests) {
        if (now > val.resetAt) requests.delete(key);
    }
}

/**
 * Check if a request is rate limited.
 * @param userId - User identifier
 * @param action - Action name (e.g. 'deposit', 'withdraw')
 * @param maxRequests - Max requests in window (default: 10)
 * @param windowMs - Time window in ms (default: 60000 = 1 min)
 * @returns true if rate limited (should block), false if allowed
 */
export function isRateLimited(
    userId: string,
    action: string,
    maxRequests = 10,
    windowMs = 60_000
): boolean {
    cleanup();
    const key = `${action}:${userId}`;
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now > entry.resetAt) {
        requests.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count++;
    if (entry.count > maxRequests) {
        return true;
    }

    return false;
}
