# Tekup-Billy MCP HTTP Client

# TypeScript/JavaScript client library for RenOS Backend

Installation for RenOS backend:

```bash
npm install axios
```

Then copy this file to: `renos-backend/src/services/BillyMCPClient.ts`

Usage in RenOS:

```typescript
import { BillyMCPClient } from './services/BillyMCPClient';

// Initialize
const billy = new BillyMCPClient({
  baseURL: process.env.BILLY_MCP_URL, // https://tekup-billy-mcp.onrender.com
  apiKey: process.env.BILLY_MCP_API_KEY
});

// Use in routes
app.get('/api/invoices', async (req, res) => {
  const invoices = await billy.listInvoices({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json(invoices);
});
```
