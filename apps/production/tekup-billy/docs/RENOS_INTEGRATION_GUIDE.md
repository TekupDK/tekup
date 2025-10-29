# RenOS Backend Integration Guide

## Overview

This guide explains how to integrate the Tekup-Billy MCP Server with your RenOS backend application.

**Live Service URL:** `https://tekup-billy.onrender.com`  
**Authentication:** Token-based via `X-API-Key` header  
**API Version:** v1  
**Available Tools:** 13 Billy.dk accounting operations

---

## Architecture

```text
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│  RenOS Frontend │────────▶│   RenOS Backend      │────────▶│  Billy MCP  │
│   (Next.js)     │         │   (Node.js/TS)       │         │   Server    │
└─────────────────┘         └──────────────────────┘         └─────────────┘
                                     │                               │
                                     │                               │
                                     ▼                               ▼
                            ┌─────────────────┐           ┌──────────────────┐
                            │  RenOS Database │           │  Billy.dk API    │
                            │   (PostgreSQL)  │           │ (billysbilling)  │
                            └─────────────────┘           └──────────────────┘
```

---

## Step 1: Setup Environment Variables

Add these variables to your RenOS backend `.env` file:

```bash
# Billy MCP Server Configuration
BILLY_MCP_URL=https://tekup-billy.onrender.com
BILLY_MCP_API_KEY=sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr

# Optional: Enable Billy integration features
ENABLE_BILLY_INTEGRATION=true
BILLY_SYNC_INTERVAL=300000  # 5 minutes in milliseconds
```

---

## Step 2: Install TypeScript Client

### Option A: Copy the Client (Recommended)

Copy the TypeScript client from this repository:

```bash
# From Tekup-Billy repository root
cp renos-backend-client/BillyMCPClient.ts ../renos-backend/src/lib/billy/

# Also copy types if needed
cp renos-backend-client/types.ts ../renos-backend/src/lib/billy/
```

### Option B: Install as npm package

If you package it later:

```bash
npm install @tekup/billy-mcp-client
```

---

## Step 3: Initialize the Client

Create a Billy client instance in your RenOS backend:

**File:** `src/lib/billy/client.ts`

```typescript
import { BillyMCPClient } from './BillyMCPClient';

// Initialize client with environment variables
export const billyClient = new BillyMCPClient({
  baseUrl: process.env.BILLY_MCP_URL || 'https://tekup-billy.onrender.com',
  apiKey: process.env.BILLY_MCP_API_KEY!,
  timeout: 30000, // 30 seconds
});

// Test connection on startup
billyClient.testConnection()
  .then(() => console.log('✅ Billy MCP client connected'))
  .catch(err => console.error('❌ Billy MCP connection failed:', err));
```

---

## Step 4: Create API Routes

Add Billy integration routes to your RenOS backend API:

**File:** `src/api/routes/billy.ts`

```typescript
import express from 'express';
import { billyClient } from '../../lib/billy/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// List invoices
router.get('/invoices', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, state } = req.query;
    
    const result = await billyClient.listInvoices({
      page: Number(page),
      pageSize: Number(pageSize),
      state: state as string,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      details: error.message 
    });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const invoiceData = req.body;
    const result = await billyClient.createInvoice(invoiceData);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create invoice',
      details: error.message 
    });
  }
});

// Get invoice by ID
router.get('/invoices/:id', async (req, res) => {
  try {
    const result = await billyClient.getInvoice(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ 
      error: 'Invoice not found',
      details: error.message 
    });
  }
});

// Send invoice via email
router.post('/invoices/:id/send', async (req, res) => {
  try {
    const { email, message } = req.body;
    
    const result = await billyClient.sendInvoice({
      invoiceId: req.params.id,
      email,
      message,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send invoice',
      details: error.message 
    });
  }
});

// List customers
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    
    const result = await billyClient.listCustomers({
      page: Number(page),
      pageSize: Number(pageSize),
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: error.message 
    });
  }
});

// Create customer
router.post('/customers', async (req, res) => {
  try {
    const customerData = req.body;
    const result = await billyClient.createCustomer(customerData);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create customer',
      details: error.message 
    });
  }
});

// List products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    
    const result = await billyClient.listProducts({
      page: Number(page),
      pageSize: Number(pageSize),
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
});

// Get revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const result = await billyClient.getRevenue({
      startDate: startDate as string,
      endDate: endDate as string,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch revenue',
      details: error.message 
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await billyClient.testConnection();
    res.json(health);
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

export default router;
```

**File:** `src/api/index.ts`

```typescript
import express from 'express';
import billyRouter from './routes/billy';

const app = express();

// Mount Billy routes
app.use('/api/billy', billyRouter);

export default app;
```

---

## Step 5: Frontend Integration

Create React hooks for Billy operations:

**File:** `renos-frontend/src/hooks/useBilly.ts`

```typescript
import { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useBillyInvoices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listInvoices = async (params?: { page?: number; pageSize?: number; state?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const response = await fetch(`${BACKEND_URL}/api/billy/invoices?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch invoices');
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/billy/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) throw new Error('Failed to create invoice');
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendInvoice = async (invoiceId: string, email: string, message?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/billy/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, message }),
      });
      
      if (!response.ok) throw new Error('Failed to send invoice');
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    listInvoices,
    createInvoice,
    sendInvoice,
    loading,
    error,
  };
}

export function useBillyCustomers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listCustomers = async (params?: { page?: number; pageSize?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const response = await fetch(`${BACKEND_URL}/api/billy/customers?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/billy/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) throw new Error('Failed to create customer');
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    listCustomers,
    createCustomer,
    loading,
    error,
  };
}
```

---

## Step 6: Example React Component

**File:** `renos-frontend/src/components/InvoiceList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useBillyInvoices } from '@/hooks/useBilly';

export default function InvoiceList() {
  const { listInvoices, loading, error } = useBillyInvoices();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const result = await listInvoices({ page: 1, pageSize: 50 });
      setInvoices(result.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="invoice-list">
      <h2>Invoices</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>State</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice: any) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNo}</td>
              <td>{invoice.contact?.name}</td>
              <td>{invoice.totalAmount} {invoice.currency}</td>
              <td>{invoice.state}</td>
              <td>{new Date(invoice.createdTime).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Available Tools Reference

### Invoices (4 tools)

- **list_invoices** - List all invoices with pagination and filters
- **create_invoice** - Create new invoice
- **get_invoice** - Get invoice by ID
- **send_invoice** - Send invoice via email

### Customers (3 tools)

- **list_customers** - List all customers/contacts
- **create_customer** - Create new customer
- **get_customer** - Get customer by ID

### Products (2 tools)

- **list_products** - List all products
- **create_product** - Create new product

### Revenue (1 tool)

- **get_revenue** - Get revenue analytics with date ranges

### Testing (3 tools)

- **list_test_scenarios** - List available test scenarios
- **run_test_scenario** - Run specific test scenario
- **generate_test_data** - Generate test data

---

## Error Handling

The Billy MCP client throws `BillyMCPClientError` with structured error information:

```typescript
try {
  await billyClient.createInvoice(data);
} catch (error) {
  if (error instanceof BillyMCPClientError) {
    console.error('Billy API Error:', {
      message: error.message,
      statusCode: error.statusCode,
      tool: error.tool,
      response: error.response,
    });
  }
}
```

---

## Rate Limiting

The Billy MCP server has rate limiting enabled:

- **100 requests per 15 minutes** per IP address
- Returns `429 Too Many Requests` when exceeded
- Implement exponential backoff in your retry logic

Example retry logic:

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.statusCode === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Monitoring & Debugging

### Health Check Endpoint

Check Billy MCP server health:

```bash
curl https://tekup-billy.onrender.com/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T17:45:57.376Z",
  "version": "1.0.0",
  "uptime": 67.4395277,
  "billy": {
    "connected": true,
    "organization": "pmf9tU56RoyZdcX3k69z1g"
  }
}
```

### Enable Debug Logging

In your RenOS backend:

```typescript
// Enable debug mode
const billyClient = new BillyMCPClient({
  baseUrl: process.env.BILLY_MCP_URL!,
  apiKey: process.env.BILLY_MCP_API_KEY!,
  debug: true, // Enable debug logging
});
```

---

## Security Best Practices

### 1. Secure API Key Storage

- **Never** commit API keys to Git
- Use environment variables only
- Rotate keys regularly (recommended: every 90 days)

### 2. CORS Configuration

Update Billy MCP server CORS after RenOS backend is deployed:

```bash
# In Render.com dashboard, update environment variable:
CORS_ORIGIN=https://renos-backend.onrender.com
```

### 3. Request Validation

Always validate user input before sending to Billy API:

```typescript
import { z } from 'zod';

const createInvoiceSchema = z.object({
  contactId: z.string().min(1),
  lines: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })),
});

router.post('/invoices', async (req, res) => {
  try {
    const validatedData = createInvoiceSchema.parse(req.body);
    const result = await billyClient.createInvoice(validatedData);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
```

---

## Performance Optimization

### 1. Implement Caching

Cache frequently accessed data:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

async function getCachedCustomers(page: number) {
  const cacheKey = `customers-${page}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  const result = await billyClient.listCustomers({ page });
  cache.set(cacheKey, result);
  
  return result;
}
```

### 2. Batch Operations

Use batch endpoint for multiple operations:

```typescript
const results = await billyClient.batch([
  { tool: 'list_customers', input: { page: 1 } },
  { tool: 'list_products', input: { page: 1 } },
  { tool: 'get_revenue', input: { startDate: '2024-01-01', endDate: '2024-12-31' } },
]);
```

### 3. Pagination

Always use pagination for large datasets:

```typescript
async function getAllInvoices() {
  const allInvoices = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await billyClient.listInvoices({ page, pageSize: 100 });
    allInvoices.push(...result.invoices);
    
    hasMore = result.invoices.length === 100;
    page++;
  }
  
  return allInvoices;
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BillyMCPClient } from '../lib/billy/BillyMCPClient';

describe('Billy MCP Client', () => {
  let client: BillyMCPClient;
  
  beforeEach(() => {
    client = new BillyMCPClient({
      baseUrl: 'https://tekup-billy.onrender.com',
      apiKey: process.env.BILLY_MCP_API_KEY!,
    });
  });
  
  it('should connect to Billy MCP server', async () => {
    const health = await client.testConnection();
    expect(health.status).toBe('healthy');
    expect(health.billy.connected).toBe(true);
  });
  
  it('should list invoices', async () => {
    const result = await client.listInvoices({ page: 1, pageSize: 10 });
    expect(result.invoices).toBeInstanceOf(Array);
  });
  
  it('should handle errors gracefully', async () => {
    await expect(client.getInvoice('invalid-id')).rejects.toThrow();
  });
});
```

---

## Deployment Checklist

- [ ] Copy `BillyMCPClient.ts` to RenOS backend
- [ ] Add environment variables to `.env`
- [ ] Install dependencies (`axios` if not already installed)
- [ ] Create Billy API routes in backend
- [ ] Add authentication middleware to routes
- [ ] Create React hooks for frontend
- [ ] Test all endpoints locally
- [ ] Deploy RenOS backend to production
- [ ] Update CORS_ORIGIN in Billy MCP server
- [ ] Monitor logs for errors
- [ ] Set up health check monitoring

---

## Support & Resources

- **Billy MCP Server:** <https://tekup-billy.onrender.com>
- **GitHub Repository:** <https://github.com/TekupDK/Tekup-Billy>
- **Billy.dk API Docs:** <https://www.billy.dk/api>
- **Service Status:** Check Render.com dashboard

---

## Troubleshooting

### Connection Timeout

```typescript
// Increase timeout for slow operations
const client = new BillyMCPClient({
  baseUrl: process.env.BILLY_MCP_URL!,
  apiKey: process.env.BILLY_MCP_API_KEY!,
  timeout: 60000, // 60 seconds
});
```

### Authentication Failed (401)

- Verify `X-API-Key` header is set correctly
- Check that `BILLY_MCP_API_KEY` environment variable is set
- Ensure no extra spaces in the API key

### Rate Limited (429)

- Implement exponential backoff retry logic
- Reduce request frequency
- Use caching for frequently accessed data

### Service Unavailable (503)

- Check Billy MCP server health: <https://tekup-billy.onrender.com/health>
- Verify Render.com service status
- Check Billy.dk API status

---

**Last Updated:** October 10, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
