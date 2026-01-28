'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Coins } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  formatUsd,
  formatPercent,
  formatTokenBalance,
  getChangeColor,
} from '@/lib/utils/format';
import type { AssetPosition } from '@/lib/services';

interface AssetListProps {
  assets: AssetPosition[];
  isLoading?: boolean;
}

type SortField = 'value' | 'name' | 'change';
type SortDirection = 'asc' | 'desc';

export function AssetList({ assets, isLoading }: AssetListProps) {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'value':
        return (a.valueUsd - b.valueUsd) * multiplier;
      case 'name':
        return a.symbol.localeCompare(b.symbol) * multiplier;
      case 'change':
        const aChange = a.priceChange24h ?? 0;
        const bChange = b.priceChange24h ?? 0;
        return (aChange - bChange) * multiplier;
      default:
        return 0;
    }
  });

const getSortIcon = (
    field: SortField,
    currentSortField: SortField,
    direction: SortDirection
  ) => {
    if (currentSortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  if (isLoading) {
    return <AssetListSkeleton />;
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assets found in this wallet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Assets
            <Badge variant="secondary" className="ml-2">
              {assets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="-ml-3 h-8 hover:bg-transparent"
                  >
                    Asset
                    {getSortIcon('name', sortField, sortDirection)}
                  </Button>
                </TableHead>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('change')}
                    className="-mr-3 h-8 hover:bg-transparent"
                  >
                    24h
                    {getSortIcon('change', sortField, sortDirection)}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('value')}
                    className="-mr-3 h-8 hover:bg-transparent"
                  >
                    Value
                    {getSortIcon('value', sortField, sortDirection)}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {sortedAssets.map((asset, index) => (
                  <AssetRow
                    key={`${asset.chainId}-${asset.address}-${index}`}
                    asset={asset}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AssetRowProps {
  asset: AssetPosition;
  index: number;
}

function AssetRow({ asset, index }: AssetRowProps) {
  const changeColor = getChangeColor(asset.priceChange24h);
  const isPositive = (asset.priceChange24h ?? 0) >= 0;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="border-b transition-colors hover:bg-muted/50"
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: asset.chainColor + '20',
              color: asset.chainColor,
            }}
          >
            {asset.symbol.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{asset.symbol}</p>
            <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="font-normal"
          style={{
            borderColor: asset.chainColor + '50',
            backgroundColor: asset.chainColor + '10',
            color: asset.chainColor,
          }}
        >
          {asset.chainName}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatTokenBalance(asset.formattedBalance)}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {asset.priceUsd > 0 ? formatUsd(asset.priceUsd) : '--'}
      </TableCell>
      <TableCell className={`text-right text-sm font-medium ${changeColor}`}>
        <span className="flex items-center justify-end gap-1">
          {isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {formatPercent(Math.abs(asset.priceChange24h ?? 0))}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatUsd(asset.valueUsd)}
      </TableCell>
    </motion.tr>
  );
}

function AssetListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b last:border-0"
            >
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
