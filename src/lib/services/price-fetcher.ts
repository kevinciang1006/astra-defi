import { CacheKeys, buildKey, getOrSet } from '@/lib/redis';
import { type SupportedChainId, ChainId } from '@/lib/chains';

// CoinGecko API configuration
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || '60', 10);

// CoinGecko platform IDs for each chain
const CHAIN_TO_COINGECKO_PLATFORM: Record<SupportedChainId, string> = {
  [ChainId.ETHEREUM]: 'ethereum',
  [ChainId.ARBITRUM]: 'arbitrum-one',
  [ChainId.OPTIMISM]: 'optimistic-ethereum',
  [ChainId.POLYGON]: 'polygon-pos',
  [ChainId.BASE]: 'base',
};

// CoinGecko native token IDs
const NATIVE_TOKEN_IDS: Record<SupportedChainId, string> = {
  [ChainId.ETHEREUM]: 'ethereum',
  [ChainId.ARBITRUM]: 'ethereum', // ETH on Arbitrum
  [ChainId.OPTIMISM]: 'ethereum', // ETH on Optimism
  [ChainId.POLYGON]: 'matic-network',
  [ChainId.BASE]: 'ethereum', // ETH on Base
};

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceChange24h: number | null;
  lastUpdated: string;
}

interface CoinGeckoSimplePriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface CoinGeckoTokenPriceResponse {
  [address: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

/**
 * Build CoinGecko API headers with optional API key
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  return headers;
}

/**
 * Fetch native token prices (ETH, MATIC) from CoinGecko
 */
export async function fetchNativeTokenPrices(
  chainIds: SupportedChainId[]
): Promise<Map<SupportedChainId, TokenPrice>> {
  const uniqueTokenIds = [...new Set(chainIds.map((id) => NATIVE_TOKEN_IDS[id]))];
  const cacheKey = buildKey(CacheKeys.PRICE, 'native', uniqueTokenIds.join(','));

  const prices = await getOrSet(
    cacheKey,
    async () => {
      const url = `${COINGECKO_API_BASE}/simple/price?ids=${uniqueTokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;

      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data: CoinGeckoSimplePriceResponse = await response.json();
      return data;
    },
    PRICE_CACHE_TTL
  );

  // Map prices back to chain IDs
  const result = new Map<SupportedChainId, TokenPrice>();

  for (const chainId of chainIds) {
    const tokenId = NATIVE_TOKEN_IDS[chainId];
    const priceData = prices[tokenId];

    if (priceData) {
      result.set(chainId, {
        id: tokenId,
        symbol: chainId === ChainId.POLYGON ? 'MATIC' : 'ETH',
        name: chainId === ChainId.POLYGON ? 'Polygon' : 'Ethereum',
        priceUsd: priceData.usd,
        priceChange24h: priceData.usd_24h_change ?? null,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  return result;
}

/**
 * Fetch ERC-20 token prices by contract address
 * CoinGecko free tier: 30 calls/min, so we batch requests
 */
export async function fetchTokenPricesByAddress(
  chainId: SupportedChainId,
  addresses: string[]
): Promise<Map<string, TokenPrice>> {
  if (addresses.length === 0) {
    return new Map();
  }

  const platform = CHAIN_TO_COINGECKO_PLATFORM[chainId];
  const normalizedAddresses = addresses.map((a) => a.toLowerCase());

  // CoinGecko limits to ~100 addresses per request
  const batchSize = 100;
  const batches: string[][] = [];

  for (let i = 0; i < normalizedAddresses.length; i += batchSize) {
    batches.push(normalizedAddresses.slice(i, i + batchSize));
  }

  const allPrices = new Map<string, TokenPrice>();

  for (const batch of batches) {
    const cacheKey = buildKey(CacheKeys.PRICE, chainId.toString(), batch.slice(0, 3).join('-'));

    const prices = await getOrSet(
      cacheKey,
      async () => {
        const url = `${COINGECKO_API_BASE}/simple/token_price/${platform}?contract_addresses=${batch.join(',')}&vs_currencies=usd&include_24hr_change=true`;

        const response = await fetch(url, { headers: getHeaders() });

        if (!response.ok) {
          // Return empty on rate limit rather than failing
          if (response.status === 429) {
            console.warn('[PriceFetcher] Rate limited by CoinGecko');
            return {};
          }
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data: CoinGeckoTokenPriceResponse = await response.json();
        return data;
      },
      PRICE_CACHE_TTL
    );

    // Map prices
    for (const [address, priceData] of Object.entries(prices)) {
      allPrices.set(address.toLowerCase(), {
        id: address,
        symbol: '', // CoinGecko simple endpoint doesn't return symbol
        name: '',
        priceUsd: priceData.usd,
        priceChange24h: priceData.usd_24h_change ?? null,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  return allPrices;
}

/**
 * Fetch prices for a list of CoinGecko token IDs
 * Used for well-known tokens where we have the CoinGecko ID
 */
export async function fetchPricesByIds(tokenIds: string[]): Promise<Map<string, TokenPrice>> {
  if (tokenIds.length === 0) {
    return new Map();
  }

  const cacheKey = buildKey(CacheKeys.PRICE, 'ids', tokenIds.slice(0, 5).join('-'));

  const prices = await getOrSet(
    cacheKey,
    async () => {
      const url = `${COINGECKO_API_BASE}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;

      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('[PriceFetcher] Rate limited by CoinGecko');
          return {};
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return response.json();
    },
    PRICE_CACHE_TTL
  );

  const result = new Map<string, TokenPrice>();

  for (const [id, priceData] of Object.entries(prices)) {
    const data = priceData as { usd: number; usd_24h_change?: number };
    result.set(id, {
      id,
      symbol: '',
      name: '',
      priceUsd: data.usd,
      priceChange24h: data.usd_24h_change ?? null,
      lastUpdated: new Date().toISOString(),
    });
  }

  return result;
}

/**
 * Get cached price for a single token, or null if not cached
 */
export async function getCachedPrice(
  chainId: SupportedChainId,
  address: string
): Promise<TokenPrice | null> {
  const prices = await fetchTokenPricesByAddress(chainId, [address]);
  return prices.get(address.toLowerCase()) ?? null;
}
