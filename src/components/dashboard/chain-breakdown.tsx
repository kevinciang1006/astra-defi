'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Network, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Chain Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data to display</p>
          </div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Chain Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <motion.div
              className="w-48 h-48 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
            >
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
                    animationBegin={300}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as (typeof chartData)[0];
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
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
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{formatUsd(totalValue)}</p>
                </div>
              </div>
            </motion.div>

            <div className="flex-1 space-y-3 w-full">
              {chartData.map((chain, index) => (
                <motion.div
                  key={chain.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full transition-all group-hover:scale-125"
                      style={{
                        backgroundColor: chain.color,
                        boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${chain.color}40`,
                      }}
                    />
                    <span className="text-sm font-medium">{chain.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{formatUsd(chain.value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({chain.percent.toFixed(1)}%)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChainBreakdownSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Chain Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <Skeleton className="w-48 h-48 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
