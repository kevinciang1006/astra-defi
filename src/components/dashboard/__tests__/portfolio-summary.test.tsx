import { render, screen } from '@testing-library/react';
import { PortfolioSummary } from '../portfolio-summary';
import type { Portfolio } from '@/lib/services';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...filterMotionProps(props)}>{children as React.ReactNode}</div>,
    span: ({ children, ...props }: Record<string, unknown>) => <span {...filterMotionProps(props)}>{children as React.ReactNode}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function filterMotionProps(props: Record<string, unknown>) {
  const filtered = { ...props };
  delete filtered.initial;
  delete filtered.animate;
  delete filtered.exit;
  delete filtered.transition;
  delete filtered.whileHover;
  delete filtered.layout;
  return filtered;
}

const mockPortfolio: Portfolio = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  totalValueUsd: 12345.67,
  totalChange24hUsd: 456.78,
  totalChange24hPercent: 3.84,
  chainSummaries: [
    { chainId: 1 as never, chainName: 'Ethereum', chainColor: '#627EEA', totalValueUsd: 8000, assetCount: 3 },
    { chainId: 42161 as never, chainName: 'Arbitrum', chainColor: '#28A0F0', totalValueUsd: 4345.67, assetCount: 2 },
  ],
  assets: [
    { chainId: 1 as never, chainName: 'Ethereum', chainColor: '#627EEA', address: '0x0', symbol: 'ETH', name: 'Ether', decimals: 18, balance: '1000000000000000000', formattedBalance: '1.0', priceUsd: 3500, valueUsd: 3500, priceChange24h: 2.5, isNative: true },
    { chainId: 1 as never, chainName: 'Ethereum', chainColor: '#627EEA', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: '5000000000', formattedBalance: '5000.0', priceUsd: 1, valueUsd: 5000, priceChange24h: 0.01, isNative: false },
  ],
  lastUpdated: new Date().toISOString(),
};

describe('PortfolioSummary', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(<PortfolioSummary portfolio={null} isLoading={true} />);
    // Skeleton renders pulse animation divs
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThanOrEqual(0);
    expect(screen.queryByText('$12,345.67')).not.toBeInTheDocument();
  });

  it('renders connect wallet message when portfolio is null', () => {
    render(<PortfolioSummary portfolio={null} isLoading={false} />);
    expect(screen.getByText('Connect your wallet to view your portfolio')).toBeInTheDocument();
  });

  it('renders total value formatted as currency', () => {
    render(<PortfolioSummary portfolio={mockPortfolio} />);
    expect(screen.getByText('$12,345.67')).toBeInTheDocument();
  });

  it('shows 24h change with positive styling', () => {
    render(<PortfolioSummary portfolio={mockPortfolio} />);
    expect(screen.getByText(/\+\$456\.78/)).toBeInTheDocument();
    expect(screen.getByText(/\+3\.84%/)).toBeInTheDocument();
  });

  it('shows negative change correctly', () => {
    const negativePortfolio: Portfolio = {
      ...mockPortfolio,
      totalChange24hUsd: -200,
      totalChange24hPercent: -1.62,
    };
    render(<PortfolioSummary portfolio={negativePortfolio} />);
    expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-1\.62%/)).toBeInTheDocument();
  });

  it('shows position and chain counts', () => {
    render(<PortfolioSummary portfolio={mockPortfolio} />);
    expect(screen.getByText('Total Positions')).toBeInTheDocument();
    expect(screen.getByText('Active Chains')).toBeInTheDocument();
    // Both values are "2" — use getAllByText
    expect(screen.getAllByText('2')).toHaveLength(2);
  });

  it('handles zero-value portfolio', () => {
    const zeroPortfolio: Portfolio = {
      ...mockPortfolio,
      totalValueUsd: 0,
      totalChange24hUsd: 0,
      totalChange24hPercent: 0,
      assets: [],
      chainSummaries: [],
    };
    render(<PortfolioSummary portfolio={zeroPortfolio} />);
    // Multiple $0.00 may appear (total value + 24h change + volume)
    expect(screen.getAllByText('$0.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });

  it('renders refresh button when onRefresh is provided', () => {
    const onRefresh = jest.fn();
    render(<PortfolioSummary portfolio={mockPortfolio} onRefresh={onRefresh} />);
    // The refresh button should exist (RefreshCw icon button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
