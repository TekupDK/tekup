/**
 * 🌐 API Client
 *
 * Axios-based API client with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Job } from '../components/JobCard';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            token,
          });

          const { token: newToken } = response.data;
          await SecureStore.setItemAsync('auth_token', newToken);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');

        // Navigate to login (handled by app)
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Netværksfejl. Tjek din internetforbindelse.',
        code: 'NETWORK_ERROR',
      });
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || 'Der opstod en fejl. Prøv igen senere.';

    return Promise.reject({
      message: errorMessage,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status,
    });
  }
);

// Export axios instance for direct use
export const apiClient = axiosInstance;

// API Endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (token: string) =>
    apiClient.post('/auth/refresh', { token }),

  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/register', data),

  resetPassword: (email: string) =>
    apiClient.post('/auth/reset-password', { email }),
};

export const jobsApi = {
  getTodaysJobs: async (userId?: string): Promise<Job[]> => {
    const response = await apiClient.get('/jobs/today', {
      params: { userId },
    });
    return response.data;
  },

  getJobById: async (jobId: string): Promise<Job> => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  updateJobStatus: (
    jobId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ) => apiClient.patch(`/jobs/${jobId}/status`, { status }),

  addJobPhoto: (jobId: string, photo: { uri: string; type: 'before' | 'after'; data?: string; timestamp?: number }) =>
    apiClient.post(`/jobs/${jobId}/photos`, photo),

  getUpcomingJobs: async (userId?: string): Promise<Job[]> => {
    const response = await apiClient.get('/jobs/upcoming', {
      params: { userId },
    });
    return response.data;
  },

  searchJobs: async (query: string): Promise<Job[]> => {
    const response = await apiClient.get('/jobs/search', {
      params: { q: query },
    });
    return response.data;
  },
};

export const timeTrackingApi = {
  startTimer: (jobId: string) =>
    apiClient.post('/time-tracking/start', { jobId }),

  stopTimer: (entryId: string) =>
    apiClient.post('/time-tracking/stop', { entryId }),

  getActiveTimer: () => apiClient.get('/time-tracking/active'),

  getTimeEntries: (jobId?: string) =>
    apiClient.get('/time-tracking/entries', { params: { jobId } }),

  syncOfflineEntries: (entries: any[]) =>
    apiClient.post('/time-tracking/sync', { entries }),
};

export const locationApi = {
  trackLocation: (data: { latitude: number; longitude: number; timestamp: number }) =>
    apiClient.post('/location/track', data),

  getRoute: (jobId: string) =>
    apiClient.get(`/location/route/${jobId}`),

  optimizeRoute: (jobIds: string[]) =>
    apiClient.post('/location/optimize-route', { jobIds }),
};

export const aiApi = {
  sendMessage: (message: string, context?: any) =>
    apiClient.post('/ai/chat', { message, context }),

  getJobSuggestions: (query: string) =>
    apiClient.get('/ai/suggestions', { params: { q: query } }),

  analyzePhoto: (photoUri: string) =>
    apiClient.post('/ai/analyze-photo', { photoUri }),
};

export const notificationsApi = {
  registerToken: (token: string) =>
    apiClient.post('/notifications/register', { token }),

  getNotifications: () => apiClient.get('/notifications'),

  markAsRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`),
};

export default {
  auth: authApi,
  jobs: jobsApi,
  timeTracking: timeTrackingApi,
  location: locationApi,
  ai: aiApi,
  notifications: notificationsApi,
};
