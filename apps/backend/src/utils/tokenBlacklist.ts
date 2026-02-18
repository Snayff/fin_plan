/**
 * In-memory token blacklist with automatic TTL cleanup.
 * Stores JWT IDs (jti) of revoked access tokens.
 * Tokens are automatically removed after they would have expired anyway.
 */

const blacklist = new Map<string, number>(); // jti -> expiresAt (ms)

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes (matches access token expiry)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run cleanup every 5 minutes

/**
 * Add a token's jti to the blacklist.
 */
export function blacklistToken(jti: string, ttlMs: number = DEFAULT_TTL_MS): void {
  blacklist.set(jti, Date.now() + ttlMs);
}

/**
 * Check if a token's jti is blacklisted.
 */
export function isTokenBlacklisted(jti: string): boolean {
  const expiresAt = blacklist.get(jti);
  if (expiresAt === undefined) return false;
  if (Date.now() > expiresAt) {
    blacklist.delete(jti);
    return false;
  }
  return true;
}

/**
 * Remove expired entries from the blacklist.
 */
function cleanup(): void {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklist) {
    if (now > expiresAt) {
      blacklist.delete(jti);
    }
  }
}

// Periodic cleanup to prevent unbounded memory growth
setInterval(cleanup, CLEANUP_INTERVAL_MS).unref();
