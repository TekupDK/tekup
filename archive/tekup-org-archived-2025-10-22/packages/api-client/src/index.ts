export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  tenantId?: string;
}

export interface LeadPayload {
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  [key: string]: unknown;
}

export interface Lead {
  id: string;
  tenantId: string;
  source: string;
  status: 'NEW' | 'CONTACTED';
  payload?: LeadPayload;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  source: string;
  payload: LeadPayload;
}

export interface VoiceCommandRequest {
  command: string;
  parameters?: Record<string, unknown>;
  tenantId: string;
}

export interface VoiceCommandResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  tenant: string;
  timestamp: string;
}

export interface Meta {
  total: number;
  limit: number;
  offset: number;
}

export interface TenantInfo {
    id: string;
    name: string;
    [key: string]: unknown;
}

export interface Metrics {
    [key: string]: unknown;
}

export const createApiClient = (config: ApiClientConfig) => {
  const { baseUrl, apiKey, tenantId } = config;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['x-tenant-key'] = apiKey;
  }
  
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  const makeRequest = async <T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  return {
    // Health & Status
    getHealth: async () => {
      return makeRequest('/metrics');
    },

    // Lead Management
    createLead: async (data: CreateLeadRequest): Promise<Lead> => {
      return makeRequest('/ingest/form', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getLeads: async (params?: {
      status?: string;
      limit?: number;
      source?: string;
      search?: string;
      createdAfter?: string;
      createdBefore?: string;
    }): Promise<{ data: Lead[]; meta: Meta }> => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return makeRequest(endpoint);
    },

    getLead: async (id: string): Promise<Lead> => {
      return makeRequest(`/leads/${id}`);
    },

    updateLeadStatus: async (id: string, status: 'CONTACTED'): Promise<Lead> => {
      return makeRequest(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    // Voice Commands
    executeVoiceCommand: async (command: VoiceCommandRequest): Promise<VoiceCommandResponse> => {
      return makeRequest('/voice/execute', {
        method: 'POST',
        body: JSON.stringify(command),
      });
    },

    // Tenant Management
    getTenantInfo: async (): Promise<TenantInfo> => {
      return makeRequest('/tenant/info');
    },

    // Metrics
    getMetrics: async (): Promise<Metrics> => {
      return makeRequest('/metrics');
    },
  };
};

// Convenience function for creating client with default config
export const createFlowApiClient = (baseUrl: string = 'http://localhost:4000') => {
  return createApiClient({ baseUrl });
};
