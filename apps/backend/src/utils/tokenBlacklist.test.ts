import { describe, it, expect, beforeEach } from 'bun:test';
import { blacklistToken, isTokenBlacklisted } from './tokenBlacklist';

// Each test gets a fresh state via fresh imports is not possible in bun (module cache),
// but the blacklist is a module-level Map — we reset via short TTLs and time-based logic.

describe('tokenBlacklist', () => {
  describe('blacklistToken / isTokenBlacklisted', () => {
    it('returns false for an unknown jti', () => {
      expect(isTokenBlacklisted('unknown-jti')).toBe(false);
    });

    it('returns true immediately after blacklisting a jti', () => {
      const jti = `jti-${Date.now()}-active`;
      blacklistToken(jti);
      expect(isTokenBlacklisted(jti)).toBe(true);
    });

    it('returns false and removes the entry after TTL has elapsed', () => {
      const jti = `jti-${Date.now()}-expired`;
      // Use -1ms TTL so the token is immediately "expired"
      blacklistToken(jti, -1);
      // isTokenBlacklisted checks Date.now() > expiresAt, which is now true
      expect(isTokenBlacklisted(jti)).toBe(false);
    });

    it('supports custom TTL values', () => {
      const jtiShort = `jti-${Date.now()}-short`;
      const jtiLong  = `jti-${Date.now()}-long`;
      blacklistToken(jtiShort, -1);
      blacklistToken(jtiLong, 60_000);

      expect(isTokenBlacklisted(jtiShort)).toBe(false); // already expired
      expect(isTokenBlacklisted(jtiLong)).toBe(true);   // still valid
    });

    it('can blacklist multiple independent jtis', () => {
      const jtiA = `jti-${Date.now()}-A`;
      const jtiB = `jti-${Date.now()}-B`;
      blacklistToken(jtiA);
      blacklistToken(jtiB);
      expect(isTokenBlacklisted(jtiA)).toBe(true);
      expect(isTokenBlacklisted(jtiB)).toBe(true);
    });
  });
});
