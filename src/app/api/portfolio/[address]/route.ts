import { type NextRequest } from 'next/server';
import { type Address } from 'viem';
import { success, errors, ethereumAddressSchema, safeValidate } from '@/lib/api';
import { getPortfolio } from '@/lib/services';
import { isSupportedChain, type SupportedChainId } from '@/lib/chains';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/portfolio/[address]
 *
 * Fetch portfolio data for a wallet address across all supported chains.
 *
 * Query params:
 * - chains: Comma-separated list of chain IDs to filter (optional)
 *
 * Response:
 * - 200: Portfolio data with assets, values, and chain breakdown
 * - 400: Invalid address format
 * - 500: Internal error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Validate address parameter
    const { address } = await params;
    const validation = safeValidate(ethereumAddressSchema, address);

    if (!validation.success) {
      return errors.validationError(validation.error);
    }

    const walletAddress = validation.data as Address;

    // Parse optional chain filter
    const searchParams = request.nextUrl.searchParams;
    const chainsParam = searchParams.get('chains');

    let chainIds: SupportedChainId[] | undefined;

    if (chainsParam) {
      const parsedChains = chainsParam.split(',').map(Number);
      const validChains = parsedChains.filter(isSupportedChain);

      if (validChains.length === 0) {
        return errors.validationError('No valid chain IDs provided');
      }

      chainIds = validChains;
    }

    // Fetch portfolio
    const portfolio = await getPortfolio(walletAddress, chainIds);

    return success(portfolio);
  } catch (error) {
    console.error('[API] Portfolio fetch error:', error);
    return errors.internalError('Failed to fetch portfolio data');
  }
}
