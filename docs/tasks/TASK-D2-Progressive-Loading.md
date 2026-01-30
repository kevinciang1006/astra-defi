# TASK-D2: Progressive Loading

## Why
Currently the entire dashboard waits for one `usePortfolio` hook. The PRD specifies: "Progressive loading prioritizes total portfolio value, then individual positions." This improves perceived performance and demonstrates advanced React patterns (Suspense boundaries).

## Implementation

### Current State
`dashboard-content.tsx` has a single `usePortfolio(address)` call that fetches everything. The entire dashboard shows loading state until it resolves.

### Target State
Split into 3 independent data fetches with separate loading states:

1. **Portfolio Summary** (fastest) — total value and 24h change
   - Hook: `usePortfolioSummary(address)` → lightweight API or derive from cached data
   - Shows first, with skeleton for everything below

2. **Asset Positions** (medium) — full asset list with balances and prices
   - Hook: `usePortfolio(address)` (existing)
   - Shows after summary

3. **Chart Data** (slowest) — historical snapshots from DB
   - Hook: `useHistoricalData(address, period)` (new, from TASK-A1)
   - Shows last, independent of other sections

### Changes to `dashboard-content.tsx`
- Each section wrapped in its own loading/skeleton state
- Sections render independently as their data arrives
- Error in one section doesn't block others

### Skeleton Components
Already exist in shadcn/ui (`skeleton.tsx`). Use them for each section independently.

## Acceptance Criteria
- [ ] Portfolio summary appears before asset list
- [ ] Chart loads independently of other sections
- [ ] Error in chart doesn't break asset list (and vice versa)
- [ ] Each section has its own skeleton loader
