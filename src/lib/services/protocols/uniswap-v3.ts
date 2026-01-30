import { getPublicClient, type SupportedChainId } from '@/lib/chains';
import { UNISWAP_V3, NFT_POSITION_MANAGER_ABI } from '@/lib/constants/contracts';
import { findTokenByAddress } from '@/lib/constants/tokens';
import { getOrSet, buildKey } from '@/lib/redis';
import type { Address } from 'viem';

const POSITION_CACHE_TTL = 60; // 1 minute

export interface UniswapV3Position {
  tokenId: string;
  chainId: SupportedChainId;
  token0: { address: string; symbol: string; name: string; decimals: number };
  token1: { address: string; symbol: string; name: string; decimals: number };
  feeTier: number; // 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
  tickLower: number;
  tickUpper: number;
  liquidity: string; // bigint as string
  tokensOwed0: string; // Uncollected fees (raw, bigint as string)
  tokensOwed1: string;
}

function formatFeeTier(fee: number): string {
  const tiers: Record<number, string> = {
    100: '0.01%',
    500: '0.05%',
    3000: '0.3%',
    10000: '1%',
  };
  return tiers[fee] ?? `${fee / 10000}%`;
}

/**
 * Read all Uniswap V3 LP positions for a wallet on a single chain.
 * Uses multicall for efficient batching of RPC calls.
 */
export async function getUniswapV3Positions(
  walletAddress: Address,
  chainId: SupportedChainId
): Promise<UniswapV3Position[]> {
  const cacheKey = buildKey('univ3', chainId.toString(), walletAddress.toLowerCase());

  return getOrSet(
    cacheKey,
    async () => {
      const client = getPublicClient(chainId);
      const nftManager = UNISWAP_V3.NonfungiblePositionManager as Address;

      // 1. Get number of positions owned
      let balance: bigint;
      try {
        balance = await client.readContract({
          address: nftManager,
          abi: NFT_POSITION_MANAGER_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });
      } catch {
        // Contract may not exist on this chain or RPC error — return empty
        return [];
      }

      const count = Number(balance);
      if (count === 0) return [];

      // 2. Get all tokenIds via multicall
      const tokenIdCalls = Array.from({ length: count }, (_, i) => ({
        address: nftManager,
        abi: NFT_POSITION_MANAGER_ABI,
        functionName: 'tokenOfOwnerByIndex' as const,
        args: [walletAddress, BigInt(i)] as const,
      }));

      const tokenIdResults = await client.multicall({ contracts: tokenIdCalls });

      const validTokenIds = tokenIdResults
        .filter((r): r is { status: 'success'; result: bigint } => r.status === 'success')
        .map((r) => r.result);

      if (validTokenIds.length === 0) return [];

      // 3. Get position data for each tokenId via multicall
      const positionCalls = validTokenIds.map((tokenId) => ({
        address: nftManager,
        abi: NFT_POSITION_MANAGER_ABI,
        functionName: 'positions' as const,
        args: [tokenId] as const,
      }));

      const positionResults = await client.multicall({ contracts: positionCalls });

      // 4. Transform results
      const positions: UniswapV3Position[] = [];

      for (let i = 0; i < positionResults.length; i++) {
        const result = positionResults[i];
        if (result.status !== 'success' || !result.result) continue;

        const posData = result.result as readonly [
          bigint, string, string, string,
          number, number, number, bigint,
          bigint, bigint, bigint, bigint,
        ];

        const [
          , , // nonce, operator
          token0Address,
          token1Address,
          fee,
          tickLower,
          tickUpper,
          liquidity,
          , , // feeGrowthInside values
          tokensOwed0,
          tokensOwed1,
        ] = posData;

        // Skip closed positions (zero liquidity)
        if (liquidity === 0n) continue;

        const token0Info = findTokenByAddress(chainId, token0Address);
        const token1Info = findTokenByAddress(chainId, token1Address);

        positions.push({
          tokenId: validTokenIds[i].toString(),
          chainId,
          token0: {
            address: token0Address,
            symbol: token0Info?.symbol ?? 'Unknown',
            name: token0Info?.name ?? 'Unknown Token',
            decimals: token0Info?.decimals ?? 18,
          },
          token1: {
            address: token1Address,
            symbol: token1Info?.symbol ?? 'Unknown',
            name: token1Info?.name ?? 'Unknown Token',
            decimals: token1Info?.decimals ?? 18,
          },
          feeTier: Number(fee),
          tickLower: Number(tickLower),
          tickUpper: Number(tickUpper),
          liquidity: liquidity.toString(),
          tokensOwed0: tokensOwed0.toString(),
          tokensOwed1: tokensOwed1.toString(),
        });
      }

      return positions;
    },
    POSITION_CACHE_TTL
  );
}

/**
 * Scan all supported chains for Uniswap V3 positions.
 * Uses Promise.allSettled so one chain failure doesn't block others.
 */
export async function getAllUniswapV3Positions(
  walletAddress: Address
): Promise<UniswapV3Position[]> {
  const chainIds: SupportedChainId[] = [1, 42161, 10, 137, 8453] as SupportedChainId[];

  const results = await Promise.allSettled(
    chainIds.map((id) => getUniswapV3Positions(walletAddress, id))
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

export { formatFeeTier };
