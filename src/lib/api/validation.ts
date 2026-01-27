import { z } from 'zod';

// Ethereum address validation (0x followed by 40 hex characters)
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
  .transform((addr) => addr.toLowerCase() as `0x${string}`);

// Chain ID validation
export const chainIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .refine((id) => [1, 10, 137, 8453, 42161].includes(id), 'Unsupported chain ID');

// Pagination parameters
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Time range for historical data
export const timeRangeSchema = z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d');

// Portfolio query parameters
export const portfolioQuerySchema = z.object({
  chains: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map(Number) : undefined)),
  hideSmallBalances: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Safely parse and validate request data.
 * Returns either the validated data or a validation error.
 */
export function safeValidate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a readable message (Zod v4 uses 'issues')
  const errorMessage = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  return { success: false, error: errorMessage };
}

/**
 * Parse URL search params into an object.
 */
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
