import { success, errors } from '@/lib/api';
import { healthCheck as redisHealthCheck } from '@/lib/redis';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    redis: ServiceStatus;
    database: ServiceStatus;
  };
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const isHealthy = await redisHealthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and load balancers.
 *
 * Response:
 * - 200: All services healthy
 * - 503: One or more services unhealthy
 */
export async function GET() {
  try {
    // Check all services in parallel
    const [redis, database] = await Promise.all([
      checkRedis(),
      checkDatabase(),
    ]);

    // Determine overall status
    const allHealthy = redis.status === 'healthy' && database.status === 'healthy';
    const allUnhealthy = redis.status === 'unhealthy' && database.status === 'unhealthy';

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      overallStatus = 'healthy';
    } else if (allUnhealthy) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      services: {
        redis,
        database,
      },
    };

    // Return 503 if unhealthy, 200 otherwise
    if (overallStatus === 'unhealthy') {
      return errors.serviceUnavailable('One or more services are unavailable');
    }

    return success(response);
  } catch (error) {
    console.error('[API] Health check error:', error);
    return errors.internalError('Health check failed');
  }
}
