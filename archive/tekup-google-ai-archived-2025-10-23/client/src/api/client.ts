import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for CORS
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Clerk token dynamically
    // Note: You need to use this client within React components with useAuth hook
    // or pass token manually for server-side calls

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to signin if unauthorized
      window.location.href = '/auth/signin';
    } else if (error.response?.status === 403) {
      console.error('Forbidden: Insufficient permissions');
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Hook for authenticated API calls
export const useApiClient = () => {
  const { user, getToken } = useAuth();

  const authenticatedClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  authenticatedClient.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  authenticatedClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        window.location.href = '/auth/signin';
      }
      return Promise.reject(error);
    }
  );

  return authenticatedClient;
};

export default apiClient;
