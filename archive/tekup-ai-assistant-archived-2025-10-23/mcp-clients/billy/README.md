# Billy MCP Client

TypeScript client for **Tekup-Billy MCP Server** - Production-ready with TekUp unified code standards.

## Features

- ✅ Type-safe wrappers for all Billy MCP tools
- ✅ Enhanced error handling with detailed context
- ✅ Structured logging (Winston)
- ✅ Rate limit awareness (100 req/15min)
- ✅ Environment-based configuration (Zod validation)
- ✅ Generic HTTP methods with TypeScript generics
- ✅ Singleton pattern for easy usage
- ✅ Follows TekUp unified code standards

## Installation

```bash
cd mcp-clients/billy
npm install
npm run build
```

## Configuration

Create `.env` file:

```env
BILLY_MCP_URL=https://tekup-billy.onrender.com
BILLY_MCP_API_KEY=your_mcp_api_key_here
BILLY_MCP_TIMEOUT=30000
BILLY_MCP_DRY_RUN=false
```

## Usage

### Quick Start

```typescript
import { billyClient, invoices, customers, products } from '@tekup/billy-mcp-client';

// Health check
const isHealthy = await billyClient.healthCheck();

// List invoices
const allInvoices = await invoices.listInvoices();

// Create customer
const customer = await customers.createCustomer({
  name: 'Acme Corp',
  email: 'billing@acme.com',
  phone: '+45 12 34 56 78'
});

// Create invoice
const invoice = await invoices.createInvoice({
  contactId: customer.id,
  entryDate: '2025-10-16',
  paymentTermsDays: 30,
  lines: [{
    description: 'Consulting services',
    quantity: 4,
    unitPrice: 850,
    productId: 'product-id-here'
  }]
});

// Send invoice
await invoices.sendInvoice({ invoiceId: invoice.id });
```

### Advanced Usage

```typescript
// Custom client instance
import { BillyMCPClient } from '@tekup/billy-mcp-client';

const customClient = new BillyMCPClient({
  baseURL: 'https://custom-billy-server.com',
  apiKey: 'custom-key',
  timeout: 60000,
  dryRun: false
});

// Call any Billy MCP tool
const result = await customClient.callTool('list_invoices', {
  state: 'approved',
  pageSize: 50
});
```

## Available Tools

### Invoices
- `listInvoices(input?)` - List invoices with filtering
- `createInvoice(input)` - Create new invoice
- `getInvoice(invoiceId)` - Get invoice by ID
- `sendInvoice(input)` - Send invoice to customer
- `updateInvoice(invoiceId, updates)` - Update invoice
- `approveInvoice(invoiceId)` - Approve invoice

### Customers
- `listCustomers(input?)` - List customers
- `createCustomer(input)` - Create new customer
- `getCustomer(customerId)` - Get customer by ID

### Products
- `listProducts(input?)` - List products
- `createProduct(input)` - Create new product

## Error Handling

```typescript
import { BillyApiError } from '@tekup/billy-mcp-client';

try {
  const invoice = await invoices.createInvoice(data);
} catch (error) {
  if (error instanceof BillyApiError) {
    console.error('Billy API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Development

```bash
# Build TypeScript
npm run build

# Development mode
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Architecture

```
Billy MCP Client
├── client.ts         # Main BillyMCPClient class
├── config.ts         # Environment configuration (Zod)
├── logger.ts         # Winston structured logging
├── types.ts          # TypeScript type definitions
└── tools/            # Tool wrappers
    ├── invoices.ts   # Invoice operations
    ├── customers.ts  # Customer operations
    └── products.ts   # Product operations
```

## Code Standards

This client follows **TekUp Unified Code Standards**:
- TypeScript strict mode
- Zod validation for configuration
- Winston structured logging
- Axios with interceptors
- Enhanced error handling
- JSDoc documentation
- Named exports

See: `docs/TEKUP_UNIFIED_CODE_STANDARDS.md`

## Related Projects

- **Tekup-Billy MCP Server:** https://github.com/JonasAbde/Tekup-Billy
- **Live Server:** https://tekup-billy.onrender.com
- **TekUp AI Assistant:** This project

## License

MIT - TekUp Team

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2025-10-16

