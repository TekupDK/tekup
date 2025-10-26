// Main exports
export { ServiceRegistry } from './service-registry.js';
export { HealthMonitor } from './health-monitor.js';
export { APIKeyManager } from './api-key-manager.js';
export { ServiceDashboard } from './dashboard.js';
export { IncidentResponseSystem } from './incident-response.js';

// Import for internal use
import { ServiceRegistry } from './service-registry.js';
import { getPredefinedService } from './predefined-services.js';

// Type exports
export type {
  ServiceType,
  RateLimit,
  RetryPolicy,
  HealthCheck,
  ServiceStatus,
  ServiceHealth,
  ExternalService,
  ServiceRegistryConfig,
  APIKeyRotationResult,
  ServiceOperationResult
} from './types.js';

// Schema exports for validation
export {
  ServiceType as ServiceTypeSchema,
  RateLimitSchema,
  RetryPolicySchema,
  HealthCheckSchema,
  ServiceStatus as ServiceStatusSchema,
  ServiceHealthSchema,
  ExternalServiceSchema,
  ServiceRegistryConfigSchema,
  APIKeyRotationResultSchema,
  ServiceOperationResultSchema
} from './types.js';

// Predefined services
export {
  PREDEFINED_SERVICES,
  getPredefinedService,
  getPredefinedServicesByType,
  getPredefinedServiceIds
} from './predefined-services.js';

// Utility function to create a service registry with common services
export async function createServiceRegistryWithDefaults(config?: {
  apiKeys?: Record<string, string>;
  environment?: 'development' | 'staging' | 'production';
  enabledServices?: string[];
}) {
  const registry = new ServiceRegistry({
    monitoring: {
      enabled: true,
      dashboardEnabled: true,
      metricsRetentionDays: 30
    }
  });

  // Register common services if API keys are provided
  if (config?.apiKeys) {
    const { apiKeys, environment = 'development', enabledServices } = config;

    for (const [serviceId, apiKey] of Object.entries(apiKeys)) {
      if (apiKey && (!enabledServices || enabledServices.includes(serviceId))) {
        const predefinedService = getPredefinedService(serviceId);
        if (predefinedService) {
          await registry.registerService({
            ...predefinedService,
            apiKey,
            environment,
            enabled: true
          });
        }
      }
    }
  }

  return registry;
}

// Utility function to load service registry from environment variables
export async function createServiceRegistryFromEnv() {
  const apiKeys: Record<string, string> = {};
  
  // Map environment variables to service IDs
  const envMapping: Record<string, string> = {
    'OPENAI_API_KEY': 'openai',
    'ANTHROPIC_API_KEY': 'anthropic',
    'CLAUDE_API_KEY': 'anthropic', // Alternative for Anthropic
    'GEMINI_API_KEY': 'gemini',
    'STRIPE_SECRET_KEY': 'stripe',
    'CONVERTKIT_API_KEY': 'convertkit',
    'SENDGRID_API_KEY': 'sendgrid',
    'HUBSPOT_API_KEY': 'hubspot',
    'PLAUSIBLE_API_KEY': 'plausible',
    'TWILIO_AUTH_TOKEN': 'twilio'
  };

  // Extract API keys from environment
  for (const [envVar, serviceId] of Object.entries(envMapping)) {
    const apiKey = process.env[envVar];
    if (apiKey) {
      apiKeys[serviceId] = apiKey;
    }
  }

  const environment = (process.env.NODE_ENV as any) || 'development';

  return createServiceRegistryWithDefaults({
    apiKeys,
    environment
  });
}