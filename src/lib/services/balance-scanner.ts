import { formatUnits, erc20Abi, type Address } from 'viem';
import { getPublicClient, type SupportedChainId, ChainId, getChainInfo } from '@/lib/chains';
import { CacheKeys, buildKey, getOrSet } from '@/lib/redis';
import { getTokensForChain, NATIVE_TOKEN_ADDRESS, type TokenInfo } from '@/lib/constants/tokens';

const BALANCE_CACHE_TTL = parseInt(process.env.BALANCE_CACHE_TTL || '30', 10);

export interface TokenBalance {
  chainId: SupportedChainId;
  address: string; // Token contract address or NATIVE_TOKEN_ADDRESS
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // Raw balance as string (bigint)
  formattedBalance: string; // Human-readable balance
  coingeckoId?: string;
}

export interface ChainBalances {
  chainId: SupportedChainId;
  chainName: string;
  nativeBalance: TokenBalance;
  tokenBalances: TokenBalance[];
}

/**
 * Fetch native token balance (ETH, MATIC, etc.)
 */
async function fetchNativeBalance(
  chainId: SupportedChainId,
  walletAddress: Address
): Promise<TokenBalance> {
  const client = getPublicClient(chainId);
  const chainInfo = getChainInfo(chainId);

  const balance = await client.getBalance({ address: walletAddress });

  return {
    chainId,
    address: NATIVE_TOKEN_ADDRESS,
    symbol: chainInfo.nativeCurrency.symbol,
    name: chainInfo.nativeCurrency.name,
    decimals: chainInfo.nativeCurrency.decimals,
    balance: balance.toString(),
    formattedBalance: formatUnits(balance, chainInfo.nativeCurrency.decimals),
    coingeckoId: chainId === ChainId.POLYGON ? 'matic-network' : 'ethereum',
  };
}

/**
 * Fetch ERC-20 token balances using multicall for efficiency
 */
async function fetchTokenBalances(
  chainId: SupportedChainId,
  walletAddress: Address,
  tokens: TokenInfo[]
): Promise<TokenBalance[]> {
  if (tokens.length === 0) {
    return [];
  }

  const client = getPublicClient(chainId);

  // Use multicall to batch all balance requests
  const balanceCalls = tokens.map((token) => ({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf' as const,
    args: [walletAddress] as const,
  }));

  try {
    const results = await client.multicall({
      contracts: balanceCalls,
      allowFailure: true,
    });

    const balances: TokenBalance[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const result = results[i];

      if (result.status === 'success' && result.result !== undefined) {
        const balance = result.result as bigint;

        // Only include non-zero balances
        if (balance > 0n) {
          balances.push({
            chainId,
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance: balance.toString(),
            formattedBalance: formatUnits(balance, token.decimals),
            coingeckoId: token.coingeckoId,
          });
        }
      }
    }

    return balances;
  } catch (error) {
    console.error(`[BalanceScanner] Multicall failed for chain ${chainId}:`, error);
    return [];
  }
}

/**
 * Scan all balances for a wallet on a specific chain
 */
export async function scanChainBalances(
  chainId: SupportedChainId,
  walletAddress: Address
): Promise<ChainBalances> {
  const cacheKey = buildKey(
    CacheKeys.BALANCE,
    chainId.toString(),
    walletAddress.toLowerCase()
  );

  return getOrSet(
    cacheKey,
    async () => {
      const chainInfo = getChainInfo(chainId);
      const tokens = getTokensForChain(chainId);

      // Fetch native and token balances in parallel
      const [nativeBalance, tokenBalances] = await Promise.all([
        fetchNativeBalance(chainId, walletAddress),
        fetchTokenBalances(chainId, walletAddress, tokens),
      ]);

      return {
        chainId,
        chainName: chainInfo.name,
        nativeBalance,
        tokenBalances,
      };
    },
    BALANCE_CACHE_TTL
  );
}

/**
 * Scan balances across all supported chains
 */
export async function scanAllChainBalances(
  walletAddress: Address,
  chainIds?: SupportedChainId[]
): Promise<ChainBalances[]> {
  const chainsToScan = chainIds ?? [
    ChainId.ETHEREUM,
    ChainId.ARBITRUM,
    ChainId.OPTIMISM,
    ChainId.POLYGON,
    ChainId.BASE,
  ];

  // Scan all chains in parallel
  const results = await Promise.allSettled(
    chainsToScan.map((chainId) => scanChainBalances(chainId, walletAddress))
  );

  const balances: ChainBalances[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      balances.push(result.value);
    } else {
      console.error('[BalanceScanner] Chain scan failed:', result.reason);
    }
  }

  return balances;
}

/**
 * Get all tokens with non-zero balances across all chains
 */
export function getAllTokensWithBalances(chainBalances: ChainBalances[]): TokenBalance[] {
  const allTokens: TokenBalance[] = [];

  for (const chain of chainBalances) {
    // Include native token if balance > 0
    if (BigInt(chain.nativeBalance.balance) > 0n) {
      allTokens.push(chain.nativeBalance);
    }

    // Include all token balances (already filtered for non-zero)
    allTokens.push(...chain.tokenBalances);
  }

  return allTokens;
}
