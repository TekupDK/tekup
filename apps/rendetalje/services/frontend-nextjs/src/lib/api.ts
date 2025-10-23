import { DashboardKPIs, RevenueData, TeamLocation, Job, Customer, TeamMember } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Dashboard & Analytics
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    return this.request<DashboardKPIs>('/api/v1/dashboard/kpis')
  }

  async getRevenueData(period: '7d' | '30d' | '90d' = '30d'): Promise<RevenueData[]> {
    return this.request<RevenueData[]>(`/api/v1/dashboard/revenue?period=${period}`)
  }

  async getTeamLocations(): Promise<TeamLocation[]> {
    return this.request<TeamLocation[]>('/api/v1/dashboard/team-locations')
  }

  // Jobs
  async getJobs(params?: {
    status?: string
    date?: string
    customer_id?: string
    limit?: number
    offset?: number
  }): Promise<{ jobs: Job[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    return this.request<{ jobs: Job[]; total: number }>(
      `/api/v1/jobs?${searchParams.toString()}`
    )
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/api/v1/jobs/${id}`)
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    return this.request<Job>('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
  }

  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    return this.request<Job>(`/api/v1/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(jobData),
    })
  }

  async deleteJob(id: string): Promise<void> {
    return this.request<void>(`/api/v1/jobs/${id}`, {
      method: 'DELETE',
    })
  }

  // Customers
  async getCustomers(params?: {
    search?: string
    city?: string
    is_active?: boolean
    min_satisfaction?: number
    min_jobs?: number
    min_revenue?: number
    page?: number
    limit?: number
  }): Promise<{ data: Customer[]; total: number; totalPages: number }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    return this.request<{ data: Customer[]; total: number; totalPages: number }>(
      `/customers?${searchParams.toString()}`
    )
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`)
  }

  async getCustomerHistory(id: string): Promise<any> {
    return this.request<any>(`/customers/${id}/history`)
  }

  async getCustomerMessages(id: string, jobId?: string): Promise<any[]> {
    const params = jobId ? `?job_id=${jobId}` : ''
    return this.request<any[]>(`/customers/${id}/messages${params}`)
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData),
    })
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    })
  }

  async getCustomerAnalytics(timeRange: string = '30d'): Promise<any> {
    return this.request<any>(`/customers/analytics?timeRange=${timeRange}`)
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>('/api/v1/team')
  }

  async getTeamMember(id: string): Promise<TeamMember> {
    return this.request<TeamMember>(`/api/v1/team/${id}`)
  }

  async createTeamMember(memberData: Partial<TeamMember>): Promise<TeamMember> {
    return this.request<TeamMember>('/api/v1/team', {
      method: 'POST',
      body: JSON.stringify(memberData),
    })
  }

  async updateTeamMember(id: string, memberData: Partial<TeamMember>): Promise<TeamMember> {
    return this.request<TeamMember>(`/api/v1/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(memberData),
    })
  }

  async deleteTeamMember(id: string): Promise<void> {
    return this.request<void>(`/api/v1/team/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Simple API object for components that expect this interface
export const api = {
  get: async (endpoint: string, config?: { params?: any }) => {
    const searchParams = new URLSearchParams()
    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const url = searchParams.toString() ? `${endpoint}?${searchParams.toString()}` : endpoint
    return { data: await apiClient.request(url) }
  },
  
  post: async (endpoint: string, data?: any) => {
    return { data: await apiClient.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }) }
  },
  
  put: async (endpoint: string, data?: any) => {
    return { data: await apiClient.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }) }
  },
  
  patch: async (endpoint: string, data?: any) => {
    return { data: await apiClient.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }) }
  },
  
  delete: async (endpoint: string) => {
    return { data: await apiClient.request(endpoint, {
      method: 'DELETE',
    }) }
  }
}