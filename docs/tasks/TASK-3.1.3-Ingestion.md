# TASK-3.1.3: Data Ingestion (The Engine)

## Objective

Build the logic that actually fetches data. This is the most complex backend task. It involves two distinct systems: **Market Data** (Prices) and **User Data** (Balances).

## Requirements

### 1. Market Data Fetcher (`src/services/prices.ts`)

- **Source**: Coingecko API (Free tier) or Pyth Network (On-chain).
- **Logic**:
  - Create a function `fetchTokenPrices(tokenIds: string[])`.
  - Should batch requests (coingecko allows multiple IDs).
  - **Cache Wrapper**: Wrap this in the `getOrSet` from Task 3.1.2.
  - _Constraint_: Coingecko free tier is rate-limited. Cache aggressively (2 minutes).

### 2. Multi-Chain Balance Scanner (`src/services/balances.ts`)

- **Tech**: `viem` (lightweight, highly performant replacement for ethers.js).
- **Input**: `walletAddress`.
- **Logic**:
  - Define "Whitelisted Tokens" config for MVP (e.g., ETH, USDC, USDT on Ethereum & Arbitrum). Don't try to scan _everything_ yet.
  - Use `multicall` (viem feature) to fetch specific token balances in ONE RPC request per chain.
  - **Return**: Standardized `Asset` array: `[{ chain: 'eth', symbol: 'USDC', balance: 100.50, decimals: 6 }]`.

### 3. The Aggregator (`src/services/portfolio.ts`)

- Combine #1 and #2.
- `getPortfolio(address)`:
  1.  Fetch Balances (Parallel per chain).
  2.  Fetch Prices for found assets.
  3.  Math: `Balance * Price = Value`.
  4.  Sort by Value (Descending).

## Implementation Steps

1.  Install: `npm install viem`.
2.  Create `src/config/tokens.ts` (The static list of tokens to scan).
3.  Implement `fetchTokenPrices` (with reliable error handling).
4.  Implement `fetchChainBalances` using `viem`.
