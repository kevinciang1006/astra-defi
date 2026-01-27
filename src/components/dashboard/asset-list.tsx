'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

  if (isLoading) {
    return <AssetListSkeleton />;
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No assets found in this wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets ({assets.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort('name')}
                    className="hover:text-foreground transition-colors"
                  >
                    Asset {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Chain
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Balance
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort('change')}
                    className="hover:text-foreground transition-colors"
                  >
                    24h {sortField === 'change' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort('value')}
                    className="hover:text-foreground transition-colors"
                  >
                    Value {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset, index) => (
                <AssetRow key={`${asset.chainId}-${asset.address}-${index}`} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetRow({ asset }: { asset: AssetPosition }) {
  const changeColor = getChangeColor(asset.priceChange24h);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: asset.chainColor + '33', color: asset.chainColor }}
          >
            {asset.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-foreground">{asset.symbol}</p>
            <p className="text-xs text-muted-foreground">{asset.name}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: asset.chainColor + '22', color: asset.chainColor }}
        >
          {asset.chainName}
        </span>
      </td>
      <td className="p-4 text-right">
        <span className="font-mono text-sm">
          {formatTokenBalance(asset.formattedBalance)}
        </span>
      </td>
      <td className="p-4 text-right">
        <span className="text-sm text-muted-foreground">
          {asset.priceUsd > 0 ? formatUsd(asset.priceUsd) : '--'}
        </span>
      </td>
      <td className={`p-4 text-right text-sm ${changeColor}`}>
        {formatPercent(asset.priceChange24h)}
      </td>
      <td className="p-4 text-right">
        <span className="font-medium">{formatUsd(asset.valueUsd)}</span>
      </td>
    </tr>
  );
}

function AssetListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-muted rounded mb-1" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
