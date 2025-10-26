# 📡 RenOS API Documentation

## Oversigt
RenOS API er en RESTful API der understøtter alle CRUD operationer for rendetalje management systemet.

## Base URL
```
Production: https://api.renos.dk
Development: http://localhost:3000
```

## Authentication
Alle API endpoints kræver authentication via Clerk JWT token.

```typescript
// Headers
{
  "Authorization": "Bearer <clerk_jwt_token>",
  "Content-Type": "application/json"
}
```

## Endpoints

### Customers

#### GET /api/customers
Hent alle kunder

**Response:**
```typescript
interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  lastContactAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Response
{
  "data": Customer[],
  "total": number,
  "page": number,
  "limit": number
}
```

#### POST /api/customers
Opret ny kunde

**Request:**
```typescript
interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}
```

**Response:**
```typescript
{
  "data": Customer,
  "message": "Customer created successfully"
}
```

#### PUT /api/customers/:id
Opdater kunde

**Request:**
```typescript
interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}
```

#### DELETE /api/customers/:id
Slet kunde

**Response:**
```typescript
{
  "message": "Customer deleted successfully"
}
```

### Leads

#### GET /api/leads
Hent alle leads

**Query Parameters:**
- `page` - Side nummer (default: 1)
- `limit` - Antal per side (default: 20)
- `status` - Filter efter status
- `customerId` - Filter efter kunde

**Response:**
```typescript
interface Lead {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  estimatedValue: number;
  probability: number;
  source: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### POST /api/leads
Opret ny lead

**Request:**
```typescript
interface CreateLeadRequest {
  customerId: string;
  title: string;
  description: string;
  estimatedValue: number;
  probability: number;
  source: string;
  assignedTo?: string;
}
```

### Bookings

#### GET /api/bookings
Hent alle bookinger

**Response:**
```typescript
interface Booking {
  id: string;
  customerId: string;
  leadId: string | null;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Quotes

#### GET /api/quotes
Hent alle tilbud

**Response:**
```typescript
interface Quote {
  id: string;
  customerId: string;
  leadId: string | null;
  title: string;
  description: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
```

### Analytics

#### GET /api/analytics/dashboard
Hent dashboard statistikker

**Response:**
```typescript
interface DashboardStats {
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  leads: {
    total: number;
    new: number;
    qualified: number;
    conversionRate: number;
  };
  bookings: {
    total: number;
    scheduled: number;
    completed: number;
    revenue: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
    chart: RevenueDataPoint[];
  };
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  leads: number;
  bookings: number;
}
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict
- `INTERNAL_ERROR` - Server error

### Example Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/customers"
}
```

## Rate Limiting

### Limits
- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

## Pagination

### Query Parameters
- `page` - Side nummer (1-based)
- `limit` - Antal per side (max: 100)
- `sort` - Sort field
- `order` - Sort order (asc/desc)

### Response Format
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Webhooks

### Events
- `customer.created` - Kunde oprettet
- `customer.updated` - Kunde opdateret
- `customer.deleted` - Kunde slettet
- `lead.created` - Lead oprettet
- `lead.updated` - Lead opdateret
- `booking.created` - Booking oprettet
- `booking.updated` - Booking opdateret

### Webhook Payload
```typescript
interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  webhookId: string;
}
```

## SDK

### TypeScript SDK
```typescript
import { RenOSClient } from '@renos/sdk';

const client = new RenOSClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.renos.dk'
});

// Hent kunder
const customers = await client.customers.getAll();

// Opret kunde
const customer = await client.customers.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## Testing

### Test Environment
```
Base URL: https://api-test.renos.dk
API Key: test_key_123
```

### Test Data
Test environment indeholder sample data for alle endpoints.

## Support

### API Support
- **Email**: api-support@renos.dk
- **Documentation**: https://docs.renos.dk
- **Status Page**: https://status.renos.dk

### Rate Limits
- **Free Tier**: 1000 requests/month
- **Pro Tier**: 10000 requests/month
- **Enterprise**: Unlimited
