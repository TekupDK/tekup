# 🔄 Webhook System Design - v1.3.0

**Feature:** Real-time Billy.dk Event Processing  
**Priority:** Phase 1 (Uge 2-3)  
**Effort:** High | **Value:** Very High  

---

## 🎯 **VISION**

Bygge et robust webhook system som:
- **Lytter** til Billy.dk events i real-time
- **Processor** data og opdaterer Supabase cache
- **Notificerer** andre systemer om ændringer
- **Garanterer** data consistency og reliability

---

## 🏗️ **SYSTEM ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Billy.dk      │    │  Webhook Receiver │    │   Supabase      │
│                 │───▶│                  │───▶│                 │
│ • Invoice.paid  │    │ • Validation     │    │ • Cache Update  │
│ • Customer.new  │    │ • Authentication │    │ • Real-time Sub │
│ • Product.edit  │    │ • Rate Limiting  │    │ • Audit Log     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Event Processor │
                       │                  │
                       │ • Queue System   │
                       │ • Retry Logic    │
                       │ • Error Handling │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Notifications  │
                       │                  │
                       │ • Email Alerts   │
                       │ • Slack/Discord  │
                       │ • Dashboard Live │
                       └──────────────────┘
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Webhook Receiver (Express.js):**

```typescript
// webhook-server.ts
import express from 'express';
import crypto from 'crypto';
import { Queue } from 'bullmq';

interface BillyWebhookPayload {
  event: string;
  resourceType: 'invoice' | 'customer' | 'product' | 'contact';
  resourceId: string;
  organizationId: string;
  timestamp: string;
  data: any;
  signature?: string;
}

class BillyWebhookReceiver {
  private app = express();
  private eventQueue: Queue;
  
  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.eventQueue = new Queue('billy-events', {
      connection: { host: 'redis-server', port: 6379 }
    });
  }

  private setupMiddleware() {
    // Raw body parsing for signature verification
    this.app.use('/webhook', express.raw({ type: 'application/json' }));
    
    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100 // Max 100 requests per minute per IP
    }));
  }

  private setupRoutes() {
    // Main webhook endpoint
    this.app.post('/webhook/billy', this.handleBillyWebhook.bind(this));
    
    // Health check
    this.app.get('/webhook/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  private async handleBillyWebhook(req: Request, res: Response) {
    try {
      // 1. Verify webhook signature
      if (!this.verifySignature(req.body, req.headers['x-billy-signature'])) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // 2. Parse payload
      const payload: BillyWebhookPayload = JSON.parse(req.body.toString());
      
      // 3. Validate payload structure
      if (!this.validatePayload(payload)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      // 4. Add to processing queue
      await this.eventQueue.add('process-billy-event', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });

      // 5. Log webhook received
      await this.logWebhookEvent(payload, 'received');

      res.status(200).json({ 
        status: 'accepted', 
        eventId: payload.resourceId 
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private verifySignature(body: Buffer, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.BILLY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}
```

### **Event Processor (Bull Queue Worker):**

```typescript
// event-processor.ts
import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from './supabase';
import { BillyClient } from './billy-client';

class BillyEventProcessor {
  private worker: Worker;
  private billyClient: BillyClient;

  constructor() {
    this.billyClient = new BillyClient();
    this.setupWorker();
  }

  private setupWorker() {
    this.worker = new Worker('billy-events', async (job: Job) => {
      const payload: BillyWebhookPayload = job.data;
      
      try {
        await this.processEvent(payload);
        await this.logWebhookEvent(payload, 'processed');
      } catch (error) {
        await this.logWebhookEvent(payload, 'error', error.message);
        throw error; // Re-throw for retry logic
      }
    }, {
      connection: { host: 'redis-server', port: 6379 },
      concurrency: 5 // Process up to 5 events simultaneously
    });

    this.worker.on('completed', (job) => {
      console.log(`✅ Event processed: ${job.data.event}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Event failed: ${job?.data?.event}`, err);
    });
  }

  private async processEvent(payload: BillyWebhookPayload) {
    switch (payload.event) {
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.paid':
        await this.handleInvoiceEvent(payload);
        break;
        
      case 'customer.created':
      case 'customer.updated':
        await this.handleCustomerEvent(payload);
        break;
        
      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
        await this.handleProductEvent(payload);
        break;
        
      default:
        console.warn(`Unknown event type: ${payload.event}`);
    }
  }

  private async handleInvoiceEvent(payload: BillyWebhookPayload) {
    const { resourceId, organizationId } = payload;
    
    // 1. Fetch updated invoice from Billy.dk
    const invoice = await this.billyClient.getInvoice(resourceId, organizationId);
    
    // 2. Update Supabase cache
    await supabaseAdmin
      .from('billy_invoices_cache')
      .upsert({
        invoice_id: resourceId,
        organization_id: organizationId,
        data: invoice,
        last_synced: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });

    // 3. Trigger real-time notification
    await supabaseAdmin
      .from('billy_live_events')
      .insert({
        event_type: payload.event,
        resource_type: 'invoice',
        resource_id: resourceId,
        organization_id: organizationId,
        payload: payload.data
      });

    // 4. Send notifications if configured
    if (payload.event === 'invoice.paid') {
      await this.sendNotification({
        type: 'invoice_paid',
        message: `Invoice ${resourceId} has been paid`,
        organizationId
      });
    }
  }
}
```

---

## 📡 **BILLY.DK WEBHOOK EVENTS**

### **Supported Events:**

```typescript
// Invoice Events
'invoice.created'     // New invoice created
'invoice.updated'     // Invoice details changed  
'invoice.sent'        // Invoice sent to customer
'invoice.paid'        // Payment received
'invoice.overdue'     // Payment deadline passed
'invoice.cancelled'   // Invoice was cancelled

// Customer Events  
'customer.created'    // New customer added
'customer.updated'    // Customer info changed
'customer.deleted'    // Customer removed

// Product Events
'product.created'     // New product added
'product.updated'     // Product details changed
'product.deleted'     // Product removed

// Contact Events
'contact.created'     // New contact person
'contact.updated'     // Contact details changed
'contact.deleted'     // Contact removed

// Organization Events
'organization.updated' // Company settings changed
```

### **Event Payload Structure:**

```json
{
  "event": "invoice.paid",
  "resourceType": "invoice",
  "resourceId": "invoice_123456789",
  "organizationId": "org_987654321",
  "timestamp": "2025-10-14T15:30:45.123Z",
  "data": {
    "invoiceNumber": "INV-2025-001",
    "amount": 1250.00,
    "currency": "DKK",
    "customerId": "customer_456789123",
    "paymentDate": "2025-10-14T15:30:00.000Z",
    "paymentMethod": "bank_transfer"
  },
  "signature": "sha256=abc123def456..."
}
```

---

## 🔒 **SECURITY & RELIABILITY**

### **Authentication & Validation:**

```typescript
// Webhook signature verification
const verifyWebhookSignature = (payload: string, signature: string) => {
  const hmac = crypto.createHmac('sha256', BILLY_WEBHOOK_SECRET);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(`sha256=${computedSignature}`, 'utf8')
  );
};

// Rate limiting per organization
const organizationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per org
  keyGenerator: (req) => req.body.organizationId,
  message: 'Too many webhook requests from this organization'
});
```

### **Reliability Features:**

- **Retry Logic:** Exponential backoff (2s, 4s, 8s delays)
- **Dead Letter Queue:** Failed events after 3 retries
- **Idempotency:** Duplicate event detection and handling
- **Circuit Breaker:** Automatic failover during Billy.dk outages
- **Health Monitoring:** Webhook endpoint monitoring and alerting

---

## 📊 **MONITORING & OBSERVABILITY**

### **Metrics Dashboard:**

```typescript
// Webhook metrics collection
interface WebhookMetrics {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  eventTypeCounts: Record<string, number>;
  organizationActivity: Record<string, number>;
  lastProcessedAt: string;
  queueSize: number;
}

// Real-time metrics endpoint
app.get('/api/webhook/metrics', async (req, res) => {
  const metrics = await getWebhookMetrics();
  res.json(metrics);
});
```

### **Alerting System:**

```typescript
// Alert conditions
const alertConditions = {
  highFailureRate: (failureRate: number) => failureRate > 0.1, // >10%
  queueBacklog: (queueSize: number) => queueSize > 100,
  processingDelay: (delay: number) => delay > 30000, // >30s
  webhookDown: (lastReceived: Date) => Date.now() - lastReceived.getTime() > 300000 // >5min
};

// Send alerts via multiple channels
async function sendAlert(condition: string, details: any) {
  await Promise.all([
    sendEmailAlert(condition, details),
    sendSlackAlert(condition, details),
    logAlertToSupabase(condition, details)
  ]);
}
```

---

## 🎯 **IMPLEMENTATION ROADMAP**

### **Phase 1: Core Webhook System (Week 2)**

**Day 1-2: Infrastructure Setup**
- [ ] Setup Express.js webhook server
- [ ] Configure Redis queue system
- [ ] Implement signature verification
- [ ] Create basic event processing

**Day 3-4: Event Handlers**
- [ ] Invoice event processing
- [ ] Customer event processing  
- [ ] Product event processing
- [ ] Supabase cache updates

### **Phase 2: Advanced Features (Week 3)**

**Day 5-6: Reliability & Monitoring**
- [ ] Retry logic and error handling
- [ ] Metrics collection system
- [ ] Health monitoring dashboard
- [ ] Alert system setup

**Day 7: Integration & Testing**
- [ ] Billy.dk webhook registration
- [ ] End-to-end testing with test events
- [ ] Load testing and performance optimization
- [ ] Production deployment

---

## 🔄 **SUPABASE INTEGRATION**

### **New Tables for Webhook System:**

```sql
-- Webhook event log
CREATE TABLE billy_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'received', -- received, processing, completed, failed
  error_message TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Live events for real-time dashboard
CREATE TABLE billy_live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook metrics aggregation
CREATE TABLE billy_webhook_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_bucket TIMESTAMP NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  total_events INTEGER DEFAULT 0,
  successful_events INTEGER DEFAULT 0,
  failed_events INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(hour_bucket, organization_id, event_type)
);

-- Indexes for performance
CREATE INDEX idx_webhook_events_org_status ON billy_webhook_events(organization_id, status);
CREATE INDEX idx_webhook_events_created_at ON billy_webhook_events(created_at);
CREATE INDEX idx_live_events_org_type ON billy_live_events(organization_id, event_type);
CREATE INDEX idx_webhook_metrics_hour_org ON billy_webhook_metrics(hour_bucket, organization_id);
```

### **Real-time Subscriptions:**

```typescript
// Dashboard real-time updates
const liveEventsSubscription = supabase
  .from('billy_live_events')
  .on('INSERT', payload => {
    // Update dashboard in real-time
    updateDashboardEvent(payload.new);
  })
  .subscribe();

// Webhook status monitoring
const webhookStatusSubscription = supabase
  .from('billy_webhook_events')
  .on('UPDATE', payload => {
    if (payload.new.status === 'failed') {
      showFailureAlert(payload.new);
    }
  })
  .subscribe();
```

---

## 📧 **NOTIFICATION SYSTEM**

### **Multi-Channel Notifications:**

```typescript
interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    events: string[];
  };
  slack?: {
    enabled: boolean;
    webhook_url: string;
    channel: string;
    events: string[];
  };
  discord?: {
    enabled: boolean;
    webhook_url: string;
    events: string[];
  };
}

class NotificationManager {
  async sendInvoicePaidNotification(invoice: Invoice) {
    const message = `🎉 Invoice ${invoice.number} has been paid! Amount: ${invoice.amount} ${invoice.currency}`;
    
    await Promise.all([
      this.sendEmail({
        subject: 'Invoice Payment Received',
        body: message,
        recipients: ['accounting@company.com']
      }),
      
      this.sendSlackMessage({
        channel: '#accounting',
        message: message,
        attachments: [{
          color: 'good',
          fields: [
            { title: 'Invoice', value: invoice.number, short: true },
            { title: 'Amount', value: `${invoice.amount} ${invoice.currency}`, short: true },
            { title: 'Customer', value: invoice.customerName, short: true },
            { title: 'Paid At', value: invoice.paidAt, short: true }
          ]
        }]
      })
    ]);
  }
}
```

---

## 🎯 **SUCCESS METRICS**

### **Performance Targets:**

- **Webhook Response Time:** < 200ms (acknowledgment)
- **Event Processing Time:** < 5 seconds (average)
- **Uptime:** 99.9% availability  
- **Reliability:** < 0.1% event loss rate

### **Business Value:**

- **Real-time Data Sync:** Eliminate manual cache refreshing
- **Instant Notifications:** Immediate alerts for important events
- **Audit Trail:** Complete event history for compliance
- **Reduced API Calls:** Proactive cache updates vs reactive polling

---

**Version:** 1.0  
**Created:** 2025-10-14  
**Author:** Jonas Abde (w/ GitHub Copilot)  
**Status:** 🔄 Design Complete - Ready for Implementation
