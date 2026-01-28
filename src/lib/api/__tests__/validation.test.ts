import {
  ethereumAddressSchema,
  chainIdSchema,
  paginationSchema,
  timeRangeSchema,
  safeValidate,
  parseSearchParams,
} from '../validation';

describe('ethereumAddressSchema', () => {
  it('validates correct Ethereum addresses', () => {
    const validAddresses = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '0x0000000000000000000000000000000000000000',
    ];

    for (const addr of validAddresses) {
      const result = ethereumAddressSchema.safeParse(addr);
      expect(result.success).toBe(true);
    }
  });

  it('lowercases addresses', () => {
    const result = ethereumAddressSchema.safeParse(
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    }
  });

  it('rejects invalid addresses', () => {
    const invalidAddresses = [
      '0x123', // Too short
      '1234567890abcdef1234567890abcdef12345678', // Missing 0x
      '0xGHIJKL7890abcdef1234567890abcdef12345678', // Invalid hex
      '', // Empty
    ];

    for (const addr of invalidAddresses) {
      const result = ethereumAddressSchema.safeParse(addr);
      expect(result.success).toBe(false);
    }
  });
});

describe('chainIdSchema', () => {
  it('validates supported chain IDs', () => {
    const supportedChains = [1, 10, 137, 8453, 42161];

    for (const chainId of supportedChains) {
      const result = chainIdSchema.safeParse(chainId);
      expect(result.success).toBe(true);
    }
  });

  it('coerces string to number', () => {
    const result = chainIdSchema.safeParse('1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(1);
    }
  });

  it('rejects unsupported chain IDs', () => {
    const unsupportedChains = [0, -1, 999, 56, 43114];

    for (const chainId of unsupportedChains) {
      const result = chainIdSchema.safeParse(chainId);
      expect(result.success).toBe(false);
    }
  });
});

describe('paginationSchema', () => {
  it('provides defaults for missing values', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('validates custom pagination', () => {
    const result = paginationSchema.safeParse({ page: 5, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects invalid pagination', () => {
    const result = paginationSchema.safeParse({ page: 0, limit: 200 });
    expect(result.success).toBe(false);
  });
});

describe('timeRangeSchema', () => {
  it('validates all supported time ranges', () => {
    const validRanges = ['7d', '30d', '90d', '1y', 'all'];

    for (const range of validRanges) {
      const result = timeRangeSchema.safeParse(range);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid time ranges', () => {
    const result = timeRangeSchema.safeParse('1w');
    expect(result.success).toBe(false);
  });
});

describe('safeValidate', () => {
  it('returns success with valid data', () => {
    const result = safeValidate(ethereumAddressSchema, '0x1234567890abcdef1234567890abcdef12345678');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('0x1234567890abcdef1234567890abcdef12345678');
    }
  });

  it('returns error with invalid data', () => {
    const result = safeValidate(ethereumAddressSchema, 'invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid Ethereum address');
    }
  });
});

describe('parseSearchParams', () => {
  it('parses URL search params to object', () => {
    const params = new URLSearchParams('page=1&limit=20&chain=ethereum');
    const result = parseSearchParams(params);

    expect(result).toEqual({
      page: '1',
      limit: '20',
      chain: 'ethereum',
    });
  });

  it('handles empty params', () => {
    const params = new URLSearchParams('');
    const result = parseSearchParams(params);
    expect(result).toEqual({});
  });
});
