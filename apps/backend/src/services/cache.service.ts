import Redis from 'ioredis';
import { config } from '../config/env';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redis.on('error', (err: Error) => {
      // Log but never throw — Redis failure must not break the app
      console.error('[cache] Redis error:', err.message);
    });
  }
  return redis;
}

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedis();
      if (!client) return null;
      const raw = await client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Silent — Redis failure must not surface to callers
    }
  },

  async invalidate(...keys: string[]): Promise<void> {
    try {
      const client = getRedis();
      if (!client || keys.length === 0) return;
      await client.del(...keys);
    } catch {
      // Silent
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, batch] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Silent
    }
  },
};
