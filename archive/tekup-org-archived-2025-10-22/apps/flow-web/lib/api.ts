import { getApiBase, getDevTenantKey } from './config';
const API_BASE_URL = getApiBase();
const TENANT_API_KEY = getDevTenantKey(); // Dev convenience only

export interface Lead {
  id: string;
  tenantId?: string;
  tenant_id?: string; // tolerate alternative key casing
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

class ApiError extends Error { constructor(public status: number, message: string){ super(message); this.name='ApiError'; } }

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, tenant?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Prefer explicit tenant header; fall back to global dev key if present
      ...(tenant ? { 'x-tenant-key': tenant } : {}),
      ...(!tenant && TENANT_API_KEY ? { 'x-tenant-key': TENANT_API_KEY } : {}),
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

export const api = {
  getLeads(tenant?: string): Promise<Lead[]> { return apiRequest('/leads', {}, tenant); },
  changeLeadStatus(id: string, data: ChangeStatusRequest, tenant?: string): Promise<Lead> {
    return apiRequest(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }, tenant);
  },
  getLeadEvents(id: string, tenant?: string): Promise<any[]> { return apiRequest(`/leads/${id}/events`, {}, tenant); }
};

// Mock fallback (extended for offline dev + error simulation)
export const mockApi = {
  async getLeads(tenant: string): Promise<Lead[]> {
    await new Promise(r => setTimeout(r, 180));
    return [
      { id: '1', tenant_id: tenant, source: 'form', status: 'new', created_at: new Date().toISOString() },
      { id: '2', tenant_id: tenant, source: 'imap', status: 'contacted', created_at: new Date().toISOString() },
      { id: '3', tenant_id: tenant, source: 'form', status: 'new', created_at: new Date(Date.now() - 86400000).toISOString() }
    ];
  },
  async changeLeadStatus(tenant: string, id: string, data: ChangeStatusRequest): Promise<Lead> {
    await new Promise(r => setTimeout(r, 250));
    if (id === '3') throw new Error('Mock server error updating lead');
    return { id, tenant_id: tenant, source: 'form', status: data.status, created_at: new Date().toISOString() };
  },
  async getLeadEvents(_tenant: string, id: string): Promise<any[]> {
    await new Promise(r => setTimeout(r, 120));
    // Return a mock status transition if id === '1'
    if (id === '1') {
      return [
        { id: 'e1', fromStatus: 'NEW', toStatus: 'CONTACTED', createdAt: new Date().toISOString(), actor: 'system' }
      ];
    }
    return [];
  }
};

export const leadApi = {
  async getLeads(tenant: string): Promise<Lead[]> {
    try { return await api.getLeads(getTenantKey(tenant)); } catch (e) { logger.warn('Falling back to mock leads', e); return mockApi.getLeads(tenant); }
  },
  async changeLeadStatus(tenant: string, id: string, data: ChangeStatusRequest): Promise<Lead> {
    try { return await api.changeLeadStatus(id, data, getTenantKey(tenant)); } catch (e) { logger.warn('Falling back to mock changeLeadStatus', e); return mockApi.changeLeadStatus(tenant, id, data); }
  },
  async getLeadEvents(tenant: string, id: string): Promise<any[]> {
    try { return await api.getLeadEvents(id, getTenantKey(tenant)); } catch (e) { logger.warn('Falling back to mock getLeadEvents', e); return mockApi.getLeadEvents(tenant, id); }
  }
};

export function getTenantKey(_tenant?: string): string {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-web-lib-api-ts');

  // For dev/local, use a single tenant API key. In production, prefer server-side lookup.
  return TENANT_API_KEY || '';
}
