# Stripe Integration Guide

Complete integration guide for Stripe payment processing in the TekUp.org platform.

## Overview

Stripe provides comprehensive payment processing capabilities including one-time payments, subscriptions, invoicing, and financial reporting. This integration enables secure payment handling across all TekUp applications.

## Quick Start

### 1. Get API Keys
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Navigate to Developers > API keys
4. Copy your keys:
   - **Publishable key** (starts with `pk_`) - for client-side
   - **Secret key** (starts with `sk_`) - for server-side

### 2. Configure Environment
```bash
# Add to your .env file
STRIPE_SECRET_KEY=sk_test_your-secret-key-here
STRIPE_PUBLIC_KEY=pk_test_your-public-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

### 3. Register Service
```typescript
import { ServiceRegistry } from '@tekup/service-registry';

const registry = new ServiceRegistry();
await registry.registerService({
  id: 'stripe',
  name: 'Stripe',
  type: 'payment',
  provider: 'Stripe',
  baseUrl: 'https://api.stripe.com/v1',
  apiKey: process.env.STRIPE_SECRET_KEY,
  apiKeyHeader: 'Authorization',
  apiKeyPrefix: 'Bearer'
});
```

## Authentication

Stripe uses Bearer token authentication with your secret key:

```typescript
const headers = {
  'Authorization': `Bearer ${secretKey}`,
  'Content-Type': 'application/x-www-form-urlencoded'
};
```

## Core Concepts

### Customers
Represent your users in Stripe:

```typescript
// Create customer
const customer = await fetch('https://api.stripe.com/v1/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    email: 'customer@example.com',
    name: 'John Doe',
    metadata: JSON.stringify({ userId: '123' })
  })
});

// Retrieve customer
const customer = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
  headers: {
    'Authorization': `Bearer ${secretKey}`
  }
});
```

### Payment Intents
For one-time payments:

```typescript
// Create payment intent
const paymentIntent = await fetch('https://api.stripe.com/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    amount: '2000', // $20.00 in cents
    currency: 'dkk',
    customer: customerId,
    metadata: JSON.stringify({ orderId: 'order_123' })
  })
});

// Confirm payment intent
const confirmed = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    payment_method: paymentMethodId
  })
});
```

### Subscriptions
For recurring payments:

```typescript
// Create subscription
const subscription = await fetch('https://api.stripe.com/v1/subscriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    customer: customerId,
    items: JSON.stringify([{ price: priceId }]),
    payment_behavior: 'default_incomplete',
    expand: JSON.stringify(['latest_invoice.payment_intent'])
  })
});
```

## Usage Examples

### Complete Payment Flow

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

class StripeService {
  constructor(private registry: ServiceRegistry) {}

  async createCustomer(email, name, metadata = {}) {
    const service = this.registry.getService('stripe');
    if (!service) throw new Error('Stripe service not configured');

    const response = await fetch(`${service.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        email,
        name,
        metadata: JSON.stringify(metadata)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${error.error.message}`);
    }

    return await response.json();
  }

  async createPaymentIntent(amount, currency = 'dkk', customerId, metadata = {}) {
    const service = this.registry.getService('stripe');
    
    const response = await fetch(`${service.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency,
        customer: customerId,
        metadata: JSON.stringify(metadata),
        automatic_payment_methods: JSON.stringify({ enabled: true })
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${error.error.message}`);
    }

    return await response.json();
  }

  async createSubscription(customerId, priceId, metadata = {}) {
    const service = this.registry.getService('stripe');
    
    const response = await fetch(`${service.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        items: JSON.stringify([{ price: priceId }]),
        payment_behavior: 'default_incomplete',
        expand: JSON.stringify(['latest_invoice.payment_intent']),
        metadata: JSON.stringify(metadata)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe error: ${error.error.message}`);
    }

    return await response.json();
  }
}

// Usage
const stripe = new StripeService(registry);

// Create customer
const customer = await stripe.createCustomer(
  'customer@example.com',
  'John Doe',
  { userId: '123', plan: 'pro' }
);

// Create one-time payment
const paymentIntent = await stripe.createPaymentIntent(
  5000, // 50 DKK
  'dkk',
  customer.id,
  { orderId: 'order_123', service: 'consulting' }
);

// Create subscription
const subscription = await stripe.createSubscription(
  customer.id,
  'price_1234567890',
  { plan: 'monthly_pro' }
);
```

### Webhook Handling

```typescript
import crypto from 'crypto';

class StripeWebhookHandler {
  constructor(private webhookSecret: string) {}

  verifyWebhook(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    const signatureHeader = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureHeader.v1 || '')
    );
  }

  async handleWebhook(payload: string, signature: string) {
    if (!this.verifyWebhook(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSuccess(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    console.log('Payment succeeded:', paymentIntent.id);
    // Update order status, send confirmation email, etc.
  }

  private async handlePaymentFailure(paymentIntent: any) {
    console.log('Payment failed:', paymentIntent.id);
    // Notify customer, retry payment, etc.
  }

  private async handleSubscriptionCreated(subscription: any) {
    console.log('Subscription created:', subscription.id);
    // Activate user account, send welcome email, etc.
  }

  private async handleSubscriptionUpdated(subscription: any) {
    console.log('Subscription updated:', subscription.id);
    // Update user permissions, notify of changes, etc.
  }

  private async handleSubscriptionCanceled(subscription: any) {
    console.log('Subscription canceled:', subscription.id);
    // Deactivate features, send cancellation email, etc.
  }

  private async handleInvoicePaymentSuccess(invoice: any) {
    console.log('Invoice payment succeeded:', invoice.id);
    // Update subscription status, send receipt, etc.
  }

  private async handleInvoicePaymentFailure(invoice: any) {
    console.log('Invoice payment failed:', invoice.id);
    // Retry payment, notify customer, etc.
  }
}

// Express.js webhook endpoint
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  const payload = req.body.toString();

  try {
    const webhookHandler = new StripeWebhookHandler(process.env.STRIPE_WEBHOOK_SECRET!);
    await webhookHandler.handleWebhook(payload, signature);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});
```

### Client-Side Integration

```typescript
// Frontend payment form
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutForm({ amount, currency = 'dkk' }) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Create payment intent on component mount
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, [amount, currency]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const stripe = await stripePromise;
    const { error } = await stripe!.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`
      }
    });

    if (error) {
      console.error('Payment failed:', error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={loading || !clientSecret}>
        {loading ? 'Processing...' : `Pay ${amount / 100} ${currency.toUpperCase()}`}
      </button>
    </form>
  );
}
```

## Error Handling

Common Stripe errors and how to handle them:

```typescript
function handleStripeError(error: any) {
  switch (error.type) {
    case 'card_error':
      // Card was declined
      return {
        message: 'Your card was declined. Please try a different payment method.',
        code: 'CARD_DECLINED'
      };

    case 'rate_limit_error':
      // Too many requests
      return {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED'
      };

    case 'invalid_request_error':
      // Invalid parameters
      return {
        message: 'Invalid request. Please check your payment details.',
        code: 'INVALID_REQUEST'
      };

    case 'authentication_error':
      // Authentication failed
      return {
        message: 'Authentication failed. Please contact support.',
        code: 'AUTH_FAILED'
      };

    case 'api_connection_error':
      // Network error
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      };

    case 'api_error':
      // Stripe API error
      return {
        message: 'Payment service error. Please try again later.',
        code: 'API_ERROR'
      };

    default:
      return {
        message: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN_ERROR'
      };
  }
}

// Usage in payment processing
try {
  const paymentIntent = await stripe.createPaymentIntent(amount, currency, customerId);
  return { success: true, paymentIntent };
} catch (error) {
  const handledError = handleStripeError(error);
  console.error('Payment error:', handledError);
  return { success: false, error: handledError };
}
```

## Rate Limits

Stripe has the following rate limits:

| API | Rate Limit |
|-----|------------|
| Standard API | 100 requests/second |
| Connect API | 100 requests/second |
| Webhook endpoints | 1000 requests/second |

### Rate Limit Handling

```typescript
async function callStripeWithRetry(apiCall: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.type === 'rate_limit_error' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Usage
const customer = await callStripeWithRetry(() => 
  stripe.createCustomer(email, name, metadata)
);
```

## Monitoring & Health Checks

### Health Check Implementation

```typescript
async function checkStripeHealth() {
  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    });

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: response.headers.get('x-response-time'),
      statusCode: response.status
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}
```

### Payment Analytics

```typescript
class StripeAnalytics {
  private metrics = {
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    averagePaymentAmount: 0,
    subscriptions: {
      active: 0,
      canceled: 0,
      pastDue: 0
    }
  };

  trackPayment(amount: number, currency: string, status: 'succeeded' | 'failed') {
    this.metrics.totalPayments++;
    
    if (status === 'succeeded') {
      this.metrics.successfulPayments++;
      this.metrics.totalRevenue += amount;
      this.metrics.averagePaymentAmount = 
        this.metrics.totalRevenue / this.metrics.successfulPayments;
    } else {
      this.metrics.failedPayments++;
    }
  }

  trackSubscription(status: 'active' | 'canceled' | 'past_due') {
    this.metrics.subscriptions[status]++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulPayments / this.metrics.totalPayments,
      failureRate: this.metrics.failedPayments / this.metrics.totalPayments
    };
  }

  async generateReport(startDate: Date, endDate: Date) {
    // Fetch data from Stripe API for the date range
    const charges = await this.fetchCharges(startDate, endDate);
    const subscriptions = await this.fetchSubscriptions(startDate, endDate);
    
    return {
      period: { start: startDate, end: endDate },
      charges: this.analyzeCharges(charges),
      subscriptions: this.analyzeSubscriptions(subscriptions),
      revenue: this.calculateRevenue(charges)
    };
  }

  private async fetchCharges(startDate: Date, endDate: Date) {
    // Implementation to fetch charges from Stripe
  }

  private async fetchSubscriptions(startDate: Date, endDate: Date) {
    // Implementation to fetch subscriptions from Stripe
  }
}
```

## Best Practices

### 1. Security
```typescript
// Always validate webhook signatures
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature.split('=')[1] || '')
  );
}

// Use idempotency keys for critical operations
const idempotencyKey = `payment_${orderId}_${Date.now()}`;
const paymentIntent = await createPaymentIntent(amount, currency, customerId, {
  idempotencyKey
});
```

### 2. Error Recovery
```typescript
// Implement retry logic for failed payments
async function retryFailedPayment(paymentIntentId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await stripe.confirmPaymentIntent(paymentIntentId);
      if (result.status === 'succeeded') {
        return result;
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = attempt * 2000; // Increasing delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Testing
```typescript
// Use test mode for development
const isTestMode = process.env.NODE_ENV !== 'production';
const stripeKey = isTestMode 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_SECRET_KEY;

// Test card numbers for different scenarios
const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  requiresAuthentication: '4000002500003155'
};
```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Fails**
   - Check webhook secret is correct
   - Ensure raw body is used for verification
   - Verify timestamp tolerance

2. **Payment Intent Creation Fails**
   - Validate amount (must be positive integer)
   - Check currency code format
   - Ensure customer exists

3. **Subscription Issues**
   - Verify price ID exists
   - Check customer has valid payment method
   - Ensure proper trial period configuration

### Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

class StripeDebugger {
  static log(operation: string, data: any) {
    if (DEBUG) {
      console.log(`[Stripe Debug] ${operation}:`, {
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data, null, 2)
      });
    }
  }

  static logError(operation: string, error: any) {
    console.error(`[Stripe Error] ${operation}:`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      type: error.type,
      code: error.code,
      stack: DEBUG ? error.stack : undefined
    });
  }
}
```

## Support & Resources

- **Documentation**: [Stripe API Docs](https://stripe.com/docs/api)
- **Status Page**: [Stripe Status](https://status.stripe.com/)
- **Support**: [Stripe Support](https://support.stripe.com/)
- **Community**: [Stripe Discord](https://discord.gg/stripe)
- **Testing**: [Test Card Numbers](https://stripe.com/docs/testing)

## Pricing

Stripe pricing (as of 2024):

| Region | Online Payments | In-Person Payments |
|--------|----------------|-------------------|
| EU | 1.4% + 0.25 EUR | 1.5% + 0.05 EUR |
| Denmark | 1.4% + 2.50 DKK | 1.5% + 0.50 DKK |

Additional fees may apply for:
- International cards: +1.5%
- Currency conversion: +1%
- Disputes: 15.00 EUR
- Refunds: No additional fee

Monitor transaction fees through the Stripe Dashboard and optimize payment flows to minimize costs.