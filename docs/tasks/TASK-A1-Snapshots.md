# TASK-A1: Activate Portfolio Snapshots

## Why
The historical chart in `portfolio-chart.tsx` generates fake data via `generateChartData()` which starts at 85% of current value and adds random volatility. This is the most visible fake in the app. Fixing it connects the DB, makes the chart real, and demonstrates the "read-heavy architecture" described in TECHNICAL_DESIGN.md.

## Prerequisites
- Run `npx prisma migrate dev --name init` (no migrations exist yet)
- MySQL must be running (Docker: `docker compose up -d mysql`)

## Existing Code to Integrate With

### Prisma Schema (already defined, just needs migration)
```prisma
model User {
  id        String   @id @default(uuid())
  address   String   @unique @db.VarChar(42)
  snapshots PortfolioSnapshot[]
}

model PortfolioSnapshot {
  id            String   @id @default(uuid())
  userId        String
  timestamp     DateTime @default(now())
  totalValueUsd Decimal  @db.Decimal(24, 8)
  breakdown     Json
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, timestamp(sort: Desc)])
}
```

### DB Client
```typescript
import { prisma } from '@/lib/db'; // src/lib/db/client.ts — singleton PrismaClient
```

### Portfolio Service (src/lib/services/portfolio.ts)
```typescript
// Returns this interface — reuse for snapshot data
export interface Portfolio {
  address: string;
  totalValueUsd: number;
  totalChange24hUsd: number;
  totalChange24hPercent: number;
  chainSummaries: ChainSummary[];
  assets: AssetPosition[];
  lastUpdated: string;
}

export interface ChainSummary {
  chainId: SupportedChainId;
  chainName: string;
  totalValueUsd: number;
  assetCount: number;
}

// Main function:
export async function getPortfolio(walletAddress: Address): Promise<Portfolio>
```

### API Response Pattern (src/lib/api/response.ts)
```typescript
import { success, errors } from '@/lib/api';
// success(data) → { success: true, data }
// errors.validationError(msg) → { success: false, error: { code, message } }
```

### Validation (src/lib/api/validation.ts)
```typescript
import { ethereumAddressSchema, timeRangeSchema, safeValidate } from '@/lib/api';
// timeRangeSchema = z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d')
```

### Cache Utilities (src/lib/redis/cache.ts)
```typescript
import { getOrSet, invalidatePattern, buildKey, CacheKeys } from '@/lib/redis';
```

### Chart Component (src/components/dashboard/portfolio-chart.tsx)
```typescript
// Current props:
interface PortfolioChartProps {
  totalValue: number;
  isLoading?: boolean;
}

// Current data shape:
interface ChartDataPoint {
  date: string;    // Formatted label
  value: number;   // USD value
  timestamp: number;
}

type TimePeriod = '7d' | '30d' | '90d' | '1y';
```

### Dashboard (src/components/dashboard/dashboard-content.tsx)
```typescript
// Chart is rendered as:
<PortfolioChart totalValue={displayPortfolio.totalValueUsd} isLoading={isLoading} />
// The address is available via: const { address } = useAccount();
```

---

## Implementation Steps

### Step 1: Run Prisma Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 2: Create Snapshot Service
**File:** `src/lib/services/snapshot.ts`

```typescript
import { prisma } from '@/lib/db';
import { getPortfolio } from './portfolio';
import { invalidatePattern, buildKey, getOrSet } from '@/lib/redis';
import type { Address } from 'viem';
import type { Decimal } from '@prisma/client/runtime/library';

export interface HistoricalDataPoint {
  timestamp: string;       // ISO string
  totalValueUsd: number;
  breakdown: Record<string, number>; // chainName → USD value
}

/**
 * Creates or finds a User record, then snapshots their current portfolio value.
 */
export async function createSnapshot(walletAddress: Address): Promise<void> {
  // 1. Upsert user (create if first visit)
  const user = await prisma.user.upsert({
    where: { address: walletAddress.toLowerCase() },
    update: {},
    create: { address: walletAddress.toLowerCase() },
  });

  // 2. Fetch live portfolio
  const portfolio = await getPortfolio(walletAddress);

  // 3. Build breakdown JSON from chainSummaries
  const breakdown: Record<string, number> = {};
  for (const chain of portfolio.chainSummaries) {
    breakdown[chain.chainName] = chain.totalValueUsd;
  }

  // 4. Create snapshot
  await prisma.portfolioSnapshot.create({
    data: {
      userId: user.id,
      totalValueUsd: portfolio.totalValueUsd,
      breakdown,
    },
  });

  // 5. Invalidate any cached history for this address
  await invalidatePattern(`history:${walletAddress.toLowerCase()}*`);
}

/**
 * Queries historical snapshots for a wallet within a time range.
 */
export async function getHistoricalData(
  walletAddress: Address,
  period: '7d' | '30d' | '90d' | '1y' | 'all'
): Promise<HistoricalDataPoint[]> {
  const cacheKey = buildKey('history', walletAddress.toLowerCase(), period);

  return getOrSet(cacheKey, async () => {
    const user = await prisma.user.findUnique({
      where: { address: walletAddress.toLowerCase() },
    });
    if (!user) return [];

    const now = new Date();
    const daysMap: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 3650,
    };
    const since = new Date(now.getTime() - daysMap[period] * 86400000);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    return snapshots.map((s) => ({
      timestamp: s.timestamp.toISOString(),
      totalValueUsd: Number(s.totalValueUsd),
      breakdown: s.breakdown as Record<string, number>,
    }));
  }, 300); // Cache 5 min
}
```

### Step 3: Create Snapshot API Route
**File:** `src/app/api/portfolio/[address]/snapshot/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { success, errors } from '@/lib/api';
import { ethereumAddressSchema, safeValidate } from '@/lib/api';
import { createSnapshot } from '@/lib/services/snapshot';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const validation = safeValidate(ethereumAddressSchema, address);
    if (!validation.success) return errors.validationError(validation.error);

    await createSnapshot(validation.data);
    return success({ created: true });
  } catch (error) {
    console.error('[API] Snapshot creation error:', error);
    return errors.internalError(
      error instanceof Error ? error.message : 'Failed to create snapshot'
    );
  }
}
```

### Step 4: Create History API Route
**File:** `src/app/api/portfolio/[address]/history/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { success, errors } from '@/lib/api';
import { ethereumAddressSchema, timeRangeSchema, safeValidate } from '@/lib/api';
import { getHistoricalData } from '@/lib/services/snapshot';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const validation = safeValidate(ethereumAddressSchema, address);
    if (!validation.success) return errors.validationError(validation.error);

    const searchParams = request.nextUrl.searchParams;
    const periodResult = safeValidate(timeRangeSchema, searchParams.get('period') ?? '30d');
    if (!periodResult.success) return errors.validationError(periodResult.error);

    const data = await getHistoricalData(validation.data, periodResult.data);
    return success(data);
  } catch (error) {
    console.error('[API] History fetch error:', error);
    return errors.internalError(
      error instanceof Error ? error.message : 'Failed to fetch history'
    );
  }
}
```

### Step 5: Update Portfolio Chart Component
**File:** `src/components/dashboard/portfolio-chart.tsx`

Changes needed:
1. Add `address` prop (passed from dashboard-content)
2. Add `isDemoMode` prop to know when to fall back to generated data
3. Create a `useHistoricalData` hook or inline fetch
4. Replace `generateChartData()` call with API data when available
5. Keep `generateChartData()` as fallback for demo mode and when no snapshots exist yet

```typescript
// New props:
interface PortfolioChartProps {
  totalValue: number;
  address?: string;       // NEW — wallet address for API calls
  isDemoMode?: boolean;   // NEW — use generated data in demo mode
  isLoading?: boolean;
}
```

### Step 6: Update Dashboard Content
**File:** `src/components/dashboard/dashboard-content.tsx`

Pass `address` and `isDemoMode` to `PortfolioChart`:
```typescript
<PortfolioChart
  totalValue={displayPortfolio.totalValueUsd}
  address={address}
  isDemoMode={isDemoMode}
  isLoading={isLoading}
/>
```

Auto-trigger snapshot on wallet connection:
```typescript
// After portfolio loads successfully, trigger a snapshot
useEffect(() => {
  if (isConnected && address && portfolio) {
    fetch(`/api/portfolio/${address}/snapshot`, { method: 'POST' })
      .catch(console.error); // Fire and forget
  }
}, [isConnected, address, portfolio]);
```

---

## Acceptance Criteria
- [ ] `npx prisma migrate dev` runs successfully
- [ ] Connecting a wallet creates a User + PortfolioSnapshot record in MySQL
- [ ] `GET /api/portfolio/{address}/history?period=30d` returns snapshot data
- [ ] Chart displays real DB data when snapshots exist
- [ ] Chart falls back to generated data in demo mode or when no snapshots exist
- [ ] Snapshot creation doesn't block the UI (fire-and-forget POST)
- [ ] Redis cache invalidates history when new snapshot is created
