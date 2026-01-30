'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApiResponse } from '@/lib/api';
import type { UniswapV3Position } from '@/lib/services/protocols';
import { getChainInfo, type SupportedChainId } from '@/lib/chains';
import { formatUnits } from 'viem';

interface LPPositionsProps {
  address?: string;
  isDemoMode?: boolean;
  isLoading?: boolean;
}

const FEE_TIER_LABELS: Record<number, string> = {
  100: '0.01%',
  500: '0.05%',
  3000: '0.3%',
  10000: '1%',
};

function getDemoPositions(): UniswapV3Position[] {
  return [
    {
      tokenId: '123456',
      chainId: 1 as SupportedChainId,
      token0: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
      token1: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      feeTier: 3000,
      tickLower: -887220,
      tickUpper: 887220,
      liquidity: '50000000000000000',
      tokensOwed0: '150000000000000', // ~0.00015 ETH
      tokensOwed1: '2500000', // 2.5 USDC
    },
    {
      tokenId: '789012',
      chainId: 42161 as SupportedChainId,
      token0: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
      token1: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      feeTier: 500,
      tickLower: -100,
      tickUpper: 100,
      liquidity: '25000000000000000',
      tokensOwed0: '80000000000000',
      tokensOwed1: '1200000',
    },
  ];
}

export function LPPositions({ address, isDemoMode, isLoading }: LPPositionsProps) {
  const [positions, setPositions] = useState<UniswapV3Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setPositions(getDemoPositions());
      return;
    }

    if (!address) {
      setPositions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/portfolio/${address}/positions`)
      .then((res) => res.json())
      .then((data: ApiResponse<UniswapV3Position[]>) => {
        if (cancelled) return;
        if (data.success) {
          setPositions(data.data);
        } else {
          setError(data.error.message);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, isDemoMode]);

  if (isLoading || loading) {
    return <LPPositionsSkeleton />;
  }

  // Don't render section at all if no positions and not in demo mode
  if (positions.length === 0 && !error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">
              Uniswap V3 Positions
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {positions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-500 mb-4">Failed to load positions: {error}</p>
          )}
          <div className="space-y-3">
            {positions.map((position) => (
              <PositionCard key={`${position.chainId}-${position.tokenId}`} position={position} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PositionCard({ position }: { position: UniswapV3Position }) {
  const chainInfo = getChainInfo(position.chainId);
  const feesToken0 = formatUnits(BigInt(position.tokensOwed0), position.token0.decimals);
  const feesToken1 = formatUnits(BigInt(position.tokensOwed1), position.token1.decimals);

  const hasUncollectedFees =
    BigInt(position.tokensOwed0) > 0n || BigInt(position.tokensOwed1) > 0n;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Token Pair */}
        <div>
          <div className="font-semibold text-foreground">
            {position.token0.symbol} / {position.token1.symbol}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: chainInfo.color, color: chainInfo.color }}
            >
              {chainInfo.shortName}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {FEE_TIER_LABELS[position.feeTier] ?? `${position.feeTier / 10000}%`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Uncollected Fees */}
      <div className="text-right">
        {hasUncollectedFees ? (
          <>
            <div className="text-xs text-muted-foreground mb-1">Uncollected Fees</div>
            <div className="text-sm font-medium text-emerald-500">
              {Number(feesToken0).toFixed(6)} {position.token0.symbol}
            </div>
            <div className="text-sm font-medium text-emerald-500">
              {Number(feesToken1).toFixed(2)} {position.token1.symbol}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">No uncollected fees</div>
        )}
      </div>
    </div>
  );
}

function LPPositionsSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
