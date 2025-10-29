# Internal Sales Tracking System - Implementation Plan & Coding Checklist

## Executive Summary

This is an **actionable implementation plan** with detailed coding tasks for building an Internal Sales Tracking System for Tekup's three business units. This system tracks sales of actual services (cleaning, IT consulting, catering) - it is NOT a software product to sell.

### Quick Reference

- **Repository**: Create new repo `tekup-sales-tracking`
- **Timeline**: 16 weeks across 4 phases
- **Stack**: NestJS + Next.js + Supabase PostgreSQL + Render.com
- **First Milestone**: Rendetalje pilot (Week 4)

---

## Phase 1: Foundation & Rendetalje Pilot (Weeks 1-4)

### 1.1 Project Setup & Database Schema

#### ✅ Task 1.1.1: Create Supabase Project

**Priority**: Critical | **Duration**: 1 hour

**Steps**:

1. Go to supabase.com and create new project
   - Project Name: `tekup-sales-tracking`
   - Region: `Frankfurt (eu-central-1)`
   - Generate strong database password
   - Save connection string to password manager

2. Enable required features:
   - Row Level Security (RLS)
   - Connection pooling
   - Daily automated backups

3. Create `.env` file with connection details

**Deliverable**: Supabase project URL and database credentials

---

#### ✅ Task 1.1.2: Initialize Backend Project with NestJS

**Priority**: Critical | **Duration**: 2 hours

```bash
# Install NestJS CLI
npm install -g @nestjs/cli

# Create backend project
nest new tekup-sales-tracking-backend
cd tekup-sales-tracking-backend

# Install core dependencies
npm install @prisma/client @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt class-validator class-transformer @supabase/supabase-js
npm install -D prisma @types/bcrypt @types/passport-jwt

# Initialize Prisma
npx prisma init
```

**Project Structure**:
```
tekup-sales-tracking-backend/
├── src/
│   ├── auth/
│   ├── sales/
│   ├── customers/
│   ├── services/
│   ├── common/
│   ├── database/
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env
└── package.json
```

**Deliverable**: Running NestJS application on `http://localhost:3000`

---

#### ✅ Task 1.1.3: Define Prisma Database Schema

**Priority**: Critical | **Duration**: 3 hours

**File**: `prisma/schema.prisma`

Create complete schema with 7 core models:

1. **Organization** - Business units (Tekup, Rendetalje, Foodtruck)
2. **Customer** - Customers with B2B/B2C support
3. **Service** - Service offerings per organization
4. **Sale** - Core sales transaction entity
5. **Lead** - Potential sales opportunities (Phase 2)
6. **User** - Internal staff with roles
7. **AuditLog** - Security and compliance tracking

**Key Schema Features**:

- UUID primary keys
- Organization-based data isolation
- Enum types for status fields
- Proper indexes on foreign keys
- Timestamp tracking (created_at, updated_at)
- JSON fields for flexible metadata

**Testing**:
```bash
npx prisma validate
npx prisma format
```

**Deliverable**: Valid Prisma schema file ready for migration

---

#### ✅ Task 1.1.4: Create Database Migrations

**Priority**: Critical | **Duration**: 1 hour

```bash
# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

**Verify Migration**:

- Check Supabase dashboard for created tables
- Verify all indexes created
- Test foreign key constraints

**Deliverable**: Database schema deployed to Supabase

---

#### ✅ Task 1.1.5: Create Seed Data Script

**Priority**: High | **Duration**: 2 hours

**File**: `prisma/seed.ts`

Seed data includes:

1. Rendetalje organization
2. 4 cleaning services (Standard, Deep, Window, Move-out)
3. Admin user account
4. 2 sample customers

**Run Seed**:
```bash
npx prisma db seed
```

**Verify**:
```bash
npx prisma studio
# Check organizations, services, users tables
```

**Deliverable**: Seed data loaded successfully

---

### 1.2 Backend API Development

#### ✅ Task 1.2.1: Create Prisma Service Module

**Priority**: Critical | **Duration**: 1 hour

**Files**:

- `src/database/prisma.service.ts`
- `src/database/database.module.ts`

**Features**:

- Global module for app-wide access
- Lifecycle hooks (onModuleInit, onModuleDestroy)
- Connection management

**Testing**:
```typescript
// Test in any service
constructor(private prisma: PrismaService) {}

async test() {
  const orgs = await this.prisma.organization.findMany();
  console.log(orgs);
}
```

**Deliverable**: PrismaService accessible throughout app

---

#### ✅ Task 1.2.2: Implement Authentication Module

**Priority**: Critical | **Duration**: 4 hours

**Files**:

- `src/auth/auth.service.ts` - Login logic
- `src/auth/auth.controller.ts` - POST /auth/login endpoint
- `src/auth/jwt.strategy.ts` - JWT validation
- `src/auth/guards/jwt-auth.guard.ts` - Route protection
- `src/auth/guards/organization.guard.ts` - Organization isolation
- `src/auth/auth.module.ts`

**Features**:

- Email/password authentication
- JWT token generation (24h expiry)
- Token payload includes: userId, organizationId, role
- Organization ID injection into requests

**API Endpoints**:
```typescript
POST /auth/login
Body: { email, password }
Response: { access_token, user }
```

**Testing**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rendetalje.dk","password":"temp123"}'
```

**Deliverable**: Working authentication with JWT tokens

---

#### ✅ Task 1.2.3: Create Financial Calculator Utility

**Priority**: High | **Duration**: 1 hour

**File**: `src/common/utils/financial-calculator.ts`

```typescript
export class FinancialCalculator {
  static calculateTax(amount: number, taxRate: number = 25): number {
    return Number(((amount * taxRate) / 100).toFixed(2));
  }

  static calculateTotal(amount: number, taxRate: number = 25): number {
    const tax = this.calculateTax(amount, taxRate);
    return Number((amount + tax).toFixed(2));
  }

  static applyDiscount(amount: number, discountPercent: number): number {
    return Number((amount * (1 - discountPercent / 100)).toFixed(2));
  }
}
```

**Testing**:
```typescript
expect(FinancialCalculator.calculateTax(1000, 25)).toBe(250);
expect(FinancialCalculator.calculateTotal(1000, 25)).toBe(1250);
```

**Deliverable**: Reusable financial calculation utility

---

#### ✅ Task 1.2.4: Implement Sale Status Validator

**Priority**: High | **Duration**: 1 hour

**File**: `src/sales/utils/status-validator.ts`

```typescript
export class SaleStatusValidator {
  private static validTransitions = {
    QUOTE_SENT: ['ACCEPTED', 'LOST'],
    ACCEPTED: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['PAID'],
    PAID: [],
    LOST: [],
    CANCELLED: [],
  };

  static canTransition(from: SaleStatus, to: SaleStatus): boolean {
    return this.validTransitions[from]?.includes(to) || false;
  }

  static getValidNextStatuses(current: SaleStatus): SaleStatus[] {
    return this.validTransitions[current] || [];
  }
}
```

**Deliverable**: Status transition validation logic

---

#### ✅ Task 1.2.5: Implement Sales Module - Service Layer

**Priority**: Critical | **Duration**: 4 hours

**File**: `src/sales/sales.service.ts`

**Methods**:
```typescript
class SalesService {
  // Generate unique sale number (RS-2025-0001)
  private async generateSaleNumber(organizationId: string): Promise<string>
  
  // Create new sale with validation
  async create(createSaleDto: CreateSaleDto, organizationId: string, userId: string)
  
  // Find all sales for organization with filters
  async findAll(organizationId: string, filters?: SaleFilters)
  
  // Find single sale by ID
  async findOne(id: string, organizationId: string)
  
  // Update sale with status validation
  async update(id: string, updateSaleDto: UpdateSaleDto, organizationId: string)
  
  // Delete sale (soft delete recommended)
  async remove(id: string, organizationId: string)
  
  // Get sales statistics
  async getStatistics(organizationId: string, dateRange?: DateRange)
}
```

**Business Logic**:

- Auto-generate sale numbers (prefix based on org type)
- Calculate tax and totals automatically
- Validate status transitions
- Update customer statistics on sale creation
- Ensure data isolation by organization ID

**Deliverable**: Complete sales service with business logic

---

#### ✅ Task 1.2.6: Implement Sales Module - DTOs

**Priority**: Critical | **Duration**: 2 hours

**Files**:

- `src/sales/dto/create-sale.dto.ts`
- `src/sales/dto/update-sale.dto.ts`
- `src/sales/dto/sale-filters.dto.ts`

**Validation Rules**:

- Required fields: customerId, serviceId, status, saleDate, finalAmount
- Amount validation: >= 0
- Date validation: valid ISO string
- Enum validation: status, source
- Optional fields: scheduledDate, assignedTo, notes

**Example**:
```typescript
export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsEnum(SaleStatus)
  status: SaleStatus;

  @IsDateString()
  saleDate: string;

  @IsNumber()
  @Min(0)
  finalAmount: number;

  // ... other fields
}
```

**Deliverable**: Validated DTOs for sales operations

---

#### ✅ Task 1.2.7: Implement Sales Module - Controller

**Priority**: Critical | **Duration**: 3 hours

**File**: `src/sales/sales.controller.ts`

**API Endpoints**:
```typescript
@Controller('sales')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class SalesController {
  
  @Post()
  // POST /sales - Create new sale
  
  @Get()
  // GET /sales?status=ACCEPTED&dateFrom=2025-01-01
  
  @Get(':id')
  // GET /sales/:id - Get sale details
  
  @Patch(':id')
  // PATCH /sales/:id - Update sale
  
  @Delete(':id')
  // DELETE /sales/:id - Delete sale
  
  @Get('statistics/summary')
  // GET /sales/statistics/summary - Dashboard stats
}
```

**Response Format**:
```json
{
  "data": [...],
  "meta": {
    "total": 45,
    "page": 1,
    "pageSize": 20
  }
}
```

**Deliverable**: REST API for sales management

---

#### ✅ Task 1.2.8: Implement Customers Module

**Priority**: High | **Duration**: 3 hours

**Files**:

- `src/customers/customers.service.ts`
- `src/customers/customers.controller.ts`
- `src/customers/dto/create-customer.dto.ts`

**Features**:

- CRUD operations for customers
- Organization-based isolation
- Search by name, email, phone
- Customer statistics (total sales, revenue)
- Duplicate detection by email

**API Endpoints**:
```
POST   /customers
GET    /customers
GET    /customers/:id
PATCH  /customers/:id
DELETE /customers/:id
GET    /customers/:id/sales
```

**Deliverable**: Complete customer management API

---

#### ✅ Task 1.2.9: Implement Services Module

**Priority**: High | **Duration**: 2 hours

**Files**:

- `src/services/services.service.ts`
- `src/services/services.controller.ts`

**Features**:

- List active services for organization
- Filter by category
- Service details with pricing
- Admin can create/update services

**API Endpoints**:
```
GET  /services
GET  /services/:id
POST /services (ADMIN only)
PATCH /services/:id (ADMIN only)
```

**Deliverable**: Services catalog API

---

#### ✅ Task 1.2.10: Implement Audit Logging Interceptor

**Priority**: Medium | **Duration**: 2 hours

**File**: `src/common/interceptors/audit-log.interceptor.ts`

**Logged Actions**:

- CREATE, UPDATE, DELETE operations on sales, customers
- User login/logout
- Status changes on sales
- Data exports

**Implementation**:
```typescript
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return next.handle().pipe(
      tap(async (data) => {
        await this.prisma.auditLog.create({
          data: {
            userId: user.userId,
            organizationId: user.organizationId,
            actionType: request.method,
            resourceType: this.getResourceType(request.url),
            // ... other fields
          },
        });
      }),
    );
  }
}
```

**Deliverable**: Automatic audit logging for sensitive operations

---

### 1.3 Frontend Development (Next.js)

#### ✅ Task 1.3.1: Initialize Next.js Project

**Priority**: Critical | **Duration**: 2 hours

```bash
# Create Next.js project with App Router
npx create-next-app@latest tekup-sales-tracking-frontend --typescript --tailwind --app

cd tekup-sales-tracking-frontend

# Install UI dependencies
npx shadcn-ui@latest init

# Install additional dependencies
npm install @tanstack/react-query axios zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns recharts lucide-react
```

**Project Structure**:
```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (main dashboard)
│   │   ├── sales/
│   │   │   ├── page.tsx (sales list)
│   │   │   ├── [id]/page.tsx (sale detail)
│   │   │   └── new/page.tsx (create sale)
│   │   ├── customers/
│   │   └── reports/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── sales/
│   ├── customers/
│   └── dashboard/
├── lib/
│   ├── api.ts (axios client)
│   ├── auth.ts
│   └── utils.ts
├── hooks/
│   ├── use-sales.ts
│   └── use-auth.ts
└── types/
    └── index.ts
```

**Deliverable**: Running Next.js app on `http://localhost:3001`

---

#### ✅ Task 1.3.2: Set Up Shadcn/ui Components

**Priority**: High | **Duration**: 1 hour

```bash
# Add required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
```

**Deliverable**: UI component library ready for use

---

#### ✅ Task 1.3.3: Create API Client with Axios

**Priority**: Critical | **Duration**: 2 hours

**File**: `lib/api.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**API Service Functions**:
```typescript
// lib/services/sales.service.ts
export const salesService = {
  getAll: (filters?: SaleFilters) => apiClient.get('/sales', { params: filters }),
  getOne: (id: string) => apiClient.get(`/sales/${id}`),
  create: (data: CreateSaleDto) => apiClient.post('/sales', data),
  update: (id: string, data: UpdateSaleDto) => apiClient.patch(`/sales/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sales/${id}`),
};
```

**Deliverable**: Configured API client with authentication

---

#### ✅ Task 1.3.4: Set Up TanStack Query

**Priority**: High | **Duration**: 1 hour

**File**: `app/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.Node }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Custom Hook Example**:
```typescript
// hooks/use-sales.ts
export function useSales(filters?: SaleFilters) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesService.getAll(filters),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: salesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}
```

**Deliverable**: TanStack Query configured for API state management

---

#### ✅ Task 1.3.5: Implement Login Page

**Priority**: Critical | **Duration**: 2 hours

**File**: `app/(auth)/login/page.tsx`

**Features**:

- Email and password inputs
- Form validation with Zod
- Login API call
- Store JWT token in localStorage
- Redirect to dashboard on success
- Error handling

**UI Design**:

- Centered card layout
- Company logo
- "Remember me" checkbox
- Forgot password link (placeholder)

**Deliverable**: Functional login page with authentication

---

#### ✅ Task 1.3.6: Create Dashboard Layout

**Priority**: Critical | **Duration**: 3 hours

**File**: `app/(dashboard)/layout.tsx`

**Components**:

1. **Header**: Organization name, user profile, logout
2. **Sidebar**: Navigation menu
   - Dashboard
   - Sales
   - Customers
   - Reports
   - Settings (admin only)
3. **Main Content Area**: Page-specific content

**Responsive Design**:

- Desktop: Permanent sidebar
- Mobile: Collapsible hamburger menu

**Deliverable**: Complete dashboard layout

---

#### ✅ Task 1.3.7: Build Main Dashboard Page

**Priority**: Critical | **Duration**: 4 hours

**File**: `app/(dashboard)/page.tsx`

**Components**:

1. **KPI Cards** (4 cards in row):
   - Total Revenue (this month)
   - Total Sales Count
   - Active Leads
   - Conversion Rate

2. **Sales Pipeline Visualization**:
   - Funnel chart showing sales by status
   - Count and total value per status

3. **Recent Activity Feed**:
   - Last 10 sales/leads created
   - Status changes
   - Payments received

4. **Revenue Trend Chart**:
   - Line chart showing last 30 days revenue
   - Using Recharts library

5. **Quick Actions**:
   - Button: Create New Sale
   - Button: Add Lead
   - Button: View Reports

**Data Requirements**:
```typescript
GET /sales/statistics/summary
Response: {
  revenue: { current: 125000, previous: 112000 },
  salesCount: { current: 45, previous: 40 },
  conversionRate: { current: 68, previous: 63 },
  pipeline: [
    { status: 'QUOTE_SENT', count: 12, value: 45000 },
    // ...
  ],
  recentActivity: [...],
  revenueTrend: [...],
}
```

**Deliverable**: Functional dashboard with live data

---

#### ✅ Task 1.3.8: Build Sales List Page

**Priority**: Critical | **Duration**: 4 hours

**File**: `app/(dashboard)/sales/page.tsx`

**Features**:

- Data table with columns:
  - Sale Number
  - Customer Name
  - Service
  - Amount (with tax)
  - Status (with colored badge)
  - Sale Date
  - Assigned To
  - Actions (View, Edit, Delete)

- **Filters**:
  - Status dropdown
  - Date range picker
  - Customer search
  - Assigned to dropdown

- **Sorting**: Click column headers to sort

- **Pagination**: 20 items per page

- **Bulk Actions**: Select multiple, bulk delete

- **"Create Sale" button**: Top right

**Deliverable**: Functional sales list with filtering and sorting

---

#### ✅ Task 1.3.9: Build Create Sale Form

**Priority**: Critical | **Duration**: 4 hours

**File**: `app/(dashboard)/sales/new/page.tsx`

**Form Fields**:

1. Customer Selection (searchable dropdown)
2. Service Selection (dropdown, filtered by org)
3. Sale Status (dropdown)
4. Sale Date (date picker)
5. Scheduled Date (optional, date picker)
6. Quoted Amount (number input)
7. Final Amount (number input)
8. Source (dropdown: EMAIL, PHONE, WEBSITE, etc.)
9. Assigned To (user dropdown)
10. Internal Notes (textarea)
11. Customer Notes (textarea)

**Real-time Calculations**:

- Tax amount (auto-calculated)
- Total with tax (auto-calculated)
- Show pricing preview

**Validation**:

- All required fields
- Amount >= 0
- Valid dates

**Deliverable**: Working sale creation form

---

#### ✅ Task 1.3.10: Build Sale Detail Page

**Priority**: High | **Duration**: 3 hours

**File**: `app/(dashboard)/sales/[id]/page.tsx`

**Sections**:

1. **Sale Header**:
   - Sale number
   - Status badge
   - Action buttons (Edit, Delete, Change Status)

2. **Customer Information**:
   - Name, email, phone
   - Link to customer profile

3. **Service Details**:
   - Service name and category
   - Pricing breakdown

4. **Financial Summary**:
   - Quoted amount
   - Final amount
   - Tax rate and amount
   - Total with tax
   - Payment status

5. **Timeline**:
   - Sale date
   - Scheduled date
   - Delivery start/end
   - Payment date

6. **Notes**:
   - Internal notes (staff only)
   - Customer notes

7. **Status History**:
   - Timeline of status changes
   - Who changed, when

**Deliverable**: Complete sale detail view

---

#### ✅ Task 1.3.11: Build Basic Reports Page

**Priority**: Medium | **Duration**: 3 hours

**File**: `app/(dashboard)/reports/page.tsx`

**Reports**:

1. **Sales by Status**:
   - Pie chart
   - Count and value per status

2. **Revenue by Week**:
   - Bar chart
   - Last 12 weeks

3. **Top Customers**:
   - Table with customer name and total revenue
   - Top 10

4. **Top Services**:
   - Table with service name and sales count
   - Top 10

**Export Functionality**:

- CSV export button for each report

**Deliverable**: Basic reporting dashboard

---

### 1.4 Testing & Deployment

#### ✅ Task 1.4.1: Write Backend Unit Tests

**Priority**: High | **Duration**: 4 hours

**Test Files**:

- `src/auth/auth.service.spec.ts`
- `src/sales/sales.service.spec.ts`
- `src/customers/customers.service.spec.ts`

**Test Coverage**:

- Service methods (CRUD operations)
- Business logic (sale number generation, financial calculations)
- Status validation
- Organization isolation

**Run Tests**:
```bash
npm run test
npm run test:cov
```

**Target**: 80%+ code coverage

**Deliverable**: Passing unit tests

---

#### ✅ Task 1.4.2: Write Frontend Component Tests

**Priority**: Medium | **Duration**: 3 hours

**Test Files**:

- `components/sales/sales-list.test.tsx`
- `components/sales/create-sale-form.test.tsx`
- `app/(dashboard)/page.test.tsx`

**Testing Library**: Jest + React Testing Library

**Test Coverage**:

- Component rendering
- User interactions
- Form validation
- API integration (mocked)

**Deliverable**: Passing component tests

---

#### ✅ Task 1.4.3: Create Docker Configuration

**Priority**: High | **Duration**: 2 hours

**File**: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**File**: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

**Test Locally**:
```bash
docker build -t sales-backend ./backend
docker build -t sales-frontend ./frontend
docker-compose up
```

**Deliverable**: Working Docker containers

---

#### ✅ Task 1.4.4: Deploy to Render.com

**Priority**: Critical | **Duration**: 3 hours

**Backend Deployment**:

1. Create new Web Service on Render
2. Connect to GitHub repository
3. Settings:
   - Name: `tekup-sales-backend`
   - Region: `Frankfurt`
   - Branch: `main`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables:
     - DATABASE_URL
     - JWT_SECRET
     - NODE_ENV=production

**Frontend Deployment**:

1. Create new Static Site on Render
2. Settings:
   - Name: `tekup-sales-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next`
   - Environment Variables:
     - NEXT_PUBLIC_API_URL

**Deliverable**: Live applications on Render.com

---

#### ✅ Task 1.4.5: Set Up GitHub Actions CI/CD

**Priority**: High | **Duration**: 2 hours

**File**: `.github/workflows/backend.yml`

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Similar workflow for frontend**

**Deliverable**: Automated testing and deployment

---

#### ✅ Task 1.4.6: Create User Documentation

**Priority**: High | **Duration**: 4 hours

**File**: `docs/USER_GUIDE.md`

**Sections**:

1. **Getting Started**
   - Logging in
   - Dashboard overview

2. **Managing Sales**
   - Creating a sale
   - Editing a sale
   - Changing status
   - Deleting a sale

3. **Managing Customers**
   - Adding new customer
   - Viewing customer history

4. **Reports**
   - Available reports
   - Exporting data

5. **FAQ**
   - Common issues
   - Troubleshooting

**Include Screenshots**: Use tool like Snagit or built-in

**Deliverable**: Complete user guide with screenshots

---

## Phase 2: Lead Management & Multi-Organization (Weeks 5-8)

### 2.1 Database & Backend Extensions

#### ✅ Task 2.1.1: Add Lead Entity to Schema

**Priority**: Critical | **Duration**: 1 hour

Update `prisma/schema.prisma`:

- Lead model already defined in Phase 1
- Create migration: `npx prisma migrate dev --name add-leads`

**Deliverable**: Lead table in database

---

#### ✅ Task 2.1.2: Implement Leads Module (Backend)

**Priority**: Critical | **Duration**: 4 hours

**Files**:

- `src/leads/leads.service.ts`
- `src/leads/leads.controller.ts`
- `src/leads/dto/create-lead.dto.ts`

**Features**:

- CRUD operations for leads
- Lead scoring algorithm
- Follow-up tracking
- Convert lead to sale

**API Endpoints**:
```
POST   /leads
GET    /leads
GET    /leads/:id
PATCH  /leads/:id
DELETE /leads/:id
POST   /leads/:id/convert (convert to sale)
```

**Deliverable**: Complete leads management API

---

#### ✅ Task 2.1.3: Implement Lead-to-Sale Conversion

**Priority**: Critical | **Duration**: 2 hours

**File**: `src/leads/leads.service.ts`

```typescript
async convertToSale(leadId: string, organizationId: string, userId: string) {
  const lead = await this.findOne(leadId, organizationId);
  
  // Create customer if needed
  let customer = lead.customerId 
    ? await this.prisma.customer.findUnique({ where: { id: lead.customerId }})
    : await this.prisma.customer.create({
        data: {
          name: lead.contactName,
          email: lead.contactEmail,
          phone: lead.contactPhone,
          organizationId,
          customerType: 'B2C',
          status: 'ACTIVE',
        },
      });
  
  // Create sale
  const sale = await this.salesService.create({
    customerId: customer.id,
    serviceId: lead.interestServiceId,
    status: 'ACCEPTED',
    saleDate: new Date().toISOString(),
    quotedAmount: lead.estimatedValue || 0,
    finalAmount: lead.estimatedValue || 0,
    source: lead.source,
  }, organizationId, userId);
  
  // Update lead
  await this.prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'CONVERTED',
      convertedSaleId: sale.id,
    },
  });
  
  return sale;
}
```

**Deliverable**: Working lead conversion workflow

---

#### ✅ Task 2.1.4: Seed Tekup and Foodtruck Organizations

**Priority**: High | **Duration**: 2 hours

**File**: `prisma/seed-phase2.ts`

**Tekup Services**:

- IT Consulting (hourly)
- Software Development (project-based)
- System Integration (custom)
- IT Support (monthly subscription)

**Foodtruck Fiesta Services**:

- Event Catering (per person)
- Private Events (fixed)
- Corporate Catering (custom)
- Menu Customization (add-on)

**Run Seed**:
```bash
npx ts-node prisma/seed-phase2.ts
```

**Deliverable**: All three organizations with services in database

---

### 2.2 Frontend Multi-Organization Support

#### ✅ Task 2.2.1: Implement Organization Switcher

**Priority**: Critical | **Duration**: 3 hours

**File**: `components/layout/organization-switcher.tsx`

**Features**:

- Dropdown in header showing current organization
- Switch between organizations (if user has multi-org access)
- Update global state on switch
- Refresh all data when switching

**State Management**:
```typescript
// stores/organization.store.ts (Zustand)
interface OrganizationStore {
  currentOrg: Organization | null;
  setOrganization: (org: Organization) => void;
}
```

**Deliverable**: Working organization switcher

---

#### ✅ Task 2.2.2: Build Lead List Page

**Priority**: Critical | **Duration**: 3 hours

**File**: `app/(dashboard)/leads/page.tsx`

**Features**:

- Table with columns:
  - Contact Name
  - Email/Phone
  - Service Interest
  - Status
  - Priority
  - Score
  - Follow-up Date
  - Actions

- **Filters**:
  - Status (NEW, CONTACTED, QUALIFIED)
  - Priority
  - Overdue follow-ups

- **Quick Actions**:
  - Convert to Sale
  - Schedule Follow-up
  - Mark as Unqualified

**Deliverable**: Functional lead list page

---

#### ✅ Task 2.2.3: Build Lead Creation Form

**Priority**: High | **Duration**: 2 hours

**File**: `app/(dashboard)/leads/new/page.tsx`

**Form Fields**:

- Contact name (required)
- Email
- Phone
- Source (dropdown)
- Service interest (dropdown)
- Estimated value
- Priority
- Notes

**Deliverable**: Working lead creation form

---

#### ✅ Task 2.2.4: Build Lead Detail Page with Conversion

**Priority**: Critical | **Duration**: 3 hours

**File**: `app/(dashboard)/leads/[id]/page.tsx`

**Features**:

- Lead information display
- Follow-up history
- **"Convert to Sale" button** (prominent)
- Edit/Delete actions
- Notes section

**Conversion Modal**:

- Confirm conversion
- Preview sale to be created
- Option to adjust details before converting

**Deliverable**: Complete lead detail with conversion

---

#### ✅ Task 2.2.5: Enhance Reports for Multi-Org

**Priority**: Medium | **Duration**: 2 hours

**Updates**:

- Add organization filter to all reports
- Show aggregated data across all orgs (for admins)
- Comparative charts (org vs org)

**New Report**: Lead Conversion Rate by Organization

**Deliverable**: Multi-org reporting

---

### 2.3 Email Integration (RenOS Pattern)

#### ✅ Task 2.3.1: Create Email Parser for Lead Extraction

**Priority**: Medium | **Duration**: 3 hours

**File**: `src/integrations/email/email-parser.service.ts`

**Features**:

- Parse email subject and body
- Extract contact information (name, email, phone)
- Identify service interest keywords
- Assign priority based on content

**Integration Pattern** (similar to RenOS):
```typescript
async processIncomingEmail(email: EmailData) {
  const parsed = this.parseEmail(email);
  
  const lead = await this.leadsService.create({
    contactName: parsed.name || 'Unknown',
    contactEmail: parsed.email || email.from,
    contactPhone: parsed.phone,
    source: 'EMAIL',
    status: 'NEW',
    priority: parsed.priority,
    message: email.body,
    interestServiceId: this.matchService(parsed.keywords),
  }, organizationId);
  
  // Notify assigned staff
  await this.notificationService.notify(...);
  
  return lead;
}
```

**Deliverable**: Automatic lead creation from emails

---

#### ✅ Task 2.3.2: Set Up Email Webhook Endpoint

**Priority**: Medium | **Duration**: 2 hours

**File**: `src/integrations/email/email.controller.ts`

**Endpoint**:
```typescript
@Post('webhooks/email')
async handleEmailWebhook(@Body() emailData: any) {
  // Verify webhook signature
  // Parse email
  // Create lead
  return { success: true };
}
```

**Configure Gmail**: Forward emails to webhook URL

**Deliverable**: Working email-to-lead automation

---

### 2.4 Security Audit

#### ✅ Task 2.4.1: Verify Organization Data Isolation

**Priority**: Critical | **Duration**: 3 hours

**Tests**:

1. User from Org A cannot access Org B data
2. API queries automatically filter by organizationId
3. Database RLS policies enforce isolation
4. No data leakage in error messages

**Audit Checklist**:

- [ ] All queries include organizationId filter
- [ ] Guards protect all routes
- [ ] Token includes organizationId
- [ ] No direct ID access without org check

**Deliverable**: Security audit report

---

## Phase 3: Automation & Billy.dk Integration (Weeks 9-12)

### 3.1 Billy.dk Invoice Automation

#### ✅ Task 3.1.1: Implement Billy Invoice Service

**Priority**: Critical | **Duration**: 4 hours

**File**: `src/integrations/billy/billy.service.ts`

**Features**:

- Create invoice in Billy.dk when sale status → COMPLETED
- Sync customer to Billy contacts
- Add line items for services
- Apply correct VAT
- Store Billy invoice ID in sale

**Integration**:
```typescript
async createInvoiceForSale(saleId: string) {
  const sale = await this.salesService.findOne(saleId);
  
  // Call Tekup-Billy API
  const invoice = await this.billyClient.post('/invoices/create', {
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
  });
  
  // Update sale with Billy invoice ID
  await this.salesService.update(saleId, {
    billyInvoiceId: invoice.id,
    paymentStatus: 'PENDING',
  });
  
  return invoice;
}
```

**Deliverable**: Automatic Billy invoice creation

---

#### ✅ Task 3.1.2: Implement Payment Status Sync

**Priority**: Critical | **Duration**: 3 hours

**File**: `src/integrations/billy/billy-sync.service.ts`

**Features**:

- Poll Billy.dk every 15 minutes for payment status
- Update sale payment_status when paid
- Handle partial payments
- Handle refunds

**Implementation**:
```typescript
@Cron('*/15 * * * *') // Every 15 minutes
async syncPaymentStatuses() {
  const pendingSales = await this.salesService.findAll({
    paymentStatus: 'PENDING',
    billyInvoiceId: { not: null },
  });
  
  for (const sale of pendingSales) {
    const invoice = await this.billyClient.get(`/invoices/${sale.billyInvoiceId}`);
    
    if (invoice.status === 'PAID') {
      await this.salesService.update(sale.id, {
        paymentStatus: 'PAID',
        paymentDate: invoice.paidDate,
      });
    }
  }
}
```

**Deliverable**: Automatic payment status updates

---

#### ✅ Task 3.1.3: Implement Billy Webhook Handler

**Priority**: High | **Duration**: 2 hours

**File**: `src/integrations/billy/billy-webhook.controller.ts`

**Endpoint**:
```typescript
@Post('webhooks/billy/payment')
async handlePaymentWebhook(@Body() webhookData: any) {
  const invoiceId = webhookData.invoiceId;
  
  const sale = await this.salesService.findByBillyInvoiceId(invoiceId);
  
  if (sale) {
    await this.salesService.update(sale.id, {
      paymentStatus: 'PAID',
      paymentDate: webhookData.paidDate,
    });
  }
  
  return { success: true };
}
```

**Configure Billy**: Set webhook URL in Billy.dk settings

**Deliverable**: Real-time payment notifications

---

### 3.2 Google Calendar Integration

#### ✅ Task 3.2.1: Implement Calendar Service

**Priority**: High | **Duration**: 4 hours

**File**: `src/integrations/calendar/calendar.service.ts`

**Features**:

- Create event when sale status → SCHEDULED
- Include customer and service details
- Invite assigned staff member
- Update event when scheduled_date changes
- Delete event if sale cancelled

**Implementation**:
```typescript
async createEventForSale(saleId: string) {
  const sale = await this.salesService.findOne(saleId);
  
  const event = await this.calendarClient.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `${sale.service.name} - ${sale.customer.name}`,
      description: `Sale: ${sale.saleNumber}\nCustomer: ${sale.customer.email}\nNotes: ${sale.customerNotes}`,
      start: {
        dateTime: sale.scheduledDate,
        timeZone: 'Europe/Copenhagen',
      },
      end: {
        dateTime: this.calculateEndTime(sale.scheduledDate, sale.service.durationMinutes),
        timeZone: 'Europe/Copenhagen',
      },
      attendees: [
        { email: sale.assignedUser.email },
        { email: sale.customer.email },
      ],
    },
  });
  
  // Store event ID
  await this.salesService.update(saleId, {
    calendarEventId: event.id,
  });
}
```

**Deliverable**: Automatic calendar event creation

---

#### ✅ Task 3.2.2: Implement Availability Checker

**Priority**: Medium | **Duration**: 2 hours

**Feature**: Check staff availability before scheduling

**Implementation**:
```typescript
async getAvailableSlots(date: Date, staffId?: string) {
  const events = await this.calendarClient.events.list({
    calendarId: 'primary',
    timeMin: startOfDay(date).toISOString(),
    timeMax: endOfDay(date).toISOString(),
  });
  
  // Calculate available time slots
  const slots = this.calculateAvailableSlots(events.items);
  return slots;
}
```

**Deliverable**: Availability checking feature

---

### 3.3 Automated Notifications & Reminders

#### ✅ Task 3.3.1: Implement Email Notification Service

**Priority**: High | **Duration**: 3 hours

**File**: `src/notifications/email-notification.service.ts`

**Email Templates**:

1. New lead assigned
2. Quote sent to customer
3. Sale accepted
4. Service scheduled
5. Payment received
6. Follow-up reminder

**Implementation**:
```typescript
async sendEmail(template: EmailTemplate, data: any) {
  const html = this.renderTemplate(template, data);
  
  await this.mailer.sendMail({
    to: data.recipientEmail,
    subject: this.getSubject(template),
    html,
  });
}
```

**Deliverable**: Automated email notifications

---

#### ✅ Task 3.3.2: Implement Follow-up Reminder System

**Priority**: Medium | **Duration**: 2 hours

**File**: `src/notifications/reminder.service.ts`

**Features**:

- Check for overdue follow-ups daily
- Send reminder emails to assigned staff
- Update lead with reminder sent timestamp

**Implementation**:
```typescript
@Cron('0 9 * * *') // Daily at 9 AM
async sendFollowUpReminders() {
  const overdueLeads = await this.leadsService.findOverdue();
  
  for (const lead of overdueLeads) {
    await this.emailService.sendEmail('FOLLOW_UP_REMINDER', {
      recipientEmail: lead.assignedUser.email,
      leadName: lead.contactName,
      daysSince: this.calculateDays(lead.followUpDate),
    });
  }
}
```

**Deliverable**: Automatic follow-up reminders

---

### 3.4 Mobile Optimization

#### ✅ Task 3.4.1: Optimize UI for Mobile Devices

**Priority**: High | **Duration**: 4 hours

**Updates**:

- Responsive tables (collapse to cards on mobile)
- Touch-friendly buttons (minimum 44px)
- Mobile navigation (hamburger menu)
- Simplified forms for mobile
- Test on iOS Safari and Android Chrome

**Breakpoints**:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Deliverable**: Fully responsive mobile UI

---

#### ✅ Task 3.4.2: Implement Mobile Quick Actions

**Priority**: Medium | **Duration**: 2 hours

**Features**:

- Swipe actions on list items
- Quick status change from mobile
- One-tap phone/email from customer view
- Simplified data entry on mobile

**Deliverable**: Mobile-optimized workflows

---

## Phase 4: Analytics & Business Intelligence (Weeks 13-16)

### 4.1 Advanced Analytics Dashboard

#### ✅ Task 4.1.1: Build Executive Dashboard

**Priority**: High | **Duration**: 4 hours

**File**: `app/(dashboard)/analytics/page.tsx`

**KPIs**:

1. **Monthly Revenue**: Current vs previous month
2. **Conversion Rate**: Leads → Sales (%)
3. **Average Sale Value**: Mean finalAmount
4. **Customer Acquisition Cost**: If tracked
5. **Customer Lifetime Value**: Total revenue per customer
6. **Sales Cycle Length**: Days from lead to paid

**Visualizations**:

- Revenue trend (line chart)
- Sales by status (funnel chart)
- Revenue by organization (pie chart)
- Top performing services (bar chart)

**Deliverable**: Executive analytics dashboard

---

#### ✅ Task 4.1.2: Implement Customer Lifetime Value Calculation

**Priority**: High | **Duration**: 2 hours

**File**: `src/analytics/analytics.service.ts`

```typescript
async calculateCustomerLTV(customerId: string) {
  const sales = await this.prisma.sale.findMany({
    where: {
      customerId,
      paymentStatus: 'PAID',
    },
  });
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const avgSaleValue = totalRevenue / sales.length;
  const purchaseFrequency = sales.length / this.calculateMonthsSinceFirst(sales);
  
  // Simplified LTV = Avg Sale Value × Purchase Frequency × Avg Customer Lifespan
  const ltv = avgSaleValue * purchaseFrequency * 24; // 24 months assumed lifespan
  
  return {
    totalRevenue,
    avgSaleValue,
    purchaseFrequency,
    estimatedLTV: ltv,
  };
}
```

**Deliverable**: Customer LTV metrics

---

#### ✅ Task 4.1.3: Build Sales Trend Analysis

**Priority**: High | **Duration**: 3 hours

**Features**:

- Revenue over time (daily/weekly/monthly/yearly)
- Sales volume over time
- Trend lines and forecasting
- Comparison periods (YoY, MoM)

**API Endpoint**:
```
GET /analytics/sales-trends?period=monthly&start=2025-01-01&end=2025-12-31
```

**Deliverable**: Sales trend analytics

---

#### ✅ Task 4.1.4: Implement Service Performance Report

**Priority**: Medium | **Duration**: 2 hours

**Report Shows**:

- Sales count by service
- Revenue by service
- Average sale value by service
- Most/least popular services
- Service profitability (if cost tracked)

**Deliverable**: Service performance report

---

#### ✅ Task 4.1.5: Build Sales Rep Performance Tracking

**Priority**: Medium | **Duration**: 3 hours

**Metrics per Staff Member**:

- Total sales closed
- Total revenue generated
- Conversion rate
- Average deal size
- Sales cycle length

**Leaderboard**: Rank staff by revenue/sales count

**Deliverable**: Sales rep performance dashboard

---

### 4.2 Export & Data Management

#### ✅ Task 4.2.1: Implement CSV Export for Sales

**Priority**: High | **Duration**: 2 hours

**File**: `src/exports/csv-export.service.ts`

**Features**:

- Export sales data to CSV
- Include all fields
- Apply current filters
- Download as file

**API Endpoint**:
```
GET /sales/export?format=csv&status=PAID&dateFrom=2025-01-01
```

**Deliverable**: CSV export functionality

---

#### ✅ Task 4.2.2: Implement PDF Report Generation

**Priority**: Medium | **Duration**: 3 hours

**Library**: Use `pdfkit` or similar

**Reports**:

- Monthly sales summary
- Customer statement
- Executive report

**Features**:

- Company branding
- Charts and tables
- Downloadable PDF

**Deliverable**: PDF report generation

---

#### ✅ Task 4.2.3: Build Custom Report Builder (Basic)

**Priority**: Low | **Duration**: 4 hours

**Features**:

- Select data fields to include
- Choose filters
- Pick date range
- Generate report
- Save report configuration

**Deliverable**: Basic custom report builder

---

### 4.3 Performance Optimization

#### ✅ Task 4.3.1: Implement Redis Caching

**Priority**: High | **Duration**: 3 hours

**File**: `src/cache/cache.service.ts`

**Cache Strategy**:

- Dashboard statistics (TTL: 5 minutes)
- Service list (TTL: 1 hour)
- Reports (TTL: 15 minutes)

**Implementation**:
```typescript
async getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
  const cached = await this.redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFn();
  await this.redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

**Deliverable**: Redis caching layer

---

#### ✅ Task 4.3.2: Optimize Database Queries

**Priority**: High | **Duration**: 3 hours

**Optimizations**:

- Add missing indexes
- Use eager loading (include relations)
- Implement pagination everywhere
- Use database aggregations (SUM, COUNT)
- Avoid N+1 queries

**Example**:
```typescript
// Bad: N+1 query
const sales = await this.prisma.sale.findMany();
for (const sale of sales) {
  sale.customer = await this.prisma.customer.findUnique({ where: { id: sale.customerId }});
}

// Good: Single query with include
const sales = await this.prisma.sale.findMany({
  include: { customer: true, service: true },
});
```

**Deliverable**: Optimized database queries

---

#### ✅ Task 4.3.3: Implement Database Indexing Strategy

**Priority**: High | **Duration**: 2 hours

**Add Indexes**:
```sql
CREATE INDEX idx_sales_org_date ON sales(organization_id, sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date, status);
```

**Test Performance**:
```sql
EXPLAIN ANALYZE SELECT * FROM sales WHERE organization_id = '...' AND sale_date > '2025-01-01';
```

**Deliverable**: Optimized database indexes

---

#### ✅ Task 4.3.4: Conduct Load Testing

**Priority**: High | **Duration**: 3 hours

**Tool**: Use `k6` or `Artillery`

**Test Scenarios**:

1. Dashboard load with 5000 sales
2. Sales list with filters
3. Report generation
4. Concurrent users (10, 50, 100)

**Target Performance**:

- Dashboard < 2 seconds
- API responses < 500ms (p95)
- Support 100 concurrent users

**Deliverable**: Load test results and optimizations

---

## Post-Implementation Tasks

### ✅ Final Testing & QA

**Duration**: 1 week

**Test Plan**:

- [ ] End-to-end user flows
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Security penetration testing
- [ ] Data integrity tests
- [ ] Performance benchmarks

**Deliverable**: QA report with bug fixes

---

### ✅ User Training

**Duration**: 1 week

**Training Sessions**:

1. Rendetalje staff (2 hours)
2. Tekup staff (2 hours)
3. Foodtruck Fiesta staff (2 hours)
4. Admin training (3 hours)

**Materials**:

- Video tutorials
- User guide (already created)
- Quick reference cards

**Deliverable**: Trained users

---

### ✅ Production Launch

**Duration**: 1 day

**Launch Checklist**:

- [ ] All tests passing
- [ ] Production environment configured
- [ ] Database backup automated
- [ ] Monitoring enabled (Sentry)
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] User accounts created
- [ ] Data migration complete

**Go-Live**: Coordinate with all three organizations

**Deliverable**: Live production system

---

## Maintenance & Support Plan

### Weekly Tasks

- Monitor error logs (Sentry)
- Review performance metrics
- Check database backups
- User support tickets

### Monthly Tasks

- Security updates
- Performance optimization
- Feature requests review
- User feedback analysis

### Quarterly Tasks

- Security audit
- Infrastructure review
- Cost optimization
- Feature roadmap planning

---

## Success Metrics (6-Month Review)

### Adoption Metrics

- [ ] 95%+ of sales logged in system
- [ ] 80%+ daily active users
- [ ] 40%+ mobile usage

### Efficiency Metrics

- [ ] < 2 minutes to create sale
- [ ] < 1 hour from completion to invoice
- [ ] 90% reduction in missed follow-ups

### Business Metrics

- [ ] +10% lead-to-sale conversion rate
- [ ] Customer retention tracking active
- [ ] Revenue forecasting ±10% accuracy

---

## Technology Stack Reference

### Backend Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "@prisma/client": "^5.0.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "@supabase/supabase-js": "^2.38.0",
  "redis": "^4.6.0"
}
```

### Frontend Dependencies

```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0",
  "date-fns": "^2.30.0",
  "recharts": "^2.10.0",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Deployment Configuration

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@host:5432/db?schema=public
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h
NODE_ENV=production
REDIS_URL=redis://localhost:6379
BILLY_API_URL=https://billy-api.tekup.dk
BILLY_API_KEY=your-billy-key
GOOGLE_CALENDAR_API_KEY=your-calendar-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tekup.dk
SMTP_PASS=your-smtp-password
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=https://api.tekup-sales.dk
NEXT_PUBLIC_APP_NAME=Tekup Sales Tracking
```

---

## Repository Structure

```
tekup-sales-tracking/
├── .github/
│   └── workflows/
│       ├── backend.yml
│       └── frontend.yml
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── USER_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT.md
├── docker-compose.yml
└── README.md
```

---

## Next Steps

1. **Create GitHub Repository**: `tekup-sales-tracking`
2. **Set Up Development Environment**: Clone repo, install dependencies
3. **Start Phase 1, Task 1.1.1**: Create Supabase project
4. **Follow checklist sequentially**: Mark tasks complete as you go

**Estimated Total Development Time**: 16 weeks (4 months)

**Team Recommendation**: 1-2 full-stack developers

---

## Questions or Issues?

- **Technical Questions**: Document in `docs/TECHNICAL_NOTES.md`
- **Design Decisions**: Update design document
- **Bug Tracking**: Use GitHub Issues
- **Feature Requests**: Create GitHub Discussions

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**Status**: Ready for Implementation
