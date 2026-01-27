# TASK-3.2.2: Dashboard Components

## Objective

Build the actual "Screen" that users see. This consumes the data from the API (built in Task 3.1.4) and renders it beautifully.

## Context

See Logic: `docs/PRD.md` (Persona 1: Sarah, Persona 2: Marcus).

## Requirements

### 1. API Integration Hook

- Create `usePortfolio(address)` hook using `tanstack-query`.
- Fetches from `/api/portfolio`.
- Handles `isLoading` (Show Skeletons) and `isError`.

### 2. Component: `PortfolioHeader`

- Big number: "Total Net Worth".
- 24h Change: Green (+2.3%) / Red (-1.2%).
- One-click "Refresh" button (calls `api/refresh` -> invalidate query).

### 3. Component: `AssetTable`

- Columns: Asset (Icon + Symbol), Price, Balance (Token Amount), Value (USD), Allocation (%).
- **Interaction**: Click row to see details (Expansion).

### 4. Component: `AllocationChart`

- Library: `recharts` (Standard, reliable).
- Donut chart showing breakdown by Chain or Token.

### 5. Loading States (The "Senior" Detail)

- Do NOT use a full-screen spinner.
- Use "Shimmer" skeletons (`<Skeleton className="h-4 w-[250px]" />`) inside the table rows and cards. This reduces perceived latency.

## Implementation Steps

1.  Install icons: `npm install lucide-react`.
2.  Install charts: `npm install recharts`.
3.  Build the components individually in `src/components/dashboard/`.
4.  Assemble them in `src/app/page.tsx` (The main page).
