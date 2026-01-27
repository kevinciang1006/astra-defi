import Redis from 'ioredis';

// Singleton Redis client to avoid connection exhaustion
let redis: Redis | null = null;
let connectionFailed = false;

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null && !connectionFailed;
}

/**
 * Get or create a Redis client instance.
 * Returns null if Redis is not configured or unavailable.
 */
export function getRedisClient(): Redis | null {
  if (connectionFailed) {
    return null;
  }

  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not set, caching disabled');
    connectionFailed = true;
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) {
          // Stop retrying after 2 attempts
          connectionFailed = true;
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    redis.on('error', (error) => {
      console.error('[Redis] Connection error:', error.message);
      connectionFailed = true;
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
      connectionFailed = false;
    });

    return redis;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    connectionFailed = true;
    return null;
  }
}

/**
 * Gracefully close Redis connection.
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Connection closed');
  }
}
