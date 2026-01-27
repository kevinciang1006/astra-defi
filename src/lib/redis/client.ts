import Redis from 'ioredis';

// Singleton Redis client to avoid connection exhaustion
let redis: Redis | null = null;

/**
 * Get or create a Redis client instance.
 * Uses singleton pattern to reuse connections across requests.
 */
export function getRedisClient(): Redis {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // Reconnect on error
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  redis.on('error', (error) => {
    console.error('[Redis] Connection error:', error.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  return redis;
}

/**
 * Gracefully close Redis connection.
 * Call this during application shutdown.
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Connection closed');
  }
}
