# @tekup/event-bus

A comprehensive event-driven architecture package for Tekup's AI ecosystem, providing Redis-based message bus with intelligent routing, retry logic, and type-safe event handling.

## Features

### 🚀 Core Capabilities
- **Type-Safe Events**: Strongly typed events for all AI applications
- **Redis-Based Message Bus**: Scalable and reliable event distribution
- **Priority Queues**: Different priority levels for event processing
- **Retry Logic**: Exponential backoff with dead letter queues
- **Pattern Matching**: Flexible event subscription patterns
- **Tenant Isolation**: Multi-tenant event routing and filtering

### 🔧 Advanced Features
- **Event Batching**: Efficient batch processing for high throughput
- **Correlation Tracking**: Event chains and workflow correlation
- **Metrics & Monitoring**: Built-in performance tracking
- **Graceful Shutdown**: Clean shutdown with processing completion
- **Health Monitoring**: Service health checks and status reporting

### 📊 Event Types
Support for all Tekup AI applications:
- **Proposal Engine**: Proposal creation, buying signals
- **Content Generator**: Content generation and publishing
- **Customer Support**: Session management and resolution
- **CRM & Leads**: Lead creation, scoring, and conversion
- **Marketing**: Campaign management and analytics
- **Project Management**: Project and task tracking
- **Analytics**: Predictions and model training
- **Voice & Vision**: Multimedia processing events
- **Business Intelligence**: Reports and dashboards

## Quick Start

### Installation

```bash
pnpm add @tekup/event-bus
```

### Basic Usage

```typescript
import { createEventBus, EventFactory, EventPatternBuilder } from '@tekup/event-bus';

// Initialize event bus
const eventBus = await createEventBus(
  'redis://localhost:6379',
  'my-ai-service'
);

// Publish an event
const event = EventFactory.leadCreated(
  'tenant-123',
  'user-456',
  {
    leadId: 'lead-789',
    source: 'website',
    score: 75,
    contactId: 'contact-123'
  }
);

const eventId = await eventBus.publish(event);
console.log('Event published:', eventId);

// Subscribe to events
await eventBus.subscribe({
  eventType: 'lead.created',
  handler: async (event, context) => {
    console.log('New lead created:', event.data.leadId);
    // Process the lead...
  },
  priority: EventPriority.HIGH
});
```

### Advanced Subscription Patterns

```typescript
// Subscribe to all proposal events
await eventBus.subscribe({
  eventType: EventPatternBuilder.common.allProposalEvents(),
  handler: proposalHandler,
  priority: EventPriority.HIGH
});

// Subscribe to all completion events
await eventBus.subscribe({
  eventType: EventPatternBuilder.common.allCompletedEvents(),
  handler: completionHandler,
  filter: (event) => event.tenantId === 'specific-tenant'
});

// Custom pattern
const pattern = new EventPatternBuilder()
  .service('support')
  .category('resolved')
  .buildSingle();

await eventBus.subscribe({
  eventType: pattern,
  handler: supportResolutionHandler
});
```

## Event Types Reference

### Proposal Engine Events

#### `proposal.created`
```typescript
const event = EventFactory.proposalCreated(tenantId, userId, {
  proposalId: 'prop-123',
  clientName: 'Acme Corp',
  estimatedValue: 150000,
  confidence: 0.87,
  leadId: 'lead-456'
});
```

#### `buying-signal.detected`
```typescript
const event = EventFactory.buyingSignalDetected(tenantId, userId, {
  proposalId: 'prop-123',
  signalType: 'urgency',
  content: 'need this implemented by end of quarter',
  confidence: 0.92,
  position: 145
});
```

### CRM & Lead Events

#### `lead.created`
```typescript
const event = EventFactory.leadCreated(tenantId, userId, {
  leadId: 'lead-123',
  source: 'referral',
  score: 85,
  contactId: 'contact-456',
  companyId: 'company-789'
});
```

#### `lead.scored`
```typescript
const event = EventFactory.leadScored(tenantId, userId, {
  leadId: 'lead-123',
  previousScore: 60,
  newScore: 85,
  factors: [
    { factor: 'company_size', impact: 15, confidence: 0.9 },
    { factor: 'engagement', impact: 10, confidence: 0.8 }
  ]
});
```

#### `lead.converted`
```typescript
const event = EventFactory.leadConverted(tenantId, userId, {
  leadId: 'lead-123',
  dealId: 'deal-456',
  conversionValue: 75000,
  conversionTime: 15000, // ms
  touchpoints: ['website', 'demo', 'proposal']
});
```

### Content & Marketing Events

#### `content.generated`
```typescript
const event = EventFactory.contentGenerated(tenantId, userId, {
  contentId: 'content-123',
  type: 'blog',
  platform: 'linkedin',
  title: 'AI in Business Automation',
  wordCount: 1200,
  seoScore: 85
});
```

#### `campaign.completed`
```typescript
const event = EventFactory.campaignCompleted(tenantId, userId, {
  campaignId: 'campaign-123',
  delivered: 10000,
  opened: 2500,
  clicked: 500,
  converted: 50,
  revenue: 125000,
  roi: 450
});
```

### Support & Analytics Events

#### `support.session.started`
```typescript
const event = EventFactory.supportSessionStarted(tenantId, userId, {
  sessionId: 'session-123',
  contactId: 'contact-456',
  channel: 'chat',
  priority: 'high'
});
```

#### `prediction.generated`
```typescript
const event = EventFactory.predictionGenerated(tenantId, userId, {
  predictionId: 'pred-123',
  modelId: 'model-456',
  type: 'lead_score',
  confidence: 0.89,
  input: { company_size: 'enterprise', source: 'referral' },
  output: { score: 85, probability: 0.73 }
});
```

## Event Handlers

### Creating Event Handlers

```typescript
import { EventHandler, EventContext, LeadCreatedEvent } from '@tekup/event-bus';

const leadScoringHandler: EventHandler<LeadCreatedEvent> = async (event, context) => {
  console.log(`Processing lead: ${event.data.leadId}`);
  
  try {
    // Your business logic here
    const score = await calculateLeadScore(event.data);
    await updateLeadScore(event.data.leadId, score);
    
    console.log(`Lead scored: ${score}/100`);
  } catch (error) {
    console.error('Lead scoring failed:', error);
    throw error; // Triggers retry logic
  }
};
```

### Handler Configuration

```typescript
await eventBus.subscribe({
  eventType: 'lead.created',
  handler: leadScoringHandler,
  priority: EventPriority.HIGH,
  retryAttempts: 5,
  retryDelay: 2000,
  timeout: 30000,
  filter: (event) => event.data.score > 50 // Only process qualified leads
});
```

## Configuration

### Event Bus Configuration

```typescript
import { createEventBus, EventBusConfig } from '@tekup/event-bus';

const config: EventBusConfig = {
  redisUrl: 'redis://localhost:6379',
  serviceName: 'ai-proposal-engine',
  namespace: 'tekup-prod',
  retryAttempts: 3,
  retryDelay: 1000,
  deadLetterTtl: 86400, // 24 hours
  batchSize: 50,
  concurrency: 10
};

const eventBus = new TekupEventBus(config);
await eventBus.initialize();
```

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Event Bus Configuration
EVENT_BUS_NAMESPACE=tekup
EVENT_BUS_RETRY_ATTEMPTS=3
EVENT_BUS_RETRY_DELAY=1000
EVENT_BUS_DEAD_LETTER_TTL=86400
EVENT_BUS_BATCH_SIZE=10
EVENT_BUS_CONCURRENCY=5

# Logging
LOG_LEVEL=info
```

## Advanced Usage

### Event Correlation

```typescript
import { EventUtils } from '@tekup/event-bus';

// Create correlated events
const correlationMetadata = EventUtils.createCorrelationMetadata(
  parentEventId,
  workflowId,
  sessionId
);

const event = EventFactory.proposalCreated(tenantId, userId, data, correlationMetadata);
```

### Event Batching

```typescript
const events = [
  EventFactory.leadCreated(tenantId, userId, leadData1),
  EventFactory.leadCreated(tenantId, userId, leadData2),
  EventFactory.leadCreated(tenantId, userId, leadData3)
];

const batchedEvents = EventUtils.createEventBatch(events, {
  batchType: 'lead_import',
  source: 'csv_upload'
});

// Publish all events in batch
for (const event of batchedEvents) {
  await eventBus.publish(event);
}
```

### Metrics and Monitoring

```typescript
// Get overall metrics
const globalMetrics = await eventBus.getMetrics();
console.log('Published:', globalMetrics.published);
console.log('Processed:', globalMetrics.processed);
console.log('Failed:', globalMetrics.failed);
console.log('Avg Processing Time:', globalMetrics.avgProcessingTime);

// Get tenant-specific metrics
const tenantMetrics = await eventBus.getMetrics('tenant-123');
```

### Event Status Tracking

```typescript
const eventId = await eventBus.publish(event);

// Check processing status
const status = await eventBus.getEventStatus(eventId);
console.log('Event status:', status); // 'pending', 'processing', 'completed', 'failed'
```

## Example Handlers

### Lead Scoring Automation

```typescript
const leadScoringHandler: EventHandler<LeadCreatedEvent> = async (event) => {
  const score = await calculateLeadScore(event.data);
  await updateLeadScore(event.data.leadId, score);
  
  if (score > 80) {
    // Trigger high-value lead workflow
    await eventBus.publish(
      EventFactory.leadScored(event.tenantId, event.userId!, {
        leadId: event.data.leadId,
        previousScore: event.data.score,
        newScore: score,
        factors: await getScoringFactors(event.data)
      })
    );
  }
};
```

### Campaign Analytics

```typescript
const campaignAnalyticsHandler: EventHandler<CampaignCompletedEvent> = async (event) => {
  const analytics = {
    campaignId: event.data.campaignId,
    openRate: (event.data.opened / event.data.delivered) * 100,
    clickRate: (event.data.clicked / event.data.opened) * 100,
    conversionRate: (event.data.converted / event.data.clicked) * 100,
    roi: event.data.roi
  };
  
  await storeCampaignAnalytics(analytics);
  
  if (analytics.roi > 400) {
    await notifyMarketingTeam('High-performing campaign detected!');
  }
};
```

### Support Prioritization

```typescript
const supportPrioritizationHandler: EventHandler<SupportSessionStartedEvent> = async (event) => {
  const customer = await getCustomerContext(event.data.contactId);
  
  if (customer.ltv > 100000) {
    await escalateToAgent(event.data.sessionId, 'high-value-customer');
  }
  
  if (customer.recentIssues > 2) {
    await increasePriority(event.data.sessionId, 'frequent-issues');
  }
};
```

## Production Deployment

### Docker Configuration

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# Copy source
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
  name: ai-event-processor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-event-processor
  template:
    metadata:
      labels:
        app: ai-event-processor
    spec:
      containers:
      - name: ai-event-processor
        image: tekup/ai-event-processor:latest
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: tekup-secrets
              key: redis-url
        - name: SERVICE_NAME
          value: "ai-event-processor"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Monitoring with Prometheus

```typescript
// Add metrics collection
import { register, Counter, Histogram } from 'prom-client';

const eventCounter = new Counter({
  name: 'tekup_events_total',
  help: 'Total number of events processed',
  labelNames: ['event_type', 'tenant_id', 'status']
});

const eventDuration = new Histogram({
  name: 'tekup_event_duration_seconds',
  help: 'Event processing duration',
  labelNames: ['event_type', 'tenant_id']
});

// In your event handler
const timer = eventDuration.startTimer({ event_type: event.type, tenant_id: event.tenantId });
try {
  await processEvent(event);
  eventCounter.inc({ event_type: event.type, tenant_id: event.tenantId, status: 'success' });
} catch (error) {
  eventCounter.inc({ event_type: event.type, tenant_id: event.tenantId, status: 'error' });
  throw error;
} finally {
  timer();
}
```

## Best Practices

### Event Design
1. **Keep events immutable** - Never modify event data after publishing
2. **Include relevant context** - Add metadata for debugging and correlation
3. **Use semantic versioning** - Version your event schemas for backward compatibility
4. **Avoid large payloads** - Keep event data focused and reference external resources

### Error Handling
1. **Implement idempotent handlers** - Handlers should handle duplicate events gracefully
2. **Use appropriate retry strategies** - Critical events need more retries
3. **Monitor dead letter queues** - Set up alerts for failed events
4. **Log correlation IDs** - Track events through their entire lifecycle

### Performance
1. **Batch related operations** - Process multiple events together when possible
2. **Use appropriate priorities** - Critical business events get higher priority
3. **Monitor queue depths** - Watch for processing bottlenecks
4. **Scale horizontally** - Add more event processors as needed

### Security
1. **Validate event schemas** - Always validate incoming events
2. **Implement tenant isolation** - Ensure events don't leak between tenants
3. **Audit sensitive events** - Log security-relevant events for compliance
4. **Use secure Redis connections** - Enable TLS and authentication

## Troubleshooting

### Common Issues

#### Events Not Being Processed
```bash
# Check Redis connectivity
redis-cli ping

# Check event queue depth
redis-cli llen tekup:queue:high

# Check subscriber connections
redis-cli client list
```

#### High Memory Usage
```bash
# Check Redis memory usage
redis-cli info memory

# Check event TTL settings
redis-cli ttl tekup:event:some-event-id

# Monitor dead letter queues
redis-cli llen tekup:dlq:event-type
```

#### Slow Event Processing
- Check handler timeout settings
- Monitor processing time metrics
- Scale event processors horizontally
- Optimize handler business logic

### Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug NODE_ENV=development npm start
```

Monitor events in real-time:
```bash
redis-cli monitor | grep tekup
```

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests for new event types
3. Update documentation for API changes
4. Ensure proper error handling and logging

## License

MIT License - see LICENSE file for details.

