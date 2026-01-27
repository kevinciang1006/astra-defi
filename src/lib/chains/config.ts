import { createPublicClient, http, type Chain, type PublicClient } from 'viem';
import { mainnet, arbitrum, optimism, polygon, base } from 'viem/chains';

// Supported chain IDs
export const ChainId = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BASE: 8453,
} as const;

export type SupportedChainId = (typeof ChainId)[keyof typeof ChainId];

// Chain metadata for UI display
export interface ChainInfo {
  id: SupportedChainId;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  color: string;
  chain: Chain;
}

// All supported chains with metadata
export const SUPPORTED_CHAINS: Record<SupportedChainId, ChainInfo> = {
  [ChainId.ETHEREUM]: {
    id: ChainId.ETHEREUM,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
    chain: mainnet,
  },
  [ChainId.ARBITRUM]: {
    id: ChainId.ARBITRUM,
    name: 'Arbitrum One',
    shortName: 'ARB',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://arbiscan.io',
    color: '#28A0F0',
    chain: arbitrum,
  },
  [ChainId.OPTIMISM]: {
    id: ChainId.OPTIMISM,
    name: 'Optimism',
    shortName: 'OP',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    chain: optimism,
  },
  [ChainId.POLYGON]: {
    id: ChainId.POLYGON,
    name: 'Polygon',
    shortName: 'MATIC',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
    chain: polygon,
  },
  [ChainId.BASE]: {
    id: ChainId.BASE,
    name: 'Base',
    shortName: 'BASE',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://basescan.org',
    color: '#0052FF',
    chain: base,
  },
};

// Get RPC URL for a chain (supports Alchemy/Infura or public fallback)
function getRpcUrl(chainId: SupportedChainId): string {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const infuraKey = process.env.INFURA_API_KEY;

  // Alchemy endpoints (preferred)
  if (alchemyKey) {
    const alchemyNetworks: Record<SupportedChainId, string> = {
      [ChainId.ETHEREUM]: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      [ChainId.ARBITRUM]: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      [ChainId.OPTIMISM]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      [ChainId.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      [ChainId.BASE]: `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    };
    return alchemyNetworks[chainId];
  }

  // Infura fallback
  if (infuraKey) {
    const infuraNetworks: Record<SupportedChainId, string> = {
      [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${infuraKey}`,
      [ChainId.ARBITRUM]: `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`,
      [ChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${infuraKey}`,
      [ChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${infuraKey}`,
      [ChainId.BASE]: `https://base-mainnet.infura.io/v3/${infuraKey}`,
    };
    return infuraNetworks[chainId];
  }

  // Public RPC fallback (rate limited, use for development only)
  const publicRpcs: Record<SupportedChainId, string> = {
    [ChainId.ETHEREUM]: 'https://eth.llamarpc.com',
    [ChainId.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.OPTIMISM]: 'https://mainnet.optimism.io',
    [ChainId.POLYGON]: 'https://polygon-rpc.com',
    [ChainId.BASE]: 'https://mainnet.base.org',
  };

  return publicRpcs[chainId];
}

// Singleton map of viem public clients
const clients = new Map<SupportedChainId, PublicClient>();

/**
 * Get or create a viem public client for a specific chain.
 * Uses singleton pattern to reuse clients across requests.
 */
export function getPublicClient(chainId: SupportedChainId): PublicClient {
  const existing = clients.get(chainId);
  if (existing) {
    return existing;
  }

  const chainInfo = SUPPORTED_CHAINS[chainId];
  const client = createPublicClient({
    chain: chainInfo.chain,
    transport: http(getRpcUrl(chainId)),
    batch: {
      multicall: true, // Enable automatic multicall batching
    },
  });

  clients.set(chainId, client);
  return client;
}

/**
 * Get all supported chain IDs.
 */
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.values(ChainId);
}

/**
 * Check if a chain ID is supported.
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return Object.values(ChainId).includes(chainId as SupportedChainId);
}

/**
 * Get chain info by ID.
 */
export function getChainInfo(chainId: SupportedChainId): ChainInfo {
  return SUPPORTED_CHAINS[chainId];
}
