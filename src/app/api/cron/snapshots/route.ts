import { type NextRequest } from 'next/server';
import { type Address } from 'viem';
import { success, errors } from '@/lib/api';
import { prisma } from '@/lib/db/client';
import { createSnapshot } from '@/lib/services/snapshot';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Up to 5 minutes for many wallets

/**
 * GET /api/cron/snapshots
 *
 * Create portfolio snapshots for all registered users.
 * Designed to run daily via Vercel Cron or external scheduler.
 * Secured with CRON_SECRET Bearer token.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return errors.unauthorized('Invalid or missing cron secret');
  }

  try {
    const users = await prisma.user.findMany({ select: { address: true } });

    const results = {
      total: users.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      try {
        await createSnapshot(user.address as Address);
        results.succeeded++;
      } catch (err) {
        results.failed++;
        const message = err instanceof Error ? err.message : String(err);
        results.errors.push(`${user.address}: ${message}`);
      }
    }

    console.log(
      `[Cron/Snapshots] ${results.succeeded}/${results.total} snapshots created`
    );

    if (results.errors.length > 0) {
      console.warn('[Cron/Snapshots] Errors:', results.errors);
    }

    return success(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron/Snapshots] Fatal error:', message);
    return errors.internalError(`Snapshot cron failed: ${message}`);
  }
}
