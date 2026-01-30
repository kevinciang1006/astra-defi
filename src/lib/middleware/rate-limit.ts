import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { errors } from '@/lib/api';

interface RateLimitConfig {
  /** Time window in seconds */
  windowSeconds: number;
  /** Maximum requests allowed within the window */
  maxRequests: number;
}

/**
 * Token bucket rate limiter backed by Redis.
 * Returns null if the request is allowed, or a 429 NextResponse if rate-limited.
 *
 * Falls back to allowing all requests if Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const redis = getRedisClient();

  // If Redis is unavailable, allow the request through
  if (!redis) return null;

  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.incr(key);

    // Set expiry on first request in the window
    if (current === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    if (current > config.maxRequests) {
      const ttl = await redis.ttl(key);
      const retryAfter = ttl > 0 ? ttl : config.windowSeconds;

      const response = errors.rateLimited(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );

      response.headers.set('Retry-After', String(retryAfter));
      response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + retryAfter));

      return response;
    }

    return null; // Allowed
  } catch {
    // Redis error — fail open (allow the request)
    return null;
  }
}

/** Rate limit presets for common route types */
export const RateLimits = {
  /** Read endpoints — generous limits */
  read: { windowSeconds: 60, maxRequests: 60 },
  /** Portfolio endpoint — heavier, triggers RPC calls */
  portfolio: { windowSeconds: 60, maxRequests: 30 },
  /** Write endpoints — tighter limits */
  write: { windowSeconds: 60, maxRequests: 10 },
} as const;
