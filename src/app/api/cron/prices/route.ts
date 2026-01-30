import { type NextRequest } from 'next/server';
import { success, errors } from '@/lib/api';
import { runPriceIndexer } from '@/lib/workers/price-indexer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/prices
 *
 * Trigger the price indexer to fetch and persist all tracked token prices.
 * Secured with CRON_SECRET Bearer token.
 *
 * Used by: Vercel Cron, external scheduler, or manual trigger in development.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return errors.unauthorized('Invalid or missing cron secret');
  }

  try {
    const result = await runPriceIndexer();

    console.log(
      `[Cron/Prices] ${result.tokensUpdated} tokens indexed in ${result.durationMs}ms`
    );

    if (result.errors.length > 0) {
      console.warn('[Cron/Prices] Errors:', result.errors);
    }

    return success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron/Prices] Fatal error:', message);
    return errors.internalError(`Price indexer failed: ${message}`);
  }
}
