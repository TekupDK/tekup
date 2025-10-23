# RenOS Integration Quick Start

## 🚀 5-Minute Setup Guide

Get Billy MCP integrated into RenOS in 5 minutes!

---

## Step 1: Copy Client to RenOS Backend (1 min)

```bash
# From Tekup-Billy repo root
cd c:/Users/empir/Tekup-Billy

# Copy TypeScript client to RenOS backend
cp renos-backend-client/BillyMCPClient.ts ../renos-backend/src/lib/billy/
```

---

## Step 2: Add Environment Variables (1 min)

**File:** `renos-backend/.env`

```bash
# Billy MCP Server
BILLY_MCP_URL=https://tekup-billy.onrender.com
BILLY_MCP_API_KEY=sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr
```

---

## Step 3: Initialize Client (1 min)

**File:** `renos-backend/src/lib/billy/client.ts`

```typescript
import { BillyMCPClient } from './BillyMCPClient';

export const billyClient = new BillyMCPClient({
  baseUrl: process.env.BILLY_MCP_URL!,
  apiKey: process.env.BILLY_MCP_API_KEY!,
});

// Test connection
billyClient.testConnection()
  .then(() => console.log('✅ Billy connected'))
  .catch(err => console.error('❌ Billy error:', err));
```

---

## Step 4: Create API Route (2 min)

**File:** `renos-backend/src/api/routes/billy.ts`

```typescript
import express from 'express';
import { billyClient } from '../../lib/billy/client';

const router = express.Router();

// List invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await billyClient.listInvoices({
      page: 1,
      pageSize: 50,
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const invoice = await billyClient.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Mount routes in:** `renos-backend/src/api/index.ts`

```typescript
import billyRouter from './routes/billy';

app.use('/api/billy', billyRouter);
```

---

## Step 5: Test It! (30 sec)

```bash
# Start RenOS backend
npm run dev

# Test in another terminal
curl http://localhost:3001/api/billy/invoices
```

---

## ✅ Done

You now have Billy accounting integration in RenOS!

### Available Endpoints

- `GET /api/billy/invoices` - List invoices
- `POST /api/billy/invoices` - Create invoice
- `GET /api/billy/invoices/:id` - Get invoice
- `POST /api/billy/invoices/:id/send` - Send invoice
- `GET /api/billy/customers` - List customers
- `POST /api/billy/customers` - Create customer
- `GET /api/billy/products` - List products
- `GET /api/billy/revenue` - Get revenue analytics

---

## Next Steps

1. **Add Frontend Integration** - See `RENOS_INTEGRATION_GUIDE.md` Step 5
2. **Add Authentication** - Protect routes with your auth middleware
3. **Add Error Handling** - Implement proper error responses
4. **Deploy to Production** - Deploy RenOS backend and update CORS

---

## Need Help?

See full integration guide: `RENOS_INTEGRATION_GUIDE.md`

---

**Service URL:** <https://tekup-billy.onrender.com>  
**API Key:** `sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr`  
**Status:** ✅ Production Ready
