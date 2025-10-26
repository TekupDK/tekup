# TekUp Unified Code Standards

**Version:** 1.0.0  
**Dato:** 16. oktober 2025  
**Baseret på:** Analyse af Tekup-Billy, RenOS Backend, RenOS Frontend, TekupVault  
**Analyseret med:** Qwen 2.5 Coder 14B

---

## 🎯 Purpose

Dette dokument definerer unified coding standards for alle TekUp projekter baseret på faktiske patterns fundet i eksisterende production code.

**Repositories Analyseret:**
- ✅ Tekup-Billy (MCP Server, TypeScript)
- ✅ RenOS Backend (API, TypeScript + Prisma)
- ✅ RenOS Frontend (React, TypeScript)
- ✅ TekupVault (Monorepo, TypeScript)

---

## 📝 TypeScript Standards

### Naming Conventions

**Functions & Variables:** camelCase
```typescript
function listInvoices() { }
const apiClient = new RenOSApiClient();
let userCount = 0;
```

**Classes & Interfaces:** PascalCase
```typescript
class BillyClient { }
interface BillyInvoice { }
type CustomerInput = { };
```

**Constants:** UPPER_SNAKE_CASE
```typescript
const API_VERSION = 'v1';
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;
```

**Private Methods/Properties:** camelCase with private keyword
```typescript
class MyClass {
  private async initializeClient() { }
  private rateLimiter: RateLimiter;
}
```

**Routers & Middleware:** camelCase + Suffix
```typescript
const dashboardRouter = express.Router();
const authenticateMiddleware = (req, res, next) => { };
```

### Interface vs Type

**Use Interfaces For:**
- Domain models (entities)
```typescript
interface BillyInvoice { id: string; amount: number; }
interface Customer { name: string; email: string; }
```

**Use Types For:**
- Unions og enums
```typescript
type InvoiceState = 'draft' | 'approved' | 'sent' | 'paid';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

- Complex combinations
```typescript
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
```

- Utility types
```typescript
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
```

### Import Organization

**Standard Order:**
```typescript
// 1. Critical setup (if any)
import "./instrument"; // Sentry

// 2. External dependencies
import express from 'express';
import axios from 'axios';
import { z } from 'zod';

// 3. Internal modules
import { BillyClient } from './billy-client.js';
import { validateEnvironment } from './config.js';

// 4. Types (grouped)
import type { Express, Request, Response } from 'express';
import { BillyInvoice, Customer } from './types.js';

// 5. Tool/route imports (grouped)
import * as invoiceTools from './tools/invoices.js';
import * as customerTools from './tools/customers.js';
```

**Note:** Use .js extensions for ES modules

### Export Patterns

**Prefer Named Exports:**
```typescript
export function listInvoices() { }
export class BillyClient { }
export const apiClient = new ApiClient();
```

**Default Exports Only For:**
- React components
- Express routers (sometimes)

```typescript
export default function Dashboard() { }
export default router;
```

### Generics Usage

**API Methods:**
```typescript
async get<T>(url: string): Promise<T> {
  const response: AxiosResponse<T> = await this.client.get(url);
  return response.data;
}
```

**Tool Wrappers:**
```typescript
async wrapTool<T>(
  toolName: string,
  action: 'read' | 'create',
  toolFn: (client: Client, args: any) => Promise<T>,
  args: any
): Promise<T> { }
```

---

## ⚠️ Error Handling

### Error Class Hierarchy

```typescript
// Base error
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific errors
class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class ApiError extends AppError {
  constructor(
    message: string,
    public apiDetails?: any
  ) {
    super(message, 500, 'API_ERROR');
  }
}
```

### Try/Catch Pattern

**Async Functions Always Wrapped:**
```typescript
export async function createInvoice(client: Client, args: unknown) {
  try {
    // Validate input
    const validated = schema.parse(args);
    
    // Execute operation
    const result = await client.create(validated);
    
    // Return success
    return { success: true, data: result };
  } catch (error) {
    // Enhanced error with context
    log.error('Create invoice failed', error, {
      args,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw with enhancement
    throw new ApiError(
      error.message || 'Failed to create invoice',
      { originalError: error, args }
    );
  }
}
```

### Axios Interceptors

**Response Interceptor Pattern:**
```typescript
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error details
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      apiErrorCode: error.response?.data?.errorCode,
      validationErrors: error.response?.data?.errors
    };
    
    // Log with context
    log.error('API Error', error, errorDetails);
    
    // Frontend: Show toast
    if (typeof toast !== 'undefined') {
      toast.error(getUserFriendlyMessage(error.response?.status));
    }
    
    // Re-throw
    return Promise.reject(error);
  }
);
```

### Structured Logging

**Winston (Backend):**
```typescript
import { log } from './utils/logger.js';

log.error('Operation failed', error, {
  context: 'createInvoice',
  args,
  timestamp: new Date().toISOString()
});
```

**Pino (Backend):**
```typescript
import { logger } from './logger';

logger.error({ err: error, context: 'operation' }, 'Operation failed');
```

### User-Facing Messages

**Frontend (Toast):**
```typescript
switch (error.response.status) {
  case 400: toast.error('Invalid request. Please check your input.');
  case 401: toast.error('Please log in to continue.');
  case 403: toast.error('You do not have permission.');
  case 404: toast.error('Resource not found.');
  case 500: toast.error('Server error. Please try again later.');
  default: toast.error(error.response.data?.message || 'An error occurred.');
}
```

**Backend (Enhanced Error):**
```typescript
const enhancedError: any = new Error(
  error.response?.data?.message || 
  error.message || 
  'Operation failed'
);
enhancedError.details = errorDetails;
throw enhancedError;
```

---

## 🔌 API Integration

### HTTP Client Pattern

**Class-Based Axios Client:**
```typescript
export class ApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string, timeout = 30000) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Setup interceptors
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request: Add auth
    this.client.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response: Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }
  
  private handleError(error: any) {
    // Error handling logic
    return Promise.reject(error);
  }
  
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }
  
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
}
```

### Request/Response Typing

**Generic Methods:**
```typescript
// Type-safe API calls
const invoices = await api.get<BillyInvoice[]>('/invoices');
const newInvoice = await api.post<BillyInvoice>('/invoices', data);
```

**Request Validation:**
```typescript
const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive()
});

const validated = schema.parse(input); // Throws if invalid
```

### Retry Logic

**Exponential Backoff:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      const delay = Math.min(1000 * 2 ** attempt, 60000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Timeout Handling

**Standard Timeout:** 30 seconds
```typescript
axios.create({ timeout: 30000 })
```

**Custom per Request:**
```typescript
await client.get('/slow-endpoint', { timeout: 60000 });
```

---

## 📂 Code Organization

### File Structure

**Backend (Express):**
```
src/
├── index.ts              # Server entry point
├── server.ts             # Express app creation
├── config.ts             # Environment validation
├── types.ts              # Shared types
├── routes/               # Route handlers (per feature)
│   ├── invoices.ts
│   ├── customers.ts
│   └── health.ts
├── middleware/           # Express middleware
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── rateLimiter.ts
├── services/             # Business logic
│   ├── billyService.ts
│   └── emailService.ts
├── tools/                # CLI tools
│   └── testConnection.ts
└── utils/                # Utilities
    └── logger.ts
```

**Frontend (React):**
```
src/
├── components/           # React components
│   ├── ui/              # Shared UI (Radix)
│   ├── pages/           # Page components
│   └── features/        # Feature components
├── api/                 # API client layer
│   ├── client.ts        # Base client
│   ├── customers.ts     # Customer API
│   └── invoices.ts      # Invoice API
├── hooks/               # Custom hooks
│   ├── useApi.ts
│   └── useCustomers.ts
├── lib/                 # Utilities
│   ├── types.ts
│   └── utils.ts
├── types/               # Type definitions
│   └── database.types.ts
└── App.tsx              # Root component
```

**MCP Server:**
```
src/
├── index.ts              # MCP entry (stdio)
├── http-server.ts        # HTTP wrapper
├── client.ts             # External API client
├── config.ts             # Environment config
├── types.ts              # Type definitions
├── tools/                # MCP tool implementations
│   ├── invoices.ts
│   ├── customers.ts
│   └── products.ts
├── middleware/           # Middleware functions
│   └── audit-logger.ts
└── utils/                # Utilities
    └── logger.ts
```

### Module Exports

**Named Exports (Preferred):**
```typescript
// myModule.ts
export function doSomething() { }
export class MyClass { }
export const CONSTANT = 42;

// Usage
import { doSomething, MyClass, CONSTANT } from './myModule.js';
```

**Default Export (Exceptions):**
```typescript
// React component
export default function Dashboard() { }

// Express router (sometimes)
export default router;
```

### Dependency Management

**Package.json Organization:**
```json
{
  "dependencies": {
    // Runtime dependencies only
  },
  "devDependencies": {
    // Build tools, types, testing
    "@types/*": "...",
    "typescript": "...",
    "vitest": "..."
  }
}
```

**Version Pinning:**
- Use `^` for minor updates: `"zod": "^3.22.0"`
- Pin exact versions for critical deps if needed

### Configuration Handling

**Zod Validation (Standard):**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  API_KEY: z.string().min(1, 'API_KEY is required'),
  API_BASE: z.string().url().default('https://api.example.com'),
  DRY_RUN: z.string().optional().transform(val => val === 'true'),
  TIMEOUT: z.string().transform(val => parseInt(val || '30000'))
});

export function getConfig() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing/invalid env vars: ${missing}`);
    }
    throw error;
  }
}
```

---

## 🛡️ Security Standards

### Authentication

**Multiple Methods Support:**
```typescript
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
    || req.headers['authorization']?.replace('Bearer ', '')
    || req.query.apiKey;
    
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

### Security Headers

**Standard Headers (All Express Apps):**
```typescript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet()); // Security headers
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));
```

**Advanced Headers (RenOS Pattern):**
```typescript
// CSP, HSTS, X-Frame-Options, etc.
res.setHeader('Content-Security-Policy', "default-src 'self'; ...");
res.setHeader('Strict-Transport-Security', 'max-age=31536000');
```

### Rate Limiting

**Custom Rate Limiter (Billy Pattern):**
```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = /* calculate */;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

**Express Middleware (Simple):**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

---

## 🧪 Testing Standards

### Framework Choice
**Vitest (Preferred):**
- Modern, fast
- Used by: TekupVault, RenOS Backend

**Jest (Legacy):**
- Older projects

### Test Organization
```
tests/
├── integration/          # Integration tests
│   └── api.test.ts
├── unit/                 # Unit tests
│   └── utils.test.ts
└── e2e/                  # End-to-end tests
    └── workflow.test.ts
```

### Test Naming
```typescript
describe('BillyClient', () => {
  describe('createInvoice', () => {
    it('should create invoice with valid data', async () => { });
    it('should throw on invalid data', async () => { });
    it('should handle API errors gracefully', async () => { });
  });
});
```

---

## 📊 Logging Standards

### Framework Choice

**Pino (High Performance):**
```typescript
import { logger } from './logger';

logger.info({ userId: '123' }, 'User logged in');
logger.error({ err: error }, 'Operation failed');
```

**Winston (Feature Rich):**
```typescript
import { log } from './utils/logger';

log.info('Operation started', { context: 'invoices' });
log.error('Operation failed', error, { context, args });
```

### Log Levels
- `error` - Failures requiring attention
- `warn` - Potential issues
- `info` - Important operations
- `debug` - Detailed debugging (dev only)

### Structured Logging
**Always include context:**
```typescript
log.info('Invoice created', {
  invoiceId: invoice.id,
  customerId: customer.id,
  amount: invoice.total,
  duration: Date.now() - startTime
});
```

---

## 🗄️ Database Standards (Prisma)

### Schema Conventions

**Model Naming:** PascalCase
```prisma
model Customer { }
model BillyInvoice { }
```

**Field Naming:** camelCase
```prisma
model Lead {
  id          String
  customerId  String
  createdAt   DateTime
}
```

**Relations:**
```prisma
model Lead {
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

### Indexes
**Always index:**
- Foreign keys
- Fields used in WHERE clauses
- Composite keys for complex queries

```prisma
@@index([customerId])
@@index([status, createdAt])
@@index([email])
```

---

## 📦 Project Standards

### Package Manager
- **Default:** npm
- **Monorepo:** pnpm (TekupVault)
- **Performance:** pnpm preferred for large projects

### Scripts Organization

**Standard Scripts:**
```json
{
  "scripts": {
    "dev": "...",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  }
}
```

**Feature Scripts (Grouped):**
```json
{
  "scripts": {
    // Database
    "db:migrate": "...",
    "db:generate": "...",
    "db:studio": "...",
    
    // Customer
    "customer:list": "...",
    "customer:create": "..."
  }
}
```

---

## 🎯 Summary

### Universal Standards Across All TekUp Projects

| Standard | Pattern | Mandatory |
|----------|---------|-----------|
| Language | TypeScript 5.3+ | ✅ |
| Validation | Zod 3.22+ | ✅ |
| HTTP Client | Axios with interceptors | ✅ |
| Logging | Pino or Winston | ✅ |
| Error Handling | Try/catch + enhanced errors | ✅ |
| Security | Helmet + CORS + Rate Limit | ✅ |
| Testing | Vitest (new) or Jest (legacy) | ✅ |
| Linting | ESLint + TypeScript ESLint | ✅ |
| Formatting | Prettier | Recommended |

---

## 📋 Checklist for New TekUp Projects

### Setup
- [ ] TypeScript 5.3+ with strict mode
- [ ] Install Zod for validation
- [ ] Setup ESLint + Prettier
- [ ] Choose logger (Pino or Winston)

### Code Standards
- [ ] Follow naming conventions
- [ ] Use interfaces for domain models
- [ ] Zod schemas for all inputs
- [ ] Axios client with interceptors
- [ ] Try/catch on all async functions

### Security
- [ ] Helmet for security headers
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] API key authentication
- [ ] Input validation

### Documentation
- [ ] README with setup instructions
- [ ] API documentation (if applicable)
- [ ] Environment variables documented (.env.example)

---

**Version:** 1.0.0  
**Maintained By:** TekUp Team  
**Last Updated:** 2025-10-16  
**Status:** ✅ Production Standard

