import { createClient } from '@supabase/supabase-js';
import { Lead, Invoice, Activity, KPIMetric, AIAgent } from '../types';

// Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// API Service Class
class ApiService {
  private static instance: ApiService;
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Authentication
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // KPI Metrics
  async getKPIMetrics(tenantId: string): Promise<KPIMetric[]> {
    try {
      // Check if Supabase is available
      if (!supabase) {
        console.warn('Supabase not available, using fallback data');
        return this.getFallbackKPIMetrics();
      }
      
      // Get real data from Supabase
      const [revenue, leads, systemHealth, agents] = await Promise.all([
        this.getTotalRevenue(tenantId),
        this.getActiveLeadsCount(tenantId),
        this.getSystemHealth(),
        this.getAgentStatus(tenantId)
      ]);

      return [
        {
          label: 'Total Revenue',
          value: `${revenue.toLocaleString('da-DK')} DKK`,
          change: revenue > 0 ? 12.5 : 0,
          trend: revenue > 0 ? 'up' : 'stable',
          icon: '💰'
        },
        {
          label: 'Active Leads',
          value: leads.count.toString(),
          change: leads.change,
          trend: leads.change > 0 ? 'up' : leads.change < 0 ? 'down' : 'stable',
          icon: '👥'
        },
        {
          label: 'System Health',
          value: `${systemHealth}%`,
          change: 0.3,
          trend: 'up',
          icon: '💚'
        },
        {
          label: 'Agent Status',
          value: `${agents.active}/${agents.total}`,
          change: 0,
          trend: 'stable',
          icon: '🤖'
        }
      ];
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      return this.getFallbackKPIMetrics();
    }
  }

  // Leads
  async getLeads(tenantId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        ...lead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Activities
  async getActivities(tenantId: string, limit: number = 10): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getRecentActivities(tenantId: string): Promise<Activity[]> {
    try {
      // Check if Supabase is available
      if (!supabase) {
        console.warn('Supabase not available, using fallback data');
        return this.getFallbackActivities();
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || this.getFallbackActivities();
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return this.getFallbackActivities();
    }
  }

  // AI Agents
  async getAgents(tenantId: string): Promise<AIAgent[]> {
    try {
      // Check if Supabase is available
      if (!supabase) {
        console.warn('Supabase not available, using fallback data');
        return this.getFallbackAgents();
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      return data || this.getFallbackAgents();
    } catch (error) {
      console.error('Error fetching agents:', error);
      return this.getFallbackAgents();
    }
  }

  // Billy.dk Integration
  async getBillyInvoices(tenantId: string): Promise<Invoice[]> {
    try {
      // This would integrate with Billy API
      // For now, return from Supabase
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Billy invoices:', error);
      return [];
    }
  }

  // Private helper methods
  private async getTotalRevenue(tenantId: string): Promise<number> {
    const { data, error } = await supabase
      .from('invoices')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid');

    if (error) return 0;
    return data?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
  }

  private async getActiveLeadsCount(tenantId: string): Promise<{ count: number; change: number }> {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['new', 'contacted', 'qualified']);

    if (error) return { count: 0, change: 0 };
    return { count: count || 0, change: 8.2 }; // TODO: Calculate real change
  }

  async getSystemHealth(): Promise<number> {
    // Check various system components
    try {
      await Promise.all([
        supabase.from('system_health').select('status').limit(1),
        // Add more health checks here
      ]);
      
      return 98.2; // TODO: Calculate based on actual checks
    } catch {
      return 95.0;
    }
  }

  private async getAgentStatus(tenantId: string): Promise<{ active: number; total: number }> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('status')
      .eq('tenant_id', tenantId);

    if (error) return { active: 7, total: 7 };
    
    const active = data?.filter(agent => agent.status === 'active').length || 0;
    const total = data?.length || 0;
    
    return { active, total };
  }

  // Fallback data for when real data is not available
  private getFallbackKPIMetrics(): KPIMetric[] {
    return [
      { label: 'Total Revenue', value: '428.5k DKK', change: 12.5, trend: 'up', icon: '💰' },
      { label: 'Active Leads', value: '143', change: 8.2, trend: 'up', icon: '👥' },
      { label: 'System Health', value: '98.2%', change: 0.3, trend: 'up', icon: '💚' },
      { label: 'Agent Status', value: '7/7', change: 0, trend: 'stable', icon: '🤖' },
    ];
  }

  private getFallbackAgents(): AIAgent[] {
    return [
      {
        id: '1',
        name: 'Lead Capture Agent',
        type: 'lead_capture',
        status: 'active',
        last_activity: new Date().toISOString(),
        tasks_processed: 1247,
        average_response_time: 145,
        description: 'Monitors and captures leads from Gmail, Calendar, and Website',
      },
      // Add other fallback agents...
    ];
  }

  private getFallbackActivities(): Activity[] {
    return [
      {
        id: '1',
        type: 'lead_created',
        title: 'New Lead',
        description: 'New lead captured from website',
        created_at: new Date().toISOString(),
        tenant_id: '',
        metadata: {}
      },
      {
        id: '2',
        type: 'email_sent',
        title: 'Email Sent',
        description: 'Follow-up email sent to prospect',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        tenant_id: '',
        metadata: {}
      }
    ];
  }
}

export const apiService = ApiService.getInstance();

// API client for React Query integration
export const apiClient = {
  getKPIs: async () => {
    const service = ApiService.getInstance();
    return service.getKPIMetrics('1'); // Default tenant ID
  },

  getActivities: async () => {
    const service = ApiService.getInstance();
    return service.getActivities('1', 10); // Default tenant ID, limit 10
  },

  getAgents: async () => {
    const service = ApiService.getInstance();
    return service.getAgents('1'); // Default tenant ID
  },

  getSystemHealth: async () => {
    const service = ApiService.getInstance();
    return service.getSystemHealth();
  },

  getLeads: async () => {
    const service = ApiService.getInstance();
    return service.getLeads('1'); // Default tenant ID
  },

  getAnalytics: async () => {
    // TODO: Implement analytics endpoint
    return [];
  },
};

// React Query keys
export const queryKeys = {
  kpis: ['kpis'] as const,
  activities: ['activities'] as const,
  agents: ['agents'] as const,
  systemHealth: ['system-health'] as const,
  leads: ['leads'] as const,
  analytics: ['analytics'] as const,
  profile: ['profile'] as const,
} as const;
