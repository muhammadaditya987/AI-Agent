'use client';

import { useQuery } from '@tanstack/react-query';
import { getReadiness } from '@/services/health-service';

export function useHealth() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: getReadiness,
    refetchInterval: 30_000,
  });
}