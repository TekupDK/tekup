# 📚 RendetaljeOS API Documentation

**Version**: 1.0.0  
**Base URL**: `https://rendetaljeos-api.onrender.com/api/v1`  
**Documentation**: `https://rendetaljeos-api.onrender.com/docs`

---

## 🔐 Authentication

All API endpoints require authentication via JWT Bearer token.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@rendetalje.dk",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@rendetalje.dk",
    "name": "User Name",
    "role": "owner|admin|employee|customer"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresAt": "2025-10-23T12:00:00Z"
}
```

### Headers

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## 👥 Users & Authentication

### Get Current User

```http
GET /auth/me
```

### Update Profile

```http
PATCH /auth/profile
{
  "name": "Updated Name",
  "phone": "+45 12345678"
}
```

### Change Password

```http
POST /auth/change-password
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

---

## 🏢 Jobs Management

### List Jobs

```http
GET /jobs?page=1&limit=20&status=scheduled&customerId=uuid
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by job status
- `customerId`: Filter by customer
- `teamMemberId`: Filter by assigned team member
- `dateFrom`: Filter from date (ISO string)
- `dateTo`: Filter to date (ISO string)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "serviceType": "standard",
      "status": "scheduled",
      "scheduledDate": "2025-10-23T10:00:00Z",
      "estimatedDuration": 120,
      "location": {
        "street": "Hovedgade 1",
        "city": "København",
        "postalCode": "1000"
      },
      "assignedTeamMembers": ["uuid1", "uuid2"],
      "customer": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Create Job

```http
POST /jobs
{
  "customerId": "uuid",
  "serviceType": "standard",
  "scheduledDate": "2025-10-23T10:00:00Z",
  "estimatedDuration": 120,
  "location": {
    "street": "Hovedgade 1",
    "city": "København", 
    "postalCode": "1000"
  },
  "specialInstructions": "Extra attention to kitchen",
  "assignedTeamMembers": ["uuid1"]
}
```

### Get Job Details

```http
GET /jobs/:id
```

### Update Job

```http
PATCH /jobs/:id
{
  "status": "in_progress",
  "actualDuration": 135,
  "qualityScore": 5
}
```

### Delete Job

```http
DELETE /jobs/:id
```

---

## 👤 Customers Management

### List Customers

```http
GET /customers?page=1&limit=20&search=john
```

### Create Customer

```http
POST /customers
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+45 12345678",
  "address": {
    "street": "Hovedgade 1",
    "city": "København",
    "postalCode": "1000"
  }
}
```

### Get Customer Details

```http
GET /customers/:id
```

### Update Customer

```http
PATCH /customers/:id
{
  "name": "John Smith",
  "phone": "+45 87654321"
}
```

### Get Customer Jobs

```http
GET /customers/:id/jobs
```

---

## 👷 Team Management

### List Team Members

```http
GET /team?page=1&limit=20&role=employee
```

### Create Team Member

```http
POST /team
{
  "userId": "uuid",
  "skills": ["standard_cleaning", "window_cleaning"],
  "hourlyRate": 200.00,
  "availability": {
    "monday": { "start": "08:00", "end": "16:00" },
    "tuesday": { "start": "08:00", "end": "16:00" }
  }
}
```

### Get Team Member Details

```http
GET /team/:id
```

### Update Team Member

```http
PATCH /team/:id
{
  "hourlyRate": 220.00,
  "skills": ["standard_cleaning", "deep_cleaning"]
}
```

### Get Team Member Schedule

```http
GET /team/:id/schedule?date=2025-10-23
```

---

## ⏰ Time Tracking

### Start Time Entry

```http
POST /time-entries
{
  "jobId": "uuid",
  "teamMemberId": "uuid",
  "startTime": "2025-10-23T10:00:00Z"
}
```

### Stop Time Entry

```http
PATCH /time-entries/:id/stop
{
  "endTime": "2025-10-23T12:00:00Z",
  "breakDuration": 15,
  "notes": "Job completed successfully"
}
```

### List Time Entries

```http
GET /time-entries?teamMemberId=uuid&dateFrom=2025-10-01&dateTo=2025-10-31
```

---

## 💰 Billing & Invoicing

### List Invoices

```http
GET /billing/invoices?customerId=uuid&status=paid
```

### Create Invoice

```http
POST /billing/invoices
{
  "jobId": "uuid",
  "customerId": "uuid",
  "items": [
    {
      "description": "Standard cleaning",
      "quantity": 1,
      "unitPrice": 250.00,
      "total": 250.00
    }
  ],
  "subtotal": 250.00,
  "tax": 62.50,
  "total": 312.50
}
```

### Get Invoice Details

```http
GET /billing/invoices/:id
```

### Send Invoice

```http
POST /billing/invoices/:id/send
{
  "email": "customer@example.com",
  "message": "Your invoice is ready"
}
```

---

## 🤖 AI Friday Integration

### Chat with Friday

```http
POST /ai-friday/chat
{
  "message": "Hvad er dagens omsætning?",
  "context": "owner",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "response": "Dagens omsætning er 15.750 DKK baseret på 8 completerede jobs.",
  "metadata": {
    "dataAccessed": ["revenue", "jobs"],
    "confidence": 0.95,
    "responseTime": 245
  },
  "sessionId": "uuid"
}
```

### Get Chat History

```http
GET /ai-friday/sessions/:sessionId/messages
```

### Voice Input

```http
POST /ai-friday/voice
Content-Type: multipart/form-data

{
  "audio": <audio-file>,
  "context": "employee",
  "language": "da"
}
```

---

## 📊 Analytics & Reports

### Dashboard KPIs

```http
GET /analytics/dashboard?period=today|week|month|year
```

**Response:**
```json
{
  "revenue": {
    "total": 45750.00,
    "change": 12.5,
    "trend": "up"
  },
  "jobs": {
    "completed": 28,
    "scheduled": 15,
    "cancelled": 2
  },
  "customers": {
    "total": 156,
    "new": 8,
    "satisfaction": 4.7
  },
  "team": {
    "utilization": 87.5,
    "efficiency": 92.3,
    "overtime": 5.2
  }
}
```

### Revenue Report

```http
GET /analytics/revenue?period=month&year=2025&month=10
```

### Team Performance

```http
GET /analytics/team-performance?teamMemberId=uuid&period=month
```

### Customer Satisfaction

```http
GET /analytics/customer-satisfaction?period=quarter
```

---

## 📱 Mobile API Endpoints

### Sync Data

```http
POST /mobile/sync
{
  "lastSyncAt": "2025-10-23T08:00:00Z",
  "deviceId": "device-uuid",
  "data": {
    "timeEntries": [...],
    "jobUpdates": [...],
    "photos": [...]
  }
}
```

### Upload Photos

```http
POST /mobile/photos
Content-Type: multipart/form-data

{
  "jobId": "uuid",
  "type": "before|after|issue",
  "photo": <image-file>,
  "description": "Kitchen before cleaning"
}
```

### Get Offline Data

```http
GET /mobile/offline-data?teamMemberId=uuid&date=2025-10-23
```

---

## 🔔 Notifications

### List Notifications

```http
GET /notifications?read=false&type=job_assignment
```

### Mark as Read

```http
PATCH /notifications/:id/read
```

### Send Push Notification

```http
POST /notifications/push
{
  "userId": "uuid",
  "title": "New Job Assignment",
  "body": "You have been assigned to a new cleaning job",
  "data": {
    "jobId": "uuid",
    "type": "job_assignment"
  }
}
```

---

## 🔗 External Integrations

### Tekup-Billy Integration

```http
GET /integrations/billy/customers
POST /integrations/billy/invoices
GET /integrations/billy/products
```

### TekupVault Search

```http
POST /integrations/tekupvault/search
{
  "query": "cleaning procedures",
  "limit": 10
}
```

### Calendar Integration

```http
GET /integrations/calendar/events?date=2025-10-23
POST /integrations/calendar/events
PATCH /integrations/calendar/events/:id
```

---

## 📋 Validation Schemas

### Job Creation Schema

```typescript
{
  customerId: string (uuid),
  serviceType: "standard" | "deep" | "window" | "moveout",
  scheduledDate: string (ISO date),
  estimatedDuration: number (min: 30, max: 480),
  location: {
    street: string (min: 1),
    city: string (min: 1),
    postalCode: string (regex: /^\d{4}$/)
  },
  specialInstructions?: string,
  assignedTeamMembers?: string[] (uuid[])
}
```

### Customer Creation Schema

```typescript
{
  name: string (min: 1),
  email?: string (email format),
  phone?: string,
  address: {
    street: string (min: 1),
    city: string (min: 1),
    postalCode: string (regex: /^\d{4}$/)
  },
  preferences?: object
}
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2025-10-23T12:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., scheduling conflict)
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

---

## 🚀 Rate Limiting

- **Default**: 100 requests per minute per user
- **Authentication**: 10 requests per minute per IP
- **File Upload**: 5 requests per minute per user
- **AI Friday**: 20 requests per minute per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698062400
```

---

## 📊 Pagination

All list endpoints support pagination:

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc|desc, default: desc)

### Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 Filtering & Search

### Common Filters

- `search`: Text search across relevant fields
- `status`: Filter by status
- `dateFrom`/`dateTo`: Date range filtering
- `customerId`: Filter by customer
- `teamMemberId`: Filter by team member

### Search Example

```http
GET /jobs?search=kitchen&status=completed&dateFrom=2025-10-01&dateTo=2025-10-31
```

---

## 📝 Webhooks

### Available Events

- `job.created`
- `job.updated`
- `job.completed`
- `invoice.created`
- `invoice.paid`
- `customer.created`

### Webhook Payload

```json
{
  "event": "job.completed",
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "completedAt": "2025-10-23T12:00:00Z"
  },
  "timestamp": "2025-10-23T12:00:01Z"
}
```

---

## 🧪 Testing

### Test Environment

- **Base URL**: `https://rendetaljeos-api-staging.onrender.com/api/v1`
- **Test Data**: Seeded with sample data
- **Reset**: Database reset daily at 02:00 UTC

### Postman Collection

Download: `https://rendetaljeos-api.onrender.com/postman-collection.json`

---

**API Documentation genereret**: 22. Oktober 2025  
**Version**: 1.0.0  
**Support**: <dev@rendetalje.dk>
