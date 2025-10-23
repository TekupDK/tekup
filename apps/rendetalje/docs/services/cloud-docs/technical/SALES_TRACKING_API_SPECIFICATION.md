# Sales Tracking System - API Specification

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.tekup-sales.dk/api/v1
```

## Authentication

All API requests require authentication using JWT tokens in the Authorization header.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@rendetalje.dk",
  "password": "secure-password"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@rendetalje.dk",
    "name": "Admin User",
    "role": "ADMIN",
    "organization": {
      "id": "uuid",
      "name": "Rendetalje",
      "type": "RENDETALJE"
    }
  }
}
```

### Using JWT Token
```http
GET /sales
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Sales API

### Create Sale
```http
POST /sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "uuid",
  "serviceId": "uuid",
  "status": "QUOTE_SENT",
  "saleDate": "2025-10-18T10:00:00Z",
  "scheduledDate": "2025-10-25T14:00:00Z",
  "quotedAmount": 1000,
  "finalAmount": 950,
  "source": "EMAIL",
  "assignedTo": "uuid",
  "internalNotes": "Customer requested discount",
  "customerNotes": "Prefer afternoon appointment"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "customerId": "uuid",
  "serviceId": "uuid",
  "saleNumber": "RS-2025-0123",
  "status": "QUOTE_SENT",
  "saleDate": "2025-10-18T10:00:00Z",
  "scheduledDate": "2025-10-25T14:00:00Z",
  "quotedAmount": 1000,
  "finalAmount": 950,
  "currency": "DKK",
  "taxRate": 25,
  "taxAmount": 237.5,
  "totalWithTax": 1187.5,
  "paymentStatus": "NOT_INVOICED",
  "source": "EMAIL",
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+45 12 34 56 78"
  },
  "service": {
    "id": "uuid",
    "name": "Standard Cleaning",
    "category": "Regular Cleaning"
  },
  "assignedUser": {
    "id": "uuid",
    "name": "Staff Member",
    "email": "staff@rendetalje.dk"
  },
  "createdAt": "2025-10-18T10:00:00Z",
  "updatedAt": "2025-10-18T10:00:00Z"
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "customerId must be a valid UUID",
    "finalAmount must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

### List Sales
```http
GET /sales?status=ACCEPTED&dateFrom=2025-01-01&dateTo=2025-12-31&page=1&pageSize=20
Authorization: Bearer {token}
```

**Query Parameters**:
- `status` (optional): Filter by sale status (QUOTE_SENT, ACCEPTED, etc.)
- `customerId` (optional): Filter by customer
- `assignedTo` (optional): Filter by assigned user
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by sale number or customer name

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "saleNumber": "RS-2025-0123",
      "status": "ACCEPTED",
      "saleDate": "2025-10-18T10:00:00Z",
      "finalAmount": 950,
      "totalWithTax": 1187.5,
      "customer": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "service": {
        "name": "Standard Cleaning"
      },
      "assignedUser": {
        "name": "Staff Member"
      }
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

---

### Get Sale by ID
```http
GET /sales/{id}
Authorization: Bearer {token}
```

**Response** (200 OK): Same structure as Create Sale response

**Not Found** (404):
```json
{
  "statusCode": 404,
  "message": "Sale not found",
  "error": "Not Found"
}
```

---

### Update Sale
```http
PATCH /sales/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "SCHEDULED",
  "scheduledDate": "2025-10-25T14:00:00Z",
  "finalAmount": 900,
  "internalNotes": "Updated with final pricing"
}
```

**Response** (200 OK): Updated sale object

**Invalid Status Transition** (400):
```json
{
  "statusCode": 400,
  "message": "Cannot transition from COMPLETED to QUOTE_SENT",
  "error": "Bad Request"
}
```

---

### Delete Sale
```http
DELETE /sales/{id}
Authorization: Bearer {token}
```

**Response** (204 No Content)

---

### Get Sales Statistics
```http
GET /sales/statistics/summary?dateFrom=2025-10-01&dateTo=2025-10-31
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "revenue": {
    "current": 125000,
    "previous": 112000,
    "change": 11.6
  },
  "salesCount": {
    "current": 45,
    "previous": 40,
    "change": 12.5
  },
  "conversionRate": {
    "current": 68,
    "previous": 63,
    "change": 7.9
  },
  "averageSaleValue": 2777.78,
  "pipeline": [
    {
      "status": "QUOTE_SENT",
      "count": 12,
      "totalValue": 45000
    },
    {
      "status": "ACCEPTED",
      "count": 8,
      "totalValue": 32000
    },
    {
      "status": "SCHEDULED",
      "count": 15,
      "totalValue": 56000
    },
    {
      "status": "COMPLETED",
      "count": 10,
      "totalValue": 38000
    }
  ],
  "recentActivity": [
    {
      "type": "SALE_CREATED",
      "saleNumber": "RS-2025-0145",
      "timestamp": "2025-10-18T10:00:00Z",
      "userName": "Staff Member"
    }
  ],
  "revenueTrend": [
    {
      "date": "2025-10-01",
      "revenue": 4500
    }
  ]
}
```

---

### Export Sales to CSV
```http
GET /sales/export?format=csv&status=PAID&dateFrom=2025-01-01
Authorization: Bearer {token}
```

**Response** (200 OK):
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="sales-export-2025-10-18.csv"

Sale Number,Customer,Service,Amount,Tax,Total,Status,Sale Date,Payment Date
RS-2025-0001,John Doe,Standard Cleaning,1000,250,1250,PAID,2025-01-15,2025-01-20
RS-2025-0002,Jane Smith,Deep Cleaning,1200,300,1500,PAID,2025-01-18,2025-01-25
```

---

## Customers API

### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+45 12 34 56 78",
  "customerType": "B2C",
  "companyName": null,
  "address": {
    "street": "Main Street 123",
    "city": "Copenhagen",
    "postalCode": "1000",
    "country": "Denmark"
  },
  "tags": ["vip", "repeat-customer"],
  "notes": "Prefers afternoon appointments"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+45 12 34 56 78",
  "customerType": "B2C",
  "address": {
    "street": "Main Street 123",
    "city": "Copenhagen",
    "postalCode": "1000",
    "country": "Denmark"
  },
  "tags": ["vip", "repeat-customer"],
  "notes": "Prefers afternoon appointments",
  "totalSalesCount": 0,
  "totalRevenue": 0,
  "status": "ACTIVE",
  "createdAt": "2025-10-18T10:00:00Z"
}
```

---

### List Customers
```http
GET /customers?search=john&status=ACTIVE&page=1&pageSize=20
Authorization: Bearer {token}
```

**Query Parameters**:
- `search` (optional): Search by name, email, or phone
- `status` (optional): ACTIVE, INACTIVE, BLOCKED
- `customerType` (optional): B2B, B2C
- `tags` (optional): Filter by tags (comma-separated)
- `page`, `pageSize`: Pagination

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+45 12 34 56 78",
      "customerType": "B2C",
      "totalSalesCount": 5,
      "totalRevenue": 12500,
      "lastContactAt": "2025-10-15T10:00:00Z",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "total": 78,
    "page": 1,
    "pageSize": 20,
    "totalPages": 4
  }
}
```

---

### Get Customer by ID
```http
GET /customers/{id}
Authorization: Bearer {token}
```

**Response** (200 OK): Full customer object with computed fields

---

### Get Customer Sales History
```http
GET /customers/{id}/sales?page=1&pageSize=10
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "saleNumber": "RS-2025-0123",
      "service": { "name": "Standard Cleaning" },
      "finalAmount": 950,
      "status": "PAID",
      "saleDate": "2025-10-18T10:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### Update Customer
```http
PATCH /customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+45 98 76 54 32",
  "tags": ["vip", "repeat-customer", "priority"],
  "notes": "Updated contact preferences"
}
```

**Response** (200 OK): Updated customer object

---

### Delete Customer
```http
DELETE /customers/{id}
Authorization: Bearer {token}
```

**Response** (204 No Content)

**Constraint Error** (400): If customer has associated sales
```json
{
  "statusCode": 400,
  "message": "Cannot delete customer with existing sales",
  "error": "Bad Request"
}
```

---

## Services API

### List Services
```http
GET /services?category=Regular Cleaning&active=true
Authorization: Bearer {token}
```

**Query Parameters**:
- `category` (optional): Filter by category
- `active` (optional): true/false, default: true

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Standard Cleaning",
      "description": "Standard cleaning of residential or office spaces",
      "category": "Regular Cleaning",
      "basePrice": 500,
      "currency": "DKK",
      "pricingModel": "HOURLY",
      "durationMinutes": 120,
      "active": true
    }
  ]
}
```

---

### Get Service by ID
```http
GET /services/{id}
Authorization: Bearer {token}
```

**Response** (200 OK): Full service object

---

### Create Service (Admin Only)
```http
POST /services
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Premium Cleaning",
  "description": "Premium cleaning with extra attention to detail",
  "category": "Specialized Cleaning",
  "basePrice": 800,
  "pricingModel": "HOURLY",
  "durationMinutes": 180,
  "active": true
}
```

**Response** (201 Created): Created service object

**Forbidden** (403): If user is not ADMIN
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

### Update Service (Admin Only)
```http
PATCH /services/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "basePrice": 850,
  "active": true
}
```

**Response** (200 OK): Updated service object

---

## Leads API

### Create Lead
```http
POST /leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "contactName": "Jane Smith",
  "contactEmail": "jane@example.com",
  "contactPhone": "+45 12 34 56 78",
  "source": "WEBSITE",
  "status": "NEW",
  "priority": "HIGH",
  "interestServiceId": "uuid",
  "estimatedValue": 1200,
  "message": "Interested in deep cleaning service for office space",
  "followUpDate": "2025-10-20T10:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "contactName": "Jane Smith",
  "contactEmail": "jane@example.com",
  "contactPhone": "+45 12 34 56 78",
  "source": "WEBSITE",
  "status": "NEW",
  "priority": "HIGH",
  "score": null,
  "interestServiceId": "uuid",
  "estimatedValue": 1200,
  "message": "Interested in deep cleaning service for office space",
  "followUpDate": "2025-10-20T10:00:00Z",
  "followUpCount": 0,
  "service": {
    "name": "Deep Cleaning"
  },
  "createdAt": "2025-10-18T10:00:00Z"
}
```

---

### List Leads
```http
GET /leads?status=NEW&priority=HIGH&overdue=true
Authorization: Bearer {token}
```

**Query Parameters**:
- `status`: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED
- `priority`: LOW, MEDIUM, HIGH, URGENT
- `source`: EMAIL, PHONE, WEBSITE, REFERRAL, EVENT
- `overdue`: true/false (follow-up date has passed)
- `assignedTo`: Filter by assigned user
- `search`: Search by contact name or email

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "contactName": "Jane Smith",
      "contactEmail": "jane@example.com",
      "status": "NEW",
      "priority": "HIGH",
      "score": 75,
      "estimatedValue": 1200,
      "followUpDate": "2025-10-20T10:00:00Z",
      "service": { "name": "Deep Cleaning" },
      "createdAt": "2025-10-18T10:00:00Z"
    }
  ],
  "meta": {
    "total": 23,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

---

### Get Lead by ID
```http
GET /leads/{id}
Authorization: Bearer {token}
```

**Response** (200 OK): Full lead object with related data

---

### Update Lead
```http
PATCH /leads/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONTACTED",
  "priority": "URGENT",
  "followUpDate": "2025-10-21T14:00:00Z",
  "notes": "Called customer, very interested. Schedule demo.",
  "followUpCount": 1
}
```

**Response** (200 OK): Updated lead object

---

### Convert Lead to Sale
```http
POST /leads/{id}/convert
Authorization: Bearer {token}
Content-Type: application/json

{
  "saleDate": "2025-10-18T10:00:00Z",
  "scheduledDate": "2025-10-25T14:00:00Z",
  "finalAmount": 1200,
  "status": "ACCEPTED"
}
```

**Response** (201 Created):
```json
{
  "sale": {
    "id": "uuid",
    "saleNumber": "RS-2025-0146",
    "status": "ACCEPTED",
    "customer": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  },
  "lead": {
    "id": "uuid",
    "status": "CONVERTED",
    "convertedSaleId": "uuid"
  }
}
```

**Process**:
1. If lead has no customerId, create new customer
2. Create sale with lead information
3. Update lead status to CONVERTED
4. Link lead to created sale

---

### Delete Lead
```http
DELETE /leads/{id}
Authorization: Bearer {token}
```

**Response** (204 No Content)

---

## Analytics API

### Get Dashboard Analytics
```http
GET /analytics/dashboard?dateFrom=2025-10-01&dateTo=2025-10-31
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "kpis": {
    "revenue": {
      "current": 125000,
      "previous": 112000,
      "percentageChange": 11.6
    },
    "salesCount": {
      "current": 45,
      "previous": 40,
      "percentageChange": 12.5
    },
    "conversionRate": {
      "current": 68.2,
      "previous": 63.5,
      "percentageChange": 7.4
    },
    "averageSaleValue": {
      "current": 2777.78,
      "previous": 2800.00,
      "percentageChange": -0.8
    },
    "customerLifetimeValue": {
      "average": 15600,
      "median": 12000
    }
  },
  "salesPipeline": [
    {
      "status": "QUOTE_SENT",
      "count": 12,
      "totalValue": 45000,
      "percentage": 15.8
    }
  ],
  "topCustomers": [
    {
      "customerId": "uuid",
      "name": "ABC Company",
      "totalRevenue": 25000,
      "salesCount": 10
    }
  ],
  "topServices": [
    {
      "serviceId": "uuid",
      "name": "Deep Cleaning",
      "salesCount": 25,
      "totalRevenue": 45000
    }
  ],
  "revenueTrend": [
    {
      "date": "2025-10-01",
      "revenue": 4500,
      "salesCount": 2
    }
  ]
}
```

---

### Get Customer Lifetime Value Report
```http
GET /analytics/customer-ltv
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "customerId": "uuid",
      "name": "John Doe",
      "totalRevenue": 15600,
      "salesCount": 8,
      "averageSaleValue": 1950,
      "purchaseFrequency": 2.4,
      "estimatedLTV": 35200,
      "firstPurchase": "2024-01-15",
      "lastPurchase": "2025-10-10"
    }
  ]
}
```

---

### Get Sales Trend Report
```http
GET /analytics/sales-trend?period=weekly&start=2025-01-01&end=2025-12-31
Authorization: Bearer {token}
```

**Query Parameters**:
- `period`: daily, weekly, monthly, yearly
- `start`: Start date (ISO 8601)
- `end`: End date (ISO 8601)

**Response** (200 OK):
```json
{
  "period": "weekly",
  "data": [
    {
      "period": "2025-W01",
      "startDate": "2025-01-01",
      "endDate": "2025-01-07",
      "revenue": 12500,
      "salesCount": 6,
      "averageSaleValue": 2083.33
    }
  ],
  "summary": {
    "totalRevenue": 450000,
    "totalSales": 180,
    "averageSaleValue": 2500,
    "trend": "increasing"
  }
}
```

---

### Get Service Performance Report
```http
GET /analytics/service-performance?dateFrom=2025-01-01&dateTo=2025-12-31
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "serviceId": "uuid",
      "name": "Deep Cleaning",
      "category": "Specialized Cleaning",
      "salesCount": 45,
      "totalRevenue": 54000,
      "averageSaleValue": 1200,
      "percentageOfTotal": 28.5
    }
  ]
}
```

---

### Get Sales Rep Performance Report
```http
GET /analytics/sales-rep-performance?dateFrom=2025-01-01&dateTo=2025-12-31
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "userId": "uuid",
      "name": "Staff Member",
      "salesCount": 35,
      "totalRevenue": 87500,
      "conversionRate": 72.5,
      "averageDealSize": 2500,
      "averageSalesCycle": 8.5
    }
  ],
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "name": "Top Performer",
      "totalRevenue": 125000
    }
  ]
}
```

---

## Integration Webhooks

### Email Webhook (Lead Creation)
```http
POST /webhooks/email
Content-Type: application/json
X-Webhook-Signature: {signature}

{
  "from": "customer@example.com",
  "to": "info@rendetalje.dk",
  "subject": "Inquiry about cleaning services",
  "body": "Hello, I'm interested in deep cleaning for my office...",
  "timestamp": "2025-10-18T10:00:00Z"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "leadId": "uuid",
  "message": "Lead created successfully"
}
```

---

### Billy.dk Payment Webhook
```http
POST /webhooks/billy/payment
Content-Type: application/json
X-Billy-Signature: {signature}

{
  "eventType": "invoice.paid",
  "invoiceId": "billy-invoice-123",
  "paidDate": "2025-10-18T10:00:00Z",
  "amount": 1250,
  "currency": "DKK"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "saleId": "uuid",
  "message": "Payment status updated"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per user
- **Headers**:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 950`
  - `X-RateLimit-Reset: 1697625600`

**Rate Limit Exceeded** (429):
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "retryAfter": 3600
}
```

---

## Pagination

All list endpoints support pagination with consistent parameters:

**Query Parameters**:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

**Response Meta**:
```json
{
  "meta": {
    "total": 145,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Filtering & Sorting

### Filtering
Use query parameters for filtering:
```
GET /sales?status=ACCEPTED&dateFrom=2025-01-01&assignedTo=uuid
```

### Sorting
Use `sortBy` and `sortOrder` parameters:
```
GET /sales?sortBy=saleDate&sortOrder=desc
```

**Valid Sort Orders**:
- `asc`: Ascending
- `desc`: Descending

---

## Data Types

### Date/Time Format
All dates use ISO 8601 format: `2025-10-18T10:00:00Z`

### Currency
All amounts are in Danish Kroner (DKK) with 2 decimal places.

### UUID Format
All IDs use UUID v4: `550e8400-e29b-41d4-a716-446655440000`

---

## Versioning

API version is included in the base URL: `/api/v1/`

**Version Header** (optional):
```
Accept: application/vnd.tekup.v1+json
```

---

## Testing

### Postman Collection
Import the Postman collection for testing: `sales-tracking-api.postman_collection.json`

### Test Credentials
```
Development Environment:
Email: admin@rendetalje.dk
Password: TestPassword123!

(Note: Change in production)
```

---

## Additional Resources

- **GraphQL API** (Phase 2+): Available at `/graphql`
- **WebSocket Events**: Real-time updates at `wss://api.tekup-sales.dk/ws`
- **API Changelog**: Track API changes at `/api/v1/changelog`

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**Contact**: dev@tekup.dk
