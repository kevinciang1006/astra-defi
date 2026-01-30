# TASK-D1: Stale Data Indicator & Manual Refresh

## Why
The PRD specifies: "Visual indicator when data is >2 minutes old with manual refresh option." This doesn't exist. It's a small UX detail that shows attention to real-world usage.

## Implementation

### Changes to `dashboard-content.tsx`
1. Track `lastUpdated` timestamp from portfolio data (`portfolio.lastUpdated` is already an ISO string)
2. Compute staleness: `Date.now() - new Date(lastUpdated).getTime() > 120_000`
3. Show an amber badge: "Data is X minutes old" when stale
4. Add a refresh button (calls `refetch()` from TanStack Query — already available)

### Changes to `portfolio-summary.tsx`
1. Accept optional `lastUpdated` and `onRefresh` props
2. Show a small "Updated X ago" label near the total value
3. Show refresh icon button

### Visual Design
- Normal: subtle "Updated 30s ago" text
- Stale (>2min): amber warning badge with refresh icon
- Refreshing: spinning icon on the refresh button

## Acceptance Criteria
- [ ] "Updated X ago" shown in portfolio summary
- [ ] Amber warning appears when data is >2 minutes old
- [ ] Refresh button triggers data re-fetch
- [ ] Loading state shown during refresh
