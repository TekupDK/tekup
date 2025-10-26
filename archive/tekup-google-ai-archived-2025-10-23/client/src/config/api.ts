/**
 * Centralized API Configuration
 * 
 * Single source of truth for all API URLs and endpoints.
 * Prevents hardcoded URLs scattered across the codebase.
 * 
 * Usage:
 * ```ts
 * import { API_CONFIG } from '@/config/api';
 * const response = await fetch(`${API_CONFIG.BASE_URL}/customers`);
 * ```
 */

/**
 * Get API base URL from environment or use proxy fallback
 * 
 * In development: Uses Vite proxy (/api → http://localhost:3000)
 * In production: Uses VITE_API_URL from .env (https://api.renos.dk)
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If explicit URL is set, use it
  if (envUrl) {
    return envUrl;
  }
  
  // In development, use proxy (Vite will proxy /api to backend)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production fallback (should never happen if .env is configured)
  console.warn('⚠️ VITE_API_URL not set! Using production fallback.');
  return 'https://api.renos.dk';
};

/**
 * API Configuration Object
 * 
 * Contains all API-related configuration in one place.
 * Update BASE_URL here instead of in 17+ different files!
 */
export const API_CONFIG = {
  /**
   * Base URL for all API requests
   * Examples:
   * - Development: '/api' (proxied by Vite to localhost:3000)
   * - Production: 'https://api.renos.dk'
   */
  BASE_URL: getApiBaseUrl(),
  
  /**
   * Full endpoint paths
   * Use these for consistency across the app
   */
  ENDPOINTS: {
    // Dashboard
    DASHBOARD: {
      STATS: '/api/dashboard/stats/overview',
      CACHE: '/api/dashboard/cache/stats',
      LEADS_RECENT: '/api/dashboard/leads/recent',
      BOOKINGS_UPCOMING: '/api/dashboard/bookings/upcoming',
      REVENUE: '/api/dashboard/revenue',
      SERVICES: '/api/dashboard/services',
      CONFLICTS: '/api/dashboard/conflicts',
    },
    
    // Resources
    CUSTOMERS: '/api/customers',
    LEADS: '/api/leads',
    BOOKINGS: '/api/bookings',
    QUOTES: '/api/quotes',
    
    // AI & Chat
    CHAT: '/api/chat',
    
    // Email
    EMAIL_RESPONSES: '/api/email-responses',
    
    // Health
    HEALTH: '/api/health',
  },
  
  /**
   * Request timeout in milliseconds
   */
  TIMEOUT: 10000,
  
  /**
   * Default headers for API requests
   */
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * Helper function to build full API URL
 * 
 * @param path - API path (e.g., '/customers' or 'customers')
 * @returns Full URL (e.g., 'https://api.renos.dk/api/customers')
 * 
 * @example
 * buildApiUrl('/customers') // 'https://api.renos.dk/api/customers'
 * buildApiUrl('customers')  // 'https://api.renos.dk/api/customers'
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If BASE_URL is just '/api', use it as-is (proxy mode)
  if (baseUrl === '/api') {
    return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  }
  
  // If BASE_URL is full URL, append path
  return `${baseUrl}${cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`}`;
};

/**
 * Type-safe API URL builder
 * Ensures endpoints are valid and prevents typos
 */
export const getEndpointUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS | string): string => {
  if (typeof endpoint === 'string' && endpoint in API_CONFIG.ENDPOINTS) {
    return buildApiUrl(API_CONFIG.ENDPOINTS[endpoint as keyof typeof API_CONFIG.ENDPOINTS] as string);
  }
  return buildApiUrl(endpoint);
};
