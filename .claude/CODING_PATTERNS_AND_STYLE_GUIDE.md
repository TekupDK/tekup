# Tekup Coding Patterns & Style Guide

**Generated:** 2025-11-23
**Purpose:** Detailed coding style and patterns extracted from actual codebase
**Based on:** Analysis of 3,506 TypeScript/JavaScript files, service implementations, and git history

---

## Table of Contents

1. [TypeScript/JavaScript Patterns](#typescriptjavascript-patterns)
2. [NestJS Backend Patterns](#nestjs-backend-patterns)
3. [React/Next.js Frontend Patterns](#reactnextjs-frontend-patterns)
4. [Error Handling](#error-handling)
5. [Logging Conventions](#logging-conventions)
6. [API Design](#api-design)
7. [Testing Patterns](#testing-patterns)
8. [File Naming Conventions](#file-naming-conventions)
9. [Import Organization](#import-organization)
10. [Documentation Style](#documentation-style)

---

## TypeScript/JavaScript Patterns

### Strict Type Safety

**Always use strict TypeScript mode:**

```typescript
// ✅ Good: Explicit types
async findOne(id: string): Promise<Customer> {
  const customer = await this.prisma.renosCustomer.findUnique({ where: { id } });
  if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
  return customer;
}

// ✅ Good: Interface definitions for external APIs
export interface BillyCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  vatNumber?: string;
  organizationNumber?: string;
}

// ❌ Bad: Using 'any' without justification
const where: any = {}; // Acceptable only for complex dynamic queries
```

### Async/Await Patterns

**Always use async/await, never raw promises:**

```typescript
// ✅ Good: Parallel async operations with Promise.all
const [data, total] = await Promise.all([
  this.prisma.renosCustomer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  this.prisma.renosCustomer.count({ where }),
]);

// ✅ Good: Sequential with proper error handling
async createInvoiceFromJob(jobData: any, customerData: any): Promise<BillyInvoice> {
  try {
    let billyCustomer: BillyCustomer;
    try {
      billyCustomer = await this.getCustomer(customerData.billy_customer_id);
    } catch (error) {
      // Customer doesn't exist, create it
      billyCustomer = await this.createCustomer({...});
    }
    return await this.createInvoice(invoiceData);
  } catch (error) {
    this.logger.error('Failed to create invoice from job', error);
    throw error;
  }
}

// ❌ Bad: Mixing promises and async/await
getData().then(result => {...}); // Use await instead
```

### Optional Chaining & Nullish Coalescing

```typescript
// ✅ Good: Optional chaining for nested properties
if (error?.message?.includes("connection timeout")) return null;

// ✅ Good: Nullish coalescing for defaults
const port = configService.get("PORT") ?? 3001;
const sentryEnv = configService.get("sentry.environment") || "development";

// ✅ Good: Safe property access
const totalAmount = jobData.profitability?.total_price || 0;
```

### Destructuring Patterns

```typescript
// ✅ Good: Destructure with defaults in function parameters
async findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>> {
  const {
    status,
    tag,
    minLeads,
    minBookings,
    minRevenue,
    search,
    page = 1,      // Default value
    limit = 10     // Default value
  } = filters;
  // ...
}

// ✅ Good: Spread operator for object composition
return this.prisma.renosCustomer.create({
  data: { ...data, tags: data.tags || [], status: 'active' },
});
```

---

## NestJS Backend Patterns

### Service Class Structure

**Standard service template:**

```typescript
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(filters: FilterDto): Promise<PaginatedResponseDto<Entity>> {
    // Implementation
  }

  async findOne(id: string): Promise<Entity> {
    const entity = await this.prisma.entity.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException(`Entity with ID ${id} not found`);
    return entity;
  }

  async create(data: CreateDto): Promise<Entity> {
    // Implementation
  }

  async update(id: string, data: UpdateDto): Promise<Entity> {
    await this.findOne(id); // Verify exists first
    return this.prisma.entity.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify exists first
    await this.prisma.entity.delete({ where: { id } });
  }
}
```

### Dependency Injection

```typescript
// ✅ Good: Constructor injection with readonly
constructor(
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
  private readonly integrationService: IntegrationService,
) {
  // Initialize configuration in constructor
  this.config = {
    baseUrl: this.configService.get<string>('integrations.tekupBilly.url'),
    apiKey: this.configService.get<string>('integrations.tekupBilly.apiKey'),
    timeout: 30000,
    retries: 2,
  };
}

// ❌ Bad: Direct instantiation
const service = new SomeService(); // Never instantiate manually
```

### Configuration Management

```typescript
// ✅ Good: Type-safe configuration with validation
const sentryDsn = configService.get("sentry.dsn");
const sentryEnv = configService.get("sentry.environment") || "development";

if (!this.config.baseUrl || !this.config.apiKey) {
  this.logger.warn('Tekup-Billy integration not configured properly');
}

// ✅ Good: Conditional features based on config
if (configService.get("ENABLE_SWAGGER") === "true") {
  const config = new DocumentBuilder()
    .setTitle("RendetaljeOS API")
    .setDescription("Complete Operations Management System API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
}
```

### Application Bootstrap Pattern

**From main.ts:**

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Initialize monitoring FIRST
  const sentryDsn = configService.get("sentry.dsn");
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get("sentry.environment") || "development",
      tracesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter non-critical errors
        const error = hint.originalException as any;
        if (error?.message?.includes("connection timeout")) return null;
        return event;
      },
    });
  }

  // 2. Security middleware
  app.use(helmet());
  app.use(compression());

  // 3. CORS configuration
  app.enableCors({
    origin: [
      "http://localhost:3000",
      configService.get("FRONTEND_URL"),
    ].filter(Boolean),
    credentials: true,
  });

  // 4. Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // 5. API versioning
  app.setGlobalPrefix("api/v1");

  // 6. Documentation (optional)
  if (configService.get("ENABLE_SWAGGER") === "true") {
    // Setup Swagger
  }

  // 7. Health checks
  app.use("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get("NODE_ENV"),
      version: "1.0.0",
    });
  });

  // 8. Start server
  const port = configService.get("PORT") || 3001;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 RendetaljeOS API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`❤️  Health Check: http://localhost:${port}/health`);
}

bootstrap();
```

---

## React/Next.js Frontend Patterns

### Component Structure

```typescript
// ✅ Good: Functional components with TypeScript
interface CustomerCardProps {
  customer: Customer;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      await onEdit(customer.id);
    } catch (error) {
      toast.error('Failed to edit customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Component JSX */}
    </div>
  );
}
```

### State Management (Zustand)

```typescript
// ✅ Good: Zustand store pattern
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      set({ user: response.user, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  refreshToken: async () => {
    // Implementation
  },
}));
```

### Data Fetching (TanStack Query)

```typescript
// ✅ Good: React Query hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customerApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerDto) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
}
```

---

## Error Handling

### Backend Error Handling

```typescript
// ✅ Good: Service-level error handling with logging
async createCustomer(customerData: BillyCustomer): Promise<BillyCustomer> {
  try {
    this.logger.debug('Creating customer in Billy.dk', { name: customerData.name });

    const response = await this.integrationService.post<BillyCustomer>(
      'tekup-billy',
      this.config,
      '/customers',
      customerData,
    );

    this.logger.log(`Customer created in Billy.dk: ${response.id}`);
    return response;
  } catch (error) {
    this.logger.error('Failed to create customer in Billy.dk', error);
    throw new BadRequestException(`Failed to create customer in Billy.dk: ${error.message}`);
  }
}

// ✅ Good: Nested try-catch for fallback behavior
async createInvoiceFromJob(jobData: any, customerData: any): Promise<BillyInvoice> {
  try {
    let billyCustomer: BillyCustomer;
    try {
      billyCustomer = await this.getCustomer(customerData.billy_customer_id);
    } catch (error) {
      // Customer doesn't exist, create it as fallback
      billyCustomer = await this.createCustomer({...});
    }
    return await this.createInvoice(invoiceData);
  } catch (error) {
    this.logger.error('Failed to create invoice from job', error);
    throw error; // Re-throw after logging
  }
}
```

### Frontend Error Handling

```typescript
// ✅ Good: Error boundaries for React components
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Sentry Integration

```typescript
// ✅ Good: Sentry initialization with filters
Sentry.init({
  dsn: sentryDsn,
  environment: sentryEnv,
  tracesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // Filter out non-critical errors
    const error = hint.originalException as any;
    if (error && typeof error === "object") {
      if (error.message?.includes("connection timeout")) return null;
      if (error.message?.includes("Too Many Requests")) return null;
      if (error.name === "ValidationError") return null;
    }
    return event;
  },
});
```

---

## Logging Conventions

### NestJS Logger Usage

```typescript
// ✅ Good: Use NestJS Logger with context
import { Logger } from '@nestjs/common';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  async someMethod() {
    // Debug logging for development
    this.logger.debug('Detailed debug information', { metadata: 'value' });

    // Info logging for important events
    this.logger.log('Important event occurred');
    this.logger.log(`Customer created: ${customer.id}`);

    // Warning for recoverable issues
    this.logger.warn('Non-critical issue occurred');

    // Error logging with context
    this.logger.error('Operation failed', error.stack);
  }
}
```

### Logging Best Practices

```typescript
// ✅ Good: Structured logging with context
this.logger.debug('Creating customer in Billy.dk', { name: customerData.name });
this.logger.log(`Customer created in Billy.dk: ${response.id}`);

// ✅ Good: Log before and after critical operations
this.logger.debug('Sending invoice via Billy.dk', { invoiceId, email });
await this.integrationService.post(...);
this.logger.log(`Invoice sent via Billy.dk: ${invoiceId}`);

// ✅ Good: Conditional logging for configuration issues
if (!this.config.baseUrl || !this.config.apiKey) {
  this.logger.warn('Tekup-Billy integration not configured properly');
}

// ✅ Good: Bootstrap logging with emojis (only in main.ts)
console.log(`🚀 RendetaljeOS API running on port ${port}`);
console.log(`📚 API Documentation: http://localhost:${port}/docs`);
console.log(`❤️  Health Check: http://localhost:${port}/health`);
```

---

## API Design

### RESTful Endpoint Structure

```
/api/v1/customers          GET    - List all customers (with pagination)
/api/v1/customers          POST   - Create new customer
/api/v1/customers/:id      GET    - Get single customer
/api/v1/customers/:id      PUT    - Update customer (full)
/api/v1/customers/:id      PATCH  - Update customer (partial)
/api/v1/customers/:id      DELETE - Delete customer
```

### Pagination Pattern

```typescript
// ✅ Good: Consistent pagination DTO
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// ✅ Good: Paginated response structure
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ✅ Good: Implementation
async findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>> {
  const { page = 1, limit = 10, search } = filters;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.renosCustomer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    this.prisma.renosCustomer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}
```

### Query Filtering Pattern

```typescript
// ✅ Good: Dynamic query building
async findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>> {
  const { status, tag, minLeads, minBookings, minRevenue, search } = filters;
  const where: any = {};

  if (status) where.status = status;
  if (tag) where.tags = { has: tag };
  if (minLeads !== undefined) where.totalLeads = { gte: minLeads };
  if (minBookings !== undefined) where.totalBookings = { gte: minBookings };
  if (minRevenue !== undefined) where.totalRevenue = { gte: minRevenue };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const data = await this.prisma.renosCustomer.findMany({ where });
  return data;
}
```

### Swagger/OpenAPI Documentation

```typescript
// ✅ Good: Comprehensive Swagger setup
const config = new DocumentBuilder()
  .setTitle("RendetaljeOS API")
  .setDescription("Complete Operations Management System API")
  .setVersion("1.0")
  .addBearerAuth()
  .addTag("auth", "Authentication endpoints")
  .addTag("jobs", "Job management endpoints")
  .addTag("customers", "Customer management endpoints")
  .addTag("team", "Team management endpoints")
  .addTag("billing", "Billing and invoicing endpoints")
  .addTag("ai-friday", "AI Friday integration endpoints")
  .build();

SwaggerModule.setup("docs", app, document, {
  customSiteTitle: "RendetaljeOS API Documentation",
  customfavIcon: "/favicon.ico",
  customCss: ".swagger-ui .topbar { display: none }",
});
```

---

## Testing Patterns

### Unit Test Structure (Jest)

```typescript
// ✅ Good: Describe/test structure
describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            renosCustomer: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findOne', () => {
    it('should return a customer if found', async () => {
      const mockCustomer = { id: '1', name: 'Test Customer' };
      jest.spyOn(prisma.renosCustomer, 'findUnique').mockResolvedValue(mockCustomer);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(prisma.renosCustomer.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if customer not found', async () => {
      jest.spyOn(prisma.renosCustomer, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Integration Test Pattern

```typescript
// ✅ Good: E2E test with supertest
describe('CustomersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/customers (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/customers')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('total');
      });
  });
});
```

---

## File Naming Conventions

### Backend Files (NestJS)

```
# Modules
customers/
├── customers.module.ts
├── customers.controller.ts
├── customers.service.ts
├── customers.service.spec.ts
├── dto/
│   ├── index.ts
│   ├── create-customer.dto.ts
│   ├── update-customer.dto.ts
│   └── customer-filters.dto.ts
└── entities/
    ├── customer.entity.ts
    └── index.ts

# Shared utilities
common/
├── decorators/
│   └── current-user.decorator.ts
├── guards/
│   └── jwt-auth.guard.ts
├── interceptors/
│   └── transform.interceptor.ts
└── filters/
    └── http-exception.filter.ts
```

### Frontend Files (Next.js/React)

```
# App Router pages
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx
├── dashboard/
│   ├── page.tsx
│   └── layout.tsx
└── api/
    └── customers/
        └── route.ts

# Components
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── customers/
│   ├── customer-card.tsx
│   ├── customer-list.tsx
│   └── customer-form.tsx
└── layout/
    ├── header.tsx
    └── sidebar.tsx
```

### Naming Rules

- **PascalCase:** Classes, components, interfaces, types
  - `CustomerService`, `BillyCustomer`, `AuthGuard`
- **camelCase:** Functions, variables, methods
  - `createCustomer`, `findAll`, `isAuthenticated`
- **kebab-case:** File names, directories
  - `customers.service.ts`, `create-customer.dto.ts`
- **UPPER_SNAKE_CASE:** Constants, environment variables
  - `MAX_RETRIES`, `API_BASE_URL`, `DATABASE_URL`

---

## Import Organization

### Import Order

```typescript
// 1. Node.js built-ins
import * as fs from 'fs';
import * as path from 'path';

// 2. External packages
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

// 3. Internal modules (absolute paths)
import { PrismaService } from '../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { Customer } from './entities/customer.entity';

// 4. Types and interfaces
import type { BillyCustomer, BillyInvoice } from './types';
```

### Barrel Exports (index.ts)

```typescript
// ✅ Good: Use barrel exports for cleaner imports
// dto/index.ts
export * from './create-customer.dto';
export * from './update-customer.dto';
export * from './customer-filters.dto';

// Usage in other files
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
```

---

## Documentation Style

### JSDoc Comments

```typescript
/**
 * Creates a new customer in Billy.dk accounting system
 *
 * @param customerData - Customer data to create
 * @returns The created customer with Billy.dk ID
 * @throws {BadRequestException} If creation fails
 *
 * @example
 * ```typescript
 * const customer = await billyService.createCustomer({
 *   name: 'ACME Corp',
 *   email: 'contact@acme.com',
 *   phone: '+45 12345678'
 * });
 * ```
 */
async createCustomer(customerData: BillyCustomer): Promise<BillyCustomer> {
  // Implementation
}
```

### Inline Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Filter out non-critical errors to reduce Sentry noise
if (error.message?.includes("connection timeout")) return null;

// Initialize Sentry FIRST (before any requests)
Sentry.init({ dsn: sentryDsn });

// Customer doesn't exist, create it as fallback
billyCustomer = await this.createCustomer({...});

// ✅ Good: TODO comments with context
// TODO: Add retry logic for failed payments (JIRA-123)
// TODO: Implement customer segmentation by LTV
```

### README Structure

```markdown
# Project Name

Brief description of the project

## Features

- Feature 1
- Feature 2

## Prerequisites

- Node.js 20.x
- pnpm 10.17.0
- PostgreSQL 15

## Installation

\`\`\`bash
pnpm install
\`\`\`

## Configuration

Copy `.env.example` to `.env` and configure:

\`\`\`env
DATABASE_URL="postgresql://..."
BILLY_API_KEY="..."
\`\`\`

## Development

\`\`\`bash
pnpm dev
\`\`\`

## Testing

\`\`\`bash
pnpm test
\`\`\`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md)

## License

Private - Tekup ApS
```

---

## Common Patterns Summary

### The "Tekup Way"

**✅ DO:**
- Use TypeScript strict mode everywhere
- Implement comprehensive error handling with logging
- Follow DDD patterns for backend modules
- Use dependency injection (never instantiate manually)
- Parallelize independent async operations with `Promise.all`
- Validate inputs at API boundaries with `class-validator`
- Filter Sentry errors to reduce noise
- Use structured logging with context
- Follow conventional commits strictly
- Co-locate tests with source files
- Document complex business logic
- Implement health checks for all services

**❌ DON'T:**
- Use `any` type without justification
- Ignore error handling (always log and throw)
- Mix promises and async/await
- Instantiate services manually
- Skip input validation
- Use console.log in production code (use Logger)
- Commit without tests for new features
- Push directly to master without PR (for major changes)
- Expose secrets in code (use environment variables)
- Skip Swagger documentation for public APIs

---

## Code Review Checklist

When reviewing code, check for:

- [ ] TypeScript strict mode compliance
- [ ] Proper error handling and logging
- [ ] Input validation with DTOs
- [ ] Tests for new functionality
- [ ] No exposed secrets or API keys
- [ ] Swagger/OpenAPI documentation
- [ ] Conventional commit messages
- [ ] No `@ts-ignore` without justification
- [ ] Dependency injection used correctly
- [ ] Async operations optimized (Promise.all where applicable)
- [ ] Proper use of NestJS decorators
- [ ] Health checks for new services
- [ ] Sentry error filtering implemented
- [ ] Database queries optimized (no N+1 queries)
- [ ] Proper CORS and security headers

---

## Examples from Production Code

### Excellent Service Implementation

**From `tekup-billy.service.ts` (433 lines):**

✅ **Strengths:**
- Comprehensive TypeScript interfaces
- Consistent error handling pattern
- Structured logging throughout
- Configuration validation
- Webhook handling structure
- Utility methods for business logic
- Health check endpoint

### Excellent Bootstrap Implementation

**From `main.ts` (142 lines):**

✅ **Strengths:**
- Clear initialization order
- Sentry configured first
- Security middleware properly layered
- CORS with environment-based origins
- Global validation pipe with strict settings
- Comprehensive health check endpoint
- Development-only debugging endpoints
- Emoji logging for key events

### Excellent CRUD Implementation

**From `customers.service.ts` (74 lines):**

✅ **Strengths:**
- Clean, concise implementation
- Proper pagination with `Promise.all`
- Dynamic query building
- Existence validation before update/delete
- Consistent error handling
- Type-safe return values

---

## Additional Resources

**Internal Documentation:**
- `.claude/context.md` - Quick reference guide
- `KNOWLEDGE_INDEX.json` - Searchable knowledge base
- `TYPESCRIPT_FIX_STATUS.md` - Current type issues
- `WORKSPACE_KNOWLEDGE_BASE.json` - Patterns and conventions

**External References:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*This guide is extracted from real production code in the Tekup repository. Follow these patterns to maintain consistency and quality across the codebase.*

**Last Updated:** 2025-11-23
**Based on:** 3,506 TypeScript files, 94 commits, production services
**Maintained by:** Rendetalje Team
