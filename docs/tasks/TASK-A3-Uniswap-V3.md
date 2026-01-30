# TASK-A3: Uniswap V3 LP Position Integration

## Why
The PRD promises LP position tracking with APY and impermanent loss. Currently all APY/fee data is mocked via deterministic hash of the token address. Adding real Uniswap V3 position reading transforms this from "balance viewer" to "DeFi dashboard."

## How Uniswap V3 Positions Work
- Users hold NFTs minted by the `NonfungiblePositionManager` contract
- Each NFT represents a concentrated liquidity position with a specific price range
- The contract exposes `balanceOf(address)` → number of positions, and `tokenOfOwnerByIndex(address, index)` → tokenId
- `positions(tokenId)` returns: token0, token1, fee tier, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1

## Contract Addresses (same on all chains)
```
NonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88
UniswapV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984
```
Deployed on: Ethereum, Arbitrum, Optimism, Polygon, Base

## Existing Code to Integrate With

### Chain Config
```typescript
import { getPublicClient, getSupportedChainIds, type SupportedChainId } from '@/lib/chains/config';
// getPublicClient returns a viem PublicClient with multicall enabled
```

### Token Constants
```typescript
import { findTokenByAddress, type TokenInfo } from '@/lib/constants/tokens';
```

### Price Fetcher
```typescript
import { fetchPricesByIds } from '@/lib/services/price-fetcher';
```

### Cache
```typescript
import { getOrSet, buildKey } from '@/lib/redis';
```

---

## Implementation Steps

### Step 1: Add Contract ABIs and Addresses
**File:** `src/lib/constants/contracts.ts`

```typescript
export const UNISWAP_V3_ADDRESSES = {
  NonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as const,
  Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as const,
};

// Minimal ABIs — only the functions we need
export const NFT_POSITION_MANAGER_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
```

### Step 2: Create Uniswap V3 Position Reader
**File:** `src/lib/services/protocols/uniswap-v3.ts`

```typescript
import { getPublicClient, type SupportedChainId } from '@/lib/chains/config';
import { UNISWAP_V3_ADDRESSES, NFT_POSITION_MANAGER_ABI } from '@/lib/constants/contracts';
import { findTokenByAddress } from '@/lib/constants/tokens';
import { getOrSet, buildKey } from '@/lib/redis';
import type { Address } from 'viem';

export interface UniswapV3Position {
  tokenId: string;
  chainId: SupportedChainId;
  token0: { address: string; symbol: string; name: string; decimals: number };
  token1: { address: string; symbol: string; name: string; decimals: number };
  feeTier: number;        // 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
  tickLower: number;
  tickUpper: number;
  liquidity: string;      // bigint as string
  tokensOwed0: string;    // Uncollected fees (bigint as string)
  tokensOwed1: string;
  inRange: boolean;       // Is current price within tick range?
}

const POSITION_CACHE_TTL = 60; // 1 minute

export async function getUniswapV3Positions(
  walletAddress: Address,
  chainId: SupportedChainId
): Promise<UniswapV3Position[]> {
  const cacheKey = buildKey('univ3', chainId, walletAddress.toLowerCase());

  return getOrSet(cacheKey, async () => {
    const client = getPublicClient(chainId);
    const nftManager = UNISWAP_V3_ADDRESSES.NonfungiblePositionManager;

    // 1. Get number of positions
    const balance = await client.readContract({
      address: nftManager,
      abi: NFT_POSITION_MANAGER_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    const count = Number(balance);
    if (count === 0) return [];

    // 2. Get all tokenIds via multicall
    const tokenIdCalls = Array.from({ length: count }, (_, i) => ({
      address: nftManager,
      abi: NFT_POSITION_MANAGER_ABI,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [walletAddress, BigInt(i)],
    }));

    const tokenIds = await client.multicall({ contracts: tokenIdCalls });

    // 3. Get position data for each tokenId via multicall
    const positionCalls = tokenIds
      .filter((r) => r.status === 'success')
      .map((r) => ({
        address: nftManager,
        abi: NFT_POSITION_MANAGER_ABI,
        functionName: 'positions' as const,
        args: [r.result as bigint],
      }));

    const positionResults = await client.multicall({ contracts: positionCalls });

    // 4. Transform into UniswapV3Position
    const positions: UniswapV3Position[] = [];

    for (let i = 0; i < positionResults.length; i++) {
      const result = positionResults[i];
      if (result.status !== 'success' || !result.result) continue;

      const [
        , , // nonce, operator
        token0Address, token1Address,
        fee, tickLower, tickUpper, liquidity,
        , , // feeGrowthInside values
        tokensOwed0, tokensOwed1,
      ] = result.result as readonly [
        bigint, string, string, string,
        number, number, number, bigint,
        bigint, bigint, bigint, bigint,
      ];

      // Skip closed positions (zero liquidity)
      if (liquidity === 0n) continue;

      const token0Info = findTokenByAddress(chainId, token0Address) ?? {
        address: token0Address, symbol: '???', name: 'Unknown', decimals: 18,
      };
      const token1Info = findTokenByAddress(chainId, token1Address) ?? {
        address: token1Address, symbol: '???', name: 'Unknown', decimals: 18,
      };

      // Simplified in-range check (accurate check would need current pool tick)
      // For now, mark as in-range if liquidity > 0
      const inRange = true; // TODO: fetch current tick from pool contract

      const tokenIdResult = tokenIds[i];
      positions.push({
        tokenId: (tokenIdResult.result as bigint).toString(),
        chainId,
        token0: { address: token0Address, symbol: token0Info.symbol, name: token0Info.name, decimals: token0Info.decimals },
        token1: { address: token1Address, symbol: token1Info.symbol, name: token1Info.name, decimals: token1Info.decimals },
        feeTier: Number(fee),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        liquidity: liquidity.toString(),
        tokensOwed0: tokensOwed0.toString(),
        tokensOwed1: tokensOwed1.toString(),
        inRange,
      });
    }

    return positions;
  }, POSITION_CACHE_TTL);
}

/**
 * Scan all supported chains for Uniswap V3 positions.
 */
export async function getAllUniswapV3Positions(
  walletAddress: Address
): Promise<UniswapV3Position[]> {
  const chainIds = [1, 42161, 10, 137, 8453] as SupportedChainId[];
  const results = await Promise.allSettled(
    chainIds.map((id) => getUniswapV3Positions(walletAddress, id))
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
```

### Step 3: Create Protocol Aggregator
**File:** `src/lib/services/protocols/index.ts`

```typescript
export { getUniswapV3Positions, getAllUniswapV3Positions, type UniswapV3Position } from './uniswap-v3';

// Future protocols can be added here:
// export { getAavePositions } from './aave';
// export { getCurvePositions } from './curve';
```

### Step 4: Create API Route
**File:** `src/app/api/portfolio/[address]/positions/route.ts`

Returns Uniswap V3 LP positions for a wallet.

### Step 5: Create LP Positions Component
**File:** `src/components/dashboard/lp-positions.tsx`

Display:
- Token pair (e.g., "ETH / USDC")
- Fee tier badge (0.05%, 0.3%, 1%)
- In-range / Out-of-range status badge
- Uncollected fees (tokensOwed0, tokensOwed1)
- Chain badge
- Empty state when no positions found

### Step 6: Add to Dashboard
**File:** `src/components/dashboard/dashboard-content.tsx`

Add `<LPPositions>` section between the chart and asset list.

### Step 7: Add Demo LP Positions
**File:** `src/lib/demo/mock-data.ts`

Add mock Uniswap V3 position data for demo mode.

---

## Acceptance Criteria
- [ ] Wallet with Uniswap V3 positions shows real LP data
- [ ] Displays: token pair, fee tier, range status, uncollected fees
- [ ] Works across all 5 supported chains
- [ ] Wallets without positions show clean empty state
- [ ] Demo mode shows mock LP positions
- [ ] Positions are cached in Redis for 60 seconds
- [ ] Closed positions (zero liquidity) are filtered out
