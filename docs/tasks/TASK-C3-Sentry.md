# TASK-C3: Error Monitoring (Sentry)

## Why
No error monitoring exists. Errors in production go unnoticed. Sentry integration demonstrates operational maturity expected of a senior engineer.

## Implementation

### Step 1: Install
```bash
npx @sentry/wizard@latest -i nextjs
```
This auto-creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and modifies `next.config.ts`.

### Step 2: Configure
- DSN from `SENTRY_DSN` env var
- Enable source maps in production
- Set `tracesSampleRate: 0.1` (10% of requests)
- Set `environment` from `NODE_ENV`

### Step 3: Error Boundary Component
**File:** `src/components/error-boundary.tsx`

Wrap the dashboard in a React error boundary that reports to Sentry and shows a fallback UI with a "Try Again" button.

### Step 4: Instrument API Routes
Add `Sentry.captureException(error)` to catch blocks in API route handlers (currently only `console.error`).

### Step 5: Update .env.example
```
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

## Acceptance Criteria
- [ ] Sentry SDK initialized on client and server
- [ ] Unhandled errors reported to Sentry
- [ ] API route errors captured with request context
- [ ] Error boundary renders fallback UI on component crash
- [ ] Source maps uploaded for production builds
