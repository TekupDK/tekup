'use client';

import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { environment, getDashboardConfig } from '../utils/environment';

export interface DashboardMetrics {
  newLeads: number;
  conversionRate: number;
  aiScore: number;
  liveStatus: 'OK' | 'WARNING' | 'ERROR';
  uptime: string;
  trends: {
    newLeads: { value: number; direction: 'up' | 'down' };
    conversionRate: { value: number; direction: 'up' | 'down' };
    aiScore: { value: number; direction: 'up' | 'down' };
  };
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  source: string;
  status: 'hot' | 'warm' | 'cold';
  lastContact?: string;
  value?: number;
  urgency?: 'high' | 'medium' | 'low';
  keywords?: string[];
  phone?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  leads: Lead[];
  lastUpdated: Date;
  sources: { name: string; count: number; percentage: number; growth: number }[];
  activities: { id: string; type: 'email_received' | 'meeting_booked' | 'lead_scored'; title: string; description: string; timestamp: Date; priority: 'high' | 'medium' | 'low'; leadId: string }[];
}

export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const config = getDashboardConfig();

  // Check if user is authenticated (real user) to override mock data setting
  const isRealUserLoggedIn = () => {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('tekup_user');
    const token = localStorage.getItem('tekup_access_token');
    return !!(user && token);
  };

  // Always use real data if a real user is logged in, otherwise respect config
  const shouldUseMockData = config.useMockData && !isRealUserLoggedIn();

  console.log('📊 Dashboard Data Config:', {
    configUseMockData: config.useMockData,
    isRealUserLoggedIn: isRealUserLoggedIn(),
    shouldUseMockData,
    environment: environment.isDevelopment ? 'development' : 'production'
  });

  const fetchDashboardData = async () => {
    try {
      if (shouldUseMockData) {
        // Development mock data - Updated with real Tekup metrics
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData: DashboardData = {
          metrics: {
            newLeads: 28,  // Real count from Gmail integration
            conversionRate: 3.6, // Realistic business conversion rate
            aiScore: 78,  // Average AI score from email analysis
            liveStatus: 'OK',
            uptime: '99.9%',
            trends: {
              newLeads: { value: 15, direction: 'up' },
              conversionRate: { value: 0.3, direction: 'up' },
              aiScore: { value: 2, direction: 'up' }
            }
          },
          leads: [
            {
              id: '1',
              name: 'Caja og Torben',
              company: 'Privat bolig - Aarhus',
              email: 'caja.torben@gmail.com',
              score: 95,
              source: 'Leadpoint.dk',
              status: 'hot',
              lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              value: 12500,
              urgency: 'high',
              keywords: ['akut', 'hurtig', 'budget klar'],
              phone: '23 45 67 89'
            },
            {
              id: '2',
              name: 'Emil Houmann',
              company: 'Houmann Consulting ApS',
              email: 'emil@houmannconsulting.dk',
              score: 87,
              source: 'Leadmail.no',
              status: 'warm',
              lastContact: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              value: 25000,
              urgency: 'medium',
              keywords: ['kontor', 'ugentlig', 'professionel'],
              phone: '87 65 43 21'
            },
            {
              id: '3',
              name: 'Natascha Kring',
              company: 'Kring & Partners',
              email: 'natascha@kringpartners.dk',
              score: 95,
              source: 'Leadpoint.dk',
              status: 'hot',
              lastContact: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              value: 18750,
              urgency: 'high',
              keywords: ['i dag', 'akut behov', 'fast aftale'],
              phone: '42 18 75 93'
            }
          ],
          sources: [
            { name: 'Leadpoint.dk (Rengøring Aarhus)', count: 15, percentage: 54, growth: 12 },
            { name: 'Leadmail.no (Rengøring.nu)', count: 13, percentage: 46, growth: 8 }
          ],
          activities: [
            {
              id: '1',
              type: 'email_received',
              title: 'Ny forespørgsel fra Natascha Kring',
              description: 'Akut rengøringsbehov - kræver svar i dag',
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              priority: 'high',
              leadId: '3'
            },
            {
              id: '2',
              type: 'meeting_booked',
              title: 'Demo booket med Caja og Torben',
              description: 'Besigtigelse planlagt til i morgen kl. 14:00',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              priority: 'high',
              leadId: '1'
            }
          ],
          lastUpdated: new Date()
        };
        
        setMetrics(mockData.metrics);
        setLeads(mockData.leads);
        setLastUpdated(mockData.lastUpdated);
      } else {
        // Production API calls to Tekup-org backend
        const [metricsResponse, leadsResponse, activitiesResponse] = await Promise.all([
          get(config.apiEndpoints.dashboard),
          get(config.apiEndpoints.contacts + '?status=new&created_after=today'),
          get(config.apiEndpoints.activities + '?limit=10')
        ]);
        
        // Transform API response to match our interface
        const metrics: DashboardMetrics = {
          newLeads: metricsResponse.data?.newLeads || 0,
          conversionRate: metricsResponse.data?.conversionRate || 0,
          aiScore: metricsResponse.data?.aiScore || 0,
          liveStatus: metricsResponse.data?.systemStatus === 'OK' ? 'OK' : 'WARNING',
          uptime: metricsResponse.data?.uptime || '99.9%',
          trends: metricsResponse.data?.trends || {
            newLeads: { value: 0, direction: 'up' },
            conversionRate: { value: 0, direction: 'up' },
            aiScore: { value: 0, direction: 'up' }
          }
        };

        // Transform leads data
        const leads: Lead[] = leadsResponse.data?.map((lead: any) => ({
          id: lead.id,
          name: lead.name,
          company: lead.company || 'Unknown',
          email: lead.email,
          score: lead.aiScore || 0,
          source: lead.source || 'Unknown',
          status: lead.score >= 90 ? 'hot' : lead.score >= 70 ? 'warm' : 'cold',
          lastContact: lead.lastContact,
          value: lead.estimatedValue,
          urgency: lead.urgency,
          keywords: lead.keywords,
          phone: lead.phone
        })) || [];

        setMetrics(metrics);
        setLeads(leads);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Don't fallback to mock data in production, show error instead
      if (config.useMockData) {
        // Minimal fallback for development
        setMetrics({
          newLeads: 0,
          conversionRate: 0,
          aiScore: 0,
          liveStatus: 'ERROR',
          uptime: '0%',
          trends: {
            newLeads: { value: 0, direction: 'down' },
            conversionRate: { value: 0, direction: 'down' },
            aiScore: { value: 0, direction: 'down' }
          }
        });
        setLeads([]);
        setLastUpdated(new Date());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh specific metric
  const refreshMetric = async (metricName: keyof DashboardMetrics) => {
    if (!metrics) return;
    
    try {
      const response = await get(`/api/analytics/metrics/${metricName}`);
      
      setMetrics(prev => prev ? {
        ...prev,
        [metricName]: response.data?.value || prev[metricName]
      } : null);
    } catch (err) {
      console.error('Error refreshing metric:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up refresh interval using config
    const interval = setInterval(fetchDashboardData, config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [config.refreshInterval]);

  return {
    metrics,
    leads,
    isLoading,
    lastUpdated,
    refresh: fetchDashboardData,
    refreshMetric
  };
};

// Hook for individual metric
export const useMetric = (metricName: keyof DashboardMetrics) => {
  const { metrics, isLoading, refreshMetric } = useDashboardData();
  
  return {
    value: metrics?.[metricName],
    isLoading,
    refresh: () => refreshMetric(metricName)
  };
};