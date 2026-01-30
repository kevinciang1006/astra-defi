'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUsd, formatPercent, getChangeColor } from '@/lib/utils/format';
import type { AssetPosition } from '@/lib/services';

interface PositionCardsProps {
  assets: AssetPosition[];
}

export function PositionCards({ assets }: PositionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {assets.map((asset, index) => (
        <PositionCard key={`${asset.chainId}-${asset.address}`} asset={asset} index={index} />
      ))}
    </div>
  );
}

interface PositionCardProps {
  asset: AssetPosition;
  index: number;
}

// Generate a deterministic "random" APY based on asset address hash
function getAssetApy(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to a number between 8 and 23
  return 8 + Math.abs(hash % 150) / 10;
}

function PositionCard({ asset, index }: PositionCardProps) {
  const isPositive = (asset.priceChange24h ?? 0) >= 0;
  const changeColor = getChangeColor(asset.priceChange24h);

  // Mock APY and fees for demo (in a real app, these would come from DeFi protocols)
  // Use deterministic value based on address to avoid React purity issues
  const mockApy = getAssetApy(asset.address);
  const mockFees24h = asset.valueUsd * (mockApy / 100 / 365);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-border hover:border-primary/50 transition-all cursor-pointer group">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: asset.chainColor + '20',
                  color: asset.chainColor,
                }}
              >
                {asset.symbol.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {asset.symbol}
                </p>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: asset.chainColor + '50',
                backgroundColor: asset.chainColor + '10',
                color: asset.chainColor,
              }}
            >
              {asset.chainName}
            </Badge>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricItem
              label="Current Value"
              value={formatUsd(asset.valueUsd)}
            />
            <MetricItem
              label="24h Change"
              value={
                <span className={`flex items-center gap-1 ${changeColor}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? '+' : ''}{formatPercent(asset.priceChange24h ?? 0)}
                </span>
              }
            />
            <MetricItem
              label="Current APY"
              value={<span className="text-success">{mockApy.toFixed(1)}%</span>}
            />
            <MetricItem
              label="24h Fees"
              value={formatUsd(mockFees24h)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
