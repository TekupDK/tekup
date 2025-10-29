# Sales Tracking System - Technical Architecture Document

## Executive Summary

This document details the technical architecture of the Internal Sales Tracking System for Tekup's three business units. The system uses a modern three-tier architecture with NestJS backend, Next.js frontend, and PostgreSQL database, deployed on Render.com infrastructure.

**Key Architecture Principles:**

- Multi-tenant single database with logical isolation
- Microservices-ready monolith pattern
- API-first design with REST endpoints
- Row-level security for data isolation
- Scalable caching strategy with Redis

---

## System Context Diagram

```
External Users              Internal Systems           External Services
─────────────────────────────────────────────────────────────────────
                                  │
    Desktop/Mobile               │                   Billy.dk API
    Browser Clients    ────────► │ ◄──────────      (Invoicing)
         │                       │                        │
         │                  ┌────┴─────┐                 │
         │                  │  Sales   │                 │
         └─────────────────►│ Tracking │◄────────────────┘
                            │  System  │
                            └────┬─────┘           Google Calendar
                                 │                 (Scheduling)
                                 │                      │
                                 └──────────────────────┘
                                          
                                       Gmail API
                                   (Email Processing)
```

---

## High-Level Architecture

The system follows a **three-tier architecture**:

1. **Presentation Tier**: Next.js frontend (React 18)
2. **Application Tier**: NestJS backend (Node.js 20)
3. **Data Tier**: PostgreSQL database (Supabase) + Redis cache

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Desktop Browser │ Tablet Browser │ Mobile Browser          │
│                   HTTPS/TLS Encrypted                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│             PRESENTATION LAYER (Next.js 15)                 │
│                                                             │
│  Dashboard │ Sales │ Customers │ Leads │ Reports            │
│  TanStack Query State Management + Zustand                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────┼──────────────────────────────────────┐
│             APPLICATION LAYER (NestJS)                      │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │ API Gateway + Middleware                │               │
│  │ - JWT Authentication                    │               │
│  │ - Organization Isolation                │               │
│  │ - Rate Limiting                         │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Business Modules:                                          │
│  Sales │ Customers │ Services │ Leads │ Analytics          │
│                                                             │
│  Integration Services:                                      │
│  Billy.dk │ Google Calendar │ Email Processing             │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────┼──────────────────────────────────────┐
│                 DATA LAYER                                  │
│                                                             │
│  PostgreSQL Database (Supabase)                             │
│  Organizations │ Customers │ Services │ Sales │ Leads      │
│  Row-Level Security Policies                                │
│                                                             │
│  Redis Cache (Dashboard stats, Reports, Sessions)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture (Next.js)

```
app/
├── (auth)/                    # Public authentication routes
│   └── login/page.tsx        # Login page
│
├── (dashboard)/              # Protected dashboard routes
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Main dashboard (KPIs, charts)
│   │
│   ├── sales/                # Sales management
│   │   ├── page.tsx         # Sales list view
│   │   ├── new/page.tsx     # Create sale form
│   │   └── [id]/page.tsx    # Sale detail view
│   │
│   ├── customers/            # Customer management
│   │   ├── page.tsx         # Customer list
│   │   ├── new/page.tsx     # Create customer
│   │   └── [id]/page.tsx    # Customer profile
│   │
│   ├── leads/                # Lead management (Phase 2)
│   │   ├── page.tsx         # Lead list
│   │   └── [id]/page.tsx    # Lead detail + conversion
│   │
│   └── reports/              # Analytics & reporting
│       └── page.tsx          # Reports dashboard
│
├── api/                      # API routes (if needed)
└── layout.tsx                # Root layout

components/
├── ui/                       # Shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   └── ...
│
├── sales/                    # Sale-specific components
│   ├── sales-list.tsx
│   ├── sale-form.tsx
│   ├── sale-detail.tsx
│   └── status-badge.tsx
│
├── customers/                # Customer components
│   ├── customer-list.tsx
│   ├── customer-form.tsx
│   └── customer-profile.tsx
│
└── dashboard/                # Dashboard components
    ├── kpi-cards.tsx
    ├── sales-pipeline.tsx
    ├── revenue-chart.tsx
    └── activity-feed.tsx

lib/
├── api.ts                    # Axios client configuration
├── auth.ts                   # Authentication utilities
└── utils.ts                  # Shared utilities

hooks/
├── use-sales.ts              # TanStack Query hooks for sales
├── use-customers.ts          # Customer data hooks
└── use-auth.ts               # Authentication hooks

stores/
└── organization.ts           # Zustand store for org context
```

**Key Frontend Patterns:**

1. **Server Components by Default**: Leverage Next.js 15 App Router
2. **Client Components**: Only when interactivity needed (`'use client'`)
3. **Data Fetching**: TanStack Query for server state
4. **Forms**: React Hook Form + Zod validation
5. **Styling**: Tailwind CSS + Shadcn/ui components

### Backend Architecture (NestJS)

```
src/
├── main.ts                   # Application bootstrap
├── app.module.ts             # Root module
│
├── auth/                     # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts    # POST /auth/login
│   ├── auth.service.ts       # JWT generation, validation
│   ├── jwt.strategy.ts       # Passport JWT strategy
│   └── guards/
│       ├── jwt-auth.guard.ts        # Route protection
│       └── organization.guard.ts    # Data isolation
│
├── database/                 # Database module
│   ├── database.module.ts    # Global Prisma module
│   └── prisma.service.ts     # Prisma client wrapper
│
├── sales/                    # Sales management module
│   ├── sales.module.ts
│   ├── sales.controller.ts   # REST endpoints
│   ├── sales.service.ts      # Business logic
│   ├── dto/
│   │   ├── create-sale.dto.ts
│   │   ├── update-sale.dto.ts
│   │   └── sale-filters.dto.ts
│   └── utils/
│       ├── status-validator.ts
│       └── sale-number-generator.ts
│
├── customers/                # Customer management module
│   ├── customers.module.ts
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   └── dto/
│
├── services/                 # Service catalog module
│   ├── services.module.ts
│   ├── services.controller.ts
│   └── services.service.ts
│
├── leads/                    # Lead management module (Phase 2)
│   ├── leads.module.ts
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   ├── lead-conversion.service.ts
│   └── dto/
│
├── analytics/                # Analytics module (Phase 4)
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   └── reports/
│
├── integrations/             # External integrations
│   ├── billy/
│   │   ├── billy.service.ts         # Invoice operations
│   │   ├── billy-sync.service.ts    # Payment sync
│   │   └── billy-webhook.controller.ts
│   │
│   ├── calendar/
│   │   ├── calendar.service.ts      # Event management
│   │   └── availability.service.ts
│   │
│   └── email/
│       ├── email-parser.service.ts
│       ├── email-webhook.controller.ts
│       └── notification.service.ts
│
└── common/                   # Shared utilities
    ├── middleware/
    │   └── organization.middleware.ts
    ├── interceptors/
    │   ├── audit-log.interceptor.ts
    │   └── transform.interceptor.ts
    ├── pipes/
    │   └── validation.pipe.ts
    ├── filters/
    │   └── http-exception.filter.ts
    └── utils/
        ├── financial-calculator.ts
        └── date-helper.ts

prisma/
├── schema.prisma             # Database schema
├── seed.ts                   # Seed data script
└── migrations/               # Database migrations
```

**Key Backend Patterns:**

1. **Module-Based Architecture**: Each feature is a module
2. **Dependency Injection**: NestJS built-in DI container
3. **Guards & Middleware**: Request pipeline for auth and isolation
4. **DTOs with Validation**: class-validator for input validation
5. **Service Layer**: Business logic separated from controllers

---

## Data Flow Patterns

### 1. Sale Creation Flow

```
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  User   │       │ Frontend │       │ Backend  │       │ Database │
└────┬────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                 │                  │                  │
     │ Fill form       │                  │                  │
     ├────────────────>│                  │                  │
     │                 │                  │                  │
     │ Submit          │                  │                  │
     ├────────────────>│                  │                  │
     │                 │                  │                  │
     │                 │ POST /sales      │                  │
     │                 │ + JWT token      │                  │
     │                 ├─────────────────>│                  │
     │                 │                  │                  │
     │                 │                  │ Validate JWT     │
     │                 │                  │ Check org access │
     │                 │                  │                  │
     │                 │                  │ Validate DTO     │
     │                 │                  │                  │
     │                 │                  │ Verify customer  │
     │                 │                  │ Verify service   │
     │                 │                  │                  │
     │                 │                  │ Generate sale #  │
     │                 │                  │ Calculate tax    │
     │                 │                  │                  │
     │                 │                  │ INSERT sale      │
     │                 │                  ├─────────────────>│
     │                 │                  │                  │
     │                 │                  │ Sale created     │
     │                 │                  │<─────────────────┤
     │                 │                  │                  │
     │                 │                  │ Update customer  │
     │                 │                  │ stats            │
     │                 │                  ├─────────────────>│
     │                 │                  │                  │
     │                 │                  │ Log audit entry  │
     │                 │                  ├─────────────────>│
     │                 │                  │                  │
     │                 │ Sale object      │                  │
     │                 │<─────────────────┤                  │
     │                 │                  │                  │
     │ Success         │                  │                  │
     │<────────────────┤                  │                  │
     │ Navigate to     │                  │                  │
     │ sale detail     │                  │                  │
```

### 2. Authentication & Authorization Flow

```
Login Request → JWT Generation → Token Storage → Authenticated Request
──────────────────────────────────────────────────────────────────────

1. User submits login
   POST /auth/login
   Body: { email, password }

2. AuthService validates
   - Find user by email
   - Verify password (bcrypt)
   - Check user active status

3. Generate JWT token
   Payload: {
     sub: userId,
     email: email,
     organizationId: orgId,
     role: userRole,
     permissions: []
   }
   Sign with JWT_SECRET
   Expiration: 24 hours

4. Frontend stores token
   localStorage.setItem('access_token', token)

5. Subsequent requests
   - Axios interceptor adds: Authorization: Bearer {token}
   - JwtStrategy validates token
   - OrganizationGuard injects organizationId
   - Request proceeds with user context

6. All database queries filtered
   WHERE organization_id = {user.organizationId}
```

### 3. Lead to Sale Conversion

```
Lead Qualification → User Converts → Customer Check → Sale Creation
──────────────────────────────────────────────────────────────────

Step 1: Lead exists with status QUALIFIED
{
  id: "lead-123",
  contactName: "Jane Smith",
  contactEmail: "jane@example.com",
  interestServiceId: "service-456",
  estimatedValue: 1200,
  status: "QUALIFIED"
}

Step 2: User clicks "Convert to Sale"
POST /leads/lead-123/convert

Step 3: Backend processes conversion
LeadsService.convertToSale():
  - Fetch lead data
  - Check if lead has customerId
    - If yes: Use existing customer
    - If no: Create new customer from contact info
  
  - Call SalesService.create():
      customerId: customer.id,
      serviceId: lead.interestServiceId,
      status: "ACCEPTED",
      finalAmount: lead.estimatedValue,
      source: lead.source
  
  - Update lead:
      status: "CONVERTED",
      convertedSaleId: newSale.id

Step 4: Return created sale and updated lead
{
  sale: { id, saleNumber, status, customer, service },
  lead: { id, status: "CONVERTED", convertedSaleId }
}

Step 5: Frontend navigates to sale detail
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌──────────────────┐
│  Organizations   │
│  ──────────────  │
│  id (PK)         │
│  name            │
│  type (enum)     │
│  billing_email   │
└────────┬─────────┘
         │ 1
         │
         │ has many
         │
    ┌────┴──────┬──────────┬──────────┬──────────┐
    │           │          │          │          │
    │ N         │ N        │ N        │ N        │ N
┌───┴───────┐ ┌─┴────────┐ ┌┴────────┐ ┌┴───────┐ ┌┴────────┐
│ Customers │ │ Services │ │  Sales  │ │  Leads │ │  Users  │
│ ──────── │ │ ──────── │ │ ──────  │ │ ────── │ │ ──────  │
│ id (PK)   │ │ id (PK)  │ │ id (PK) │ │ id (PK)│ │ id (PK) │
│ org_id(FK)│ │ org_id   │ │ org_id  │ │ org_id │ │ org_id  │
│ name      │ │ name     │ │ customer│ │ contact│ │ email   │
│ email     │ │ base_    │ │  _id(FK)│ │  _name │ │ role    │
│ phone     │ │  price   │ │ service │ │ service│ └─────────┘
└───────────┘ └──────────┘ │  _id(FK)│ │  _id   │
                           │ status  │ │ status │
                           │ amount  │ │ follow_│
                           │ tax     │ │  up    │
                           └─────────┘ └────────┘
```

### Data Isolation Strategy

**Row-Level Security (RLS) Policies:**

```sql
-- Sales table policy
CREATE POLICY sales_org_isolation ON sales
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Customers table policy
CREATE POLICY customers_org_isolation ON customers
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Apply to all multi-tenant tables
```

**Application-Level Enforcement:**

Every query automatically includes organization filter:

```typescript
// In SalesService
async findAll(filters: any, organizationId: string) {
  return this.prisma.sale.findMany({
    where: {
      organizationId,  // Always included
      ...filters,
    },
  });
}

// organizationId injected by OrganizationGuard
@UseGuards(JwtAuthGuard, OrganizationGuard)
async getSales(@Request() req) {
  return this.salesService.findAll({}, req.organizationId);
}
```

### Indexing Strategy

```sql
-- Primary indexes (auto-created)
PK: organizations(id)
PK: customers(id)
PK: services(id)
PK: sales(id)
PK: leads(id)
PK: users(id)

-- Performance indexes
CREATE INDEX idx_sales_org_status ON sales(organization_id, status);
CREATE INDEX idx_sales_org_date ON sales(organization_id, sale_date DESC);
CREATE INDEX idx_customers_org_email ON customers(organization_id, email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date) 
  WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED');

-- Full-text search
CREATE INDEX idx_customers_search ON customers 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '')));
```

---

## Security Architecture

### Multi-Layer Security Model

```
Layer 1: Network Security
├── HTTPS/TLS 1.3 encryption
├── Rate limiting (1000 req/hour per user)
├── DDoS protection via Render.com
└── CORS configuration

Layer 2: Authentication
├── JWT-based token authentication
├── bcrypt password hashing (10 rounds)
├── Token expiration (24 hours)
└── Refresh token mechanism (future)

Layer 3: Authorization
├── Role-Based Access Control (RBAC)
│   ├── ADMIN: Full access
│   ├── SALES_MANAGER: Org-level access
│   ├── SALES_REP: Limited access
│   └── VIEWER: Read-only
└── Organization-based data isolation

Layer 4: Data Protection
├── Row-Level Security (RLS) policies
├── Encrypted connections to database
├── Audit logging of all changes
└── Automated daily backups

Layer 5: Application Security
├── Input validation (class-validator)
├── SQL injection prevention (Prisma ORM)
├── XSS prevention (React auto-escaping)
├── CSRF protection (SameSite cookies)
└── Dependency scanning (npm audit)
```

### Authentication Flow

```typescript
// 1. Login endpoint
@Post('login')
async login(@Body() credentials: LoginDto) {
  const user = await this.authService.validateUser(credentials);
  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  });
  return { access_token: token, user };
}

// 2. JWT Strategy validates token
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}

// 3. Guards protect routes
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Get('sales')
async getSales(@Request() req) {
  // req.user contains validated user context
  // req.organizationId injected by OrganizationGuard
}
```

### Permission Matrix

| Permission | ADMIN | SALES_MANAGER | SALES_REP | VIEWER |
|------------|-------|---------------|-----------|--------|
| View own sales | ✓ | ✓ | ✓ | ✓ |
| View all sales | ✓ | ✓ | ✗ | ✓ |
| Create sales | ✓ | ✓ | ✓ | ✗ |
| Edit own sales | ✓ | ✓ | ✓ | ✗ |
| Edit all sales | ✓ | ✓ | ✗ | ✗ |
| Delete sales | ✓ | ✓ | ✗ | ✗ |
| Manage users | ✓ | ✗ | ✗ | ✗ |
| View reports | ✓ | ✓ | Limited | ✓ |
| Export data | ✓ | ✓ | ✗ | ✗ |

---

## Integration Architecture

### Billy.dk Invoice Integration

```
Sale Status Change → Auto-Invoice → Payment Tracking
────────────────────────────────────────────────────

Trigger: Sale status changes to COMPLETED

1. Post-Update Hook
   └─> BillyService.createInvoiceForSale(saleId)

2. Prepare Invoice Data
   {
     customer: {
       name: sale.customer.name,
       email: sale.customer.email,
     },
     lineItems: [{
       description: sale.service.name,
       quantity: 1,
       unitPrice: sale.finalAmount,
       taxRate: sale.taxRate,
     }],
     dueDate: addDays(new Date(), 14),
   }

3. Call Tekup-Billy API
   POST https://billy-api.tekup.dk/invoices/create

4. Store Invoice ID
   UPDATE sales 
   SET billy_invoice_id = '{invoiceId}',
       payment_status = 'PENDING'
   WHERE id = '{saleId}'

5. Payment Tracking (Two Methods)
   
   A. Polling (every 15 minutes)
      @Cron('*/15 * * * *')
      async syncPaymentStatuses() {
        const pending = await this.getPendingSales();
        for (const sale of pending) {
          const invoice = await this.billy.getInvoice(sale.billyInvoiceId);
          if (invoice.status === 'PAID') {
            await this.updateSalePaymentStatus(sale.id, 'PAID');
          }
        }
      }
   
   B. Webhook (real-time)
      POST /webhooks/billy/payment
      {
        eventType: 'invoice.paid',
        invoiceId: 'billy-inv-123',
        paidDate: '2025-10-18T10:00:00Z'
      }
      → Update sale immediately
```

### Google Calendar Integration

```
Sale Scheduled → Create Event → Sync Updates
──────────────────────────────────────────────

Trigger: Sale status changes to SCHEDULED

1. CalendarService.createEventForSale(saleId)
   
2. Prepare Event Data
   {
     summary: `${sale.service.name} - ${sale.customer.name}`,
     description: `Sale: ${sale.saleNumber}\nCustomer: ${sale.customer.email}`,
     start: {
       dateTime: sale.scheduledDate,
       timeZone: 'Europe/Copenhagen',
     },
     end: {
       dateTime: calculateEndTime(sale.scheduledDate, sale.service.durationMinutes),
       timeZone: 'Europe/Copenhagen',
     },
     attendees: [
       { email: sale.assignedUser.email },
       { email: sale.customer.email },
     ],
     reminders: {
       useDefault: false,
       overrides: [
         { method: 'email', minutes: 24 * 60 }, // 1 day before
         { method: 'popup', minutes: 60 },      // 1 hour before
       ],
     },
   }

3. Create Calendar Event
   const event = await calendar.events.insert({
     calendarId: 'primary',
     requestBody: eventData,
   });

4. Store Event ID
   UPDATE sales
   SET calendar_event_id = '{event.id}'
   WHERE id = '{saleId}'

5. Handle Updates
   - Sale date changed → Update calendar event
   - Sale cancelled → Delete calendar event
```

---

## Caching Strategy

### Redis Caching Layers

```typescript
// Cache configuration
const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60,      // 5 minutes
  SERVICE_CATALOG: 60 * 60,     // 1 hour
  REPORTS: 15 * 60,             // 15 minutes
  USER_SESSION: 24 * 60 * 60,   // 24 hours
};

// Cache service
@Injectable()
export class CacheService {
  async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await fetchFn();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
}

// Usage in service
async getDashboardStats(organizationId: string) {
  const cacheKey = `dashboard:${organizationId}`;
  
  return this.cache.getCachedOrFetch(
    cacheKey,
    () => this.calculateDashboardStats(organizationId),
    CACHE_TTL.DASHBOARD_STATS
  );
}
```

### Cache Invalidation Strategy

```typescript
// Invalidate on data changes
async create(createSaleDto: CreateSaleDto, orgId: string) {
  const sale = await this.prisma.sale.create({ data: {...} });
  
  // Invalidate related caches
  await this.cache.del(`dashboard:${orgId}`);
  await this.cache.del(`sales:list:${orgId}`);
  await this.cache.del(`analytics:${orgId}`);
  
  return sale;
}
```

---

## Performance Optimization

### Database Query Optimization

```typescript
// Bad: N+1 query problem
const sales = await this.prisma.sale.findMany();
for (const sale of sales) {
  sale.customer = await this.prisma.customer.findUnique({ 
    where: { id: sale.customerId } 
  });
}

// Good: Single query with includes
const sales = await this.prisma.sale.findMany({
  include: {
    customer: true,
    service: true,
    assignedUser: {
      select: { id: true, name: true, email: true },
    },
  },
});

// Even better: Add pagination
const sales = await this.prisma.sale.findMany({
  where: { organizationId },
  include: { customer: true, service: true },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { saleDate: 'desc' },
});
```

### Pagination Best Practices

```typescript
interface PaginationParams {
  page: number;
  pageSize: number;
}

async findAllPaginated(
  filters: any,
  orgId: string,
  pagination: PaginationParams
) {
  const { page = 1, pageSize = 20 } = pagination;
  const skip = (page - 1) * pageSize;
  
  const [data, total] = await Promise.all([
    this.prisma.sale.findMany({
      where: { organizationId: orgId, ...filters },
      take: pageSize,
      skip,
      orderBy: { saleDate: 'desc' },
    }),
    this.prisma.sale.count({
      where: { organizationId: orgId, ...filters },
    }),
  ]);
  
  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Dashboard load | < 2s | Redis caching, optimized queries |
| API response (p95) | < 500ms | Indexing, connection pooling |
| Sales list query | < 200ms | Pagination, selective fields |
| Report generation | < 3s | Background jobs, caching |
| Concurrent users | 100+ | Horizontal scaling, load balancing |

---

## Deployment Architecture

### Production Infrastructure (Render.com)

```
┌─────────────────────────────────────────────────────────┐
│                    Render.com (Frankfurt)               │
│                                                         │
│  ┌──────────────────┐       ┌──────────────────┐       │
│  │     Frontend     │       │      Backend     │       │
│  │   (Static Site)  │◄──────┤   (Web Service)  │       │
│  │                  │       │                  │       │
│  │  - Next.js Build │       │  - NestJS        │       │
│  │  - CDN Cached    │       │  - Node 20       │       │
│  │                  │       │  - Auto-scaling  │       │
│  └──────────────────┘       └────────┬─────────┘       │
│                                      │                 │
│                              ┌───────┴────────┐        │
│                              │  Redis Cache   │        │
│                              │  (Managed)     │        │
│                              └────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
                                │
                                │ Secure connection
                                │
                    ┌───────────┴────────────┐
                    │      Supabase          │
                    │  PostgreSQL Database   │
                    │   (Frankfurt Region)   │
                    └────────────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl ${{ secrets.RENDER_BACKEND_DEPLOY_HOOK }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl ${{ secrets.RENDER_FRONTEND_DEPLOY_HOOK }}
```

### Environment Configuration

**Development:**
```bash
DATABASE_URL=postgresql://...@supabase:5432/dev_db
JWT_SECRET=dev-secret
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

**Production:**
```bash
DATABASE_URL=${SUPABASE_PRODUCTION_URL}
JWT_SECRET=${SECURE_JWT_SECRET}
REDIS_URL=${RENDER_REDIS_URL}
NODE_ENV=production
```

---

## Monitoring & Observability

### Monitoring Stack

```
Application Layer
├── Sentry (Error Tracking)
│   ├── Backend exceptions
│   ├── Frontend errors
│   └── Performance traces
│
├── Render Metrics
│   ├── CPU/Memory usage
│   ├── Response times
│   ├── Request volumes
│   └── Error rates
│
└── Custom Application Metrics
    ├── Sales created/day
    ├── Conversion rates
    ├── API endpoint usage
    └── User activity patterns
```

### Health Check Endpoint

```typescript
@Get('health')
async healthCheck() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
    integrations: {
      billy: await this.checkBilly(),
      calendar: await this.checkCalendar(),
    },
  };
  
  return checks;
}
```

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T10:00:00Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected",
  "integrations": {
    "billy": "ok",
    "calendar": "ok"
  }
}
```

---

## Scalability Roadmap

### Current Capacity

- **Users**: 100 concurrent users
- **Database**: 1M sales records
- **API Throughput**: 1000 requests/hour per user
- **Storage**: Unlimited (Supabase)

### Phase 1: Vertical Scaling

- Upgrade Render instance (2GB → 4GB RAM)
- Increase database connections (50 → 100)
- Add Redis persistence

### Phase 2: Horizontal Scaling

```
Before:                      After:
┌──────────┐                ┌──────────────┐
│  Single  │                │   Load       │
│  Server  │                │   Balancer   │
└──────────┘                └───────┬──────┘
                                    │
                     ┌──────────────┼──────────────┐
                     │              │              │
                 ┌───┴───┐     ┌───┴───┐     ┌───┴───┐
                 │Server1│     │Server2│     │Server3│
                 └───────┘     └───────┘     └───────┘
```

### Phase 3: Database Optimization

- Read replicas for analytics
- Table partitioning by date
- Archive old data (> 2 years)

---

## Technology Stack Summary

### Backend

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 15 (Supabase)
- **Cache**: Redis 7.x
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator
- **Testing**: Jest, Supertest

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Components**: Shadcn/ui + Tailwind CSS 3.x
- **State**: TanStack Query 5.x + Zustand 4.x
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Testing**: Jest, React Testing Library

### Infrastructure

- **Hosting**: Render.com (Frankfurt)
- **Database**: Supabase (managed PostgreSQL)
- **Cache**: Redis (Render managed)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **CDN**: Render built-in

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**Status**: Implementation Ready  
**Maintained by**: Tekup Development Team
