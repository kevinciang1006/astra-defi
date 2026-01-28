'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Layers, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatUsd, formatPercent, getChangeColor } from '@/lib/utils/format';
import type { Portfolio } from '@/lib/services';

interface PortfolioSummaryProps {
  portfolio: Portfolio | null;
  isLoading?: boolean;
}

export function PortfolioSummary({ portfolio, isLoading }: PortfolioSummaryProps) {
  if (isLoading) {
    return <PortfolioSummarySkeleton />;
  }

  if (!portfolio) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-4">
            <motion.span
              className="text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {formatUsd(portfolio.totalValueUsd)}
            </motion.span>
            {portfolio.totalChange24hPercent !== 0 && (
              <Badge variant={isPositive ? 'success' : 'destructive'} className="gap-1">
                <TrendIcon className="h-3 w-3" />
                {formatPercent(Math.abs(portfolio.totalChange24hPercent))}
              </Badge>
            )}
          </div>

          {portfolio.totalChange24hUsd !== 0 && (
            <p className={`text-sm ${getChangeColor(portfolio.totalChange24hPercent)}`}>
              {isPositive ? '+' : ''}
              {formatUsd(portfolio.totalChange24hUsd)} today
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <Stat
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Assets"
              value={portfolio.assets.length.toString()}
            />
            <Stat
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Chains"
              value={portfolio.chainSummaries.length.toString()}
            />
            <Stat
              label="Top Chain"
              value={portfolio.chainSummaries[0]?.chainName ?? '--'}
            />
            <Stat
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Last Updated"
              value={formatTime(portfolio.lastUpdated)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PortfolioSummarySkeleton() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
