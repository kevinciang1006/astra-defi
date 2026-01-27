import { type Address } from 'viem';
import {
  scanAllChainBalances,
  getAllTokensWithBalances,
  type ChainBalances,
  type TokenBalance,
} from './balance-scanner';
import {
  fetchNativeTokenPrices,
  fetchPricesByIds,
  type TokenPrice,
} from './price-fetcher';
import { type SupportedChainId, getChainInfo, getSupportedChainIds } from '@/lib/chains';
import { CacheKeys, buildKey, getOrSet } from '@/lib/redis';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/constants/tokens';

const PORTFOLIO_CACHE_TTL = parseInt(process.env.PORTFOLIO_CACHE_TTL || '300', 10);

export interface AssetPosition {
  chainId: SupportedChainId;
  chainName: string;
  chainColor: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  formattedBalance: string;
  priceUsd: number;
  valueUsd: number;
  priceChange24h: number | null;
  isNative: boolean;
}

export interface ChainSummary {
  chainId: SupportedChainId;
  chainName: string;
  chainColor: string;
  totalValueUsd: number;
  assetCount: number;
}

export interface Portfolio {
  address: string;
  totalValueUsd: number;
  totalChange24hUsd: number;
  totalChange24hPercent: number;
  chainSummaries: ChainSummary[];
  assets: AssetPosition[];
  lastUpdated: string;
}

/**
 * Fetch all portfolio data for a wallet address
 */
export async function getPortfolio(
  walletAddress: Address,
  chainIds?: SupportedChainId[]
): Promise<Portfolio> {
  const cacheKey = buildKey(
    CacheKeys.PORTFOLIO,
    walletAddress.toLowerCase(),
    (chainIds ?? getSupportedChainIds()).join('-')
  );

  return getOrSet(
    cacheKey,
    async () => buildPortfolio(walletAddress, chainIds),
    PORTFOLIO_CACHE_TTL
  );
}

/**
 * Build portfolio data from scratch (uncached)
 */
async function buildPortfolio(
  walletAddress: Address,
  chainIds?: SupportedChainId[]
): Promise<Portfolio> {
  // Step 1: Scan balances across all chains
  const chainBalances = await scanAllChainBalances(walletAddress, chainIds);
  const allTokens = getAllTokensWithBalances(chainBalances);

  if (allTokens.length === 0) {
    return createEmptyPortfolio(walletAddress);
  }

  // Step 2: Fetch prices
  const prices = await fetchAllPrices(chainBalances, allTokens);

  // Step 3: Build asset positions with values
  const assets = buildAssetPositions(allTokens, prices);

  // Step 4: Calculate chain summaries
  const chainSummaries = buildChainSummaries(assets);

  // Step 5: Calculate totals
  const totalValueUsd = assets.reduce((sum, asset) => sum + asset.valueUsd, 0);

  // Calculate 24h change
  let totalValue24hAgo = 0;
  for (const asset of assets) {
    if (asset.priceChange24h !== null) {
      const price24hAgo = asset.priceUsd / (1 + asset.priceChange24h / 100);
      totalValue24hAgo += parseFloat(asset.formattedBalance) * price24hAgo;
    } else {
      totalValue24hAgo += asset.valueUsd;
    }
  }

  const totalChange24hUsd = totalValueUsd - totalValue24hAgo;
  const totalChange24hPercent = totalValue24hAgo > 0 ? (totalChange24hUsd / totalValue24hAgo) * 100 : 0;

  return {
    address: walletAddress.toLowerCase(),
    totalValueUsd,
    totalChange24hUsd,
    totalChange24hPercent,
    chainSummaries,
    assets: assets.sort((a, b) => b.valueUsd - a.valueUsd), // Sort by value descending
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch all required prices for the portfolio
 */
async function fetchAllPrices(
  chainBalances: ChainBalances[],
  allTokens: TokenBalance[]
): Promise<Map<string, TokenPrice>> {
  const prices = new Map<string, TokenPrice>();

  // Get chain IDs with balances
  const chainIdsWithBalances = chainBalances
    .filter((cb) => BigInt(cb.nativeBalance.balance) > 0n || cb.tokenBalances.length > 0)
    .map((cb) => cb.chainId);

  // Fetch native token prices
  if (chainIdsWithBalances.length > 0) {
    const nativePrices = await fetchNativeTokenPrices(chainIdsWithBalances);
    for (const [chainId, price] of nativePrices) {
      prices.set(`native:${chainId}`, price);
    }
  }

  // Collect unique CoinGecko IDs for token prices
  const coingeckoIds = new Set<string>();
  for (const token of allTokens) {
    if (token.coingeckoId && token.address !== NATIVE_TOKEN_ADDRESS) {
      coingeckoIds.add(token.coingeckoId);
    }
  }

  // Fetch token prices by CoinGecko ID
  if (coingeckoIds.size > 0) {
    const tokenPrices = await fetchPricesByIds([...coingeckoIds]);
    for (const [id, price] of tokenPrices) {
      prices.set(`coingecko:${id}`, price);
    }
  }

  return prices;
}

/**
 * Build asset positions with USD values
 */
function buildAssetPositions(
  tokens: TokenBalance[],
  prices: Map<string, TokenPrice>
): AssetPosition[] {
  const assets: AssetPosition[] = [];

  for (const token of tokens) {
    const chainInfo = getChainInfo(token.chainId);
    const isNative = token.address === NATIVE_TOKEN_ADDRESS;

    // Get price
    let price: TokenPrice | undefined;
    if (isNative) {
      price = prices.get(`native:${token.chainId}`);
    } else if (token.coingeckoId) {
      price = prices.get(`coingecko:${token.coingeckoId}`);
    }

    const priceUsd = price?.priceUsd ?? 0;
    const valueUsd = parseFloat(token.formattedBalance) * priceUsd;

    assets.push({
      chainId: token.chainId,
      chainName: chainInfo.name,
      chainColor: chainInfo.color,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      balance: token.balance,
      formattedBalance: token.formattedBalance,
      priceUsd,
      valueUsd,
      priceChange24h: price?.priceChange24h ?? null,
      isNative,
    });
  }

  return assets;
}

/**
 * Build chain summaries from asset positions
 */
function buildChainSummaries(assets: AssetPosition[]): ChainSummary[] {
  const chainMap = new Map<SupportedChainId, { totalValue: number; count: number }>();

  for (const asset of assets) {
    const current = chainMap.get(asset.chainId) ?? { totalValue: 0, count: 0 };
    current.totalValue += asset.valueUsd;
    current.count += 1;
    chainMap.set(asset.chainId, current);
  }

  const summaries: ChainSummary[] = [];

  for (const [chainId, data] of chainMap) {
    const chainInfo = getChainInfo(chainId);
    summaries.push({
      chainId,
      chainName: chainInfo.name,
      chainColor: chainInfo.color,
      totalValueUsd: data.totalValue,
      assetCount: data.count,
    });
  }

  return summaries.sort((a, b) => b.totalValueUsd - a.totalValueUsd);
}

/**
 * Create an empty portfolio for wallets with no balances
 */
function createEmptyPortfolio(walletAddress: Address): Portfolio {
  return {
    address: walletAddress.toLowerCase(),
    totalValueUsd: 0,
    totalChange24hUsd: 0,
    totalChange24hPercent: 0,
    chainSummaries: [],
    assets: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get portfolio value breakdown by chain
 */
export function getChainBreakdown(portfolio: Portfolio): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const summary of portfolio.chainSummaries) {
    breakdown[summary.chainName] = summary.totalValueUsd;
  }

  return breakdown;
}
