# @tekup/ai-integration

AI Service Integration Adapters for TekUp Ecosystem

## Overview

This package provides standardized adapters for integrating all AI services in the TekUp ecosystem with the central database, authentication system, and event bus. It ensures consistent behavior, monitoring, and management across all AI applications.

## Features

### 🔌 **Unified Integration Layer**
- Standardized adapter pattern for all AI services
- Central database integration with Prisma
- Redis caching with configurable TTL
- Event-driven architecture with type-safe events
- Comprehensive error handling and logging

### 🎯 **Service-Specific Adapters**
- **Proposal Engine**: AI proposal generation with buying signal detection
- **Content Generator**: Multi-platform content creation and optimization
- **Customer Support**: Intelligent chatbot and ticket management (planned)
- **Enhanced CRM**: AI lead scoring and automation (planned)
- **Marketing Automation**: Campaign optimization and personalization (planned)
- **Project Management**: AI project insights and optimization (planned)
- **Analytics Platform**: Predictive analytics and forecasting (planned)
- **Voice AI & Computer Vision**: Speech and image processing (planned)
- **Business Intelligence**: AI-generated reports and dashboards (planned)

### 📊 **Monitoring & Management**
- Real-time health monitoring for all services
- Aggregated metrics and performance tracking
- Automatic restart of unhealthy services
- Comprehensive logging and debugging
- Usage analytics and cost tracking

### 🛡️ **Enterprise Features**
- Multi-tenant data isolation
- Role-based permission validation
- Quota management and rate limiting
- Graceful degradation and failover
- Production-ready configuration management

## Installation

```bash
pnpm add @tekup/ai-integration
```

## Quick Start

### Basic Setup

```typescript
import { 
  TekUpAdapterFactory, 
  TekUpAdapterRegistry,
  AIServiceCategory 
} from '@tekup/ai-integration';

// Create adapter factory
const factory = new TekUpAdapterFactory();

// Create adapters
const proposalAdapter = factory.createAdapter(AIServiceCategory.PROPOSAL);
const contentAdapter = factory.createAdapter(AIServiceCategory.CONTENT);

// Initialize registry
const registry = new TekUpAdapterRegistry();
registry.register(proposalAdapter);
registry.register(contentAdapter);

// Start all services
await registry.initializeAll();
await registry.startAll();
```

### Environment-Based Setup

```typescript
// Create adapters from environment variables
const adapters = factory.createAdaptersFromEnv();

// Register all adapters
adapters.forEach(adapter => registry.register(adapter));

// Start services
await registry.startAll();
```

### Custom Configuration

```typescript
const customConfig = {
  database: {
    poolSize: 20,
    timeout: 45000
  },
  cache: {
    enabled: true,
    ttl: 7200
  },
  ai: {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    maxTokens: 8000,
    temperature: 0.3
  },
  limits: {
    maxRequestsPerMinute: 100,
    maxRequestsPerDay: 2000,
    maxTokensPerRequest: 8000
  }
};

const adapter = factory.createAdapter(AIServiceCategory.PROPOSAL, customConfig);
```

## Adapter Usage

### Proposal Engine Example

```typescript
import { ProposalEngineAdapter, AIServiceCategory } from '@tekup/ai-integration';

// Create adapter
const proposalAdapter = new ProposalEngineAdapter({
  ai: {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    maxTokens: 8000
  }
});

// Initialize and start
await proposalAdapter.initialize();
await proposalAdapter.start();

// Process request
const context = {
  tenantContext: { tenantId: 'tenant-123', userId: 'user-456' },
  requestId: 'req-789',
  timestamp: new Date()
};

const operation = {
  operation: 'generate',
  input: {
    transcript: 'Sales call transcript...',
    clientName: 'Acme Corp',
    projectType: 'ai-automation'
  }
};

const result = await proposalAdapter.processRequest(context, operation);
console.log('Proposal generated:', result.data.proposalId);
```

### Content Generator Example

```typescript
import { ContentGeneratorAdapter } from '@tekup/ai-integration';

const contentAdapter = new ContentGeneratorAdapter();
await contentAdapter.initialize();
await contentAdapter.start();

// Generate blog post
const blogOperation = {
  operation: 'generate',
  input: {
    contentType: 'blog',
    topic: 'AI in Business Automation',
    keywords: ['artificial intelligence', 'automation', 'efficiency'],
    targetLength: 1500,
    audience: 'business professionals'
  }
};

const blogResult = await contentAdapter.processRequest(context, blogOperation);
console.log('Blog post generated:', blogResult.data.title);

// Generate social media content
const socialOperation = {
  operation: 'generate',
  input: {
    contentType: 'social',
    topic: 'AI Innovation',
    platform: 'linkedin',
    tone: 'professional'
  }
};

const socialResult = await contentAdapter.processRequest(context, socialOperation);
console.log('Social content:', socialResult.data.content);
```

## Registry Management

### Health Monitoring

```typescript
// Check overall health
const isHealthy = registry.isHealthy();
console.log('All services healthy:', isHealthy);

// Get detailed health status
const healthStatus = await registry.getHealthStatus();
console.log('Health overview:', {
  overall: healthStatus.overall,
  healthy: healthStatus.healthyAdapters,
  total: healthStatus.totalAdapters
});

// Get unhealthy services
const unhealthyAdapters = registry.getUnhealthyAdapters();
if (unhealthyAdapters.length > 0) {
  console.log('Unhealthy services:', unhealthyAdapters.map(a => a.category));
}
```

### Metrics and Analytics

```typescript
// Get aggregated metrics
const metrics = await registry.getAggregatedMetrics();
console.log('System metrics:', {
  totalRequests: metrics.totalRequests,
  successRate: (metrics.totalSuccessful / metrics.totalRequests) * 100,
  avgResponseTime: metrics.averageResponseTime,
  totalCost: metrics.totalAICost
});

// Get service capabilities
const capabilities = registry.getCapabilitiesSummary();
console.log('Available services:', capabilities.totalServices);
console.log('Total endpoints:', capabilities.totalEndpoints);
console.log('Supported formats:', capabilities.supportedFormats);
```

### Service Management

```typescript
// Restart specific service
await registry.restartAdapter(AIServiceCategory.PROPOSAL);

// Find services by capability
const servicesWithAnalytics = registry.findAdaptersByCapability('analytics');
console.log('Services with analytics:', servicesWithAnalytics.length);

// Check if service is supported
const isSupported = registry.isServiceSupported(AIServiceCategory.CONTENT);
console.log('Content service available:', isSupported);

// Get registry statistics
const stats = registry.getStatistics();
console.log('Registry stats:', {
  enabled: stats.enabledAdapters,
  running: stats.runningAdapters,
  uptime: stats.uptime
});
```

## Configuration

### Environment Variables

```bash
# Global configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/tekup
REDIS_URL=redis://localhost:6379
AI_PROVIDER=gemini
AI_API_KEY=your-api-key

# Service-specific configuration
PROPOSAL_ENABLED=true
PROPOSAL_AI_MAX_TOKENS=8000
PROPOSAL_CACHE_TTL=3600
PROPOSAL_MAX_REQUESTS_PER_MINUTE=50

CONTENT_ENABLED=true
CONTENT_AI_TEMPERATURE=0.7
CONTENT_CACHE_TTL=7200
CONTENT_MAX_REQUESTS_PER_DAY=800

# Enable services
ENABLED_AI_SERVICES=proposal,content,support,crm
```

### Configuration Schema

```typescript
interface AIServiceConfig {
  serviceName: string;
  serviceCategory: AIServiceCategory;
  version: string;
  enabled: boolean;
  database: {
    connectionString?: string;
    poolSize?: number;
    timeout?: number;
  };
  cache: {
    enabled: boolean;
    ttl?: number;
    keyPrefix?: string;
  };
  events: {
    enabled: boolean;
    publishEvents: string[];
    subscribeEvents: string[];
  };
  ai: {
    provider: 'openai' | 'gemini' | 'claude' | 'custom';
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
  limits: {
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
    maxTokensPerRequest: number;
  };
}
```

## Implementing New Adapters

### Step 1: Create Adapter Class

```typescript
import { BaseAIServiceAdapter } from '@tekup/ai-integration';
import { AIServiceCategory } from '@tekup/sso';

export class MyServiceAdapter extends BaseAIServiceAdapter {
  constructor(config?: Partial<AIServiceConfig>) {
    const defaultConfig = {
      serviceName: 'my-ai-service',
      serviceCategory: AIServiceCategory.CUSTOM,
      // ... other config
    };
    super({ ...defaultConfig, ...config });
  }

  getCapabilities(): ServiceCapabilities {
    return {
      endpoints: ['/my-service/endpoint'],
      features: ['feature1', 'feature2'],
      supportedFormats: ['json', 'text'],
      batchProcessing: true,
      realTimeProcessing: true,
      asyncProcessing: false
    };
  }

  protected async validateServiceRequest(context, data): Promise<boolean> {
    // Implement validation logic
    return true;
  }

  protected async processAIRequest(context, operation): Promise<any> {
    // Implement AI processing logic
    switch (operation.operation) {
      case 'process':
        return await this.processData(operation.input);
      default:
        throw new Error(`Unsupported operation: ${operation.operation}`);
    }
  }

  private async processData(input: any): Promise<any> {
    // Your AI processing logic here
    return { result: 'processed' };
  }
}
```

### Step 2: Register in Factory

```typescript
// In adapter-factory.ts
case AIServiceCategory.CUSTOM:
  return new MyServiceAdapter(config);
```

### Step 3: Export from Index

```typescript
// In adapters/index.ts
export { MyServiceAdapter } from './my-service-adapter.js';
```

## Database Integration

All adapters automatically integrate with the central PostgreSQL database using Prisma:

```typescript
// Create record
const record = await this.executeDatabase({
  operation: 'create',
  table: 'aiContent',
  data: {
    tenantId: context.tenantContext.tenantId,
    userId: context.tenantContext.userId,
    content: generatedContent,
    metadata: { timestamp: new Date() }
  }
});

// Query records
const records = await this.executeDatabase({
  operation: 'read',
  table: 'aiContent',
  conditions: { tenantId: 'tenant-123' },
  options: { take: 10, orderBy: { createdAt: 'desc' } }
});
```

## Event Integration

Adapters can publish and subscribe to events:

```typescript
// Publish event
await this.executeEvent({
  operation: 'publish',
  eventType: 'content.generated',
  data: { contentId: '123', type: 'blog' },
  metadata: { tenantId: 'tenant-123', userId: 'user-456' }
});

// Subscribe to events
await this.executeEvent({
  operation: 'subscribe',
  eventType: 'lead.created',
  metadata: {
    handler: async (event) => {
      console.log('New lead created:', event.data.leadId);
    }
  }
});
```

## Caching

Built-in Redis caching for improved performance:

```typescript
// Cache result
await this.executeCache({
  operation: 'set',
  key: 'proposal:client-123',
  value: proposalData,
  ttl: 3600
});

// Get cached result
const cached = await this.executeCache({
  operation: 'get',
  key: 'proposal:client-123'
});

if (cached) {
  return { ...cached, fromCache: true };
}
```

## Error Handling

Comprehensive error handling with logging:

```typescript
try {
  const result = await adapter.processRequest(context, operation);
  return result;
} catch (error) {
  logger.error('Request failed:', error);
  
  if (error.code === 'QUOTA_EXCEEDED') {
    return { error: 'Service quota exceeded', retryAfter: 3600 };
  }
  
  throw error;
}
```

## Monitoring and Alerting

Built-in monitoring with health checks:

```typescript
// Get service health
const health = await adapter.checkHealth();
if (health.status !== 'healthy') {
  console.warn('Service degraded:', health.status);
  
  if (health.errorRate > 0.8) {
    await adapter.restart();
  }
}

// Get performance metrics
const metrics = await adapter.getMetrics();
console.log('Performance:', {
  avgResponseTime: metrics.performance.averageResponseTime,
  errorRate: metrics.performance.errorRate,
  uptime: metrics.performance.uptime
});
```

## Testing

```typescript
import { ProposalEngineAdapter } from '@tekup/ai-integration';

describe('ProposalEngineAdapter', () => {
  let adapter: ProposalEngineAdapter;

  beforeEach(async () => {
    adapter = new ProposalEngineAdapter({
      database: { connectionString: 'sqlite::memory:' },
      cache: { enabled: false },
      events: { enabled: false }
    });
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('should generate proposal', async () => {
    const context = createTestContext();
    const operation = {
      operation: 'generate',
      input: { transcript: 'test', clientName: 'Test Corp' }
    };

    const result = await adapter.processRequest(context, operation);
    expect(result.success).toBe(true);
    expect(result.data.proposalId).toBeDefined();
  });
});
```

## Production Deployment

### Docker Configuration

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tekup-ai-integration
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tekup-ai-integration
  template:
    metadata:
      labels:
        app: tekup-ai-integration
    spec:
      containers:
      - name: ai-integration
        image: tekup/ai-integration:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: tekup-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: tekup-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "300m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Contributing

1. Implement new adapter extending `BaseAIServiceAdapter`
2. Add comprehensive tests
3. Update factory and exports
4. Add documentation
5. Submit pull request

## License

MIT License - see LICENSE file for details.

