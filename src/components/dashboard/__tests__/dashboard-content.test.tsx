import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardContent } from '../dashboard-content';

// Mock wagmi
const mockUseAccount = jest.fn(() => ({ address: undefined, isConnected: false }));
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}));

// Mock use-portfolio hook
const mockUsePortfolio = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));
jest.mock('@/hooks/use-portfolio', () => ({
  usePortfolio: (...args: unknown[]) => mockUsePortfolio(...args),
}));

// Mock getDemoPortfolio
jest.mock('@/lib/demo', () => ({
  getDemoPortfolio: () => ({
    address: '0xdemo',
    totalValueUsd: 50000,
    totalChange24hUsd: 1200,
    totalChange24hPercent: 2.46,
    chainSummaries: [
      { chainId: 1, chainName: 'Ethereum', chainColor: '#627EEA', totalValueUsd: 50000, assetCount: 2 },
    ],
    assets: [
      { chainId: 1, chainName: 'Ethereum', chainColor: '#627EEA', address: '0x0', symbol: 'ETH', name: 'Ether', decimals: 18, balance: '10000000000000000000', formattedBalance: '10.0', priceUsd: 3500, valueUsd: 35000, priceChange24h: 3.0, isNative: true },
    ],
    lastUpdated: new Date().toISOString(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const filtered = { ...props };
      ['initial', 'animate', 'exit', 'transition', 'layout', 'whileHover'].forEach(k => delete filtered[k]);
      return <div {...filtered}>{children as React.ReactNode}</div>;
    },
    tr: ({ children, ...props }: Record<string, unknown>) => {
      const filtered = { ...props };
      ['initial', 'animate', 'exit', 'transition', 'layout'].forEach(k => delete filtered[k]);
      return <tr {...filtered}>{children as React.ReactNode}</tr>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

// Mock ConnectButton
jest.mock('@/components/wallet/connect-button', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: false, error: { code: 'NOT_FOUND', message: 'No data' } }),
  })
) as jest.Mock;

describe('DashboardContent', () => {
  beforeEach(() => {
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false });
    mockUsePortfolio.mockReturnValue({ data: null, isLoading: false, error: null, refetch: jest.fn() });
  });

  it('shows welcome screen when wallet not connected', () => {
    render(<DashboardContent />);
    expect(screen.getByText('Welcome to AstraDeFi')).toBeInTheDocument();
    // Connect Wallet appears in header and welcome screen
    expect(screen.getAllByText('Connect Wallet').length).toBeGreaterThanOrEqual(1);
  });

  it('shows View Demo button on welcome screen', () => {
    render(<DashboardContent />);
    expect(screen.getByText('View Demo')).toBeInTheDocument();
  });

  it('enables demo mode when View Demo is clicked', () => {
    render(<DashboardContent />);
    fireEvent.click(screen.getByText('View Demo'));
    // Should now show portfolio data instead of welcome screen
    expect(screen.queryByText('Welcome to AstraDeFi')).not.toBeInTheDocument();
    // Should show demo portfolio total value (may appear in summary + chart)
    expect(screen.getAllByText('$50,000.00').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Demo Mode badge and Exit Demo button', () => {
    render(<DashboardContent />);
    fireEvent.click(screen.getByText('View Demo'));
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    expect(screen.getByText('Exit Demo')).toBeInTheDocument();
  });

  it('exits demo mode when Exit Demo is clicked', () => {
    render(<DashboardContent />);
    fireEvent.click(screen.getByText('View Demo'));
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Exit Demo'));
    // Should go back to welcome screen
    expect(screen.getByText('Welcome to AstraDeFi')).toBeInTheDocument();
  });

  it('shows error banner with retry when portfolio fetch fails', () => {
    const refetchMock = jest.fn();
    mockUseAccount.mockReturnValue({ address: '0x1234', isConnected: true });
    mockUsePortfolio.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: refetchMock,
    });

    render(<DashboardContent />);
    expect(screen.getByText(/Failed to load portfolio/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(refetchMock).toHaveBeenCalled();
  });
});
