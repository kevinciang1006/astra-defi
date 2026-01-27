'use client';

import { useQuery } from '@tanstack/react-query';
import type { Portfolio } from '@/lib/services';
import type { ApiResponse } from '@/lib/api';

async function fetchPortfolio(address: string): Promise<Portfolio> {
  const response = await fetch(`/api/portfolio/${address}`);
  const data: ApiResponse<Portfolio> = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
}

export function usePortfolio(address: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => fetchPortfolio(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
}
