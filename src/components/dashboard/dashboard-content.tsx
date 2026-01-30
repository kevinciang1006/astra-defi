'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Zap, Link2, BarChart3 } from 'lucide-react';
import { usePortfolio } from '@/hooks/use-portfolio';
import { getDemoPortfolio } from '@/lib/demo';
import { ConnectButton } from '@/components/wallet/connect-button';
import { PortfolioSummary, AssetList, ChainBreakdown, PortfolioChart, LPPositions } from '@/components/dashboard';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { data: portfolio, isLoading, error, refetch } = usePortfolio(address);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Use demo data when in demo mode
  const displayPortfolio = isDemoMode ? getDemoPortfolio() : portfolio;
  const displayLoading = isDemoMode ? false : isLoading;

  // Show dashboard when connected OR in demo mode
  const showDashboard = isConnected || isDemoMode;

  // Auto-create a portfolio snapshot when wallet connects and portfolio loads
  const hasSnapshotted = useRef(false);
  useEffect(() => {
    if (isConnected && address && portfolio && !hasSnapshotted.current) {
      hasSnapshotted.current = true;
      fetch(`/api/portfolio/${address}/snapshot`, { method: 'POST' }).catch(
        () => {} // Fire and forget — snapshot failure shouldn't affect UX
      );
    }
  }, [isConnected, address, portfolio]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-xl gradient-text">AstraDeFi</span>
            </div>

            {/* Nav Links - Hidden on mobile */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#overview"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </a>
              <a
                href="#history"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </a>
              <a
                href="#settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </a>
            </nav>

            {isDemoMode && (
              <Badge variant="warning" className="ml-2">
                Demo Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDemoMode(false)}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Exit Demo
              </Button>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20"
          >
            <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <Play className="h-4 w-4" />
              <span>
                You&apos;re viewing demo data. Connect your wallet to see your real portfolio.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!showDashboard ? (
          <WelcomeScreen onViewDemo={() => setIsDemoMode(true)} />
        ) : (
          <div className="space-y-6">
            {/* Error Banner */}
            {error && !isDemoMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between"
              >
                <p className="text-red-500 text-sm">
                  Failed to load portfolio: {error.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  className="text-red-500 hover:text-red-400"
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {/* Portfolio Summary — renders first */}
            <ErrorBoundary>
              <PortfolioSummary portfolio={displayPortfolio ?? null} isLoading={displayLoading} onRefresh={() => refetch()} isRefreshing={isLoading} />
            </ErrorBoundary>

            {/* Portfolio Chart — fetches history independently */}
            <ErrorBoundary>
              <PortfolioChart
                totalValue={displayPortfolio?.totalValueUsd ?? 0}
                address={address}
                isDemoMode={isDemoMode}
                isLoading={displayLoading}
              />
            </ErrorBoundary>

            {/* Uniswap V3 LP Positions — fetches independently */}
            <ErrorBoundary>
              <LPPositions
                address={address}
                isDemoMode={isDemoMode}
                isLoading={displayLoading}
              />
            </ErrorBoundary>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset List - Takes 2 columns */}
              <div className="lg:col-span-2">
                <ErrorBoundary>
                  <AssetList assets={displayPortfolio?.assets ?? []} isLoading={displayLoading} />
                </ErrorBoundary>
              </div>

              {/* Chain Breakdown - Takes 1 column */}
              <div>
                <ErrorBoundary>
                  <ChainBreakdown
                    chainSummaries={displayPortfolio?.chainSummaries ?? []}
                    isLoading={displayLoading}
                  />
                </ErrorBoundary>
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

interface WelcomeScreenProps {
  onViewDemo: () => void;
}

function WelcomeScreen({ onViewDemo }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25"
      >
        <span className="text-white font-bold text-3xl">A</span>
      </motion.div>
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Welcome to AstraDeFi
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Track your DeFi portfolio across Ethereum, Arbitrum, Optimism, Polygon, and Base
        in one unified dashboard.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <ConnectButton />
        <span className="text-muted-foreground">or</span>
        <Button
          variant="outline"
          size="lg"
          onClick={onViewDemo}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          View Demo
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl">
        <FeatureCard
          icon={<Zap className="h-6 w-6" />}
          title="Real-time Prices"
          description="Live token prices with 24h change tracking"
          delay={0.2}
        />
        <FeatureCard
          icon={<Link2 className="h-6 w-6" />}
          title="Multi-Chain"
          description="Support for 5 major networks in one view"
          delay={0.3}
        />
        <FeatureCard
          icon={<BarChart3 className="h-6 w-6" />}
          title="Portfolio Analytics"
          description="Chain breakdown and asset allocation"
          delay={0.4}
        />
      </div>
    </motion.div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="p-6 rounded-xl border border-border bg-card text-left hover:border-primary/50 transition-colors"
    >
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
