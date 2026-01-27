import { type NextRequest } from 'next/server';
import { success, errors, safeValidate } from '@/lib/api';
import { fetchPricesByIds, fetchNativeTokenPrices } from '@/lib/services';
import { getSupportedChainIds } from '@/lib/chains';
import { getAllCoingeckoIds } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const querySchema = z.object({
  ids: z.string().optional(),
  native: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * GET /api/prices
 *
 * Fetch token prices from CoinGecko.
 *
 * Query params:
 * - ids: Comma-separated CoinGecko token IDs (optional, defaults to all known tokens)
 * - native: Include native token prices for all chains (optional, default false)
 *
 * Response:
 * - 200: Map of token ID to price data
 * - 400: Invalid parameters
 * - 500: Internal error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = safeValidate(querySchema, searchParams);

    if (!validation.success) {
      return errors.validationError(validation.error);
    }

    const { ids, native } = validation.data;

    const result: Record<
      string,
      { priceUsd: number; priceChange24h: number | null }
    > = {};

    // Fetch native token prices if requested
    if (native) {
      const chainIds = getSupportedChainIds();
      const nativePrices = await fetchNativeTokenPrices(chainIds);

      for (const [chainId, price] of nativePrices) {
        result[`native:${chainId}`] = {
          priceUsd: price.priceUsd,
          priceChange24h: price.priceChange24h,
        };
      }
    }

    // Fetch token prices by CoinGecko ID
    const tokenIds = ids ? ids.split(',').filter(Boolean) : getAllCoingeckoIds();

    if (tokenIds.length > 0) {
      const tokenPrices = await fetchPricesByIds(tokenIds);

      for (const [id, price] of tokenPrices) {
        result[id] = {
          priceUsd: price.priceUsd,
          priceChange24h: price.priceChange24h,
        };
      }
    }

    return success({
      prices: result,
      count: Object.keys(result).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Prices fetch error:', error);
    return errors.internalError('Failed to fetch price data');
  }
}
