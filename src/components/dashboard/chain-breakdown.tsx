'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatUsd } from '@/lib/utils/format';
import type { ChainSummary } from '@/lib/services';

interface ChainBreakdownProps {
  chainSummaries: ChainSummary[];
  isLoading?: boolean;
}

export function ChainBreakdown({ chainSummaries, isLoading }: ChainBreakdownProps) {
  if (isLoading) {
    return <ChainBreakdownSkeleton />;
  }

  if (chainSummaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chain Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No data to display
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = chainSummaries.reduce((sum, c) => sum + c.totalValueUsd, 0);

  const chartData = chainSummaries.map((chain) => ({
    name: chain.chainName,
    value: chain.totalValueUsd,
    color: chain.chainColor,
    percent: totalValue > 0 ? (chain.totalValueUsd / totalValue) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chain Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatUsd(data.value)} ({data.percent.toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3">
            {chartData.map((chain) => (
              <div key={chain.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chain.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {chain.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">
                    {formatUsd(chain.value)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({chain.percent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChainBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chain Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6 animate-pulse">
          <div className="w-48 h-48 bg-muted rounded-full" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted rounded-full" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
