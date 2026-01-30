# TASK-A2: Background Price Indexer (Cron Worker)

## Why
TECHNICAL_DESIGN.md describes a "read-heavy architecture" where a background worker decouples data ingestion from presentation. This worker doesn't exist. Building it activates the `TokenPrice` MySQL table, provides a fallback when CoinGecko rate-limits, and demonstrates the architectural pattern.

## Existing Code to Integrate With

### Prisma TokenPrice Model (already defined)
```prisma
model TokenPrice {
  id        String   @id @db.VarChar(100) // "chainId:contractAddress"
  chainId   Int
  address   String   @db.VarChar(42)
  symbol    String   @db.VarChar(20)
  name      String   @db.VarChar(100)
  decimals  Int      @default(18)
  logoUrl   String?  @db.VarChar(500)
  priceUsd  Decimal  @db.Decimal(24, 8)
  updatedAt DateTime @updatedAt
}
```

### Token Constants (src/lib/constants/tokens.ts)
```typescript
export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
}
export const TOKENS_BY_CHAIN: Record<SupportedChainId, TokenInfo[]>;
export function getAllCoingeckoIds(): string[];
export function getTokensForChain(chainId: SupportedChainId): TokenInfo[];
```

### Price Fetcher (src/lib/services/price-fetcher.ts)
```typescript
export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceChange24h: number | null;
  lastUpdated: string;
}
export async function fetchPricesByIds(tokenIds: string[]): Promise<Map<string, TokenPrice>>;
export async function fetchNativeTokenPrices(chainIds: SupportedChainId[]): Promise<Map<SupportedChainId, TokenPrice>>;
```

### Chain Config (src/lib/chains/config.ts)
```typescript
export function getSupportedChainIds(): SupportedChainId[];
export const ChainId = { ETHEREUM: 1, ARBITRUM: 42161, OPTIMISM: 10, POLYGON: 137, BASE: 8453 };
```

---

## Implementation Steps

### Step 1: Create Price Indexer Worker
**File:** `src/lib/workers/price-indexer.ts`

Responsibilities:
1. Fetch all tracked token prices from CoinGecko (using existing `fetchPricesByIds`)
2. Fetch native token prices (using existing `fetchNativeTokenPrices`)
3. Upsert results into MySQL `TokenPrice` table via Prisma
4. Update Redis cache simultaneously

```typescript
import { prisma } from '@/lib/db';
import { fetchPricesByIds, fetchNativeTokenPrices } from '@/lib/services/price-fetcher';
import { TOKENS_BY_CHAIN, getAllCoingeckoIds, NATIVE_TOKEN_ADDRESS } from '@/lib/constants/tokens';
import { getSupportedChainIds, ChainId, type SupportedChainId } from '@/lib/chains/config';
import { set, buildKey } from '@/lib/redis';

// Native token CoinGecko IDs per chain
const NATIVE_TOKEN_IDS: Record<SupportedChainId, string> = {
  [ChainId.ETHEREUM]: 'ethereum',
  [ChainId.POLYGON]: 'matic-network',
  [ChainId.ARBITRUM]: 'ethereum',
  [ChainId.OPTIMISM]: 'ethereum',
  [ChainId.BASE]: 'ethereum',
};

export interface IndexerResult {
  tokensUpdated: number;
  errors: string[];
  durationMs: number;
}

export async function runPriceIndexer(): Promise<IndexerResult> {
  const start = Date.now();
  const errors: string[] = [];
  let tokensUpdated = 0;

  try {
    // 1. Fetch all ERC-20 prices by CoinGecko ID
    const allIds = getAllCoingeckoIds();
    const prices = await fetchPricesByIds(allIds);

    // 2. Fetch native token prices
    const chainIds = getSupportedChainIds();
    const nativePrices = await fetchNativeTokenPrices(chainIds);

    // 3. Upsert ERC-20 prices into DB
    for (const [chainId, tokens] of Object.entries(TOKENS_BY_CHAIN)) {
      for (const token of tokens) {
        if (!token.coingeckoId) continue;
        const price = prices.get(token.coingeckoId);
        if (!price) continue;

        const id = `${chainId}:${token.address.toLowerCase()}`;
        try {
          await prisma.tokenPrice.upsert({
            where: { id },
            update: { priceUsd: price.priceUsd },
            create: {
              id,
              chainId: Number(chainId),
              address: token.address.toLowerCase(),
              symbol: token.symbol,
              name: token.name,
              decimals: token.decimals,
              priceUsd: price.priceUsd,
            },
          });
          // Also update Redis
          await set(buildKey('price', chainId, token.address.toLowerCase()), price, 120);
          tokensUpdated++;
        } catch (err) {
          errors.push(`Failed to upsert ${token.symbol}: ${err}`);
        }
      }
    }

    // 4. Upsert native token prices
    for (const [chainId, price] of nativePrices.entries()) {
      const id = `${chainId}:${NATIVE_TOKEN_ADDRESS.toLowerCase()}`;
      try {
        await prisma.tokenPrice.upsert({
          where: { id },
          update: { priceUsd: price.priceUsd },
          create: {
            id,
            chainId: Number(chainId),
            address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
            symbol: price.symbol,
            name: price.name,
            decimals: 18,
            priceUsd: price.priceUsd,
          },
        });
        tokensUpdated++;
      } catch (err) {
        errors.push(`Failed to upsert native ${chainId}: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Indexer failed: ${err}`);
  }

  return { tokensUpdated, errors, durationMs: Date.now() - start };
}
```

### Step 2: Create Cron API Route for Prices
**File:** `src/app/api/cron/prices/route.ts`

Secured with `CRON_SECRET` env var to prevent unauthorized triggers.

```typescript
import { NextRequest } from 'next/server';
import { success, errors } from '@/lib/api';
import { runPriceIndexer } from '@/lib/workers/price-indexer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errors.unauthorized('Invalid cron secret');
  }

  const result = await runPriceIndexer();
  console.log(`[Cron] Price indexer: ${result.tokensUpdated} updated in ${result.durationMs}ms`);
  if (result.errors.length > 0) {
    console.warn('[Cron] Errors:', result.errors);
  }

  return success(result);
}
```

### Step 3: Create Daily Snapshot Cron
**File:** `src/app/api/cron/snapshots/route.ts`

Snapshots all registered users' portfolios once daily.

```typescript
import { NextRequest } from 'next/server';
import { success, errors } from '@/lib/api';
import { prisma } from '@/lib/db';
import { createSnapshot } from '@/lib/services/snapshot';
import type { Address } from 'viem';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min for many wallets

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errors.unauthorized('Invalid cron secret');
  }

  const users = await prisma.user.findMany({ select: { address: true } });
  const results = { total: users.length, success: 0, failed: 0, errors: [] as string[] };

  for (const user of users) {
    try {
      await createSnapshot(user.address as Address);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${user.address}: ${err}`);
    }
  }

  console.log(`[Cron] Snapshots: ${results.success}/${results.total} succeeded`);
  return success(results);
}
```

### Step 4: Add DB Fallback to Price Fetcher
**File:** `src/lib/services/price-fetcher.ts` (modify)

Add a fallback that queries `TokenPrice` from MySQL when CoinGecko is rate-limited:

```typescript
export async function getDbFallbackPrice(
  chainId: SupportedChainId,
  address: string
): Promise<TokenPrice | null> {
  try {
    const record = await prisma.tokenPrice.findUnique({
      where: { id: `${chainId}:${address.toLowerCase()}` },
    });
    if (!record) return null;
    return {
      id: record.symbol.toLowerCase(),
      symbol: record.symbol,
      name: record.name,
      priceUsd: Number(record.priceUsd),
      priceChange24h: null,
      lastUpdated: record.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}
```

### Step 5: Add Vercel Cron Config (optional)
**File:** `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/prices", "schedule": "* * * * *" },
    { "path": "/api/cron/snapshots", "schedule": "0 0 * * *" }
  ]
}
```

### Step 6: Update .env.example
Add:
```
CRON_SECRET=your-secret-here
```

---

## Acceptance Criteria
- [ ] `GET /api/cron/prices` (with valid secret) indexes all tracked tokens into MySQL
- [ ] `TokenPrice` table has records with `updatedAt` within last 60 seconds after indexer runs
- [ ] `GET /api/cron/snapshots` creates snapshots for all registered users
- [ ] Unauthorized requests to cron routes return 401
- [ ] Price fetcher falls back to MySQL when CoinGecko returns 429
- [ ] Redis cache is updated alongside DB writes
- [ ] `CRON_SECRET` is documented in `.env.example`
