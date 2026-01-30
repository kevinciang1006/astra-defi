import { type NextRequest } from 'next/server';
import { type Address } from 'viem';
import { success, errors, ethereumAddressSchema, safeValidate } from '@/lib/api';
import { getAllUniswapV3Positions } from '@/lib/services/protocols';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portfolio/[address]/positions
 *
 * Fetch Uniswap V3 LP positions for a wallet across all supported chains.
 *
 * Response:
 * - 200: Array of UniswapV3Position
 * - 400: Invalid address
 * - 500: Internal error
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const validation = safeValidate(ethereumAddressSchema, address);

    if (!validation.success) {
      return errors.validationError(validation.error);
    }

    const positions = await getAllUniswapV3Positions(validation.data as Address);

    return success(positions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Positions fetch error:', message);
    return errors.internalError(`Failed to fetch positions: ${message}`);
  }
}
