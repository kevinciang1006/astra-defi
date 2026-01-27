# TASK-3.1.2: Redis Caching Infrastructure

## Objective

Set up the "Hot Data" layer. AstraDeFi needs sub-200ms responses. We cannot query the blockchain for every user request. We must cache aggressively.

## Context

Alignment with `TECHNICAL_DESIGN.md`: Section 2.2-B (API Layer & Caching).
Alignment with `PRD.md`: "Redis-backed caching" (P0 Requirement).

## Requirements

### 1. Redis Client Singleton (`src/lib/redis.ts`)

- Initialize a Redis client (using `ioredis` or `@upstash/redis` - stick to `ioredis` for the Docker setup).
- Ensure it reuses the connection in development (Fast Refresh issue).

### 2. Caching Utilities (`src/lib/cache.ts`)

Implement a helper class/function `CacheManager`:

- `get<T>(key: string): Promise<T | null>`
- `set(key: string, value: any, ttlSeconds: number): Promise<void>`
- `getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T>`
  - **Crucial Pattern**: This function checks Redis first. If missing, it runs the `fetcher` (blockchain call), caches the result, and returns it.

### 3. Key Strategy

Define standard key prefixes to avoid collisions:

- `price:{coingeckoId}` -> e.g., `price:ethereum`, `price:uniswap` (TTL: 60s)
- `portfolio:{walletAddress}` -> The full calculated portfolio object (TTL: 300s or until invalidated).

## Implementation Steps

1.  Install: `npm install ioredis`.
2.  Create `src/lib/redis.ts`.
3.  Verify connection to the Docker Redis container (`localhost:6379`).
