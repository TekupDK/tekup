// API Client for Tekup Unified Platform Backend Integration
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

class TekupApiClient {
  private config: ApiConfig;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3001', // Default for development
      timeout: 10000,
      retries: 3,
      ...config
    };

    // Load token and tenant from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('tekup_token');
      this.tenantId = localStorage.getItem('tekup_tenant_id');
    }
  }

  setAuth(token: string, tenantId: string) {
    this.token = token;
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tekup_token', token);
      localStorage.setItem('tekup_tenant_id', tenantId);
    }
  }

  clearAuth() {
    this.token = null;
    this.tenantId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tekup_token');
      localStorage.removeItem('tekup_tenant_id');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          lastError = {
            message: data.message || `HTTP ${response.status}`,
            status: response.status,
            code: data.code,
            details: data.details,
          };

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw lastError;
          }

          continue; // Retry on server errors
        }

        return data;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = {
            message: 'Request timeout',
            status: 408,
          };
        } else if (error instanceof Error) {
          lastError = {
            message: error.message,
            status: 0,
          };
        } else {
          lastError = error as ApiError;
        }

        // If it's the last attempt or a client error, throw
        if (attempt === this.config.retries - 1 || (lastError.status >= 400 && lastError.status < 500)) {
          throw lastError;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError;
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, { method: 'GET' });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, { method: 'DELETE' });
    return response.data;
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async register(email: string, password: string, name: string, tenantName: string) {
    return this.post('/auth/register', { email, password, name, tenantName });
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken() {
    return this.post('/auth/refresh');
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // Tenant management
  async getTenants() {
    return this.get('/tenants');
  }

  async switchTenant(tenantId: string) {
    const response = await this.post(`/tenants/${tenantId}/switch`);
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tekup_tenant_id', tenantId);
    }
    return response;
  }

  async getTenantSettings() {
    return this.get('/tenants/settings');
  }

  async updateTenantSettings(settings: any) {
    return this.put('/tenants/settings', settings);
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRealtimeStats() {
    return this.get('/dashboard/realtime');
  }

  // CRM endpoints
  async getCrmStats() {
    return this.get('/crm/stats');
  }

  async getCustomers(page = 1, limit = 10) {
    return this.get(`/crm/customers?page=${page}&limit=${limit}`);
  }

  async getDeals(page = 1, limit = 10) {
    return this.get(`/crm/deals?page=${page}&limit=${limit}`);
  }

  async getActivities(page = 1, limit = 10) {
    return this.get(`/crm/activities?page=${page}&limit=${limit}`);
  }

  // Lead Platform endpoints
  async getLeadStats() {
    return this.get('/leads/stats');
  }

  async getLeads(page = 1, limit = 10) {
    return this.get(`/leads?page=${page}&limit=${limit}`);
  }

  async getLeadScoring() {
    return this.get('/leads/scoring');
  }

  async getConversions() {
    return this.get('/leads/conversions');
  }

  // Jarvis AI endpoints
  async getJarvisStats() {
    return this.get('/jarvis/stats');
  }

  async getAutomations() {
    return this.get('/jarvis/automations');
  }

  async getChatHistory(page = 1, limit = 20) {
    return this.get(`/jarvis/chat?page=${page}&limit=${limit}`);
  }

  async sendChatMessage(message: string) {
    return this.post('/jarvis/chat', { message });
  }

  // Analytics endpoints
  async getAnalytics(timeframe = '7d') {
    return this.get(`/analytics?timeframe=${timeframe}`);
  }

  async getReports() {
    return this.get('/analytics/reports');
  }

  async exportData(format: 'csv' | 'pdf' | 'excel') {
    const response = await fetch(`${this.config.baseUrl}/analytics/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'X-Tenant-ID': this.tenantId || '',
      },
    });
    return response.blob();
  }

  // Notifications
  async getNotifications(page = 1, limit = 10) {
    return this.get(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    return this.put('/notifications/read-all');
  }

  // User management
  async getUsers() {
    return this.get('/users');
  }

  async inviteUser(email: string, role: string) {
    return this.post('/users/invite', { email, role });
  }

  async updateUserRole(userId: string, role: string) {
    return this.put(`/users/${userId}/role`, { role });
  }

  async removeUser(userId: string) {
    return this.delete(`/users/${userId}`);
  }

  // Industry Solutions
  async getRendetaljeStats() {
    return this.get('/rendetalje/stats');
  }

  async getCleaningJobs() {
    return this.get('/rendetalje/jobs');
  }

  async getFoodTruckStats() {
    return this.get('/foodtruck/stats');
  }

  async getFoodTruckLocations() {
    return this.get('/foodtruck/locations');
  }

  async getEssenzaStats() {
    return this.get('/essenza/stats');
  }

  async getFragranceData() {
    return this.get('/essenza/fragrances');
  }

  // Mobile integration
  async getMobileStats() {
    return this.get('/mobile/stats');
  }

  async getMobileUsers() {
    return this.get('/mobile/users');
  }

  async sendPushNotification(userId: string, message: string) {
    return this.post('/mobile/push', { userId, message });
  }
}

// Create singleton instance
export const apiClient = new TekupApiClient();

// Export types for use in components
export type {
  ApiResponse,
  ApiError,
};