import { getRedisClient } from './client';

// Cache key prefixes for organization
export const CacheKeys = {
  PRICE: 'price',
  BALANCE: 'balance',
  PORTFOLIO: 'portfolio',
} as const;

/**
 * Build a namespaced cache key.
 * @example buildKey('price', '1', '0x...') => 'price:1:0x...'
 */
export function buildKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Get a value from cache, or set it using the fetcher if missing.
 * Implements the cache-aside (lazy-loading) pattern.
 * Falls back to direct fetching if Redis is unavailable.
 *
 * @param key - The cache key
 * @param fetcher - Async function to fetch data if cache miss
 * @param ttlSeconds - Time to live in seconds
 * @returns The cached or fetched value
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redis = getRedisClient();

  // If Redis is unavailable, just fetch directly
  if (!redis) {
    return fetcher();
  }

  try {
    // Try to get from cache first
    const cached = await redis.get(key);

    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // Invalid JSON in cache, fetch fresh
        console.warn(`[Cache] Invalid JSON for key: ${key}`);
      }
    }

    // Cache miss - fetch fresh data
    const data = await fetcher();

    // Store in cache (fire and forget for performance)
    redis.setex(key, ttlSeconds, JSON.stringify(data)).catch((error) => {
      console.error(`[Cache] Failed to set key ${key}:`, error);
    });

    return data;
  } catch (error) {
    // Redis error - fall back to direct fetch
    console.warn('[Cache] Redis error, fetching directly:', error);
    return fetcher();
  }
}

/**
 * Get a value from cache.
 * @returns The cached value or null if not found/unavailable
 */
export async function get<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get(key);

    if (cached === null) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in cache with TTL.
 */
export async function set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`[Cache] Failed to set ${key}:`, error);
  }
}

/**
 * Delete a specific key from cache.
 */
export async function invalidate(key: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] Failed to invalidate ${key}:`, error);
  }
}

/**
 * Delete all keys matching a pattern.
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  const redis = getRedisClient();

  if (!redis) {
    return 0;
  }

  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
  } catch (error) {
    console.error(`[Cache] Failed to invalidate pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Check if Redis is connected and healthy.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const redis = getRedisClient();

    if (!redis) {
      return false;
    }

    const response = await redis.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}
