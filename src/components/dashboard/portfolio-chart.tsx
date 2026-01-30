'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUsd } from '@/lib/utils/format';

type TimePeriod = '7d' | '30d' | '90d' | '1y';

interface PortfolioChartProps {
  totalValue: number;
  isLoading?: boolean;
}

interface ChartDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

// Generate mock historical data based on current value and time period
function generateChartData(
  currentValue: number,
  period: TimePeriod
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  const periodDays: Record<TimePeriod, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = periodDays[period];
  let value = currentValue * 0.85; // Start at 85% of current value
  const dailyGrowth = (currentValue - value) / days;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Add some realistic volatility
    const volatility = (Math.random() - 0.45) * (currentValue * 0.02);
    value = value + dailyGrowth + volatility;

    // Ensure value doesn't go negative
    value = Math.max(value, currentValue * 0.5);

    data.push({
      date: formatChartDate(date, period),
      value: Math.round(value * 100) / 100,
      timestamp: date.getTime(),
    });
  }

  // Ensure last point matches current value
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
  }

  return data;
}

function formatChartDate(date: Date, period: TimePeriod): string {
  if (period === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (period === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

export function PortfolioChart({ totalValue, isLoading }: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

  const chartData = useMemo(
    () => generateChartData(totalValue, selectedPeriod),
    [totalValue, selectedPeriod]
  );

  if (isLoading) {
    return <PortfolioChartSkeleton />;
  }

  const periods: { label: string; value: TimePeriod }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
  ];

  // Calculate percentage change for the period
  const firstValue = chartData[0]?.value ?? 0;
  const lastValue = chartData[chartData.length - 1]?.value ?? 0;
  const periodChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = periodChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Portfolio Value</CardTitle>
            <div className="flex gap-1">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                  className="px-3 py-1 h-8 text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => formatUsd(value, { compact: true })}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm text-muted-foreground">
                            {new Date(data.timestamp).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-lg font-semibold">{formatUsd(data.value)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PortfolioChartSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-10" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full mt-4" />
      </CardContent>
    </Card>
  );
}
