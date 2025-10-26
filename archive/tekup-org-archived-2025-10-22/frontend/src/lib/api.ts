import axios, { AxiosError, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Generic API functions
export const apiClient = {
  get: <T>(url: string, params?: any): Promise<T> =>
    api.get(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: any): Promise<T> =>
    api.post(url, data).then((res) => res.data),

  put: <T>(url: string, data?: any): Promise<T> =>
    api.put(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: any): Promise<T> =>
    api.patch(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<T> =>
    api.delete(url).then((res) => res.data),
};

// Error handling utility
export function handleApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// File upload utility
export async function uploadFile(file: File, endpoint: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}