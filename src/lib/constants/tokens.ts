import { type SupportedChainId, ChainId } from '@/lib/chains';

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
  logoUrl?: string;
}

// Native token placeholder address (used in balances)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

// Top tokens per chain - curated list of most common DeFi tokens
export const TOKENS_BY_CHAIN: Record<SupportedChainId, TokenInfo[]> = {
  // Ethereum Mainnet
  [ChainId.ETHEREUM]: [
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x6B175474E89094C44Da98b954EescdeCB5fC1d92E6',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      decimals: 18,
      coingeckoId: 'wrapped-steth',
    },
    {
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      symbol: 'stETH',
      name: 'Lido Staked ETH',
      decimals: 18,
      coingeckoId: 'staked-ether',
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      coingeckoId: 'uniswap',
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      coingeckoId: 'chainlink',
    },
    {
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      symbol: 'AAVE',
      name: 'Aave',
      decimals: 18,
      coingeckoId: 'aave',
    },
  ],

  // Arbitrum One
  [ChainId.ARBITRUM]: [
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
    {
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
      coingeckoId: 'arbitrum',
    },
    {
      address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
      symbol: 'GMX',
      name: 'GMX',
      decimals: 18,
      coingeckoId: 'gmx',
    },
    {
      address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      coingeckoId: 'chainlink',
    },
  ],

  // Optimism
  [ChainId.OPTIMISM]: [
    {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      name: 'Optimism',
      decimals: 18,
      coingeckoId: 'optimism',
    },
    {
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      coingeckoId: 'chainlink',
    },
  ],

  // Polygon
  [ChainId.POLYGON]: [
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
    {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped MATIC',
      decimals: 18,
      coingeckoId: 'wmatic',
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      coingeckoId: 'chainlink',
    },
    {
      address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B',
      symbol: 'AAVE',
      name: 'Aave',
      decimals: 18,
      coingeckoId: 'aave',
    },
  ],

  // Base
  [ChainId.BASE]: [
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coingeckoId: 'weth',
    },
    {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
    },
    {
      address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
      symbol: 'cbETH',
      name: 'Coinbase Wrapped Staked ETH',
      decimals: 18,
      coingeckoId: 'coinbase-wrapped-staked-eth',
    },
    {
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      decimals: 18,
      coingeckoId: 'wrapped-steth',
    },
  ],
};

/**
 * Get all tokens for a specific chain
 */
export function getTokensForChain(chainId: SupportedChainId): TokenInfo[] {
  return TOKENS_BY_CHAIN[chainId] ?? [];
}

/**
 * Get token addresses for a specific chain
 */
export function getTokenAddresses(chainId: SupportedChainId): `0x${string}`[] {
  return getTokensForChain(chainId).map((t) => t.address);
}

/**
 * Find token info by address
 */
export function findTokenByAddress(
  chainId: SupportedChainId,
  address: string
): TokenInfo | undefined {
  const normalizedAddress = address.toLowerCase();
  return getTokensForChain(chainId).find((t) => t.address.toLowerCase() === normalizedAddress);
}

/**
 * Get all unique CoinGecko IDs from all chains
 */
export function getAllCoingeckoIds(): string[] {
  const ids = new Set<string>();

  for (const tokens of Object.values(TOKENS_BY_CHAIN)) {
    for (const token of tokens) {
      if (token.coingeckoId) {
        ids.add(token.coingeckoId);
      }
    }
  }

  return [...ids];
}
