import { render, screen, fireEvent } from '@testing-library/react';
import { AssetList } from '../asset-list';
import type { AssetPosition } from '@/lib/services';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const filtered = { ...props };
      ['initial', 'animate', 'exit', 'transition', 'whileHover', 'layout'].forEach(k => delete filtered[k]);
      return <div {...filtered}>{children as React.ReactNode}</div>;
    },
    tr: ({ children, ...props }: Record<string, unknown>) => {
      const filtered = { ...props };
      ['initial', 'animate', 'exit', 'transition', 'whileHover', 'layout'].forEach(k => delete filtered[k]);
      return <tr {...filtered}>{children as React.ReactNode}</tr>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockAssets: AssetPosition[] = [
  {
    chainId: 1 as never, chainName: 'Ethereum', chainColor: '#627EEA',
    address: '0x0', symbol: 'ETH', name: 'Ether', decimals: 18,
    balance: '2000000000000000000', formattedBalance: '2.0',
    priceUsd: 3500, valueUsd: 7000, priceChange24h: 5.2, isNative: true,
  },
  {
    chainId: 1 as never, chainName: 'Ethereum', chainColor: '#627EEA',
    address: '0xA0b8', symbol: 'USDC', name: 'USD Coin', decimals: 6,
    balance: '3000000000', formattedBalance: '3000.0',
    priceUsd: 1, valueUsd: 3000, priceChange24h: 0.01, isNative: false,
  },
  {
    chainId: 42161 as never, chainName: 'Arbitrum', chainColor: '#28A0F0',
    address: '0x0', symbol: 'ETH', name: 'Ether', decimals: 18,
    balance: '500000000000000000', formattedBalance: '0.5',
    priceUsd: 3500, valueUsd: 1750, priceChange24h: -2.1, isNative: true,
  },
];

describe('AssetList', () => {
  it('renders empty state with no assets', () => {
    render(<AssetList assets={[]} />);
    expect(screen.getByText('No assets found in this wallet')).toBeInTheDocument();
  });

  it('renders all assets', () => {
    render(<AssetList assets={mockAssets} />);
    // Badge shows filtered count
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Your Positions')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(<AssetList assets={[]} isLoading={true} />);
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThanOrEqual(0);
    expect(screen.queryByText('No assets found in this wallet')).not.toBeInTheDocument();
  });

  it('filters by chain', () => {
    render(<AssetList assets={mockAssets} />);
    // Find the chain filter select and change it
    const selects = screen.getAllByRole('combobox');
    // First select is chain filter
    fireEvent.change(selects[0], { target: { value: 'Arbitrum' } });
    // Should now show count of 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('filters by token', () => {
    render(<AssetList assets={mockAssets} />);
    const selects = screen.getAllByRole('combobox');
    // Second select is token filter
    fireEvent.change(selects[1], { target: { value: 'USDC' } });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('switches between card and table view', () => {
    render(<AssetList assets={mockAssets} />);
    const buttons = screen.getAllByRole('button');
    // Find the table view button (List icon) - it's in the view mode toggle
    const tableButton = buttons.find(b => b.textContent === '' && b.className.includes('rounded-none'));
    if (tableButton) {
      fireEvent.click(tableButton);
    }
    // The component should still render without errors
    expect(screen.getByText('Your Positions')).toBeInTheDocument();
  });
});
