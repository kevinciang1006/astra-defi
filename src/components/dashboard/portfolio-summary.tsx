'use client';

import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10">
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const changeColor = getChangeColor(portfolio.totalChange24hPercent);

  return (
    <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground">
                {formatUsd(portfolio.totalValueUsd)}
              </span>
              {portfolio.totalChange24hPercent !== 0 && (
                <span className={`text-lg font-medium ${changeColor}`}>
                  {formatPercent(portfolio.totalChange24hPercent)}
                </span>
              )}
            </div>
            {portfolio.totalChange24hUsd !== 0 && (
              <p className={`text-sm mt-1 ${changeColor}`}>
                {portfolio.totalChange24hUsd >= 0 ? '+' : ''}
                {formatUsd(portfolio.totalChange24hUsd)} today
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <Stat
              label="Assets"
              value={portfolio.assets.length.toString()}
            />
            <Stat
              label="Chains"
              value={portfolio.chainSummaries.length.toString()}
            />
            <Stat
              label="Top Chain"
              value={portfolio.chainSummaries[0]?.chainName ?? '--'}
            />
            <Stat
              label="Last Updated"
              value={formatTime(portfolio.lastUpdated)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
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
    <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10">
      <CardContent>
        <div className="space-y-4 animate-pulse">
          <div>
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-10 w-48 bg-muted rounded" />
          </div>
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-12 bg-muted rounded mb-1" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
