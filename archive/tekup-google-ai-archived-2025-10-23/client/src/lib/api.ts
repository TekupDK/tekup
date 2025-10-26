import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Use centralized API configuration
export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: API_CONFIG.HEADERS,
    timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('[API] Response error:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('[API] No response received:', error.request);
            } else {
                console.error('[API] Error:', error.message);
            }
        } else {
            console.error('[API] Unknown error:', error);
        }
        return Promise.reject(error);
    }
);
