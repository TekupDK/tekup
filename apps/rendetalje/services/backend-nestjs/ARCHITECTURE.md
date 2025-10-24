# Rendetalje Backend Architecture

**Version:** 1.2.0  
**Status:** Minimal Backend (HealthModule Only)  
**Last Updated:** 24. oktober 2025

---

## Tech Stack

### Core
- **Runtime:** Node.js 18+ (LTS)
- **Framework:** NestJS 10.4.20
- **Language:** TypeScript 5.9+ (strict mode)
- **Package Manager:** npm (legacy from pre-pnpm migration)

### Database
- **ORM:** Prisma 6.18.0
- **Database:** PostgreSQL 15+
- **Schema:** `renos` (multi-schema setup in tekup-database)
- **Migrations:** Prisma Migrate

### API & Validation
- **REST API:** Express 4.18+
- **WebSockets:** Socket.IO (for RealTimeModule)
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger/OpenAPI 3.0

### Security & Monitoring
- **Security Headers:** Helmet
- **Rate Limiting:** @nestjs/throttler
- **Error Tracking:** Sentry (optional, disabled hvis DSN mangler)
- **Logging:** Console (JSON structured i production)

---

## Directory Structure

```
backend-nestjs/
├── src/
│   ├── app.module.ts           # Main application module
│   ├── main.ts                 # Bootstrap + middleware setup
│   │
│   ├── config/
│   │   └── configuration.ts    # Environment config loader
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts   # ✅ Prisma ORM wrapper
│   │
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts # ✅ Health check endpoints
│   │
│   ├── common/
│   │   ├── sentry/
│   │   │   └── sentry.interceptor.ts
│   │   └── services/
│   │       └── base.service.ts.bak  # ❌ Disabled
│   │
│   ├── customers.bak/          # ❌ Disabled - field name mismatches
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts
│   │   └── customers.service.ts # 35+ errors med Prisma schema
│   │
│   ├── auth/                   # ❌ Module files .bak
│   ├── jobs/                   # ❌ Module files .bak
│   ├── team/                   # ❌ Module files .bak
│   ├── time-tracking/          # ❌ Service files .bak
│   ├── gdpr/                   # ❌ Service files .bak
│   ├── quality/                # ❌ Service files .bak
│   ├── realtime/               # ❌ Service files .bak
│   ├── security/               # ❌ Service files .bak
│   └── ai-friday/              # ❌ Service files .bak
│
├── prisma/
│   └── schema.prisma           # Copied from tekup-database
│
├── dist/                       # Compiled JavaScript output
├── test/                       # E2E tests
├── .env                        # Environment variables (gitignored)
├── .env.example                # Template
├── package.json
├── tsconfig.json
├── nest-cli.json
└── MIGRATION_LOG.md            # This migration's documentation
```

---

## Module Architecture

### Active Modules ✅

#### ConfigModule (Global)
**Purpose:** Load and validate environment variables  
**Config File:** `src/config/configuration.ts`

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tekup?schema=renos

# Server
PORT=3000
NODE_ENV=development

# Sentry (Optional)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=development

# Frontend
FRONTEND_URL=http://localhost:3001
```

#### ThrottlerModule
**Purpose:** Rate limiting (100 req/min per IP)  
**Config:** 
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,  // 1 minute
  limit: 100   // 100 requests
}])
```

#### DatabaseModule
**Purpose:** Prisma ORM integration  
**Provider:** `PrismaService`

**PrismaService Methods:**
```typescript
class PrismaService extends PrismaClient {
  // Lifecycle
  async onModuleInit()    // Connect to DB
  async onModuleDestroy() // Disconnect

  // Convenience accessors (backward compatibility)
  get customers()        → this.renosCustomer
  get jobs()             → this.renosLead
  get customerMessages() → this.renosEmailMessage
  get chatSessions()     → this.renosChatSession
  // ... etc
}
```

#### HealthModule
**Purpose:** Health check endpoints  
**Controller:** `HealthController`

**Endpoints:**
- `GET /api/v1/health` - Basic health check
  ```json
  {
    "status": "ok",
    "database": "connected",
    "uptime": 123.45
  }
  ```

- `GET /api/v1/health/db` - Database health check
  ```json
  {
    "status": "ok",
    "database": {
      "connected": true,
      "latency": 5
    }
  }
  ```

---

### Disabled Modules ❌

All business logic modules are currently disabled due to Supabase→Prisma migration.  
See `MIGRATION_LOG.md` for restoration plan.

| Module | Files Disabled | Reason |
|--------|---------------|--------|
| CustomersModule | Directory renamed | Field name mismatches (35 errors) |
| AuthModule | .bak | Used Supabase Auth |
| JobsModule | .bak | 100+ Supabase queries |
| TeamModule | .bak | 50+ Supabase queries |
| TimeTrackingModule | .bak | Supabase queries |
| GDPRModule | .bak | Supabase queries |
| QualityModule | .bak | 3 services, Supabase queries |
| RealTimeModule | .bak | WebSockets + Supabase |
| SecurityModule | .bak | 3 services, Supabase queries |
| AiFridayModule | .bak | Supabase queries |

---

## Database Schema (Prisma)

### Primary Models (renos schema)

```prisma
model RenosCustomer {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  phone         String?
  address       String?
  companyName   String?  @map("company_name")
  notes         String?
  status        String   @default("active")
  tags          String[]
  totalLeads    Int      @default(0) @map("total_leads")
  totalBookings Int      @default(0) @map("total_bookings")
  totalRevenue  Float    @default(0) @map("total_revenue")
  lastContactAt DateTime? @map("last_contact_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relations
  leads         RenosLead[]
  bookings      RenosBooking[]
  conversations RenosConversation[]
  emailThreads  RenosEmailThread[]
  cleaningPlans RenosCleaningPlan[]
  
  @@map("customers")
  @@schema("renos")
}

model RenosLead {
  id               String   @id @default(cuid())
  customerId       String?  @map("customer_id")
  name             String
  email            String
  phone            String?
  address          String?
  companyName      String?  @map("company_name")
  serviceType      String?  @map("service_type")
  estimatedValue   Float?   @map("estimated_value")
  status           String   @default("new")
  priority         String?  @default("medium")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  // Relations
  customer         RenosCustomer? @relation(fields: [customerId], references: [id])
  bookings         RenosBooking[]
  quotes           RenosQuote[]
  conversations    RenosConversation[]
  
  @@map("leads")
  @@schema("renos")
}

model RenosBooking {
  id                String    @id @default(cuid())
  customerId        String?   @map("customer_id")
  leadId            String?   @map("lead_id")
  serviceType       String?   @map("service_type")
  address           String?
  scheduledAt       DateTime  @default(now()) @map("scheduled_at")
  estimatedDuration Int       @default(120) @map("estimated_duration")
  status            String    @default("scheduled")
  timerStatus       String    @default("not_started") @map("timer_status")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relations
  customer          RenosCustomer? @relation(fields: [customerId], references: [id])
  lead              RenosLead? @relation(fields: [leadId], references: [id])
  
  @@map("bookings")
  @@schema("renos")
}

// ... 20+ more models
```

### Key Schema Patterns

1. **Naming Convention:**
   - Models: PascalCase with `Renos` prefix (e.g., `RenosCustomer`)
   - Fields: camelCase (e.g., `customerId`)
   - Table names: snake_case via `@@map("table_name")`
   - Column names: snake_case via `@map("column_name")`

2. **Multi-Schema Setup:**
   - `renos` - Main application data
   - `vault` - TekupVault knowledge base
   - `billy` - Billy.dk integration cache
   - `crm` - CRM data
   - `flow` - Workflow automation

3. **Relations:**
   - All use `cuid()` for IDs (clickable, URL-safe)
   - Optional relations: `customerId String?`
   - Cascade deletes on critical relations

---

## API Structure

### Global Prefix
All endpoints prefixed with `/api/v1`

### Current Endpoints
```
GET  /api/v1/health       - Basic health check
GET  /api/v1/health/db    - Database health check
GET  /health              - Legacy health endpoint (main.ts custom handler)
GET  /test-sentry         - Sentry test (dev only)
GET  /docs                - Swagger UI (when enabled)
```

### Future Endpoints (When Modules Restored)
```
# Customers
GET    /api/v1/customers
GET    /api/v1/customers/:id
POST   /api/v1/customers
PUT    /api/v1/customers/:id
DELETE /api/v1/customers/:id

# Leads (formerly Jobs)
GET    /api/v1/leads
GET    /api/v1/leads/:id
POST   /api/v1/leads
PUT    /api/v1/leads/:id

# Bookings
GET    /api/v1/bookings
POST   /api/v1/bookings
PUT    /api/v1/bookings/:id/start
PUT    /api/v1/bookings/:id/complete

# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# ... more endpoints per module
```

---

## Middleware Stack (main.ts)

```typescript
// 1. Sentry Error Tracking (if configured)
Sentry.init({ dsn, environment })

// 2. Security Headers
app.use(helmet())

// 3. Compression
app.use(compression())

// 4. CORS
app.enableCors({
  origin: [localhost, production_url],
  credentials: true
})

// 5. Global Validation Pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown props
  forbidNonWhitelisted: true, // Throw on unknown props
  transform: true             // Auto-transform to DTO types
}))

// 6. Rate Limiting (via ThrottlerModule)

// 7. Sentry Interceptor (global)
app.useGlobalInterceptors(new SentryInterceptor())
```

---

## Error Handling

### HTTP Exceptions
```typescript
throw new NotFoundException('Customer not found')
throw new BadRequestException('Invalid email format')
throw new UnauthorizedException('Invalid credentials')
throw new ForbiddenException('Insufficient permissions')
```

### Sentry Integration
- All uncaught exceptions sent to Sentry (if configured)
- Filtered: connection timeouts, rate limit errors, validation errors
- Includes request context, user info, stack traces

### Validation Errors
Automatic via class-validator:
```typescript
// DTO
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

// Auto-rejects invalid requests with 400 + details
```

---

## Development Workflow

### Start Development Server
```bash
npm run build
node dist/main.js
```

### Watch Mode (Auto-rebuild)
```bash
npm run start:dev  # Currently broken - needs module fixes
```

### Run Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

### Database Operations
```bash
# Generate Prisma Client after schema changes
npx prisma generate

# View data in Prisma Studio
npx prisma studio

# Create migration (when ready)
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

---

## Deployment

### Production Build
```bash
npm run build
NODE_ENV=production node dist/main.js
```

### Environment Variables (Production)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
FRONTEND_URL=https://rendetaljeos.onrender.com
```

### Docker (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## Performance Considerations

### Database Connection Pooling
```typescript
// Prisma default pool size: 25 connections
prisma:info Starting a postgresql pool with 25 connections
```

### Caching Strategy (Future)
- Redis for session storage
- Redis for frequently accessed data (customers, leads)
- CDN for static assets

### Query Optimization
- Use `.select()` to fetch only needed fields
- Use `.include()` wisely to avoid N+1 queries
- Index frequently queried fields in Prisma schema

---

## Security Checklist

- [x] Helmet security headers
- [x] CORS configured
- [x] Rate limiting (100 req/min)
- [x] Input validation (class-validator)
- [x] SQL injection protection (Prisma parameterized queries)
- [ ] Authentication (JWT) - Disabled
- [ ] Authorization (RBAC) - Disabled
- [ ] XSS protection - Needs audit
- [ ] CSRF protection - Not implemented yet
- [ ] Secrets in .env (not committed)

---

## Monitoring & Observability

### Logs
- Development: Colored console output with Prisma query logs
- Production: JSON structured logs (ready for log aggregation)

### Metrics (Future)
- Prometheus metrics endpoint
- Request duration histograms
- Error rate counters
- Database connection pool metrics

### Health Checks
- `/api/v1/health` - Liveness probe
- `/api/v1/health/db` - Readiness probe (checks DB connection)

---

## Known Issues & Limitations

1. **No Business Modules Active** - Only health checks work
2. **No Authentication** - All endpoints publicly accessible
3. **No Authorization** - No role-based access control
4. **Watch Mode Broken** - Must use manual build + start
5. **Field Name Mismatches** - Old API expects snake_case, Prisma uses camelCase
6. **No Migrations** - Schema updates require manual sync from tekup-database

---

## Next Steps

See `MIGRATION_LOG.md` Phase 2 for detailed restoration plan.

**Priority 1:** CustomersModule field name mapping + conversion  
**Priority 2:** JobsModule → LeadsModule conversion  
**Priority 3:** AuthModule JWT implementation

---

**Maintained by:** Jonas Abde  
**Project:** Rendetalje Operations System  
**Organization:** Tekup Portfolio
