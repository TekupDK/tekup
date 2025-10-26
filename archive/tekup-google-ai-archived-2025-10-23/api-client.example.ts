import axios from 'axios';

// API base URL fra environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Axios instance til backend API calls
 */
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 sekunder timeout
});

/**
 * Request interceptor - tilføj authentication token
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - håndter errors globalt
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Håndter 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }

        // Log fejl i development
        if (import.meta.env.DEV) {
            console.error('API Error:', error.response?.data || error.message);
        }

        return Promise.reject(error);
    }
);

/**
 * Type-safe API call helpers
 */

// Eksempel: Hent customers
export const getCustomers = async () => {
    const response = await apiClient.get('/api/customers');
    return response.data;
};

// Eksempel: Hent bookings
export const getBookings = async () => {
    const response = await apiClient.get('/api/bookings');
    return response.data;
};

// Eksempel: Hent emails
export const getEmails = async (params?: { status?: string; limit?: number }) => {
    const response = await apiClient.get('/api/emails', { params });
    return response.data;
};

// Tilføj flere API funktioner efter behov...
