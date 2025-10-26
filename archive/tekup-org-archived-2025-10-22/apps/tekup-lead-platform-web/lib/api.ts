// Lead Platform API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  score?: number;
  qualifiedAt?: string;
  convertedAt?: string;
  conversionType?: string;
  notes?: string;
  customData: Record<string, any>;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadQualification {
  id: string;
  criteria: string;
  result: string;
  score?: number;
  notes?: string;
  leadId: string;
  createdAt: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class LeadPlatformAPI {
  private getHeaders(tenantId: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { tenantId: string }
  ): Promise<ApiResponse<T>> {
    const { tenantId, ...requestOptions } = options;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...requestOptions,
        headers: {
          ...this.getHeaders(tenantId),
          ...requestOptions.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 500,
      };
    }
  }

  // Lead CRUD operations
  async listLeads(
    tenantId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      source?: string;
    }
  ): Promise<ApiResponse<{ leads: Lead[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);

    const queryString = queryParams.toString();
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;

    return this.request<{ leads: Lead[]; total: number; page: number; limit: number }>(
      endpoint,
      { method: 'GET', tenantId }
    );
  }

  async getLead(tenantId: string, id: string): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'GET',
      tenantId,
    });
  }

  async createLead(tenantId: string, data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>('/leads', {
      method: 'POST',
      tenantId,
      body: JSON.stringify(data),
    });
  }

  async updateLead(
    tenantId: string,
    id: string,
    data: Partial<Lead>
  ): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      tenantId,
      body: JSON.stringify(data),
    });
  }

  async deleteLead(tenantId: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/leads/${id}`, {
      method: 'DELETE',
      tenantId,
    });
  }

  // Lead qualification operations
  async qualifyLead(
    tenantId: string,
    id: string,
    data: { criteria: string; result: string; score?: number; notes?: string }
  ): Promise<ApiResponse<LeadQualification>> {
    return this.request<LeadQualification>(`/leads/${id}/qualify`, {
      method: 'POST',
      tenantId,
      body: JSON.stringify(data),
    });
  }

  async getLeadQualifications(
    tenantId: string,
    id: string
  ): Promise<ApiResponse<LeadQualification[]>> {
    return this.request<LeadQualification[]>(`/leads/${id}/qualifications`, {
      method: 'GET',
      tenantId,
    });
  }

  // Lead scoring
  async calculateLeadScore(
    tenantId: string,
    id: string
  ): Promise<ApiResponse<{ leadId: string; score: number; factors: Record<string, any> }>> {
    return this.request<{ leadId: string; score: number; factors: Record<string, any> }>(
      `/leads/${id}/score`,
      {
        method: 'POST',
        tenantId,
      }
    );
  }

  // Lead conversion
  async convertLead(
    tenantId: string,
    id: string,
    data: { conversionType: string; notes?: string }
  ): Promise<ApiResponse<{ lead: Lead; customerId?: string; message: string }>> {
    return this.request<{ lead: Lead; customerId?: string; message: string }>(
      `/leads/${id}/convert`,
      {
        method: 'POST',
        tenantId,
        body: JSON.stringify(data),
      }
    );
  }

  // Analytics endpoints
  async getConversionAnalytics(
    tenantId: string,
    period: string = '30d'
  ): Promise<ApiResponse<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    conversionsBySource: Record<string, number>;
    conversionTrend: Array<{ date: string; conversions: number }>;
  }>> {
    return this.request<{
      totalLeads: number;
      convertedLeads: number;
      conversionRate: number;
      conversionsBySource: Record<string, number>;
      conversionTrend: Array<{ date: string; conversions: number }>;
    }>(`/leads/analytics/conversion?period=${period}`, {
      method: 'GET',
      tenantId,
    });
  }

  async getSourceAnalytics(
    tenantId: string,
    period: string = '30d'
  ): Promise<ApiResponse<{
    sourcePerformance: Array<{
      source: string;
      totalLeads: number;
      qualifiedLeads: number;
      convertedLeads: number;
      averageScore: number;
    }>;
  }>> {
    return this.request<{
      sourcePerformance: Array<{
        source: string;
        totalLeads: number;
        qualifiedLeads: number;
        convertedLeads: number;
        averageScore: number;
      }>;
    }>(`/leads/analytics/sources?period=${period}`, {
      method: 'GET',
      tenantId,
    });
  }

  async getPipelineAnalytics(
    tenantId: string
  ): Promise<ApiResponse<{
    pipeline: Record<string, number>;
    totalValue: number;
    averageScore: number;
  }>> {
    return this.request<{
      pipeline: Record<string, number>;
      totalValue: number;
      averageScore: number;
    }>('/leads/analytics/pipeline', {
      method: 'GET',
      tenantId,
    });
  }
}

// Export singleton instance
export const leadAPI = new LeadPlatformAPI();
export type { Lead, LeadQualification };
