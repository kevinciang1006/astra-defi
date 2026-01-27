# TASK-3.2.1: UI Foundation & Setup

## Objective

Establish the frontend "shell". Before building charts, we need the layout, the theme, and the ability to connect a wallet.

## Requirements

### 1. Component System (Shadcn/UI)

- **Initialize**: `npx shadcn@latest init`.
- **Install Core Components**:
  - `button`, `card`, `skeleton` (for loading states), `table` (for asset list), `dialog`, `dropdown-menu`.
- **Theme**: Configure `globals.css` for a "DeFi Dark Mode" (Dark background, vibrant primary color like `#3b82f6` or `#8b5cf6`).

### 2. Wallet Connection

- **Library**: `RainbowKit` + `Wagmi` (Industry standard, easiest integration).
- **Setup**:
  - Create `Providers.tsx` (Client Component) to wrap the app with `WagmiConfig` and `QueryClientProvider`.
  - Configure chains: Mainnet, Arbitrum, Optimism.

### 3. Layout Structure

- `src/components/layout/Sidebar.tsx`: Navigation (Dashboard, History, Settings).
- `src/components/layout/Header.tsx`: Contains the `<ConnectButton />` from RainbowKit.

## Implementation Steps

1.  Run the shadcn init command.
2.  Install RainbowKit: `npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query`.
3.  Create the `Providers` component and wrap `layout.tsx`.
4.  Verify you can connect a MetaMask wallet on `localhost:3000`.
