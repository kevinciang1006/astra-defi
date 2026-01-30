import { type NextRequest } from 'next/server';
import { type Address } from 'viem';
import { success, errors, ethereumAddressSchema, timeRangeSchema, safeValidate } from '@/lib/api';
import { getHistoricalData } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portfolio/[address]/history?period=30d
 *
 * Retrieve historical portfolio snapshots for a wallet address.
 *
 * Query params:
 * - period: '7d' | '30d' | '90d' | '1y' | 'all' (default: '30d')
 *
 * Response:
 * - 200: Array of { timestamp, totalValueUsd, breakdown }
 * - 400: Invalid address or period
 * - 500: Internal error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const addressValidation = safeValidate(ethereumAddressSchema, address);

    if (!addressValidation.success) {
      return errors.validationError(addressValidation.error);
    }

    const periodParam = request.nextUrl.searchParams.get('period') ?? '30d';
    const periodValidation = safeValidate(timeRangeSchema, periodParam);

    if (!periodValidation.success) {
      return errors.validationError(periodValidation.error);
    }

    const data = await getHistoricalData(
      addressValidation.data as Address,
      periodValidation.data
    );

    return success(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] History fetch error:', message);
    return errors.internalError(`Failed to fetch history: ${message}`);
  }
}
