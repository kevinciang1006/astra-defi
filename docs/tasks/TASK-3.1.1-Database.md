# TASK-3.1.1: Database Schema & Init

## Objective

Initialize the persistence layer using Prisma ORM. This sets up the structure for storing user profiles and _historical_ portfolio data. (Live data goes to Redis, but History goes here).

## Context

Alignment with `TECHNICAL_DESIGN.md`: Section 3 (Data Models).

## Requirements

### 1. Prisma Schema (`schema.prisma`)

Create the following models:

#### `User`

- `id`: UUID (PK)
- `address`: String (Unique, Indexed) - The wallet address.
- `createdAt`: DateTime

#### `PortfolioSnapshot`

- **Purpose**: Stores the total value of a user's portfolio at a specific time (for the graph).
- `id`: UUID
- `userId`: FK to User
- `timestamp`: DateTime (default now)
- `totalValueUsd`: Decimal (Precision 18, Scale 2)
- `assetBreakdown`: JSON (Store raw JSON of what changed, e.g., `{"ETH": 2.5, "USDC": 500}`)
- **Index**: `[userId, timestamp]` for fast history queries.

### 2. Migration

- Run `npx prisma migrate dev --name init_schema` to create the SQL tables in your Dockerized MySQL.

### 3. Verification

- Create a seed script `prisma/seed.ts` that inserts 1 Dummy User and 5 days of Dummy Snapshots.
- Run `npx prisma db seed` and confirm data exists via `npx prisma studio`.

## Implementation Steps

1.  Initialize Prisma: `npx prisma init`.
2.  Paste schema into `prisma/schema.prisma`.
3.  Update `.env` to point to `DATABASE_URL=mysql://root:password@localhost:3306/astra_defi` (matches docker-compose).
4.  Run migration.
