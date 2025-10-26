import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadApi, Lead } from '../../../../../lib/api';

export interface UseLeadsState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  retry: () => void;
}

export interface UseLeadsOptions {
  tenant: string;
  initialData?: Lead[];
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

export function useLeads({
  tenant,
  initialData = [],
  autoRetry = true,
  retryDelay = 1000,
  maxRetries = 3
}: UseLeadsOptions): UseLeadsState {
  const query = useQuery<Lead[], Error>({
    queryKey: ['leads', tenant],
    queryFn: () => leadApi.getLeads(tenant),
    enabled: !!tenant,
    // hydrate with initialData if provided
    initialData: initialData.length ? initialData : undefined,
    retry: autoRetry ? maxRetries : false,
    retryDelay: (attemptIndex) => retryDelay * Math.pow(2, attemptIndex),
    // keep previous data while refetching on tenant change for smoother UX
    placeholderData: (prev) => prev,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const retry = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    leads: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error.message || 'Failed to load leads') : null,
    refetch,
    retry,
  };
}