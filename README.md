# AstraDeFi

A multi-chain DeFi portfolio dashboard built with Next.js 15, React 19, and TypeScript. Track your assets across Ethereum, Arbitrum, Optimism, Polygon, and Base in one unified interface.

## Features

- **Multi-Chain Support** - View balances across 5 major EVM networks
- **Real-Time Prices** - Live token prices with 24h change tracking via CoinGecko
- **Portfolio Analytics** - Total value, chain breakdown, and asset allocation
- **Wallet Connection** - Connect via MetaMask, WalletConnect, or Coinbase Wallet
- **Demo Mode** - Preview the dashboard with sample data without connecting a wallet
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode** - System-aware dark/light theme

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **UI Components**: Shadcn/ui, Radix Primitives, Framer Motion
- **Blockchain**: viem, wagmi, RainbowKit
- **Data**: React Query, Prisma ORM, Redis caching
- **Validation**: Zod
- **Testing**: Jest

## Prerequisites

- Node.js 18.17 or later
- Docker and Docker Compose (for MySQL and Redis)
- npm, yarn, pnpm, or bun

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/astra-defi.git
cd astra-defi
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration. At minimum, you need:

```env
DATABASE_URL="mysql://root:password@localhost:3307/astra_defi"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"
```

### 3. Start Infrastructure

Start MySQL and Redis with Docker:

```bash
docker-compose up -d db cache
```

This starts:
- MySQL 8.0 on port 3307
- Redis on port 6379

### 4. Set Up Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect Cloud project ID |
| `ALCHEMY_API_KEY` | No | Alchemy API key for better RPC |
| `INFURA_API_KEY` | No | Infura API key for better RPC |
| `COINGECKO_API_KEY` | No | CoinGecko API key (optional) |
| `PRICE_CACHE_TTL` | No | Price cache TTL in seconds (default: 60) |
| `BALANCE_CACHE_TTL` | No | Balance cache TTL in seconds (default: 30) |

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npx prisma studio` | Open Prisma database viewer |

## Docker

### Development (Infrastructure Only)

```bash
# Start MySQL and Redis
docker-compose up -d db cache

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Full Stack

```bash
# Build and start everything
docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build app
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── health/         # Health check endpoint
│   │   ├── portfolio/      # Portfolio data endpoint
│   │   └── prices/         # Token prices endpoint
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard page
├── components/
│   ├── dashboard/          # Dashboard components
│   │   ├── portfolio-summary.tsx
│   │   ├── asset-list.tsx
│   │   └── chain-breakdown.tsx
│   ├── ui/                 # Shadcn UI components
│   └── wallet/             # Wallet connection
├── hooks/                  # React hooks
├── lib/
│   ├── api/                # API utilities
│   ├── chains/             # Chain configuration
│   ├── db/                 # Prisma client
│   ├── demo/               # Demo mode data
│   ├── redis/              # Redis client
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
└── providers/              # React context providers
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health check |
| `/api/portfolio/[address]` | GET | Fetch portfolio for address |
| `/api/prices` | GET | Fetch token prices |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

Current test coverage:
- Format utilities (20 tests)
- API validation schemas (15 tests)
- API response helpers (14 tests)

## Supported Networks

| Network | Chain ID |
|---------|----------|
| Ethereum | 1 |
| Arbitrum | 42161 |
| Optimism | 10 |
| Polygon | 137 |
| Base | 8453 |

## License

MIT
