import { createSnapshot, getHistoricalData } from '../snapshot';
import type { Address } from 'viem';

// Mock dependencies
jest.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    portfolioSnapshot: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../portfolio', () => ({
  getPortfolio: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  buildKey: jest.fn((...parts: string[]) => parts.join(':')),
  getOrSet: jest.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  invalidatePattern: jest.fn(),
}));

import { prisma } from '@/lib/db/client';
import { getPortfolio } from '../portfolio';
import { invalidatePattern } from '@/lib/redis';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetPortfolio = getPortfolio as jest.MockedFunction<typeof getPortfolio>;

const TEST_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as Address;

const mockPortfolio = {
  address: TEST_ADDRESS,
  totalValueUsd: 10000,
  totalChange24hUsd: 250,
  totalChange24hPercent: 2.5,
  chainSummaries: [
    { chainId: 1 as const, chainName: 'Ethereum', chainColor: '#627EEA', totalValueUsd: 7000, assetCount: 3 },
    { chainId: 42161 as const, chainName: 'Arbitrum One', chainColor: '#28A0F0', totalValueUsd: 3000, assetCount: 2 },
  ],
  assets: [],
  lastUpdated: new Date().toISOString(),
};

describe('createSnapshot', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a user and snapshot for a wallet address', async () => {
    (mockPrisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1', address: TEST_ADDRESS });
    mockGetPortfolio.mockResolvedValue(mockPortfolio);
    (mockPrisma.portfolioSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snap-1' });

    await createSnapshot(TEST_ADDRESS);

    expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
      where: { address: TEST_ADDRESS },
      update: {},
      create: { address: TEST_ADDRESS },
    });
    expect(mockGetPortfolio).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(mockPrisma.portfolioSnapshot.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        totalValueUsd: 10000,
        breakdown: { Ethereum: 7000, 'Arbitrum One': 3000 },
      },
    });
    expect(invalidatePattern).toHaveBeenCalledWith(`history:${TEST_ADDRESS}*`);
  });

  it('propagates errors from portfolio fetch', async () => {
    (mockPrisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1', address: TEST_ADDRESS });
    mockGetPortfolio.mockRejectedValue(new Error('RPC timeout'));

    await expect(createSnapshot(TEST_ADDRESS)).rejects.toThrow('RPC timeout');
  });
});

describe('getHistoricalData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array for unknown wallet', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getHistoricalData(TEST_ADDRESS, '30d');

    expect(result).toEqual([]);
  });

  it('returns transformed snapshot data', async () => {
    const timestamp = new Date('2025-01-15T12:00:00Z');
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (mockPrisma.portfolioSnapshot.findMany as jest.Mock).mockResolvedValue([
      {
        timestamp,
        totalValueUsd: 10000,
        breakdown: { Ethereum: 7000 },
      },
    ]);

    const result = await getHistoricalData(TEST_ADDRESS, '30d');

    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(timestamp.toISOString());
    expect(result[0].totalValueUsd).toBe(10000);
    expect(result[0].breakdown).toEqual({ Ethereum: 7000 });
  });

  it('filters by time period', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (mockPrisma.portfolioSnapshot.findMany as jest.Mock).mockResolvedValue([]);

    await getHistoricalData(TEST_ADDRESS, '7d');

    const call = (mockPrisma.portfolioSnapshot.findMany as jest.Mock).mock.calls[0][0];
    const since = call.where.timestamp.gte as Date;
    const daysAgo = (Date.now() - since.getTime()) / 86_400_000;

    // Should be approximately 7 days ago
    expect(daysAgo).toBeGreaterThan(6.9);
    expect(daysAgo).toBeLessThan(7.1);
  });
});
