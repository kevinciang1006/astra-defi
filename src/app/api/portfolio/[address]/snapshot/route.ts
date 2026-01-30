import { type NextRequest } from 'next/server';
import { type Address } from 'viem';
import { success, errors, ethereumAddressSchema, safeValidate } from '@/lib/api';
import { createSnapshot } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * POST /api/portfolio/[address]/snapshot
 *
 * Create a portfolio snapshot for a wallet address.
 * Persists current portfolio value and chain breakdown to MySQL.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const validation = safeValidate(ethereumAddressSchema, address);

    if (!validation.success) {
      return errors.validationError(validation.error);
    }

    await createSnapshot(validation.data as Address);

    return success({ created: true }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Snapshot creation error:', message);
    return errors.internalError(`Failed to create snapshot: ${message}`);
  }
}
