# TASK-B2: Component Tests

## Why
No component tests exist. The dashboard is the primary UI — testing that it renders correctly with various data states demonstrates frontend engineering quality.

## Testing Setup
- Jest + React Testing Library (already configured in `jest.setup.js`)
- Must mock: `useAccount` (wagmi), `useQuery` (TanStack), `framer-motion`, `recharts`
- Components use `'use client'` directive

## Test Files to Create

### 1. `src/components/dashboard/__tests__/portfolio-summary.test.tsx`
Test `PortfolioSummary` component:
- Renders total value formatted as currency
- Shows 24h change with correct color (green positive, red negative)
- Shows position count and chain count
- Shows skeleton state when `isLoading=true`
- Handles zero-value portfolio

### 2. `src/components/dashboard/__tests__/asset-list.test.tsx`
Test `AssetList` component:
- Renders all assets
- Sorts by value (default), name, 24h change
- Filters by chain
- Filters by token search text
- Switches between card and table view
- Shows empty state with no assets

### 3. `src/components/dashboard/__tests__/portfolio-chart.test.tsx`
Test `PortfolioChart` component:
- Renders chart with data
- Switches between time periods (7d, 30d, 90d, 1y)
- Shows skeleton when loading
- Handles empty data gracefully

### 4. `src/components/dashboard/__tests__/dashboard-content.test.tsx`
Test `DashboardContent` orchestration:
- Shows welcome screen when wallet not connected
- Shows demo mode toggle
- Enables demo mode → renders mock portfolio data
- Shows error state with retry button
- Shows loading skeletons

## Mocking Pattern
```typescript
// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: undefined, isConnected: false })),
}));

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock framer-motion (avoid animation issues in tests)
jest.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', button: 'button' },
  AnimatePresence: ({ children }) => children,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));
```

## Acceptance Criteria
- [ ] All 4 test files pass
- [ ] Tests cover loading, error, empty, and populated states
- [ ] User interactions tested (sort, filter, toggle)
- [ ] No flaky tests from animations or async rendering
