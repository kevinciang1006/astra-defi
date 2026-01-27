# AstraDeFi Technical Design Document

## 1. Executive Summary

AstraDeFi is a high-performance, non-custodial DeFi dashboard. This document addresses the architectural challenge of aggregating fragmented on-chain data (Tokens, LPs, Yields) across multiple networks (Ethereum, Arbitrum, Optimism) and delivering it with sub-200ms latency.

**Key Technical Differentiator**: A "Read-Heavy" architecture decoupling **Data Ingestion** (slow, async) from **Data Presentation** (fast, cached).

## 2. System Architecture

### 2.1 High-Level Diagram

```mermaid
graph TD
    User[User Client / Browser]
    CDN[Edge CDN]
    Next[Next.js App Server]
    Redis[Redis Cache (Hot Data)]
    DB[(MySQL Database)]
    Worker[Node.js Ingestion Worker]

    subgraph "External Blockchains & APIs"
        Nodes[RPC Providers]
        PriceAPI[Coingecko / Pyth]
    end

    User -->|Requests Page| CDN
    CDN -->|Cache Miss| Next
    Next -->|1. Check Cache| Redis
    Redis -->|2. Return Hot Data| Next
    Next -->|3. If Missing, Query DB| DB

    Worker -->|Broadcasting Updates| DB
    Worker -->|Updating Cache| Redis
    Worker -->|Polling Data| Nodes
    Worker -->|Fetching Prices| PriceAPI
```

### 2.2 Component Breakdown

#### A. Frontend (Next.js 15)

- **Rendering Strategy**: Hybrid.
  - **Static (SSG)**: Landing pages, marketing content.
  - **Server Components (RSC)**: Dashboard shell, initial data fetch. (Zero bundle size impact).
  - **Client Components**: Interactive charts, filtering, specialized wallet interactions.
- **State**: `Jotai` for atomic client-state updates (e.g., toggling "Hide Small Balances").

#### B. API Layer & Caching

- **Strategy**: Stale-While-Revalidate (SWR).
- **Mechanism**: Next.js Cache Tags + Redis.
- **Policy**:
  - Prices: TTL 60s (Soft expire), background refresh.
  - User Portfolio History: TTL 1 hour (or invalidate on new transaction scan).

#### C. Background Worker (The Engine)

A separate Node.js service (or Cron Job in MVP) responsible for:

1.  **Price Indexing**: Fetching token prices every minute.
2.  **Portfolio Snapshotting**: Capturing user portfolio value once daily for historical charts.
3.  **On-Chain Indexing**: Listening for events (optional/advanced) or periodic scanning of connected wallets.

## 3. Data Models (Schema)

Using Prisma ORM with MySQL.

```prisma
model User {
  id        String   @id @default(uuid())
  address   String   @unique // Wallet Address
  createdAt DateTime @default(now())

  portfolios PortfolioSnapshot[]
  ignoredAssets String[] // JSON array of contract addresses
}

// Optimized for historical charts
model PortfolioSnapshot {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  timestamp DateTime @default(now())

  totalValueUsd Decimal @db.Decimal(18, 2)
  netWorth      Json    // Breakdown by chain: { "eth": 100, "arb": 50 }

  @@index([userId, timestamp])
}

// Cached Assets (To avoid spamming external APIs)
model AssetCache {
  address   String   @id // ChainId + ContractAddress
  symbol    String
  priceUsd  Decimal
  updatedAt DateTime
}
```

## 4. Key Engineering Challenges

### 4.1 The "RPC Bottleneck"

**Problem**: Querying unicast RPCs for every user request is slow and rate-limited.
**Solution**:

- **Multicall**: specific batching of RPC calls (e.g., `eth_call` aggregation).
- **Ingestion separation**: We don't query RPCs on user request for _global_ data (like Pool TVL). We query it in the background and serve from Redis.

### 4.2 Security

- **Non-Custodial**: We never touch private keys.
- **Sanitization**: All inputs (token addresses) validated via Zod/Regex to prevent injection.
- **Rate Limiting**: `upstash/ratelimit` (Token Bucket) on API routes to prevent DDoS on expensive RPC aggregation endpoints.

## 5. Deployment Strategy

- **Vercel**: For Next.js Frontend/API.
- **Railway/Render**: For the Background Worker & Redis instance (if not using Vercel KV).
- **PlanetScale/Neon**: Serverless MySQL.

## 6. Implementation Phases (MVP)

1.  **Scaffold**: Next.js repo with strict linting.
2.  **Core Lib**: `web3` utilities (viem) configured for Multi-chain.
3.  **Data Layer**: Prisma + Redis setup.
4.  **UI**: Dashboard Skeleton.
5.  **Integration**: Connect Wallet -> Fetch Balances -> Display.
