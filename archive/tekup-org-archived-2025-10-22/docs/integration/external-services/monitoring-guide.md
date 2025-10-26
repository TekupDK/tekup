# Service Health Monitoring Guide

Comprehensive guide for monitoring external service integrations in the TekUp.org platform.

## Overview

The service monitoring system provides:
- **Real-time Health Monitoring**: Continuous health checks for all registered services
- **Web Dashboard**: Visual interface for monitoring service status and metrics
- **Incident Response**: Automated incident detection, escalation, and resolution
- **Alerting & Notifications**: Configurable alerts via webhooks, email, and other channels
- **Performance Metrics**: Response times, error rates, and availability statistics

## Quick Start

### Basic Monitoring Setup

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

// Create registry with monitoring enabled
const registry = new ServiceRegistry({
  monitoring: {
    enabled: true,
    dashboardEnabled: true,
    metricsRetentionDays: 30
  }
});

// Register a service with health checks
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
    intervalMs: 30000,      // Check every 30 seconds
    timeoutMs: 10000,       // 10 second timeout
    expectedStatusCodes: [200],
    retries: 2
  }
});

// Start all monitoring systems
await registry.startAllMonitoring({
  dashboardPort: 3001,
  incidentConfig: {
    webhookUrl: 'https://your-webhook-url.com/alerts',
    emailConfig: {
      recipients: ['admin@yourcompany.com']
    }
  }
});

console.log('Monitoring dashboard: http://localhost:3001');
```

### Environment-Based Setup

```typescript
import { createServiceRegistryFromEnv } from '@tekup/service-registry';

// Automatically load services from environment variables
const registry = await createServiceRegistryFromEnv();

// Start monitoring with default configuration
await registry.startAllMonitoring();
```

## Health Monitoring

### Health Check Configuration

```typescript
interface HealthCheck {
  enabled: boolean;
  endpoint: string;           // Health check endpoint
  intervalMs: number;         // Check interval in milliseconds
  timeoutMs: number;          // Request timeout
  expectedStatusCodes: number[]; // Expected HTTP status codes
  retries: number;            // Number of retries on failure
  headers?: Record<string, string>; // Custom headers
  body?: any;                 // Request body for POST checks
  method?: 'GET' | 'POST' | 'HEAD'; // HTTP method
}
```

### Custom Health Checks

```typescript
// Register service with custom health check
await registry.registerService({
  id: 'custom-api',
  name: 'Custom API',
  type: 'api',
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    method: 'POST',
    intervalMs: 60000,
    timeoutMs: 5000,
    expectedStatusCodes: [200, 201],
    retries: 3,
    headers: {
      'X-Health-Check': 'true'
    },
    body: {
      source: 'tekup-monitoring'
    }
  }
});
```

### Health Status Types

- **healthy**: Service is responding normally
- **degraded**: Service is responding but with issues (slow response, high error rate)
- **down**: Service is not responding or returning errors
- **unknown**: Health status cannot be determined

### Accessing Health Data

```typescript
// Get health for specific service
const health = await registry.getServiceHealth('openai');
console.log(`OpenAI status: ${health.status}`);
console.log(`Response time: ${health.responseTimeMs}ms`);
console.log(`Error rate: ${(health.errorRate * 100).toFixed(1)}%`);

// Get health for all services
const allHealth = await registry.getAllServiceHealth();
for (const [serviceId, health] of allHealth) {
  console.log(`${serviceId}: ${health.status}`);
}

// Get system health summary
const summary = await registry.healthMonitor.getSystemHealthSummary();
console.log(`Overall status: ${summary.overallStatus}`);
console.log(`Healthy services: ${summary.healthyServices}/${summary.totalServices}`);
```

## Web Dashboard

### Starting the Dashboard

```typescript
// Start dashboard on default port (3001)
await registry.startDashboard();

// Start dashboard on custom port
await registry.startDashboard(8080);

// Dashboard will be available at http://localhost:8080
```

### Dashboard Features

- **Service Overview**: Real-time status of all registered services
- **Health Metrics**: Response times, error rates, availability percentages
- **Service Details**: Configuration, recent health checks, incident history
- **System Summary**: Overall system health and statistics
- **Auto-refresh**: Updates every 30 seconds automatically

### Dashboard API Endpoints

The dashboard exposes several API endpoints:

- `GET /api/health` - System health summary and all service health data
- `GET /api/services` - All registered services with health information
- `GET /api/stats` - Registry statistics and metrics
- `GET /api/service?id=<serviceId>` - Detailed information for specific service

### Custom Dashboard Integration

```typescript
// Access dashboard data programmatically
const response = await fetch('http://localhost:3001/api/health');
const healthData = await response.json();

console.log('System health:', healthData.summary);
console.log('Service health:', healthData.services);
```

## Incident Response System

### Automatic Incident Detection

The system automatically creates incidents when:
- Service health status changes to 'degraded' or 'down'
- Response times exceed thresholds
- Error rates increase significantly
- Consecutive health check failures occur

### Manual Incident Creation

```typescript
const incidentSystem = registry.getIncidentResponse();

// Create manual incident
const incident = await incidentSystem.createIncident(
  'openai',                    // Service ID
  'high',                      // Severity: critical, high, medium, low
  'OpenAI API experiencing high latency',
  {
    responseTime: 15000,
    errorRate: 0.3,
    affectedUsers: 150
  }
);

console.log(`Created incident: ${incident.id}`);
```

### Incident Management

```typescript
// Update incident status
await incidentSystem.updateIncident(incident.id, {
  status: 'investigating',
  assignee: 'john.doe@company.com'
}, 'admin');

// Resolve incident
await incidentSystem.updateIncident(incident.id, {
  status: 'resolved',
  resolvedAt: new Date()
}, 'admin');

// Get incident details
const incidentDetails = incidentSystem.getIncident(incident.id);
console.log('Timeline:', incidentDetails.timeline);

// Get all incidents
const allIncidents = incidentSystem.getIncidents({
  serviceId: 'openai',
  severity: 'high',
  status: 'open'
});

// Get incident statistics
const stats = incidentSystem.getIncidentStats();
console.log(`Total incidents: ${stats.total}`);
console.log(`Average resolution time: ${stats.averageResolutionTime}ms`);
console.log(`MTTR: ${stats.mttr}ms`);
```

### Custom Escalation Rules

```typescript
// Add custom escalation rule
incidentSystem.addEscalationRule({
  name: 'Business Hours Critical Escalation',
  condition: async (incident) => {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    return incident.severity === 'critical' && isBusinessHours;
  },
  action: async (incident) => {
    // Send SMS to on-call engineer
    await sendSMS('+1234567890', `CRITICAL: ${incident.description}`);
    
    // Create Slack alert
    await sendSlackAlert('#incidents', {
      text: `🚨 Critical incident: ${incident.description}`,
      incident: incident.id
    });
  }
});
```

### Custom Response Actions

```typescript
// Add automated response action
incidentSystem.addResponseAction({
  name: 'Auto-restart Service',
  condition: async (incident) => {
    return incident.severity === 'high' && 
           incident.metadata?.consecutiveFailures >= 5;
  },
  execute: async (incident) => {
    // Restart service monitoring
    await registry.healthMonitor.restartMonitoring(incident.serviceId);
    
    // Log action
    console.log(`Auto-restarted monitoring for ${incident.serviceId}`);
    
    // Update incident with action taken
    await incidentSystem.updateIncident(incident.id, {
      metadata: {
        ...incident.metadata,
        autoRestartAttempted: true,
        autoRestartTime: new Date()
      }
    });
  }
});
```

## Alerting & Notifications

### Webhook Notifications

```typescript
await registry.startIncidentResponse({
  webhookUrl: 'https://your-webhook-endpoint.com/alerts',
  webhookHeaders: {
    'Authorization': 'Bearer your-webhook-token',
    'X-Source': 'tekup-monitoring'
  }
});
```

Webhook payload example:
```json
{
  \"type\": \"critical_incident\",
  \"incident\": {
    \"id\": \"INC-ABC123\",
    \"serviceId\": \"openai\",
    \"severity\": \"critical\",
    \"description\": \"OpenAI API is down\",
    \"createdAt\": \"2024-01-15T10:30:00Z\",
    \"metadata\": {
      \"responseTime\": 0,
      \"errorRate\": 1.0,
      \"consecutiveFailures\": 10
    }
  },
  \"message\": \"CRITICAL: OpenAI API is down\",
  \"urgency\": \"high\"
}
```

### Email Notifications

```typescript
await registry.startIncidentResponse({
  emailConfig: {
    recipients: [
      'admin@company.com',
      'oncall@company.com',
      'alerts@company.com'
    ]
  }
});
```

### Slack Integration

```typescript
// Custom escalation rule for Slack
incidentSystem.addEscalationRule({
  name: 'Slack Alert',
  condition: async (incident) => incident.severity === 'critical',
  action: async (incident) => {
    await fetch('https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Critical Incident: ${incident.description}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Service', value: incident.serviceId, short: true },
            { title: 'Severity', value: incident.severity, short: true },
            { title: 'Incident ID', value: incident.id, short: true },
            { title: 'Created', value: incident.createdAt.toISOString(), short: true }
          ]
        }]
      })
    });
  }
});
```

### PagerDuty Integration

```typescript
incidentSystem.addEscalationRule({
  name: 'PagerDuty Alert',
  condition: async (incident) => incident.severity === 'critical',
  action: async (incident) => {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${process.env.PAGERDUTY_TOKEN}`
      },
      body: JSON.stringify({
        routing_key: process.env.PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        dedup_key: incident.id,
        payload: {
          summary: incident.description,
          severity: incident.severity,
          source: 'tekup-monitoring',
          component: incident.serviceId,
          custom_details: incident.metadata
        }
      })
    });
  }
});
```

## Performance Metrics

### Built-in Metrics

The system automatically tracks:
- **Response Time**: Average, min, max response times
- **Error Rate**: Percentage of failed requests
- **Availability**: Uptime percentage
- **Consecutive Failures**: Number of consecutive failed health checks
- **Request Count**: Total number of health check requests

### Custom Metrics

```typescript
// Add custom metric tracking
registry.healthMonitor.addMetricCollector('openai', async (service) => {
  // Custom metric collection logic
  const customMetrics = await collectCustomMetrics(service);
  
  return {
    customResponseTime: customMetrics.responseTime,
    customErrorCount: customMetrics.errors,
    customThroughput: customMetrics.requestsPerSecond
  };
});
```

### Metrics Export

```typescript
// Export metrics for external monitoring systems
const metrics = await registry.healthMonitor.exportMetrics('prometheus');
console.log(metrics); // Prometheus format

// Export to JSON
const jsonMetrics = await registry.healthMonitor.exportMetrics('json');
```

## Advanced Configuration

### Complete Monitoring Setup

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

const registry = new ServiceRegistry({
  monitoring: {
    enabled: true,
    dashboardEnabled: true,
    metricsRetentionDays: 30,
    healthCheckDefaults: {
      intervalMs: 30000,
      timeoutMs: 10000,
      retries: 2
    }
  }
});

// Register services with comprehensive configuration
await registry.registerService({
  id: 'production-api',
  name: 'Production API',
  type: 'api',
  provider: 'internal',
  baseUrl: 'https://api.production.com',
  apiKey: process.env.PRODUCTION_API_KEY,
  enabled: true,
  environment: 'production',
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 1000000
  },
  
  // Retry policy
  retryPolicy: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },
  
  // Health check configuration
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    method: 'GET',
    intervalMs: 15000,
    timeoutMs: 5000,
    expectedStatusCodes: [200],
    retries: 3,
    headers: {
      'X-Health-Check': 'monitoring',
      'User-Agent': 'TekUp-Monitor/1.0'
    }
  },
  
  // Additional headers for all requests
  additionalHeaders: {
    'X-Client-Version': '1.0.0',
    'X-Environment': 'production'
  },
  
  // Service-specific metadata
  metadata: {
    team: 'platform',
    criticality: 'high',
    documentation: 'https://docs.internal.com/api',
    runbook: 'https://runbooks.internal.com/production-api'
  }
});

// Start comprehensive monitoring
await registry.startAllMonitoring({
  dashboardPort: 3001,
  incidentConfig: {
    webhookUrl: process.env.INCIDENT_WEBHOOK_URL,
    webhookHeaders: {
      'Authorization': `Bearer ${process.env.INCIDENT_WEBHOOK_TOKEN}`
    },
    emailConfig: {
      recipients: [
        'platform-team@company.com',
        'oncall@company.com'
      ]
    },
    escalationTimeouts: {
      critical: 300000,    // 5 minutes
      high: 900000,        // 15 minutes
      medium: 3600000,     // 1 hour
      low: 86400000        // 24 hours
    }
  }
});
```

## Best Practices

### Health Check Configuration

1. **Appropriate Intervals**: Don't check too frequently (causes load) or too infrequently (delays detection)
   - Critical services: 15-30 seconds
   - Important services: 30-60 seconds
   - Non-critical services: 1-5 minutes

2. **Timeout Settings**: Set timeouts based on expected response times
   - Fast APIs: 5-10 seconds
   - Slow APIs: 10-30 seconds
   - External services: 30-60 seconds

3. **Retry Logic**: Configure retries to avoid false positives
   - Fast services: 2-3 retries
   - Slow services: 1-2 retries
   - Flaky services: 3-5 retries

### Incident Management

1. **Severity Levels**:
   - **Critical**: Complete service outage, affects all users
   - **High**: Significant degradation, affects many users
   - **Medium**: Minor issues, affects some users
   - **Low**: Cosmetic issues, minimal user impact

2. **Escalation Timing**:
   - Critical: Immediate escalation
   - High: 5-15 minutes
   - Medium: 30-60 minutes
   - Low: 2-24 hours

3. **Response Actions**:
   - Automate common fixes (restart monitoring, clear caches)
   - Document manual procedures in runbooks
   - Test response actions regularly

### Alerting Strategy

1. **Alert Fatigue Prevention**:
   - Use appropriate severity levels
   - Implement alert suppression during maintenance
   - Group related alerts
   - Set up alert acknowledgment

2. **Notification Channels**:
   - Critical: Phone, SMS, PagerDuty
   - High: Email, Slack, Teams
   - Medium: Email, dashboard
   - Low: Dashboard only

3. **On-Call Procedures**:
   - Clear escalation paths
   - Documented response procedures
   - Regular on-call rotation
   - Post-incident reviews

## Troubleshooting

### Common Issues

#### Health Checks Failing

```typescript
// Check service configuration
const service = registry.getService('problematic-service');
console.log('Service config:', service);

// Check health manually
const health = await registry.getServiceHealth('problematic-service');
console.log('Health status:', health);

// Test connectivity
const testResult = await registry.testService('problematic-service');
console.log('Test result:', testResult);
```

#### Dashboard Not Loading

```typescript
// Check if dashboard is running
try {
  const response = await fetch('http://localhost:3001/api/health');
  console.log('Dashboard is accessible');
} catch (error) {
  console.log('Dashboard is not accessible:', error.message);
}

// Restart dashboard
await registry.stopDashboard();
await registry.startDashboard(3001);
```

#### Incidents Not Being Created

```typescript
// Check incident response system
const incidentSystem = registry.getIncidentResponse();
if (!incidentSystem) {
  console.log('Incident response system not started');
  await registry.startIncidentResponse();
}

// Check escalation rules
console.log('Escalation rules:', incidentSystem.escalationRules);

// Manually create test incident
const testIncident = await incidentSystem.createIncident(
  'test-service',
  'low',
  'Test incident for troubleshooting'
);
console.log('Test incident created:', testIncident.id);
```

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'service-registry:*';

// Or set log level
const registry = new ServiceRegistry({
  monitoring: {
    enabled: true,
    logLevel: 'debug'
  }
});
```

### Performance Optimization

```typescript
// Optimize health check intervals for better performance
await registry.updateService('heavy-service', {
  healthCheck: {
    ...service.healthCheck,
    intervalMs: 120000, // Check every 2 minutes instead of 30 seconds
    timeoutMs: 30000    // Increase timeout for slow service
  }
});

// Batch health checks for multiple services
const healthPromises = serviceIds.map(id => registry.getServiceHealth(id));
const healthResults = await Promise.all(healthPromises);
```

This comprehensive monitoring system provides enterprise-grade observability for your external service integrations, ensuring high availability and quick incident resolution.