import { useState } from 'react';
import useSWR, { SWRConfiguration, mutate } from 'swr';
import { apiClient } from '../utils/api-client';
import { useAuth } from './useAuth';

// Custom fetcher that uses our API client
const fetcher = async (url: string) => {
  try {
    return await apiClient.get(url);
  } catch (error: any) {
    // Handle auth errors
    if (error.status === 401) {
      // Token expired, try to refresh or logout
      console.error('Authentication error:', error);
      throw error;
    }
    throw error;
  }
};

// Generic API hook with SWR
export function useApiData<T>(
  endpoint: string | null, 
  options?: SWRConfiguration
) {
  const { isAuthenticated } = useAuth();
  
  const { data, error, mutate: refresh, isLoading } = useSWR(
    isAuthenticated && endpoint ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    data: data as T,
    error,
    isLoading: isLoading && isAuthenticated,
    refresh,
    mutate: refresh,
  };
}

// Basic API methods for direct calls
export function useApi() {
  const { isAuthenticated } = useAuth();

  const get = async (url: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return await apiClient.get(url);
  };

  const post = async (url: string, data?: any) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return await apiClient.post(url, data);
  };

  const put = async (url: string, data?: any) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return await apiClient.put(url, data);
  };

  const del = async (url: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return await apiClient.delete(url);
  };

  return { get, post, put, delete: del };
}

// Dashboard stats hook
export function useDashboardStats() {
  return useApiData('/dashboard/stats', {
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

// Real-time stats hook
export function useRealtimeStats() {
  return useApiData('/dashboard/realtime', {
    refreshInterval: 5000, // Refresh every 5 seconds
  });
}

// New dashboard analytics hooks matching the integration plan
export function useDashboardAnalytics() {
  return useApiData('/api/analytics/dashboard', {
    refreshInterval: 30000,
  });
}

export function useTopLeads(limit = 10) {
  return useApiData(`/api/contacts/top-leads?limit=${limit}`, {
    refreshInterval: 60000,
  });
}

export function useAIScore() {
  return useApiData('/api/analytics/ai-score', {
    refreshInterval: 300000, // Refresh every 5 minutes
  });
}

export function useConversionRate(period = '30d') {
  return useApiData(`/api/deals/conversion-rate?period=${period}`, {
    refreshInterval: 300000,
  });
}

export function useSystemHealth() {
  return useApiData('/api/health', {
    refreshInterval: 60000,
  });
}