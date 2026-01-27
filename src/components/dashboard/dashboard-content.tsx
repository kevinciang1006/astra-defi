'use client';

import { useAccount } from 'wagmi';
import { usePortfolio } from '@/hooks/use-portfolio';
import { ConnectButton } from '@/components/wallet/connect-button';
import { PortfolioSummary, AssetList, ChainBreakdown } from '@/components/dashboard';

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { data: portfolio, isLoading, error, refetch } = usePortfolio(address);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl text-foreground">AstraDeFi</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <WelcomeScreen />
        ) : (
          <div className="space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
                <p className="text-red-500 text-sm">
                  Failed to load portfolio: {error.message}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-sm font-medium text-red-500 hover:text-red-400"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Portfolio Summary */}
            <PortfolioSummary portfolio={portfolio ?? null} isLoading={isLoading} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset List - Takes 2 columns */}
              <div className="lg:col-span-2">
                <AssetList assets={portfolio?.assets ?? []} isLoading={isLoading} />
              </div>

              {/* Chain Breakdown - Takes 1 column */}
              <div>
                <ChainBreakdown
                  chainSummaries={portfolio?.chainSummaries ?? []}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            AstraDeFi - Multi-Chain Yield Dashboard | Built for pubGENIUS.inc
          </p>
        </div>
      </footer>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
        <span className="text-white font-bold text-3xl">A</span>
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Welcome to AstraDeFi
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Track your DeFi portfolio across Ethereum, Arbitrum, Optimism, Polygon, and Base
        in one unified dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <ConnectButton />
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl">
        <FeatureCard
          icon="⚡"
          title="Real-time Prices"
          description="Live token prices with 24h change tracking"
        />
        <FeatureCard
          icon="🔗"
          title="Multi-Chain"
          description="Support for 5 major networks in one view"
        />
        <FeatureCard
          icon="📊"
          title="Portfolio Analytics"
          description="Chain breakdown and asset allocation"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card text-left">
      <span className="text-2xl mb-3 block">{icon}</span>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
