# API Documentation - Tekup Cloud Dashboard

Denne dokumentation beskriver alle API-endpoints og data-strukturer, der bruges i Tekup Cloud Dashboard.

## 📋 Oversigt

Tekup Cloud Dashboard integrerer med flere backend-services:

- **Supabase**: Primær database og autentificering
- **TekupVault**: Knowledge base og dokumentsøgning  
- **Billy.dk**: Fakturering og regnskab
- **Google APIs**: Kalender og email-integration

## 🔐 Autentificering

### Supabase Auth

Alle API-kald til Supabase kræver autentificering via JWT tokens.

```typescript
// Automatisk håndteret af Supabase client
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### API Headers

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Tenant-ID': tenantId
};
```

## 👤 Authentication Endpoints

### POST /auth/login

Autentificer bruger med email og password.

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  user: User;
  session: Session;
  error?: string;
}
```

**Eksempel:**
```typescript
const response = await apiService.login('user@tekup.dk', 'password123');
```

### POST /auth/register

Registrer ny bruger.

**Request:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  tenant_id?: string;
}
```

### POST /auth/logout

Log bruger ud og invalidér session.

**Response:**
```typescript
interface LogoutResponse {
  success: boolean;
  error?: string;
}
```

### POST /auth/reset-password

Send password reset email.

**Request:**
```typescript
interface ResetPasswordRequest {
  email: string;
}
```

## 📊 Dashboard Endpoints

### GET /api/kpis

Hent KPI-metrics for dashboard.

**Query Parameters:**

- `tenant_id` (required): Tenant ID
- `period` (optional): 'day' | 'week' | 'month' | 'year'
- `start_date` (optional): ISO date string
- `end_date` (optional): ISO date string

**Response:**
```typescript
interface KPIMetrics {
  totalLeads: number;
  conversionRate: number;
  revenue: number;
  activeAgents: number;
  period: string;
  previousPeriod?: {
    totalLeads: number;
    conversionRate: number;
    revenue: number;
    activeAgents: number;
  };
}
```

**Eksempel:**
```typescript
const kpis = await apiService.getKPIMetrics('tenant-123', 'month');
```

### GET /api/activities

Hent nylige aktiviteter.

**Query Parameters:**

- `tenant_id` (required): Tenant ID
- `limit` (optional): Antal aktiviteter (default: 10)
- `offset` (optional): Pagination offset

**Response:**
```typescript
interface Activity {
  id: string;
  tenant_id: string;
  type: 'lead_captured' | 'invoice_sent' | 'email_sent' | 'meeting_scheduled';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

type ActivitiesResponse = Activity[];
```

### GET /api/agents

Hent status for AI-agenter.

**Response:**
```typescript
interface AIAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastActivity: string;
  tasksCompleted: number;
  successRate: number;
  description: string;
}

type AgentsResponse = AIAgent[];
```

## 🎯 Leads Endpoints

### GET /api/leads

Hent leads med filtering og pagination.

**Query Parameters:**

- `tenant_id` (required): Tenant ID
- `status` (optional): 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
- `source` (optional): Lead source filter
- `limit` (optional): Antal leads (default: 20)
- `offset` (optional): Pagination offset
- `search` (optional): Søgeterm

**Response:**
```typescript
interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}
```

### POST /api/leads

Opret nyt lead.

**Request:**
```typescript
interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  value?: number;
  notes?: string;
}
```

### PUT /api/leads/:id

Opdater eksisterende lead.

**Request:**
```typescript
interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  value?: number;
  notes?: string;
}
```

### DELETE /api/leads/:id

Slet lead.

**Response:**
```typescript
interface DeleteResponse {
  success: boolean;
  error?: string;
}
```

## 🏥 System Health Endpoints

### GET /api/health

Hent system health status.

**Response:**
```typescript
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    email: ServiceStatus;
    billing: ServiceStatus;
    vault: ServiceStatus;
  };
  uptime: number;
  lastCheck: string;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
}
```

### GET /api/health/metrics

Hent detaljerede performance metrics.

**Response:**
```typescript
interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  requests: {
    total: number;
    errors: number;
    avgResponseTime: number;
  };
  timestamp: string;
}
```

## 💰 Billy.dk Integration

### GET /api/billy/invoices

Hent fakturaer fra Billy.dk.

**Query Parameters:**

- `status` (optional): 'draft' | 'sent' | 'paid' | 'overdue'
- `limit` (optional): Antal fakturaer
- `offset` (optional): Pagination offset

**Response:**
```typescript
interface Invoice {
  id: string;
  number: string;
  customer: {
    name: string;
    email: string;
    address?: string;
  };
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  paid_at?: string;
}

interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
}
```

### POST /api/billy/invoices

Opret ny faktura i Billy.dk.

**Request:**
```typescript
interface CreateInvoiceRequest {
  customer_id: string;
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }[];
  due_days: number;
  notes?: string;
}
```

## 📚 TekupVault Integration

### GET /api/vault/search

Søg i knowledge base.

**Query Parameters:**

- `q` (required): Søgeterm
- `limit` (optional): Antal resultater
- `type` (optional): 'document' | 'faq' | 'procedure'

**Response:**
```typescript
interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'faq' | 'procedure';
  score: number;
  metadata?: Record<string, any>;
  created_at: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}
```

### POST /api/vault/documents

Upload nyt dokument til knowledge base.

**Request:**
```typescript
interface UploadDocumentRequest {
  title: string;
  content: string;
  type: 'document' | 'faq' | 'procedure';
  tags?: string[];
  metadata?: Record<string, any>;
}
```

## 📅 Google Calendar Integration

### GET /api/google/calendar/events

Hent kalender-events.

**Query Parameters:**

- `start_date` (required): ISO date string
- `end_date` (required): ISO date string
- `calendar_id` (optional): Specifik kalender ID

**Response:**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
  meeting_link?: string;
}

type CalendarEventsResponse = CalendarEvent[];
```

### POST /api/google/calendar/events

Opret nyt kalender-event.

**Request:**
```typescript
interface CreateEventRequest {
  title: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
}
```

## 📧 Email Integration

### POST /api/email/send

Send email via integreret email-service.

**Request:**
```typescript
interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string; // base64
    contentType: string;
  }[];
}
```

**Response:**
```typescript
interface SendEmailResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}
```

## 🔔 Notifications

### GET /api/notifications

Hent notifikationer for bruger.

**Query Parameters:**

- `read` (optional): true | false
- `type` (optional): 'info' | 'success' | 'warning' | 'error'
- `limit` (optional): Antal notifikationer

**Response:**
```typescript
interface Notification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

type NotificationsResponse = Notification[];
```

### PUT /api/notifications/:id/read

Marker notifikation som læst.

**Response:**
```typescript
interface MarkReadResponse {
  success: boolean;
  error?: string;
}
```

## 🏢 Tenant Management

### GET /api/tenants/:id

Hent tenant-information.

**Response:**
```typescript
interface Tenant {
  id: string;
  name: string;
  logo?: string;
  plan: 'basic' | 'professional' | 'enterprise';
  settings: {
    timezone: string;
    currency: string;
    language: string;
    features: string[];
  };
  created_at: string;
  active: boolean;
}
```

### PUT /api/tenants/:id

Opdater tenant-indstillinger.

**Request:**
```typescript
interface UpdateTenantRequest {
  name?: string;
  logo?: string;
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
    features?: string[];
  };
}
```

## 👥 User Management

### GET /api/users

Hent brugere for tenant.

**Response:**
```typescript
interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  last_login?: string;
  created_at: string;
  active: boolean;
}

type UsersResponse = User[];
```

### POST /api/users

Opret ny bruger.

**Request:**
```typescript
interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  password: string;
}
```

## 🚨 Error Handling

Alle API-endpoints returnerer konsistente error-responses:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  status: number;
}
```

### Almindelige Error Codes

- `UNAUTHORIZED` (401): Manglende eller ugyldig autentificering
- `FORBIDDEN` (403): Utilstrækkelige rettigheder
- `NOT_FOUND` (404): Ressource ikke fundet
- `VALIDATION_ERROR` (422): Ugyldig input data
- `RATE_LIMITED` (429): For mange requests
- `INTERNAL_ERROR` (500): Server fejl

## 📊 Rate Limiting

API'et implementerer rate limiting:

- **Autentificerede requests**: 1000 requests/time
- **Uautentificerede requests**: 100 requests/time
- **Upload endpoints**: 10 requests/minut

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🔄 Webhooks

### Supabase Real-time

```typescript
// Lyt til real-time ændringer
const subscription = supabase
  .channel('leads')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leads' },
    (payload) => {
      console.log('Lead updated:', payload);
    }
  )
  .subscribe();
```

### Billy.dk Webhooks

```typescript
// Webhook endpoint for Billy.dk events
POST /api/webhooks/billy
{
  "event": "invoice.paid",
  "data": {
    "invoice_id": "123",
    "amount": 1000,
    "paid_at": "2024-01-01T12:00:00Z"
  }
}
```

## 🧪 Testing

### API Testing med Jest

```typescript
// __tests__/api.test.ts
describe('API Service', () => {
  test('should fetch KPI metrics', async () => {
    const kpis = await apiService.getKPIMetrics('tenant-123');
    expect(kpis).toHaveProperty('totalLeads');
    expect(kpis).toHaveProperty('conversionRate');
  });
});
```

### Mock Data

Se `src/lib/api.ts` for fallback mock data, der bruges under udvikling og testing.

Denne API-dokumentation giver et komplet overblik over alle tilgængelige endpoints og data-strukturer i Tekup Cloud Dashboard.
