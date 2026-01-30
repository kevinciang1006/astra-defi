'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Layers, Activity, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUsd, getChangeColor } from '@/lib/utils/format';
import type { Portfolio } from '@/lib/services';

interface PortfolioSummaryProps {
  portfolio: Portfolio | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function useTimeAgo(isoTimestamp: string | undefined): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!isoTimestamp) return;

    function update() {
      const seconds = Math.floor((Date.now() - new Date(isoTimestamp!).getTime()) / 1000);
      if (seconds < 60) setLabel(`${seconds}s ago`);
      else if (seconds < 3600) setLabel(`${Math.floor(seconds / 60)}m ago`);
      else setLabel(`${Math.floor(seconds / 3600)}h ago`);
    }

    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [isoTimestamp]);

  return label;
}

export function PortfolioSummary({ portfolio, isLoading, onRefresh, isRefreshing }: PortfolioSummaryProps) {
  if (isLoading) {
    return <PortfolioSummarySkeleton />;
  }

  if (!portfolio) {
    return (
      <Card className="border-border">
        <CardContent className="py-12">
          <div className="text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = portfolio.totalChange24hPercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  // Calculate mock APY (average of 8-15% for demo purposes)
  const avgApy = 12.4;
  // Calculate mock 24h volume based on portfolio value
  const volume24h = portfolio.totalValueUsd * 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border overflow-hidden">
        <CardContent className="pt-6 space-y-6">
          {/* Header with Live indicator */}
          <div className="flex justify-between items-start">
            <div>
              <motion.div
                className="text-5xl font-bold tracking-tight"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {formatUsd(portfolio.totalValueUsd)}
              </motion.div>

              {/* 24h Change */}
              <div className={`flex items-center gap-2 mt-2 text-lg ${getChangeColor(portfolio.totalChange24hPercent)}`}>
                <span className="flex items-center gap-1">
                  <TrendIcon className="h-4 w-4" />
                  {isPositive ? '+' : ''}
                  {formatUsd(Math.abs(portfolio.totalChange24hUsd))}
                  {' '}
                  ({isPositive ? '+' : ''}{portfolio.totalChange24hPercent.toFixed(2)}%)
                </span>
                <span className="text-sm text-muted-foreground">24h</span>
              </div>
            </div>

            {/* Live Indicator & Refresh */}
            <DataFreshnessIndicator
              lastUpdated={portfolio.lastUpdated}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <StatCard
              icon={<Layers className="h-4 w-4" />}
              label="Total Positions"
              value={portfolio.assets.length.toString()}
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Active Chains"
              value={portfolio.chainSummaries.length.toString()}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg APY"
              value={`${avgApy.toFixed(1)}%`}
              valueClassName="text-success"
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="24h Volume"
              value={formatUsd(volume24h, { compact: true })}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}

function StatCard({ icon, label, value, valueClassName = '' }: StatCardProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </p>
      <p className={`text-xl font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DataFreshnessIndicator({
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  lastUpdated: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const timeAgo = useTimeAgo(lastUpdated);
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const isStale = ageMs > 120_000; // >2 minutes

  return (
    <div className="flex items-center gap-2">
      {isStale ? (
        <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Stale &middot; {timeAgo}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-live" />
          <span>{timeAgo || 'Live'}</span>
        </div>
      )}
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}

function PortfolioSummarySkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="pt-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-12 w-56" />
            <Skeleton className="h-6 w-40 mt-2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-secondary/50 rounded-lg p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
