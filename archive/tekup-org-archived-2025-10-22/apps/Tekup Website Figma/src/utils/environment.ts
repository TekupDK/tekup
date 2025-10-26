/**
 * Environment Configuration for Tekup Platform
 * Manages the switch between development/mock data and production API
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  useRealAPI: boolean;
  apiBaseUrl: string;
  mockDataEnabled: boolean;
  features: {
    gmailIntegration: boolean;
    calendarIntegration: boolean;
    leadScoring: boolean;
    realTimeUpdates: boolean;
  };
}

// Next.js environment variable access - works in both browser and server
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Next.js injects NEXT_PUBLIC_ variables into process.env at build time
  // This works in both browser and server environments
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || fallback;
  }
  
  // Additional fallback for edge cases
  if (typeof window !== 'undefined') {
    // Try to get from window if somehow injected there
    const windowEnv = (window as any).env || (window as any).__ENV__;
    if (windowEnv && windowEnv[key]) {
      return windowEnv[key];
    }
  }
  
  return fallback;
};

// Environment variables with fallbacks
const NODE_ENV = getEnvVar('NODE_ENV', 'development');
const USE_REAL_API = getEnvVar('NEXT_PUBLIC_USE_REAL_API', 'true') === 'true'; // Default to true for production readiness
const API_URL = getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
const GMAIL_INTEGRATION = getEnvVar('NEXT_PUBLIC_GMAIL_INTEGRATION', 'true') === 'true'; // Default to true
const CALENDAR_INTEGRATION = getEnvVar('NEXT_PUBLIC_CALENDAR_INTEGRATION', 'true') === 'true'; // Default to true

export const environment: EnvironmentConfig = {
  isDevelopment: NODE_ENV === 'development',
  useRealAPI: USE_REAL_API,
  apiBaseUrl: API_URL,
  mockDataEnabled: NODE_ENV === 'development' && !USE_REAL_API,
  features: {
    gmailIntegration: GMAIL_INTEGRATION,
    calendarIntegration: CALENDAR_INTEGRATION,
    leadScoring: true, // Always enabled
    realTimeUpdates: true, // Always enabled
  },
};

/**
 * Get API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  // For development with mock server, use Supabase functions
  if (environment.isDevelopment && !environment.useRealAPI) {
    return `https://{projectId}.supabase.co/functions/v1/make-server-68ad12b6${endpoint}`;
  }
  
  // For production or real API, use configured base URL
  return `${environment.apiBaseUrl}${endpoint}`;
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return environment.features[feature];
};

/**
 * Get configuration for dashboard data source
 */
export const getDashboardConfig = () => {
  return {
    useMockData: environment.mockDataEnabled,
    refreshInterval: environment.isDevelopment ? 30000 : 15000, // 30s dev, 15s prod
    enableRealTimeUpdates: environment.features.realTimeUpdates,
    apiEndpoints: {
      dashboard: getApiUrl('/api/analytics/gmail-dashboard/live'),
      contacts: getApiUrl('/api/contacts'),
      conversionRate: getApiUrl('/api/deals/conversion-rate'),
      activities: getApiUrl('/api/activities/recent'),
      leadScoring: getApiUrl('/api/analytics/calculate-lead-score'),
    },
  };
};

/**
 * Production readiness check
 */
export const getProductionReadiness = () => {
  const checks = {
    apiConfigured: !!environment.apiBaseUrl, // Check if API URL is configured (including fallback)
    authConfigured: getEnvVar('NEXT_PUBLIC_USE_REAL_API', 'true') === 'true',
    gmailEnabled: environment.features.gmailIntegration,
    calendarEnabled: environment.features.calendarIntegration,
    production: environment.useRealAPI, // Check if using real API instead of NODE_ENV
  };

  const ready = Object.values(checks).every(check => check);

  return {
    ready,
    checks,
    issues: Object.entries(checks)
      .filter(([_, isReady]) => !isReady)
      .map(([check, _]) => `${check} is not configured`),
  };
};

/**
 * Environment info for debugging
 */
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: NODE_ENV,
    isDevelopment: environment.isDevelopment,
    useRealAPI: environment.useRealAPI,
    apiBaseUrl: environment.apiBaseUrl,
    mockDataEnabled: environment.mockDataEnabled,
    features: environment.features,
    timestamp: new Date().toISOString(),
  };
};

// Log environment info in development - but only once
if (environment.isDevelopment && typeof window !== 'undefined' && !window.__TEKUP_ENV_LOGGED__) {
  console.group('🔧 Tekup Environment Configuration');
  console.table(getEnvironmentInfo());
  
  const readiness = getProductionReadiness();
  if (!readiness.ready) {
    console.warn('⚠️ Production readiness issues:', readiness.issues);
    console.group('🔍 Environment Details');
    console.log('API Base URL:', environment.apiBaseUrl);
    console.log('Use Real API:', environment.useRealAPI);
    console.log('Mock Data Enabled:', environment.mockDataEnabled);
    console.log('Features:', environment.features);
    console.groupEnd();
  } else {
    console.log('✅ Production ready - using real API data');
  }
  
  // Performance monitoring in development
  if (environment.isDevelopment) {
    console.group('📊 Performance Monitoring');
    console.log('Page Load Time:', window.performance?.timing ? 
      `${window.performance.timing.loadEventEnd - window.performance.timing.navigationStart}ms` : 
      'Not available');
    console.log('DOM Content Loaded:', window.performance?.timing ? 
      `${window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart}ms` : 
      'Not available');
    console.groupEnd();
  }
  
  console.groupEnd();
  (window as any).__TEKUP_ENV_LOGGED__ = true;
}