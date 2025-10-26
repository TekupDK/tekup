export async function fetchLeads(tenant: string) {
  // Use leadApi which ensures tenant header uses API key, not slug
  return leadApi.getLeads(tenant);
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TENANT_API_KEY = process.env.NEXT_PUBLIC_TENANT_API_KEY; // For dev only

export interface Lead {
  id: string;
  tenantId?: string;
  tenant_id?: string; // backend may supply either shape
  source: string;
  status: 'new' | 'contacted';
  payload?: any;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  latestEvent?: any;
}

export interface ChangeStatusRequest { status: 'contacted'; actor?: string }

class ApiError extends Error { constructor(public status: number, message: string){ super(message);} }

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, tenant?: string): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`, API_BASE_URL);
  // Tenant now resolved purely from header (API key middleware); no query param needed.
  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(TENANT_API_KEY ? { 'x-tenant-key': TENANT_API_KEY } : {}),
      ...(tenant ? { 'x-tenant-key': tenant } : {}),
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new ApiError(res.status, txt || `HTTP ${res.status}`);
  }
  return res.json();
}

function normalizeLead(lead: any): Lead {
  return {
    id: lead.id,
    tenantId: lead.tenantId || lead.tenant_id,
    source: lead.source,
    status: (lead.status || '').toLowerCase() === 'contacted' ? 'contacted' : 'new',
    payload: lead.payload,
    created_at: lead.created_at || lead.createdAt,
    updated_at: lead.updated_at || lead.updatedAt,
    latestEvent: lead.latestEvent
  };
}

export const api = {
  async getLeads(tenantKey?: string): Promise<Lead[]> { const data = await apiRequest<any[]>('/leads', {}, tenantKey); return data.map(normalizeLead); },
  async getLeadEvents(id: string, tenantKey?: string) { return apiRequest(`/leads/${id}/events`, {}, tenantKey); },
  async changeLeadStatus(id: string, data: ChangeStatusRequest, tenantKey?: string): Promise<Lead> { return normalizeLead(await apiRequest(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: data.status.toUpperCase(), actor: data.actor }) }, tenantKey)); }
};

export const leadApi = {
  async getLeads(tenant: string): Promise<Lead[]> {
    try { return await api.getLeads(getTenantKey()); } catch (e) { return mockApi.getLeads(tenant); }
  },
  async changeLeadStatus(tenant: string, id: string, data: ChangeStatusRequest): Promise<Lead> {
    try { return await api.changeLeadStatus(id, data, getTenantKey()); } catch (e) { return mockApi.changeLeadStatus(tenant, id, data); }
  },
  async getLeadEvents(_tenant: string, id: string) {
    try { return await api.getLeadEvents(id, getTenantKey()); } catch { return []; }
  }
};

export function getTenantKey(): string {
  // For local/dev, we rely on a single tenant API key.
  return TENANT_API_KEY || '';
}

// Mock fallback
export const mockApi = {
  async getLeads(tenant: string): Promise<Lead[]> {
    await new Promise(r => setTimeout(r, 150));
    return [
      { id: '1', tenant_id: tenant, source: 'form', status: 'new', created_at: new Date().toISOString() },
      { id: '2', tenant_id: tenant, source: 'imap', status: 'contacted', created_at: new Date().toISOString() },
    ];
  },
  async changeLeadStatus(tenant: string, id: string, data: ChangeStatusRequest): Promise<Lead> {
    await new Promise(r => setTimeout(r, 250));
    return { id, tenant_id: tenant, source: 'form', status: data.status, created_at: new Date().toISOString() };
  }
};
