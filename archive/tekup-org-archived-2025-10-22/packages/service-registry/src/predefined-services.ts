import { ExternalService } from './types.js';

/**
 * Predefined service configurations for common external services
 * These serve as templates that can be customized with actual API keys
 */
export const PREDEFINED_SERVICES: Partial<ExternalService>[] = [
  // AI Providers
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'ai-provider',
    provider: 'OpenAI',
    description: 'OpenAI GPT models and APIs',
    baseUrl: 'https://api.openai.com/v1',
    version: 'v1',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400,
      burstLimit: 10,
      retryAfterSeconds: 60
    },
    healthCheck: {
      enabled: true,
      intervalSeconds: 300,
      timeoutMs: 10000,
      endpoint: 'https://api.openai.com/v1/models',
      method: 'GET',
      expectedStatusCodes: [200],
      alertThresholds: {
        consecutiveFailures: 3,
        responseTimeMs: 5000
      }
    },
    documentation: {
      quickStartUrl: 'https://platform.openai.com/docs/quickstart',
      apiDocsUrl: 'https://platform.openai.com/docs/api-reference',
      troubleshootingUrl: 'https://help.openai.com/',
      supportUrl: 'https://help.openai.com/en/collections/3675931-openai-api'
    },
    tags: ['ai', 'nlp', 'gpt', 'language-model']
  },

  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: 'ai-provider',
    provider: 'Anthropic',
    description: 'Anthropic Claude AI models',
    baseUrl: 'https://api.anthropic.com/v1',
    version: 'v1',
    apiKeyHeader: 'x-api-key',
    apiKeyPrefix: '',
    additionalHeaders: {
      'anthropic-version': '2023-06-01'
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400,
      burstLimit: 5,
      retryAfterSeconds: 60
    },
    healthCheck: {
      enabled: true,
      intervalSeconds: 300,
      timeoutMs: 10000,
      endpoint: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      expectedStatusCodes: [200, 400], // 400 is expected without proper payload
      alertThresholds: {
        consecutiveFailures: 3,
        responseTimeMs: 5000
      }
    },
    documentation: {
      quickStartUrl: 'https://docs.anthropic.com/claude/docs/quickstart-guide',
      apiDocsUrl: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
      troubleshootingUrl: 'https://docs.anthropic.com/claude/docs/troubleshooting-errors',
      supportUrl: 'https://support.anthropic.com/'
    },
    tags: ['ai', 'nlp', 'claude', 'language-model']
  },

  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'ai-provider',
    provider: 'Google',
    description: 'Google Gemini AI models',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    version: 'v1',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400,
      burstLimit: 10,
      retryAfterSeconds: 60
    },
    healthCheck: {
      enabled: true,
      intervalSeconds: 300,
      timeoutMs: 10000,
      endpoint: 'https://generativelanguage.googleapis.com/v1/models',
      method: 'GET',
      expectedStatusCodes: [200],
      alertThresholds: {
        consecutiveFailures: 3,
        responseTimeMs: 5000
      }
    },
    documentation: {
      quickStartUrl: 'https://ai.google.dev/gemini-api/docs/quickstart',
      apiDocsUrl: 'https://ai.google.dev/gemini-api/docs',
      troubleshootingUrl: 'https://ai.google.dev/gemini-api/docs/troubleshooting',
      supportUrl: 'https://developers.google.com/support'
    },
    tags: ['ai', 'nlp', 'gemini', 'google', 'language-model']
  },

  // Payment Providers
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'payment',
    provider: 'Stripe',
    description: 'Payment processing and billing',
    baseUrl: 'https://api.stripe.com/v1',
    version: 'v1',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer',
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 6000,
      requestsPerDay: 144000,
      burstLimit: 25,
      retryAfterSeconds: 60
    },
    healthCheck: {
      enabled: true,
      intervalSeconds: 600, // 10 minutes
      timeoutMs: 10000,
      endpoint: 'https://api.stripe.com/v1/account',
      method: 'GET',
      expectedStatusCodes: [200],
      alertThresholds: {
        consecutiveFailures: 3,
        responseTimeMs: 5000
      }
    },
    documentation: {
      quickStartUrl: 'https://stripe.com/docs/quickstart',
      apiDocsUrl: 'https://stripe.com/docs/api',
      troubleshootingUrl: 'https://stripe.com/docs/troubleshooting',
      supportUrl: 'https://support.stripe.com/'
    },
    tags: ['payment', 'billing', 'subscription', 'checkout']
  }
];

/**
 * Get predefined service configuration by ID
 */
export function getPredefinedService(serviceId: string): Partial<ExternalService> | undefined {
  return PREDEFINED_SERVICES.find(service => service.id === serviceId);
}

/**
 * Get all predefined services by type
 */
export function getPredefinedServicesByType(type: string): Partial<ExternalService>[] {
  return PREDEFINED_SERVICES.filter(service => service.type === type);
}

/**
 * Get all available predefined service IDs
 */
export function getPredefinedServiceIds(): string[] {
  return PREDEFINED_SERVICES.map(service => service.id!);
}