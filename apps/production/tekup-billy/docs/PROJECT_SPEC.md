# Tekup-Billy MCP Server - Project Specification

## Project Overview

**Purpose**: Create a standalone MCP (Model Context Protocol) server that exposes Billy.dk accounting API to AI agents and LLM models.

**Target Directory**: C:\Users\empir\Tekup-Billy

**Technology Stack**:
- TypeScript
- Node.js (v18+)
- @modelcontextprotocol/sdk
- axios for HTTP requests
- zod for validation

---

## Core Features

### 1. Invoice Management

- Create invoices
- Send invoices to customers
- Get invoice status
- List invoices (filtered by date, status, customer)
- Get invoice PDF

### 2. Customer Management  

- List customers
- Create customer
- Get customer details
- Update customer info

### 3. Products/Services

- List products
- Create product
- Update product pricing

### 4. Revenue Analytics

- Get revenue for date range
- Get payment statistics
- Get overdue invoices

### 5. Payment Tracking

- Check payment status
- Get payment history
- Send payment reminders

---

## Project Structure

\\\
C:\Users\empir\Tekup-Billy/
 src/
    index.ts                 # MCP server entry point
    billy-client.ts          # Billy.dk API wrapper
    types.ts                 # TypeScript types & interfaces
    config.ts                # Configuration & validation
    tools/
        invoices.ts          # Invoice tools
        customers.ts         # Customer tools
        products.ts          # Product tools
        revenue.ts           # Revenue analytics tools
        payments.ts          # Payment tracking tools
 package.json
 tsconfig.json
 .env.example
 .gitignore
 README.md
\\\

---

## Technical Requirements

### package.json dependencies

\\\json
{
  "name": "@tekup/billy-mcp",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
\\\

### Environment Variables (.env)

\\\ash
BILLY_API_KEY=your_billy_api_key_here
BILLY_ORGANIZATION_ID=your_organization_id
BILLY_API_BASE=<https://api.billysbilling.com/v2>
\\\

---

## Billy.dk API Reference

**Base URL**: <https://api.billysbilling.com/v2>

**Authentication**: X-Access-Token header

### Key Endpoints

#### Invoices

- GET /invoices - List invoices
- POST /invoices - Create invoice
- GET /invoices/:id - Get invoice details
- POST /invoices/:id/send - Send invoice to customer
- GET /invoices/:id/pdf - Download PDF

#### Contacts (Customers)

- GET /contacts - List contacts
- POST /contacts - Create contact
- GET /contacts/:id - Get contact details
- PUT /contacts/:id - Update contact

#### Products

- GET /products - List products
- POST /products - Create product
- GET /products/:id - Get product details
- PUT /products/:id - Update product

#### Organizations

- GET /organization - Get organization details

---

## MCP Tools to Implement

### 1. Invoice Tools (tools/invoices.ts)

#### illy_create_invoice

\\\ ypescript
{
  name: "billy_create_invoice",
  description: "Create a new invoice in Billy.dk",
  inputSchema: {
    type: "object",
    properties: {
      contactId: { type: "string", description: "Customer contact ID" },
      entryDate: { type: "string", description: "Invoice date (YYYY-MM-DD)" },
      paymentTermsDays: { type: "number", description: "Payment terms in days (default: 14)" },
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            productId: { type: "string", optional: true }
          }
        }
      }
    },
    required: ["contactId", "entryDate", "lines"]
  }
}
\\\

#### illy_list_invoices

\\\ ypescript
{
  name: "billy_list_invoices",
  description: "List invoices with optional filters",
  inputSchema: {
    type: "object",
    properties: {
      startDate: { type: "string", description: "Filter from date (YYYY-MM-DD)" },
      endDate: { type: "string", description: "Filter to date (YYYY-MM-DD)" },
      state: {
        type: "string",
        enum: ["draft", "approved", "sent", "paid", "cancelled"],
        description: "Filter by invoice state"
      },
      contactId: { type: "string", description: "Filter by customer" }
    }
  }
}
\\\

#### illy_get_invoice

\\\ ypescript
{
  name: "billy_get_invoice",
  description: "Get detailed invoice information",
  inputSchema: {
    type: "object",
    properties: {
      invoiceId: { type: "string", description: "Billy invoice ID" }
    },
    required: ["invoiceId"]
  }
}
\\\

#### illy_send_invoice

\\\ ypescript
{
  name: "billy_send_invoice",
  description: "Send invoice email to customer",
  inputSchema: {
    type: "object",
    properties: {
      invoiceId: { type: "string", description: "Billy invoice ID" },
      message: { type: "string", description: "Optional message to customer" }
    },
    required: ["invoiceId"]
  }
}
\\\

### 2. Customer Tools (tools/customers.ts)

#### illy_list_customers

\\\ ypescript
{
  name: "billy_list_customers",
  description: "List all customers/contacts",
  inputSchema: {
    type: "object",
    properties: {
      search: { type: "string", description: "Search by name or email" }
    }
  }
}
\\\

#### illy_create_customer

\\\ ypescript
{
  name: "billy_create_customer",
  description: "Create a new customer contact",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      address: {
        type: "object",
        properties: {
          street: { type: "string" },
          zipcode: { type: "string" },
          city: { type: "string" },
          country: { type: "string", default: "DK" }
        }
      }
    },
    required: ["name", "email"]
  }
}
\\\

#### illy_get_customer

\\\ ypescript
{
  name: "billy_get_customer",
  description: "Get customer details",
  inputSchema: {
    type: "object",
    properties: {
      contactId: { type: "string", description: "Customer contact ID" }
    },
    required: ["contactId"]
  }
}
\\\

### 3. Revenue Tools (tools/revenue.ts)

#### illy_get_revenue

\\\ ypescript
{
  name: "billy_get_revenue",
  description: "Get revenue statistics for a date range",
  inputSchema: {
    type: "object",
    properties: {
      startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
      endDate: { type: "string", description: "End date (YYYY-MM-DD)" }
    },
    required: ["startDate", "endDate"]
  }
}
// Returns: { totalRevenue, paidInvoices, pendingInvoices, overdueInvoices }
\\\

### 4. Product Tools (tools/products.ts)

#### illy_list_products

\\\ ypescript
{
  name: "billy_list_products",
  description: "List all products/services",
  inputSchema: {
    type: "object",
    properties: {
      search: { type: "string" }
    }
  }
}
\\\

#### illy_create_product

\\\ ypescript
{
  name: "billy_create_product",
  description: "Create a new product/service",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      prices: {
        type: "array",
        items: {
          type: "object",
          properties: {
            unitPrice: { type: "number" },
            currencyId: { type: "string", default: "DKK" }
          }
        }
      }
    },
    required: ["name", "prices"]
  }
}
\\\

---

## Implementation Reference

### Example: billy-client.ts structure

\\\ ypescript
import axios, { AxiosInstance } from 'axios';

export class BillyClient {
  private client: AxiosInstance;

  constructor(apiKey: string, organizationId: string) {
    this.client = axios.create({
      baseURL: '<https://api.billysbilling.com/v2>',
      headers: {
        'X-Access-Token': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // Invoices
  async listInvoices(params?: any) { /*... */ }
  async createInvoice(data: any) { /* ... */ }
  async getInvoice(id: string) { /* ... */ }
  async sendInvoice(id: string, message?: string) { /* ...*/ }

  // Customers
  async listContacts(params?: any) { /*... */ }
  async createContact(data: any) { /* ... */ }
  async getContact(id: string) { /* ...*/ }

  // Products
  async listProducts(params?: any) { /*... */ }
  async createProduct(data: any) { /* ...*/ }

  // Revenue analytics
  async getRevenueData(startDate: string, endDate: string) { /*...*/ }
}
\\\

### Example: index.ts MCP server

\\\ ypescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BillyClient } from './billy-client.js';

const server = new Server(
  {
    name: 'tekup-billy',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Billy client
const billy = new BillyClient(
  process.env.BILLY_API_KEY!,
  process.env.BILLY_ORGANIZATION_ID!
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Invoice tools
    { name: 'billy_create_invoice', /*... */ },
    { name: 'billy_list_invoices', /* ...*/ },
    // ... etc
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'billy_create_invoice':
      return await billy.createInvoice(args);
    // ... handle other tools
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
\\\

---

## Security Considerations

1. **Never commit API keys** - Use .env file (add to .gitignore)
2. **Validate all inputs** - Use Zod schemas
3. **Rate limiting** - Billy.dk has API limits
4. **Error handling** - Graceful failures with helpful messages
5. **Logging** - Log operations but NOT sensitive data

---

## Existing Reference Code

You can reference the existing Billy integration in RenOS:
- File: C:\Users\empir\Tekup Google AI\src\services\billyService.ts
- This has working Billy.dk API calls you can adapt

Key patterns to reuse:
\\\ ypescript
// Authentication
headers: {
  'X-Access-Token': apiKey
}

// Date filtering
params: {
  organizationId: orgId,
  entryDateGte: startDate,
  entryDateLte: endDate
}

// Invoice states
state: 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled'
\\\

---

## Setup Checklist for Trae.AI Copilot

1. [ ] Create package.json with dependencies
2. [ ] Setup TypeScript (tsconfig.json)
3. [ ] Create .env.example with required variables
4. [ ] Implement billy-client.ts (API wrapper)
5. [ ] Create types.ts (interfaces for Billy API)
6. [ ] Implement MCP server in index.ts
7. [ ] Create invoice tools (5 tools)
8. [ ] Create customer tools (3 tools)
9. [ ] Create revenue tools (1 tool)
10. [ ] Create product tools (2 tools)
11. [ ] Add error handling & validation
12. [ ] Write README.md with usage examples
13. [ ] Create .gitignore
14. [ ] Test with npx @modelcontextprotocol/inspector

---

## Usage After Implementation

### Add to VS Code mcp.json

\\\json
{
  "mcpServers": {
    "tekup-billy": {
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup-Billy\\dist\\index.js"],
      "env": {
        "BILLY_API_KEY": "your_api_key",
        "BILLY_ORGANIZATION_ID": "your_org_id"
      }
    }
  }
}
\\\

### Example AI Agent Usage

\\\
User: "Opret en faktura til kunde ABC for rengøring 2500 kr"
Agent: *calls billy_create_invoice tool*

User: "Hvad er vores omsætning i januar?"
Agent: *calls billy_get_revenue tool with date range*

User: "Send faktura #1234 til kunden"
Agent: *calls billy_send_invoice tool*
\\\

---

## Billy.dk API Documentation

Official docs: <https://www.billy.dk/api>

Rate limits:
- 100 requests per minute
- 1000 requests per hour

---

## Success Criteria

- [ ] MCP server starts without errors
- [ ] All 11+ tools are registered
- [ ] Can create invoice via tool call
- [ ] Can list invoices with filters
- [ ] Can retrieve revenue data
- [ ] Can manage customers
- [ ] Error messages are helpful
- [ ] Works in VS Code Copilot Chat
- [ ] Works in other MCP-compatible tools

---

**END OF SPECIFICATION**
