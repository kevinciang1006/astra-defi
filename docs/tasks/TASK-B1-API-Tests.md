# TASK-B1: Service & API Integration Tests

## Why
Only 3 test files exist (format utils, validation, response helpers). A senior engineer demo needs meaningful test coverage on the service layer and API routes — the actual business logic.

## Existing Test Patterns

### Jest Config (`jest.config.js`)
- Environment: `jsdom`
- Module alias: `@/` → `src/`
- Setup: `jest.setup.js` (imports `@testing-library/jest-dom`)

### Mocking Pattern (from existing tests)
```typescript
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
```

---

## Test Files to Create

### 1. `src/lib/services/__tests__/snapshot.test.ts`
Test the snapshot service (created in TASK-A1):
- `createSnapshot`: upserts user, fetches portfolio, creates DB record, invalidates cache
- `getHistoricalData`: queries by time range, returns empty for unknown wallets, caches results

Mock: `@/lib/db` (prisma), `./portfolio` (getPortfolio), `@/lib/redis` (cache utils)

### 2. `src/lib/services/__tests__/portfolio.test.ts`
Test portfolio aggregation:
- Combines balances from multiple chains
- Calculates total value from balances × prices
- Handles empty wallets (zero balances)
- Handles partial chain failures (some chains down)
- Correctly computes 24h change percentages

Mock: `./balance-scanner`, `./price-fetcher`, `@/lib/redis`

### 3. `src/lib/services/__tests__/balance-scanner.test.ts`
Test blockchain scanning:
- Returns non-zero balances only
- Handles multicall failures gracefully
- Scans all chains in parallel
- Caches results per chain

Mock: `@/lib/chains/config` (getPublicClient), `@/lib/redis`

### 4. `src/lib/services/__tests__/price-fetcher.test.ts`
Test price fetching:
- Fetches native token prices by chain
- Fetches ERC-20 prices by CoinGecko ID
- Handles 429 rate limit (returns partial data)
- Caches prices in Redis
- Falls back to DB when CoinGecko fails (after TASK-A2)

Mock: global `fetch`, `@/lib/redis`, `@/lib/db`

### 5. `src/app/api/portfolio/__tests__/portfolio-route.test.ts`
Test API route handler:
- Valid address → returns portfolio data
- Invalid address → 400 validation error
- Service throws → 500 internal error
- Response follows `{ success, data/error }` format

Mock: `@/lib/services/portfolio`

### 6. `src/app/api/portfolio/__tests__/history-route.test.ts`
Test history API (created in TASK-A1):
- Valid address + period → returns historical data
- Invalid period → validation error
- No snapshots → returns empty array

Mock: `@/lib/services/snapshot`

### 7. `src/app/api/prices/__tests__/prices-route.test.ts`
Test prices API:
- With `ids` param → returns prices
- With `native=true` → returns native prices
- Missing params → validation error

Mock: `@/lib/services/price-fetcher`

---

## Key Testing Patterns to Follow

### Service test structure
```typescript
import { getPortfolio } from '../portfolio';
import { scanAllChainBalances } from '../balance-scanner';
import { fetchNativeTokenPrices, fetchPricesByIds } from '../price-fetcher';

jest.mock('../balance-scanner');
jest.mock('../price-fetcher');
jest.mock('@/lib/redis', () => ({
  getOrSet: jest.fn((_key, fetcher) => fetcher()), // bypass cache
  buildKey: jest.fn((...parts) => parts.join(':')),
  invalidatePattern: jest.fn(),
}));

describe('getPortfolio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('aggregates balances and prices into portfolio', async () => {
    (scanAllChainBalances as jest.Mock).mockResolvedValue(mockBalances);
    (fetchNativeTokenPrices as jest.Mock).mockResolvedValue(mockNativePrices);
    (fetchPricesByIds as jest.Mock).mockResolvedValue(mockTokenPrices);

    const result = await getPortfolio('0x...' as Address);

    expect(result.totalValueUsd).toBeCloseTo(expectedTotal);
    expect(result.assets).toHaveLength(expectedAssetCount);
    expect(result.chainSummaries).toHaveLength(expectedChainCount);
  });
});
```

### API route test structure
```typescript
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getPortfolio } from '@/lib/services/portfolio';

jest.mock('@/lib/services/portfolio');
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe('GET /api/portfolio/[address]', () => {
  it('returns portfolio for valid address', async () => {
    (getPortfolio as jest.Mock).mockResolvedValue(mockPortfolio);

    const request = new NextRequest('http://localhost/api/portfolio/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    const response = await GET(request, { params: Promise.resolve({ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalValueUsd).toBeDefined();
  });
});
```

---

## Acceptance Criteria
- [ ] All 7 test files created and passing
- [ ] Services mock external dependencies (RPC, CoinGecko, Redis, Prisma)
- [ ] API route tests verify response format and status codes
- [ ] Edge cases covered: empty wallets, rate limits, partial failures
- [ ] `npm test` passes with >70% coverage on `src/lib/services/` and API routes
