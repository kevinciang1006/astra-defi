import { getAllTokensWithBalances, type ChainBalances, type TokenBalance } from '../balance-scanner';

// Only testing the pure utility function here.
// scanChainBalances and scanAllChainBalances require deep viem mocking
// and are better covered by integration/E2E tests.

describe('getAllTokensWithBalances', () => {
  it('returns empty array for empty chain balances', () => {
    const result = getAllTokensWithBalances([]);
    expect(result).toEqual([]);
  });

  it('includes native balances that are non-zero', () => {
    const chainBalances: ChainBalances[] = [
      {
        chainId: 1 as const,
        chainName: 'Ethereum',
        nativeBalance: {
          chainId: 1 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          balance: '1000000000000000000', // 1 ETH
          formattedBalance: '1.0',
        },
        tokenBalances: [],
      },
    ];

    const result = getAllTokensWithBalances(chainBalances);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('ETH');
    expect(result[0].chainId).toBe(1);
  });

  it('excludes zero native balances', () => {
    const chainBalances: ChainBalances[] = [
      {
        chainId: 1 as const,
        chainName: 'Ethereum',
        nativeBalance: {
          chainId: 1 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          balance: '0',
          formattedBalance: '0.0',
        },
        tokenBalances: [],
      },
    ];

    const result = getAllTokensWithBalances(chainBalances);

    expect(result).toHaveLength(0);
  });

  it('includes ERC-20 token balances', () => {
    const tokenBalance: TokenBalance = {
      chainId: 1 as const,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: '1000000000', // 1000 USDC
      formattedBalance: '1000.0',
      coingeckoId: 'usd-coin',
    };

    const chainBalances: ChainBalances[] = [
      {
        chainId: 1 as const,
        chainName: 'Ethereum',
        nativeBalance: {
          chainId: 1 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          balance: '0',
          formattedBalance: '0.0',
        },
        tokenBalances: [tokenBalance],
      },
    ];

    const result = getAllTokensWithBalances(chainBalances);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('USDC');
  });

  it('merges tokens from multiple chains', () => {
    const chainBalances: ChainBalances[] = [
      {
        chainId: 1 as const,
        chainName: 'Ethereum',
        nativeBalance: {
          chainId: 1 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
          balance: '1000000000000000000',
          formattedBalance: '1.0',
        },
        tokenBalances: [],
      },
      {
        chainId: 137 as const,
        chainName: 'Polygon',
        nativeBalance: {
          chainId: 137 as const,
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          symbol: 'MATIC',
          name: 'MATIC',
          decimals: 18,
          balance: '500000000000000000000',
          formattedBalance: '500.0',
        },
        tokenBalances: [],
      },
    ];

    const result = getAllTokensWithBalances(chainBalances);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.symbol)).toContain('ETH');
    expect(result.map((t) => t.symbol)).toContain('MATIC');
  });
});
