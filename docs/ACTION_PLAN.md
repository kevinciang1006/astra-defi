# AstraDeFi — High-Impact Action Plan

> **Goal**: Transform AstraDeFi from a wallet balance viewer into a credible DeFi yield tracking dashboard that demonstrates senior-level engineering for a job application.

## Current State

**What works:** Wallet connection, real multi-chain balance scanning (5 chains), live CoinGecko prices, Redis caching, polished UI with animations and demo mode.

**What's hollow:**
- Historical chart uses **generated fake data** — Prisma schema is defined but no migrations exist and nothing writes to the DB
- APY/fees/volume stats are **hardcoded or randomly derived** — no protocol integration
- No background worker despite being the key architectural differentiator in TECHNICAL_DESIGN.md
- Only 3 unit test files (format utils, validation, response helpers)
- No rate limiting, error monitoring, or security headers

---

## Phases (ordered by impact)

| Phase | Task | Detail Doc | Impact |
|-------|------|-----------|--------|
| **A** | A1. Activate Portfolio Snapshots | [TASK-A1.md](tasks/TASK-A1-Snapshots.md) | Eliminates the most visible fake (the chart) |
| **A** | A2. Background Price Indexer | [TASK-A2.md](tasks/TASK-A2-Price-Indexer.md) | Activates the DB, shows architectural depth |
| **A** | A3. Uniswap V3 Integration | [TASK-A3.md](tasks/TASK-A3-Uniswap-V3.md) | The "wow" feature — real DeFi protocol data |
| **B** | B1. Service & API Tests | [TASK-B1.md](tasks/TASK-B1-API-Tests.md) | Proves engineering discipline |
| **B** | B2. Component Tests | [TASK-B2.md](tasks/TASK-B2-Component-Tests.md) | Rounds out test coverage |
| **B** | B3. E2E Test (Playwright) | [TASK-B3.md](tasks/TASK-B3-E2E-Tests.md) | Full user journey verification |
| **C** | C1. Rate Limiting | [TASK-C1.md](tasks/TASK-C1-Rate-Limiting.md) | Production awareness |
| **C** | C2. Security Headers & CORS | [TASK-C2.md](tasks/TASK-C2-Security.md) | Production awareness |
| **C** | C3. Error Monitoring (Sentry) | [TASK-C3.md](tasks/TASK-C3-Sentry.md) | Production awareness |
| **D** | D1. Stale Data & Refresh | [TASK-D1.md](tasks/TASK-D1-Stale-Data.md) | UX polish |
| **D** | D2. Progressive Loading | [TASK-D2.md](tasks/TASK-D2-Progressive-Loading.md) | UX polish |

## Recommended Execution Order

1. **A1 (Snapshots)** — eliminates the most visible fake
2. **A2 (Price Indexer)** — activates DB writes, proves architecture
3. **B1 (API Tests)** — quick wins while A1/A2 code is fresh
4. **A3 (Uniswap V3)** — biggest "wow" feature
5. **B2 (Component Tests)** — rounds out coverage
6. **C1-C3 (Hardening)** — shows production awareness
7. **B3 (E2E)** — ties everything together
8. **D1-D2 (UX Polish)** — final touches

## Prerequisites (applies to all phases)

Before any Phase A work, must run:
```bash
npx prisma migrate dev --name init
```
No migrations currently exist. The schema is defined but never applied.

## After Completion

The app will: show real historical portfolio data from MySQL, display actual Uniswap V3 LP positions with fees and range status, run a background price indexer with daily snapshots, have meaningful test coverage (unit + integration + E2E), and handle production concerns (rate limiting, Sentry, security headers).
