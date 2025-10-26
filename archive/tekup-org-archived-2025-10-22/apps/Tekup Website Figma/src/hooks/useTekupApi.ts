'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getApiUrl } from '../utils/environment';

// Tekup-specific API client for production integration
export interface TekupAPIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface GmailDashboardMetrics {
  newLeads: number;
  conversionRate: number;
  aiScore: number;
  systemStatus: 'OK' | 'WARNING' | 'ERROR';
  uptime: string;
  trends: {
    newLeads: { value: number; direction: 'up' | 'down' };
    conversionRate: { value: number; direction: 'up' | 'down' };
    aiScore: { value: number; direction: 'up' | 'down' };
  };
  sources: Array<{
    name: string;
    count: number;
    percentage: number;
    growth: number;
  }>;
  topLeads: Array<{
    id: string;
    name: string;
    score: number;
    status: 'hot' | 'warm' | 'cold';
  }>;
  lastUpdated: string;
}

export interface TekupContact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  source: string;
  status: 'new' | 'qualified' | 'contacted' | 'converted';
  aiScore: number;
  estimatedValue?: number;
  keywords?: string[];
  lastContact?: string;
  createdAt: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface TekupActivity {
  id: string;
  type: 'email_received' | 'meeting_booked' | 'lead_scored' | 'contact_made';
  title: string;
  description: string;
  contactId: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

export const useTekupApi = () => {
  const { getToken } = useAuth();

  const apiCall = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TekupAPIResponse<T>> => {
    const token = await getToken();
    
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const get = <T = any>(endpoint: string): Promise<TekupAPIResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'GET' });
  };

  const post = <T = any>(endpoint: string, data: any): Promise<TekupAPIResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const put = <T = any>(endpoint: string, data: any): Promise<TekupAPIResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const del = <T = any>(endpoint: string): Promise<TekupAPIResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'DELETE' });
  };

  return { get, post, put, del };
};

// Hook for Gmail Dashboard Live Data
export const useGmailDashboard = () => {
  const [data, setData] = useState<GmailDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useTekupApi();

  const fetchGmailDashboard = async () => {
    try {
      setError(null);
      const response = await get<GmailDashboardMetrics>('/api/analytics/gmail-dashboard/live');
      setData(response.data);
    } catch (err) {
      console.error('Gmail dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Gmail dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGmailDashboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchGmailDashboard, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: fetchGmailDashboard,
  };
};

// Hook for New Contacts/Leads
export const useNewContacts = (filters: { status?: string; createdAfter?: string } = {}) => {
  const [contacts, setContacts] = useState<TekupContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useTekupApi();

  const fetchContacts = async () => {
    try {
      setError(null);
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.createdAfter) queryParams.append('created_after', filters.createdAfter);
      
      const response = await get<TekupContact[]>(`/api/contacts?${queryParams.toString()}`);
      setContacts(response.data);
    } catch (err) {
      console.error('Contacts fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filters.status, filters.createdAfter]);

  return {
    contacts,
    isLoading,
    error,
    refresh: fetchContacts,
  };
};

// Hook for Conversion Rate
export const useConversionRate = () => {
  const [data, setData] = useState<{ rate: number; trend: 'up' | 'down'; change: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useTekupApi();

  const fetchConversionRate = async () => {
    try {
      setError(null);
      const response = await get<{ rate: number; trend: 'up' | 'down'; change: number }>('/api/deals/conversion-rate');
      setData(response.data);
    } catch (err) {
      console.error('Conversion rate fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversion rate');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionRate();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchConversionRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: fetchConversionRate,
  };
};

// Hook for Recent Activities
export const useRecentActivities = (limit: number = 10) => {
  const [activities, setActivities] = useState<TekupActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useTekupApi();

  const fetchActivities = async () => {
    try {
      setError(null);
      const response = await get<TekupActivity[]>(`/api/activities/recent?limit=${limit}`);
      setActivities(response.data);
    } catch (err) {
      console.error('Activities fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchActivities, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [limit]);

  return {
    activities,
    isLoading,
    error,
    refresh: fetchActivities,
  };
};

// Lead Scoring Hook
export const useLeadScoring = (contactId: string) => {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { post } = useTekupApi();

  const calculateScore = async (emailContent?: string) => {
    if (!contactId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await post<{ score: number; factors: string[] }>('/api/analytics/calculate-lead-score', {
        contactId,
        emailContent,
      });
      
      setScore(response.data.score);
    } catch (err) {
      console.error('Lead scoring error:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate lead score');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    score,
    isLoading,
    error,
    calculateScore,
  };
};

// Calendar Integration Hook
export const useCalendarBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useTekupApi();

  const fetchBookings = async () => {
    try {
      setError(null);
      const response = await get<any[]>('/api/calendar/bookings/recent');
      setBookings(response.data);
    } catch (err) {
      console.error('Calendar bookings fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchBookings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    bookings,
    isLoading,
    error,
    refresh: fetchBookings,
  };
};