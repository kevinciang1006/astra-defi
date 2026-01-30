import {
  fetchNativeTokenPrices,
  fetchPricesByIds,
  fetchTokenPricesByAddress,
  getDbFallbackPrice,
} from '../price-fetcher';

jest.mock('@/lib/redis', () => ({
  CacheKeys: { PRICE: 'price' },
  buildKey: jest.fn((...parts: string[]) => parts.join(':')),
  getOrSet: jest.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
}));

jest.mock('@/lib/db/client', () => ({
  prisma: {
    tokenPrice: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchNativeTokenPrices', () => {
  it('fetches ETH and MATIC prices from CoinGecko', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ethereum: { usd: 3000, usd_24h_change: 2.5 },
          'matic-network': { usd: 0.85, usd_24h_change: -1.2 },
        }),
    });

    const result = await fetchNativeTokenPrices([1, 137] as [1, 137]);

    expect(result.size).toBe(2);
    expect(result.get(1)?.priceUsd).toBe(3000);
    expect(result.get(1)?.symbol).toBe('ETH');
    expect(result.get(137)?.priceUsd).toBe(0.85);
    expect(result.get(137)?.symbol).toBe('MATIC');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchNativeTokenPrices([1 as const])).rejects.toThrow('CoinGecko API error: 500');
  });
});

describe('fetchPricesByIds', () => {
  it('returns empty map for empty input', async () => {
    const result = await fetchPricesByIds([]);
    expect(result.size).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches prices by CoinGecko ID', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          'usd-coin': { usd: 1.0, usd_24h_change: 0.01 },
          weth: { usd: 3000, usd_24h_change: 2.5 },
        }),
    });

    const result = await fetchPricesByIds(['usd-coin', 'weth']);

    expect(result.size).toBe(2);
    expect(result.get('usd-coin')?.priceUsd).toBe(1.0);
    expect(result.get('weth')?.priceUsd).toBe(3000);
  });

  it('returns empty map on rate limit (429)', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429 });

    const result = await fetchPricesByIds(['ethereum']);

    expect(result.size).toBe(0);
  });
});

describe('fetchTokenPricesByAddress', () => {
  it('returns empty map for empty addresses', async () => {
    const result = await fetchTokenPricesByAddress(1 as const, []);
    expect(result.size).toBe(0);
  });

  it('fetches token prices by contract address', async () => {
    const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          [address]: { usd: 1.0, usd_24h_change: 0.01 },
        }),
    });

    const result = await fetchTokenPricesByAddress(1 as const, [address]);

    expect(result.size).toBe(1);
    expect(result.get(address)?.priceUsd).toBe(1.0);
  });
});

describe('getDbFallbackPrice', () => {
  it('returns price from DB when available', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.tokenPrice.findUnique as jest.Mock).mockResolvedValue({
      symbol: 'ETH',
      name: 'Ether',
      priceUsd: 3000,
      updatedAt: new Date('2025-01-15T12:00:00Z'),
    });

    const result = await getDbFallbackPrice(1 as const, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

    expect(result).not.toBeNull();
    expect(result?.priceUsd).toBe(3000);
    expect(result?.symbol).toBe('ETH');
  });

  it('returns null when token not in DB', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.tokenPrice.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getDbFallbackPrice(1 as const, '0x0000000000000000000000000000000000000000');

    expect(result).toBeNull();
  });

  it('returns null on DB error', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.tokenPrice.findUnique as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    const result = await getDbFallbackPrice(1 as const, '0x0000000000000000000000000000000000000000');

    expect(result).toBeNull();
  });
});
