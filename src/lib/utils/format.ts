/**
 * Format a number as USD currency
 */
export function formatUsd(value: number, options?: { compact?: boolean }): string {
  if (options?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with appropriate decimal places
 */
export function formatNumber(value: number, decimals: number = 4): string {
  // For very small numbers, show more decimals
  if (value > 0 && value < 0.0001) {
    return value.toExponential(2);
  }

  // For whole numbers or large numbers, show fewer decimals
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (value >= 1) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: Math.min(decimals, 4),
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage change
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '--';

  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format an Ethereum address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get color class for percentage change
 */
export function getChangeColor(value: number | null): string {
  if (value === null) return 'text-muted-foreground';
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * Format a token balance with appropriate precision
 */
export function formatTokenBalance(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  return formatNumber(num, decimals);
}
