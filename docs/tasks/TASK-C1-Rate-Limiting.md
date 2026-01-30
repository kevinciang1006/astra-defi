# TASK-C1: Rate Limiting

## Why
No rate limiting exists on any API route. Expensive operations like portfolio scanning trigger multiple RPC calls. Without limits, a single client can exhaust RPC quotas.

## Implementation

### Approach: Token Bucket via Redis
Use the existing Redis client — no new dependencies needed.

**File:** `src/lib/middleware/rate-limit.ts`

```typescript
import { getRedisClient } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { errors } from '@/lib/api';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Returns null if allowed, or a NextResponse if rate-limited
export async function checkRateLimit(
  identifier: string, // IP address or wallet address
  config: RateLimitConfig
): Promise<NextResponse | null>
```

### Limits per Route
| Route | Window | Max | Rationale |
|-------|--------|-----|-----------|
| `GET /api/portfolio/[address]` | 60s | 30 | Heavy — triggers RPC multicalls |
| `GET /api/prices` | 60s | 60 | Moderate — usually cached |
| `POST /api/portfolio/[address]/snapshot` | 60s | 5 | Write operation |
| `GET /api/cron/*` | — | Secret-only | No rate limit, auth only |

### Usage in Route Handlers
```typescript
const rateLimited = await checkRateLimit(
  request.headers.get('x-forwarded-for') ?? 'anonymous',
  { windowMs: 60_000, maxRequests: 30 }
);
if (rateLimited) return rateLimited; // Returns 429 with Retry-After header
```

### Response Format
```
HTTP 429 Too Many Requests
Retry-After: 30
{ "success": false, "error": { "code": "RATE_LIMITED", "message": "Too many requests" } }
```

Add `RATE_LIMITED` to `ErrorCode` in `src/lib/api/response.ts`.

## Acceptance Criteria
- [ ] Portfolio route returns 429 after 30 requests in 60 seconds
- [ ] Response includes `Retry-After` header
- [ ] Rate limit state stored in Redis (works across serverless instances)
- [ ] Graceful fallback if Redis unavailable (allow request through)
