# TASK-C2: Security Headers & CORS

## Why
No security headers or CORS config exists. For a production-grade demo, this shows awareness of OWASP best practices.

## Implementation

### Step 1: Security Headers in next.config.ts
Add headers to `next.config.ts`:

```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.alchemyapi.io https://*.infura.io https://api.coingecko.com wss://*; font-src 'self';",
      },
    ],
  },
],
```

### Step 2: CORS for API Routes
Create `src/lib/middleware/cors.ts`:
- Allow only the app's own origin in production
- Allow `localhost:3000` in development
- Return proper `Access-Control-Allow-*` headers on OPTIONS preflight

### Step 3: Secure Cron Routes
Already handled in TASK-A2 via `CRON_SECRET` Bearer token check.

## Acceptance Criteria
- [ ] All pages return security headers
- [ ] CSP allows RPC providers and CoinGecko API
- [ ] API routes handle OPTIONS preflight correctly
- [ ] CORS restricted to app origin in production
