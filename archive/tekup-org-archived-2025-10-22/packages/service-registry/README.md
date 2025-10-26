# TekUp Service Registry

Enterprise-grade service registry and monitoring system for managing external API integrations in the TekUp.org platform.

## 🚀 Features

- **Service Management**: Centralized registration and configuration of external services
- **Health Monitoring**: Real-time health checks with automated incident detection
- **API Key Management**: Secure storage and rotation of API credentials
- **Web Dashboard**: Visual monitoring interface with live updates
- **Incident Response**: Automated escalation and notification system
- **Performance Metrics**: Response times, error rates, and availability tracking
- **Multi-Environment**: Support for development, staging, and production environments

## 📦 Installation

```bash
npm install @tekup/service-registry
# or
pnpm add @tekup/service-registry
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

// Create registry
const registry = new ServiceRegistry({
  monitoring: {
    enabled: true,
    dashboardEnabled: true
  }
});

// Register a service
await registry.registerService({
  id: 'openai',
  name: 'OpenAI API',
  type: 'ai',
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  enabled: true,
  healthCheck: {
    enabled: true,
    endpoint: '/models',
    intervalMs: 30000
  }
});

// Start monitoring
await registry.startAllMonitoring({
  dashboardPort: 3001
});

console.log('Dashboard: http://localhost:3001');
```

### Environment-Based Setup

```typescript
import { createServiceRegistryFromEnv } from '@tekup/service-registry';

// Automatically load from environment variables
const registry = await createServiceRegistryFromEnv();
await registry.startAllMonitoring();
```

## 🔧 Core Components

### ServiceRegistry

Main class for managing external service integrations:

```typescript
const registry = new ServiceRegistry(config);

// Service management
await registry.registerService(serviceConfig);
await registry.updateService(serviceId, updates);
await registry.removeService(serviceId);

// Health monitoring
const health = await registry.getServiceHealth(serviceId);
const allHealth = await registry.getAllServiceHealth();

// Testing
const result = await registry.testService(serviceId);
```

### HealthMonitor

Automated health checking system:

```typescript
// Access through registry
const healthMonitor = registry.healthMonitor;

// Manual health check
const health = await healthMonitor.checkServiceHealth(serviceId);

// Start/stop monitoring
await healthMonitor.start();
await healthMonitor.stop();
```

### ServiceDashboard

Web-based monitoring interface:

```typescript
// Start dashboard
await registry.startDashboard(3001);

// Access at http://localhost:3001
// API endpoints:
// - GET /api/health - System health summary
// - GET /api/services - All services with health
// - GET /api/stats - Registry statistics
```

### IncidentResponseSystem

Automated incident detection and response:

```typescript
const incidents = registry.getIncidentResponse();

// Manual incident creation
const incident = await incidents.createIncident(
  'openai',
  'high',
  'API experiencing high latency'
);

// Custom escalation rules
incidents.addEscalationRule({
  name: 'Critical Alert',
  condition: async (incident) => incident.severity === 'critical',
  action: async (incident) => {
    await sendSlackAlert(incident);
    await createPagerDutyIncident(incident);
  }
});
```

## 📊 Supported Services

### AI Services
- **OpenAI**: GPT models, embeddings, completions
- **Anthropic**: Claude models and chat completions
- **Google Gemini**: Gemini Pro and vision models

### Payment Services
- **Stripe**: Payment processing, subscriptions, customers

### Communication Services
- **ConvertKit**: Email marketing and automation
- **SendGrid**: Transactional email delivery
- **Twilio**: SMS and voice communications

### Business Services
- **HubSpot**: CRM and marketing automation
- **Plausible**: Privacy-focused analytics

## 🔐 Security Features

### API Key Management

```typescript
// Secure API key storage
await registry.registerService({
  id: 'stripe',
  apiKey: process.env.STRIPE_SECRET_KEY, // Stored securely
  // ... other config
});

// API key rotation
const result = await registry.rotateAPIKey('stripe', newApiKey);

// Masked display
const config = registry.getServiceConfig('stripe', true); // API key masked
```

### Environment Isolation

```typescript
// Different configurations per environment
await registry.registerService({
  id: 'openai',
  environment: 'production',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_PROD_KEY
});

await registry.registerService({
  id: 'openai-dev',
  environment: 'development',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_DEV_KEY
});
```

## 📈 Monitoring & Alerting

### Health Checks

```typescript
// Configure health checks
await registry.registerService({
  id: 'api-service',
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    method: 'GET',
    intervalMs: 30000,      // Check every 30 seconds
    timeoutMs: 10000,       // 10 second timeout
    expectedStatusCodes: [200, 201],
    retries: 3,
    headers: {
      'X-Health-Check': 'true'
    }
  }
});
```

### Incident Management

```typescript
// Get incident statistics
const stats = incidents.getIncidentStats();
console.log(`Total incidents: ${stats.total}`);
console.log(`MTTR: ${stats.mttr}ms`);

// Filter incidents
const criticalIncidents = incidents.getIncidents({
  severity: 'critical',
  status: 'open'
});
```

### Webhook Notifications

```typescript
await registry.startIncidentResponse({
  webhookUrl: 'https://your-webhook.com/alerts',
  webhookHeaders: {
    'Authorization': 'Bearer your-token'
  },
  emailConfig: {
    recipients: ['admin@company.com']
  }
});
```

## 🛠️ Configuration

### Service Configuration

```typescript
interface ServiceConfig {
  id: string;                    // Unique service identifier
  name: string;                  // Display name
  type: ServiceType;             // Service category
  provider: string;              // Service provider
  baseUrl: string;               // API base URL
  apiKey: string;                // API key/token
  apiKeyHeader?: string;         // Header name for API key
  apiKeyPrefix?: string;         // Prefix for API key (e.g., 'Bearer')
  enabled: boolean;              // Enable/disable service
  environment: string;           // Environment (dev/staging/prod)
  rateLimit?: RateLimit;         // Rate limiting configuration
  retryPolicy?: RetryPolicy;     // Retry configuration
  healthCheck?: HealthCheck;     // Health check settings
  additionalHeaders?: Record<string, string>;
  metadata?: Record<string, any>;
}
```

### Registry Configuration

```typescript
interface ServiceRegistryConfig {
  monitoring: {
    enabled: boolean;
    dashboardEnabled: boolean;
    metricsRetentionDays: number;
    healthCheckDefaults?: Partial<HealthCheck>;
  };
  services: ServiceConfig[];
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- service-registry.test.ts
```

### Test Service

```typescript
// Test service connectivity
const result = await registry.testService('openai');
console.log(`Test ${result.success ? 'passed' : 'failed'}`);
console.log(`Response time: ${result.duration}ms`);
```

## 📚 Examples

### Complete Setup Example

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

async function setupMonitoring() {
  const registry = new ServiceRegistry({
    monitoring: {
      enabled: true,
      dashboardEnabled: true,
      metricsRetentionDays: 30
    }
  });

  // Register OpenAI
  await registry.registerService({
    id: 'openai',
    name: 'OpenAI API',
    type: 'ai',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    enabled: true,
    environment: 'production',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    },
    retryPolicy: {
      maxRetries: 3,
      baseDelayMs: 1000,
      backoffMultiplier: 2
    },
    healthCheck: {
      enabled: true,
      endpoint: '/models',
      intervalMs: 30000,
      timeoutMs: 10000,
      expectedStatusCodes: [200]
    }
  });

  // Register Stripe
  await registry.registerService({
    id: 'stripe',
    name: 'Stripe Payments',
    type: 'payment',
    provider: 'stripe',
    baseUrl: 'https://api.stripe.com/v1',
    apiKey: process.env.STRIPE_SECRET_KEY,
    enabled: true,
    environment: 'production',
    healthCheck: {
      enabled: true,
      endpoint: '/account',
      intervalMs: 60000
    }
  });

  // Start all monitoring
  await registry.startAllMonitoring({
    dashboardPort: 3001,
    incidentConfig: {
      webhookUrl: process.env.WEBHOOK_URL,
      emailConfig: {
        recipients: ['admin@company.com']
      }
    }
  });

  console.log('✅ Monitoring started');
  console.log('📊 Dashboard: http://localhost:3001');
  
  return registry;
}

setupMonitoring().catch(console.error);
```

### Custom Integration Example

```typescript
// Register custom service
await registry.registerService({
  id: 'custom-api',
  name: 'Custom Internal API',
  type: 'api',
  provider: 'internal',
  baseUrl: 'https://internal-api.company.com',
  apiKey: 'internal-api-key',
  enabled: true,
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    method: 'POST',
    headers: {
      'X-Health-Check': 'monitoring'
    },
    body: {
      source: 'service-registry'
    }
  }
});

// Add custom escalation
const incidents = registry.getIncidentResponse();
incidents.addEscalationRule({
  name: 'Custom API Critical',
  condition: async (incident) => {
    return incident.serviceId === 'custom-api' && 
           incident.severity === 'critical';
  },
  action: async (incident) => {
    // Custom notification logic
    await notifyTeam('platform', incident);
    await createJiraTicket(incident);
  }
});
```

## 🚀 Demo

Run the interactive demo to see all features:

```bash
# Basic demo
node demo.js

# Monitoring demo with dashboard and incidents
node monitoring-demo.js
```

The monitoring demo includes:
- Real-time health monitoring
- Web dashboard at http://localhost:3001
- Automatic incident detection
- Webhook notifications
- Performance metrics

## 📖 Documentation

- [Integration Guides](../../docs/integration/external-services/) - Service-specific integration documentation
- [Monitoring Guide](../../docs/integration/external-services/monitoring-guide.md) - Comprehensive monitoring setup
- [SDK Patterns](../../docs/integration/external-services/sdk-patterns.md) - Best practices for SDK implementation
- [Troubleshooting](../../docs/integration/external-services/troubleshooting.md) - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides and examples
- Email: support@tekup.org

---

Built with ❤️ by the TekUp.org team