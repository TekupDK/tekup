# External Services Troubleshooting Guide

Comprehensive troubleshooting guide for all external service integrations in the TekUp.org platform.

## Quick Diagnosis

### Service Health Check
Use the Service Registry to quickly check service status:

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

const registry = new ServiceRegistry();

// Check specific service
const health = await registry.getServiceHealth('openai');
console.log(`OpenAI Status: ${health?.status}`);

// Check all services
const allHealth = await registry.getAllServiceHealth();
for (const [serviceId, health] of allHealth) {
  console.log(`${serviceId}: ${health.status} (${health.responseTimeMs}ms)`);
}

// Get system overview
const summary = registry.getSystemHealthSummary();
console.log(`Overall Status: ${summary.overallStatus}`);
console.log(`Healthy Services: ${summary.healthyServices}/${summary.totalServices}`);
```

### Common Error Patterns

| Error Pattern | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| 401 Unauthorized | Invalid API key | Check key format and permissions |
| 429 Rate Limited | Too many requests | Implement backoff strategy |
| 500 Server Error | Service downtime | Check service status page |
| Timeout | Network/latency issues | Increase timeout values |
| SSL/TLS Error | Certificate issues | Update certificates |

## Service-Specific Issues

### OpenAI Issues

#### Authentication Errors
```
Error: Incorrect API key provided
```

**Diagnosis:**
```typescript
// Check API key format
const apiKey = process.env.OPENAI_API_KEY;
console.log('Key format valid:', apiKey?.startsWith('sk-'));
console.log('Key length:', apiKey?.length); // Should be 51 characters

// Test key validity
const testResponse = await fetch('https://api.openai.com/v1/models', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
console.log('Key valid:', testResponse.ok);
```

**Solutions:**
1. Verify key starts with `sk-`
2. Check if key was revoked in OpenAI dashboard
3. Ensure sufficient credits/quota
4. Regenerate key if necessary

#### Rate Limiting
```
Error: Rate limit reached for requests
```

**Diagnosis:**
```typescript
// Check current usage
const response = await fetch('https://api.openai.com/v1/usage', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const usage = await response.json();
console.log('Current usage:', usage);
```

**Solutions:**
```typescript
// Implement exponential backoff
async function callWithBackoff(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### Token Limit Exceeded
```
Error: This model's maximum context length is 4097 tokens
```

**Solutions:**
```typescript
// Estimate and truncate tokens
function estimateTokens(text) {
  return Math.ceil(text.length / 4); // Rough estimation
}

function truncateToTokenLimit(text, maxTokens = 3000) {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;
  
  const ratio = maxTokens / estimated;
  return text.substring(0, Math.floor(text.length * ratio));
}

// Use appropriate model for context size
const model = estimateTokens(prompt) > 3000 ? 'gpt-4-32k' : 'gpt-4';
```

### Anthropic Claude Issues

#### Version Compatibility
```
Error: anthropic-version header is required
```

**Solution:**
```typescript
// Always include version header
const headers = {
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'Content-Type': 'application/json'
};
```

#### Message Format Errors
```
Error: messages: field required
```

**Diagnosis:**
```typescript
// Validate message format
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }
  
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      throw new Error('Each message must have role and content');
    }
    
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      throw new Error('Invalid role: ' + msg.role);
    }
  }
  
  // Can't start with assistant
  if (messages[0].role === 'assistant') {
    throw new Error('First message cannot be from assistant');
  }
}
```

### Stripe Issues

#### Webhook Signature Verification
```
Error: Invalid signature
```

**Diagnosis:**
```typescript
// Debug webhook signature
function debugWebhookSignature(payload, signature, secret) {
  console.log('Payload length:', payload.length);
  console.log('Signature header:', signature);
  
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  console.log('Expected signature:', expectedSig);
  
  const receivedSig = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];
  console.log('Received signature:', receivedSig);
  
  return expectedSig === receivedSig;
}
```

**Solutions:**
1. Use raw body for signature verification
2. Check webhook secret is correct
3. Verify timestamp tolerance
4. Ensure proper header parsing

#### Payment Intent Issues
```
Error: Amount must be at least $0.50 usd
```

**Solutions:**
```typescript
// Validate payment parameters
function validatePaymentIntent(amount, currency) {
  const minimums = {
    'usd': 50,   // $0.50
    'eur': 50,   // €0.50
    'dkk': 250,  // 2.50 DKK
    'gbp': 30    // £0.30
  };
  
  const minimum = minimums[currency.toLowerCase()] || 50;
  
  if (amount < minimum) {
    throw new Error(`Amount must be at least ${minimum} ${currency}`);
  }
  
  if (!Number.isInteger(amount)) {
    throw new Error('Amount must be an integer (cents)');
  }
}
```

## Network & Connectivity Issues

### Timeout Errors

**Diagnosis:**
```typescript
// Test network connectivity
async function testConnectivity(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const start = Date.now();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TekUp-HealthCheck/1.0' }
    });
    const duration = Date.now() - start;
    
    clearTimeout(timeoutId);
    
    return {
      success: true,
      status: response.status,
      duration,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error.message,
      type: error.name
    };
  }
}

// Test all service endpoints
const services = ['https://api.openai.com', 'https://api.anthropic.com', 'https://api.stripe.com'];
for (const service of services) {
  const result = await testConnectivity(service);
  console.log(`${service}: ${result.success ? 'OK' : 'FAILED'}`, result);
}
```

**Solutions:**
1. Increase timeout values
2. Check firewall/proxy settings
3. Verify DNS resolution
4. Test from different network

### SSL/TLS Issues

**Diagnosis:**
```typescript
// Check SSL certificate
const https = require('https');
const tls = require('tls');

function checkSSL(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, hostname, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      
      resolve({
        valid: socket.authorized,
        issuer: cert.issuer,
        subject: cert.subject,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        fingerprint: cert.fingerprint
      });
    });
    
    socket.on('error', reject);
  });
}

// Check service certificates
const result = await checkSSL('api.openai.com');
console.log('SSL Certificate:', result);
```

## Environment & Configuration Issues

### Environment Variables

**Diagnosis Script:**
```typescript
// Check all required environment variables
function validateEnvironment() {
  const required = {
    'OPENAI_API_KEY': /^sk-[a-zA-Z0-9]{48}$/,
    'ANTHROPIC_API_KEY': /^sk-ant-[a-zA-Z0-9-_]{95}$/,
    'STRIPE_SECRET_KEY': /^sk_(test|live)_[a-zA-Z0-9]{24}$/,
    'GEMINI_API_KEY': /^[a-zA-Z0-9-_]{39}$/
  };
  
  const issues = [];
  
  for (const [key, pattern] of Object.entries(required)) {
    const value = process.env[key];
    
    if (!value) {
      issues.push(`Missing: ${key}`);
    } else if (!pattern.test(value)) {
      issues.push(`Invalid format: ${key}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

const envCheck = validateEnvironment();
if (!envCheck.valid) {
  console.error('Environment issues:', envCheck.issues);
}
```

### Configuration Validation

```typescript
// Validate service registry configuration
function validateServiceConfig(config) {
  const errors = [];
  
  if (!config.services || !Array.isArray(config.services)) {
    errors.push('Services must be an array');
  }
  
  for (const service of config.services || []) {
    if (!service.id) errors.push(`Service missing ID: ${JSON.stringify(service)}`);
    if (!service.apiKey) errors.push(`Service ${service.id} missing API key`);
    if (!service.baseUrl) errors.push(`Service ${service.id} missing base URL`);
    
    // Validate URL format
    try {
      new URL(service.baseUrl);
    } catch {
      errors.push(`Service ${service.id} has invalid base URL`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Monitoring & Alerting

### Health Check Automation

```typescript
// Automated health monitoring
class HealthMonitor {
  private alerts = new Map();
  
  async monitorServices(services, interval = 60000) {
    setInterval(async () => {
      for (const serviceId of services) {
        try {
          const health = await this.checkServiceHealth(serviceId);
          
          if (health.status !== 'healthy') {
            await this.handleUnhealthyService(serviceId, health);
          } else {
            // Clear any existing alerts
            this.alerts.delete(serviceId);
          }
        } catch (error) {
          console.error(`Health check failed for ${serviceId}:`, error);
        }
      }
    }, interval);
  }
  
  async handleUnhealthyService(serviceId, health) {
    const alertKey = `${serviceId}_${health.status}`;
    
    if (!this.alerts.has(alertKey)) {
      this.alerts.set(alertKey, Date.now());
      
      // Send alert
      await this.sendAlert({
        service: serviceId,
        status: health.status,
        responseTime: health.responseTimeMs,
        issues: health.issues,
        timestamp: new Date()
      });
    }
  }
  
  async sendAlert(alert) {
    // Send to Slack, email, or other alerting system
    console.log('ALERT:', alert);
    
    // Example: Send to webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    }
  }
}
```

### Performance Monitoring

```typescript
// Track API performance
class PerformanceMonitor {
  private metrics = new Map();
  
  startTimer(operation) {
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    this.metrics.set(id, { operation, start: Date.now() });
    return id;
  }
  
  endTimer(id, success = true, error = null) {
    const metric = this.metrics.get(id);
    if (!metric) return;
    
    const duration = Date.now() - metric.start;
    this.metrics.delete(id);
    
    // Log slow operations
    if (duration > 5000) {
      console.warn(`Slow operation: ${metric.operation} took ${duration}ms`);
    }
    
    // Track errors
    if (!success) {
      console.error(`Failed operation: ${metric.operation}`, error);
    }
    
    return { operation: metric.operation, duration, success, error };
  }
  
  // Usage wrapper
  async withTiming(operation, asyncFn) {
    const timerId = this.startTimer(operation);
    
    try {
      const result = await asyncFn();
      this.endTimer(timerId, true);
      return result;
    } catch (error) {
      this.endTimer(timerId, false, error);
      throw error;
    }
  }
}

// Usage
const monitor = new PerformanceMonitor();

const result = await monitor.withTiming('openai_chat', async () => {
  return await openai.chat(messages);
});
```

## Recovery Procedures

### Automatic Recovery

```typescript
// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  
  constructor(
    private threshold = 5,
    private timeout = 60000,
    private resetTimeout = 30000
  ) {}
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const openaiBreaker = new CircuitBreaker(3, 30000);

try {
  const result = await openaiBreaker.call(() => openai.chat(messages));
} catch (error) {
  // Fallback to different service or cached response
  console.log('OpenAI unavailable, using fallback');
}
```

### Manual Recovery

```typescript
// Service recovery toolkit
class ServiceRecovery {
  async recoverService(serviceId) {
    console.log(`Starting recovery for ${serviceId}...`);
    
    // 1. Test basic connectivity
    const connectivity = await this.testConnectivity(serviceId);
    if (!connectivity.success) {
      throw new Error(`Cannot reach ${serviceId}: ${connectivity.error}`);
    }
    
    // 2. Validate configuration
    const config = await this.validateConfig(serviceId);
    if (!config.valid) {
      throw new Error(`Invalid config for ${serviceId}: ${config.errors.join(', ')}`);
    }
    
    // 3. Test authentication
    const auth = await this.testAuthentication(serviceId);
    if (!auth.success) {
      throw new Error(`Authentication failed for ${serviceId}: ${auth.error}`);
    }
    
    // 4. Restart monitoring
    await this.restartMonitoring(serviceId);
    
    console.log(`Recovery completed for ${serviceId}`);
    return { success: true, timestamp: new Date() };
  }
  
  async testConnectivity(serviceId) {
    // Implementation specific to each service
  }
  
  async validateConfig(serviceId) {
    // Validate service configuration
  }
  
  async testAuthentication(serviceId) {
    // Test API key validity
  }
  
  async restartMonitoring(serviceId) {
    // Restart health monitoring
  }
}
```

## Support Escalation

### When to Escalate

1. **Service completely down** for > 15 minutes
2. **Multiple services affected** simultaneously  
3. **Data integrity issues** detected
4. **Security incidents** suspected
5. **Customer-facing features** impacted

### Escalation Contacts

```typescript
// Emergency contact system
const escalationContacts = {
  'openai': {
    status: 'https://status.openai.com/',
    support: 'https://help.openai.com/',
    emergency: 'support@openai.com'
  },
  'anthropic': {
    status: 'https://status.anthropic.com/',
    support: 'https://support.anthropic.com/',
    emergency: 'support@anthropic.com'
  },
  'stripe': {
    status: 'https://status.stripe.com/',
    support: 'https://support.stripe.com/',
    emergency: '+1-888-963-8442'
  }
};

async function escalateIssue(serviceId, issue) {
  const contacts = escalationContacts[serviceId];
  if (!contacts) {
    console.error(`No escalation contacts for ${serviceId}`);
    return;
  }
  
  // Check service status page first
  console.log(`Check status: ${contacts.status}`);
  
  // Prepare escalation data
  const escalationData = {
    service: serviceId,
    issue: issue.description,
    impact: issue.impact,
    timestamp: new Date(),
    affectedUsers: issue.affectedUsers,
    troubleshootingSteps: issue.attemptedSolutions
  };
  
  console.log('Escalation data:', escalationData);
  console.log(`Contact support: ${contacts.support}`);
  
  // Send internal alert
  await sendInternalAlert(escalationData);
}
```

## Prevention Strategies

### Proactive Monitoring

```typescript
// Comprehensive monitoring setup
async function setupProactiveMonitoring() {
  const registry = new ServiceRegistry();
  
  // Monitor all services every 5 minutes
  setInterval(async () => {
    const health = await registry.getAllServiceHealth();
    
    for (const [serviceId, status] of health) {
      // Alert on degraded performance
      if (status.responseTimeMs > 5000) {
        console.warn(`${serviceId} slow response: ${status.responseTimeMs}ms`);
      }
      
      // Alert on error rate
      if (status.errorRate > 0.1) {
        console.warn(`${serviceId} high error rate: ${status.errorRate * 100}%`);
      }
    }
  }, 300000);
  
  // Daily health report
  setInterval(async () => {
    const summary = registry.getSystemHealthSummary();
    console.log('Daily Health Report:', summary);
  }, 86400000);
}
```

### Capacity Planning

```typescript
// Monitor usage trends
class CapacityMonitor {
  private usage = new Map();
  
  trackUsage(serviceId, tokens, cost) {
    const today = new Date().toDateString();
    const key = `${serviceId}_${today}`;
    
    if (!this.usage.has(key)) {
      this.usage.set(key, { tokens: 0, cost: 0, requests: 0 });
    }
    
    const current = this.usage.get(key);
    current.tokens += tokens;
    current.cost += cost;
    current.requests += 1;
  }
  
  predictUsage(serviceId, days = 30) {
    const historical = this.getHistoricalUsage(serviceId, days);
    const trend = this.calculateTrend(historical);
    
    return {
      predictedTokens: trend.tokens * 1.2, // 20% buffer
      predictedCost: trend.cost * 1.2,
      recommendation: this.getRecommendation(trend)
    };
  }
  
  getRecommendation(trend) {
    if (trend.growth > 0.5) {
      return 'Consider upgrading plan or implementing caching';
    }
    if (trend.growth < -0.2) {
      return 'Consider downgrading plan to reduce costs';
    }
    return 'Current usage is stable';
  }
}
```

This troubleshooting guide provides comprehensive coverage of common issues and their solutions. Keep it updated as new issues are discovered and resolved.