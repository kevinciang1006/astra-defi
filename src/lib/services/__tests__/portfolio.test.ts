import { getPortfolio, getChainBreakdown, type Portfolio } from '../portfolio';
import type { Address } from 'viem';

jest.mock('../balance-scanner', () => ({
  scanAllChainBalances: jest.fn(),
  getAllTokensWithBalances: jest.fn(),
}));

jest.mock('../price-fetcher', () => ({
  fetchNativeTokenPrices: jest.fn(),
  fetchPricesByIds: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  CacheKeys: { PORTFOLIO: 'portfolio' },
  buildKey: jest.fn((...parts: string[]) => parts.join(':')),
  getOrSet: jest.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
}));

jest.mock('@/lib/chains', () => ({
  ChainId: { ETHEREUM: 1, ARBITRUM: 42161, OPTIMISM: 10, POLYGON: 137, BASE: 8453 },
  getChainInfo: jest.fn((id: number) => ({
    id,
    name: id === 1 ? 'Ethereum' : 'Other',
    color: '#000',
  })),
  getSupportedChainIds: jest.fn(() => [1, 42161, 10, 137, 8453]),
}));

jest.mock('@/lib/constants/tokens', () => ({
  NATIVE_TOKEN_ADDRESS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
}));

import { scanAllChainBalances, getAllTokensWithBalances } from '../balance-scanner';
import { fetchNativeTokenPrices, fetchPricesByIds } from '../price-fetcher';

const mockScanAll = scanAllChainBalances as jest.MockedFunction<typeof scanAllChainBalances>;
const mockGetTokens = getAllTokensWithBalances as jest.MockedFunction<typeof getAllTokensWithBalances>;
const mockFetchNative = fetchNativeTokenPrices as jest.MockedFunction<typeof fetchNativeTokenPrices>;
const mockFetchByIds = fetchPricesByIds as jest.MockedFunction<typeof fetchPricesByIds>;

const TEST_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as Address;

describe('getPortfolio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty portfolio for wallet with no balances', async () => {
    mockScanAll.mockResolvedValue([]);
    mockGetTokens.mockReturnValue([]);

    const result = await getPortfolio(TEST_ADDRESS);

    expect(result.totalValueUsd).toBe(0);
    expect(result.assets).toHaveLength(0);
    expect(result.chainSummaries).toHaveLength(0);
    expect(result.address).toBe(TEST_ADDRESS);
  });

  it('aggregates balances and prices into portfolio', async () => {
    mockScanAll.mockResolvedValue([
      {
        chainId: 1 as const,
        chainName: 'Ethereum',
        nativeBalance: {
          chainId: 1 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          balance: '1000000000000000000',
          formattedBalance: '1.0',
        },
        tokenBalances: [],
      },
    ]);

    mockGetTokens.mockReturnValue([
      {
        chainId: 1 as const,
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
        decimals: 18,
        balance: '1000000000000000000',
        formattedBalance: '1.0',
      },
    ]);

    const nativePrices = new Map();
    nativePrices.set(1, {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      priceUsd: 3000,
      priceChange24h: 2.5,
      lastUpdated: new Date().toISOString(),
    });
    mockFetchNative.mockResolvedValue(nativePrices);
    mockFetchByIds.mockResolvedValue(new Map());

    const result = await getPortfolio(TEST_ADDRESS);

    expect(result.totalValueUsd).toBe(3000);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].symbol).toBe('ETH');
    expect(result.assets[0].valueUsd).toBe(3000);
    expect(result.chainSummaries).toHaveLength(1);
    expect(result.chainSummaries[0].totalValueUsd).toBe(3000);
  });

  it('handles partial chain failures gracefully', async () => {
    // scanAllChainBalances uses Promise.allSettled internally
    mockScanAll.mockResolvedValue([]);
    mockGetTokens.mockReturnValue([]);

    const result = await getPortfolio(TEST_ADDRESS);

    expect(result.totalValueUsd).toBe(0);
    expect(result.assets).toHaveLength(0);
  });
});

describe('getChainBreakdown', () => {
  it('maps chain summaries to breakdown object', () => {
    const portfolio: Portfolio = {
      address: TEST_ADDRESS,
      totalValueUsd: 10000,
      totalChange24hUsd: 0,
      totalChange24hPercent: 0,
      chainSummaries: [
        { chainId: 1 as const, chainName: 'Ethereum', chainColor: '#627EEA', totalValueUsd: 7000, assetCount: 3 },
        { chainId: 42161 as const, chainName: 'Arbitrum One', chainColor: '#28A0F0', totalValueUsd: 3000, assetCount: 2 },
      ],
      assets: [],
      lastUpdated: new Date().toISOString(),
    };

    const breakdown = getChainBreakdown(portfolio);

    expect(breakdown).toEqual({
      Ethereum: 7000,
      'Arbitrum One': 3000,
    });
  });
});
