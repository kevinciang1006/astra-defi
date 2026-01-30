import { prisma } from '@/lib/db/client';
import { getPortfolio } from './portfolio';
import { buildKey, getOrSet, invalidatePattern } from '@/lib/redis';
import type { Address } from 'viem';

const HISTORY_CACHE_TTL = 300; // 5 minutes

export interface HistoricalDataPoint {
  timestamp: string;
  totalValueUsd: number;
  breakdown: Record<string, number>;
}

/**
 * Create a portfolio snapshot for a wallet address.
 * Upserts the user record and persists the current portfolio value to MySQL.
 */
export async function createSnapshot(walletAddress: Address): Promise<void> {
  const normalizedAddress = walletAddress.toLowerCase();

  // Upsert user (create on first visit)
  const user = await prisma.user.upsert({
    where: { address: normalizedAddress },
    update: {},
    create: { address: normalizedAddress },
  });

  // Fetch live portfolio data
  const portfolio = await getPortfolio(walletAddress);

  // Build chain breakdown from summaries
  const breakdown: Record<string, number> = {};
  for (const chain of portfolio.chainSummaries) {
    breakdown[chain.chainName] = chain.totalValueUsd;
  }

  // Persist snapshot
  await prisma.portfolioSnapshot.create({
    data: {
      userId: user.id,
      totalValueUsd: portfolio.totalValueUsd,
      breakdown,
    },
  });

  // Invalidate cached history so next fetch picks up the new snapshot
  await invalidatePattern(`history:${normalizedAddress}*`);
}

/**
 * Retrieve historical portfolio snapshots for a wallet within a time range.
 * Results are cached in Redis for 5 minutes.
 */
export async function getHistoricalData(
  walletAddress: Address,
  period: '7d' | '30d' | '90d' | '1y' | 'all'
): Promise<HistoricalDataPoint[]> {
  const normalizedAddress = walletAddress.toLowerCase();
  const cacheKey = buildKey('history', normalizedAddress, period);

  return getOrSet(
    cacheKey,
    async () => {
      const user = await prisma.user.findUnique({
        where: { address: normalizedAddress },
      });

      if (!user) return [];

      const daysMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        all: 3650,
      };

      const since = new Date(Date.now() - daysMap[period] * 86_400_000);

      const snapshots = await prisma.portfolioSnapshot.findMany({
        where: {
          userId: user.id,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'asc' },
      });

      return snapshots.map((s) => ({
        timestamp: s.timestamp.toISOString(),
        totalValueUsd: Number(s.totalValueUsd),
        breakdown: s.breakdown as Record<string, number>,
      }));
    },
    HISTORY_CACHE_TTL
  );
}
