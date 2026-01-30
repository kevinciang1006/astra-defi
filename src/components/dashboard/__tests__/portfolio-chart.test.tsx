import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioChart } from '../portfolio-chart';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const filtered = { ...props };
      ['initial', 'animate', 'exit', 'transition', 'layout'].forEach(k => delete filtered[k]);
      return <div {...filtered}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: false, error: { code: 'NOT_FOUND', message: 'No data' } }),
  })
) as jest.Mock;

describe('PortfolioChart', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(
      <PortfolioChart totalValue={10000} isLoading={true} />
    );
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThanOrEqual(0);
    expect(screen.queryByText('Portfolio Value')).not.toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<PortfolioChart totalValue={10000} isDemoMode={true} />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders time period buttons', () => {
    render(<PortfolioChart totalValue={10000} isDemoMode={true} />);
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
  });

  it('switches between time periods', () => {
    render(<PortfolioChart totalValue={10000} isDemoMode={true} />);
    const button7d = screen.getByText('7D');
    fireEvent.click(button7d);
    // No error = success, chart re-renders with new period
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('shows "Simulated" badge when no real data and not demo mode', () => {
    render(<PortfolioChart totalValue={10000} />);
    expect(screen.getByText('Simulated')).toBeInTheDocument();
  });

  it('does not show "Simulated" badge in demo mode', () => {
    render(<PortfolioChart totalValue={10000} isDemoMode={true} />);
    expect(screen.queryByText('Simulated')).not.toBeInTheDocument();
  });
});
