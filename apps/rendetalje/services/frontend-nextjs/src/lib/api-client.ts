/**
 * Centralized API Client for Backend Communication
 *
 * Handles:
 * - Authentication headers
 * - Error handling
 * - Response parsing
 * - Token refresh
 */

import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requireAuth = true, headers = {}, ...fetchOptions } = options;

    // Build headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };

    // Add authentication token if required
    if (requireAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    // Make request
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle token refresh on 401
    if (response.status === 401 && requireAuth) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request with new token
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          requestHeaders["Authorization"] = `Bearer ${newToken}`;
        }
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
        });
        return this.handleResponse<T>(retryResponse);
      }
      // If refresh failed, logout user
      useAuthStore.getState().logout();
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Parse JSON response
    const data = await response.json().catch(() => ({}));

    // Handle errors
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, data);
    }

    return data as T;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return false;

      const { accessToken } = await response.json();
      useAuthStore.getState().setToken(accessToken);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    organizationId: string;
    phone?: string;
    role?: string;
  }) {
    return this.request<{ user: User; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      requireAuth: false,
    });
  }

  async getProfile() {
    return this.request<User>("/auth/profile", {
      method: "GET",
    });
  }

  async updateProfile(data: Partial<User>) {
    return this.request<User>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Jobs endpoints
  async getJobs(params?: {
    status?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.customerId) queryParams.append("customerId", params.customerId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    return this.request<Job[]>(`/jobs${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  }

  async getJob(id: string) {
    return this.request<Job>(`/jobs/${id}`, {
      method: "GET",
    });
  }

  async createJob(data: Partial<Job>) {
    return this.request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: Partial<Job>) {
    return this.request<Job>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id: string) {
    return this.request<void>(`/jobs/${id}`, {
      method: "DELETE",
    });
  }

  // Customers endpoints
  async getCustomers(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    return this.request<Customer[]>(`/customers${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  }

  async getCustomer(id: string) {
    return this.request<Customer>(`/customers/${id}`, {
      method: "GET",
    });
  }

  async createCustomer(data: Partial<Customer>) {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    return this.request<Customer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<void>(`/customers/${id}`, {
      method: "DELETE",
    });
  }

  // AI Friday endpoints
  async sendFridayMessage(data: {
    message: string;
    sessionId?: string;
    context: {
      userRole: string;
      organizationId: string;
      currentPage?: string;
      selectedJobId?: string;
      selectedCustomerId?: string;
      recentActions?: string[];
    };
  }) {
    return this.request<{
      sessionId: string;
      response: {
        message: string;
        actions?: Array<{
          type: 'navigate' | 'create' | 'update' | 'search' | 'call_function';
          payload: any;
        }>;
        suggestions?: string[];
        data?: any;
      };
    }>("/api/v1/ai-friday/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFridaySessions(limit?: number) {
    const query = limit ? `?limit=${limit}` : "";
    return this.request<any[]>(`/api/v1/ai-friday/sessions${query}`, {
      method: "GET",
    });
  }

  async getFridaySession(sessionId: string) {
    return this.request<{
      session: any;
      messages: any[];
    }>(`/api/v1/ai-friday/sessions/${sessionId}`, {
      method: "GET",
    });
  }

  async deleteFridaySession(sessionId: string) {
    return this.request<void>(`/api/v1/ai-friday/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }
}

// Types (should match backend)
export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Job {
  id: string;
  organization_id: string;
  customer_id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_hours?: number;
  actual_hours?: number;
  assigned_to?: string[];
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  cvr?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
