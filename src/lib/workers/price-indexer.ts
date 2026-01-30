import { prisma } from '@/lib/db/client';
import { fetchPricesByIds, fetchNativeTokenPrices } from '@/lib/services/price-fetcher';
import { TOKENS_BY_CHAIN, NATIVE_TOKEN_ADDRESS } from '@/lib/constants/tokens';
import { getSupportedChainIds, ChainId, type SupportedChainId } from '@/lib/chains';
import { set, buildKey, CacheKeys } from '@/lib/redis';

const NATIVE_TOKEN_NAMES: Record<SupportedChainId, { symbol: string; name: string }> = {
  [ChainId.ETHEREUM]: { symbol: 'ETH', name: 'Ether' },
  [ChainId.ARBITRUM]: { symbol: 'ETH', name: 'Ether' },
  [ChainId.OPTIMISM]: { symbol: 'ETH', name: 'Ether' },
  [ChainId.POLYGON]: { symbol: 'MATIC', name: 'MATIC' },
  [ChainId.BASE]: { symbol: 'ETH', name: 'Ether' },
};

export interface IndexerResult {
  tokensUpdated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Fetch all tracked token prices and persist them to MySQL + Redis.
 * Designed to be called by a cron route every 60 seconds.
 */
export async function runPriceIndexer(): Promise<IndexerResult> {
  const start = Date.now();
  const indexerErrors: string[] = [];
  let tokensUpdated = 0;

  try {
    // 1. Collect all unique CoinGecko IDs across chains
    const allIds = new Set<string>();
    for (const tokens of Object.values(TOKENS_BY_CHAIN)) {
      for (const token of tokens) {
        if (token.coingeckoId) allIds.add(token.coingeckoId);
      }
    }

    // 2. Fetch ERC-20 prices in bulk
    const prices = await fetchPricesByIds([...allIds]);

    // 3. Fetch native token prices
    const chainIds = getSupportedChainIds();
    const nativePrices = await fetchNativeTokenPrices(chainIds);

    // 4. Upsert ERC-20 prices into DB
    for (const [chainIdStr, tokens] of Object.entries(TOKENS_BY_CHAIN)) {
      const chainId = Number(chainIdStr) as SupportedChainId;

      for (const token of tokens) {
        if (!token.coingeckoId) continue;
        const price = prices.get(token.coingeckoId);
        if (!price) continue;

        const id = `${chainId}:${token.address.toLowerCase()}`;
        try {
          await prisma.tokenPrice.upsert({
            where: { id },
            update: { priceUsd: price.priceUsd },
            create: {
              id,
              chainId,
              address: token.address.toLowerCase(),
              symbol: token.symbol,
              name: token.name,
              decimals: token.decimals,
              priceUsd: price.priceUsd,
            },
          });

          // Update Redis cache alongside DB
          await set(
            buildKey(CacheKeys.PRICE, chainId.toString(), token.address.toLowerCase()),
            price,
            120
          );
          tokensUpdated++;
        } catch (err) {
          indexerErrors.push(`${token.symbol} on ${chainId}: ${err}`);
        }
      }
    }

    // 5. Upsert native token prices
    for (const [chainId, price] of nativePrices) {
      const id = `${chainId}:${NATIVE_TOKEN_ADDRESS.toLowerCase()}`;
      const meta = NATIVE_TOKEN_NAMES[chainId];

      try {
        await prisma.tokenPrice.upsert({
          where: { id },
          update: { priceUsd: price.priceUsd },
          create: {
            id,
            chainId,
            address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
            symbol: meta.symbol,
            name: meta.name,
            decimals: 18,
            priceUsd: price.priceUsd,
          },
        });

        await set(
          buildKey(CacheKeys.PRICE, 'native', chainId.toString()),
          price,
          120
        );
        tokensUpdated++;
      } catch (err) {
        indexerErrors.push(`Native ${meta.symbol} on ${chainId}: ${err}`);
      }
    }
  } catch (err) {
    indexerErrors.push(`Indexer top-level error: ${err}`);
  }

  return {
    tokensUpdated,
    errors: indexerErrors,
    durationMs: Date.now() - start,
  };
}
