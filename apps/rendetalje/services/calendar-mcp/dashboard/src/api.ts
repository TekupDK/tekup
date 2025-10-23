// API configuration and types
export const API_BASE_URL = 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Booking {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  location: string;
  duration: number;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  rating: number;
  totalBookings: number;
  lastBooking: string;
  totalSpent: number;
  status: 'active' | 'vip' | 'inactive';
}

export interface SystemStats {
  totalRevenue: number;
  activeCustomers: number;
  monthlyBookings: number;
  averageTime: number;
}

// API functions
export const api = {
  // Health check
  async health(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Bookings
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bookings`);
    return response.json();
  },

  async createBooking(booking: Partial<Booking>): Promise<ApiResponse<Booking>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    return response.json();
  },

  async updateBooking(id: string, booking: Partial<Booking>): Promise<ApiResponse<Booking>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    return response.json();
  },

  async deleteBooking(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Customers
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers`);
    return response.json();
  },

  async createCustomer(customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return response.json();
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return response.json();
  },

  // Analytics
  async getStats(): Promise<ApiResponse<SystemStats>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/stats`);
    return response.json();
  },

  async getRevenueChart(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/revenue`);
    return response.json();
  },

  async getBookingsChart(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/bookings`);
    return response.json();
  },

  // MCP Tools
  async getTools(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/tools`);
    return response.json();
  },

  async executeTool(toolName: string, input: any): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  },

  // System
  async getSystemStatus(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/status`);
    return response.json();
  },

  async getLogs(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/logs`);
    return response.json();
  }
};

export default api;