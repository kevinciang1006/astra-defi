# AstraDeFi Implementation Roadmap

## Overview

This document serves as the "Master Plan" for transforming the AstraDeFi architecture into a shipped product. It breaks down the remaining work (Phase 3 & 4) into sequential, dependency-aware steps.

**Status Key**:

- [ ] Todo
- [/] In Progress
- [x] Done

## Dependencies

- **Prerequisite**: Phase 1 (Design) & Phase 2 (DevOps) -> **COMPLETE**
- **Phase 3**: Core Implementation (The "Meat" of the project)
- **Phase 4**: Optimization & Polish (The "Wow" factor)

---

## Phase 3: Core Implementation (Data & Functional)

This phase is split into **Backend/Data** (the hardest part) and **Frontend** (the visual part).

### 3.1 Data Layer & Backend Logic

- **Goal**: Get data from blockchains -> Database/Cache -> API.
- **Tasks**:
  - [ ] **[TASK-3.1.1] Database & Schema Setup** ([Link](tasks/TASK-3.1.1-Database.md))
    - Implement Prisma Schema (Users, Snapshots).
    - Set up Supabase/PlanetScale (or local Docker MySQL).
  - [ ] **[TASK-3.1.2] Redis Caching Layer** ([Link](tasks/TASK-3.1.2-Redis.md))
    - Implement Redis Client (singleton).
    - Create caching utilities (`getOrSet`, invalidation strategies).
  - [ ] **[TASK-3.1.3] Data Ingestion Engine** ([Link](tasks/TASK-3.1.3-Ingestion.md))
    - **CRITICAL**: Build the "Token Price Fetcher" (Coingecko/Pyth).
    - Build the "Multi-chain Balance Scanner" (Viem/Ethers multicall).
  - [ ] **[TASK-3.1.4] API Route Handlers** ([Link](tasks/TASK-3.1.4-API.md))
    - `GET /api/portfolio`: Aggregates data for the frontend.
    - `POST /api/refresh`: Triggers an immediate re-scan.

### 3.2 Frontend Foundation & UI

- **Goal**: A beautiful, interactive dashboard consuming the API.
- **Tasks**:
  - [ ] **[TASK-3.2.1] UI Foundation & Layout** ([Link](tasks/TASK-3.2.1-UI-Foundation.md))
    - Setup Shadcn/UI, Theme (Dark Mode), and Main Layout (Sidebar/Header).
    - Implement Wallet Connection (Web3Modal / RainbowKit).
  - [ ] **[TASK-3.2.2] Dashboard Components** ([Link](tasks/TASK-3.2.2-Dashboard.md))
    - `PortfolioSummary` (Total Balance, Chart).
    - `AssetList` (The main table/grid of assets).
    - `ChainBreakdown` (Distribution chart).

---

## Phase 4: Optimization & Polish (The Senior Touch)

### 4.1 Performance Engineering

- **Tasks**:
  - [ ] **[TASK-4.1.1] Strict Caching & Edge Scaling** ([Link](tasks/TASK-4.1.1-Caching.md))
    - Implement `stale-while-revalidate` HTTP headers.
    - Ensure <200ms TTFB (Time to First Byte).
  - [ ] **[TASK-4.1.2] Bundle Optimization**
    - Analyze bundle size. Lazy load heavy charts (`recharts`).

### 4.2 UX Polish

- **Tasks**:
  - [ ] **[TASK-4.2.1] Micro-Animations**
    - Add enter animations (Framer Motion) for rows.
    - Add number counters for balance updates.
  - [ ] **[TASK-4.2.2] SEO & Metadata**
    - Dynamic OG Images for sharing portfolios.
    - JSON-LD Schema.

---

## Execution Order

1.  **Start with 3.1.1 & 3.1.2**: You need a place to put data before fetching it.
2.  **Move to 3.1.3**: Prove you can actually get data from the blockchain. This is the biggest technical risk.
3.  **Do 3.2.1**: Get the shell ready.
4.  **Connect 3.1.4 & 3.2.2**: Connect the wires (Frontend <-> Backend).
