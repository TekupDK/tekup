# RendetaljeOS Backend API Reference

## Base Configuration

- **Base URL**: `http://localhost:3001` (development)
- **API Version**: `/api/v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## Authentication

All endpoints (except public ones) require JWT Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles

- **OWNER** - Full system access
- **ADMIN** - Administrative access
- **EMPLOYEE** - Operational access
- **CUSTOMER** - Limited access to own data

---

## Authentication Endpoints

**Base Route**: `/api/v1/auth`

### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "employee",
  "organizationId": "uuid",
  "phone": "+4512345678"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

### Get Profile

```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

### Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

---

## Customer Endpoints

**Base Route**: `/api/v1/customers`
**Required Roles**: OWNER, ADMIN, EMPLOYEE

### List Customers

```http
GET /api/v1/customers?page=1&limit=10&city=København&search=John
Authorization: Bearer <token>

Query Parameters:
- page (default: 1)
- limit (default: 10, max: 100)
- city (optional)
- is_active (optional: true/false)
- min_satisfaction (optional: 1-5)
- search (optional)

Response:
{
  "data": [{ ... }],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

### Create Customer

```http
POST /api/v1/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+4512345678",
  "address": {
    "street": "Vestergade 10",
    "city": "København",
    "postal_code": "1456",
    "country": "Denmark"
  },
  "preferences": {
    "preferred_time": "morning",
    "contact_method": "email"
  }
}
```

### Get Customer

```http
GET /api/v1/customers/:id
Authorization: Bearer <token>
```

### Update Customer

```http
PATCH /api/v1/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

### Customer Analytics

```http
GET /api/v1/customers/analytics
Authorization: Bearer <token>
Roles: OWNER, ADMIN
```

---

## Job Endpoints

**Base Route**: `/api/v1/jobs`
**Required Roles**: OWNER, ADMIN, EMPLOYEE

### List Jobs

```http
GET /api/v1/jobs?status=scheduled&service_type=standard&page=1
Authorization: Bearer <token>

Query Parameters:
- status: scheduled|confirmed|in_progress|completed|cancelled
- service_type: standard|deep|window|moveout|office
- customer_id (UUID)
- date_from (ISO date)
- date_to (ISO date)
- page, limit
```

### Create Job

```http
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "uuid",
  "service_type": "standard",
  "scheduled_date": "2025-10-26T10:00:00Z",
  "estimated_duration": 120,
  "location": {
    "street": "Vestergade 10",
    "city": "København",
    "postal_code": "1456"
  },
  "special_instructions": "Ring ved ankomst"
}
```

### Update Job Status

```http
PATCH /api/v1/jobs/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Started cleaning"
}
```

### Assign Team Members

```http
POST /api/v1/jobs/:id/assign
Authorization: Bearer <token>
Roles: OWNER, ADMIN
Content-Type: application/json

{
  "team_member_ids": ["uuid1", "uuid2"],
  "start_time": "2025-10-26T10:00:00Z"
}
```

---

## Team Endpoints

**Base Route**: `/api/v1/team`

### List Team Members

```http
GET /api/v1/team/members?page=1&limit=10
Authorization: Bearer <token>
```

### Create Team Member

```http
POST /api/v1/team/members
Authorization: Bearer <token>
Roles: OWNER, ADMIN
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+4598765432",
  "role": "cleaner",
  "hourly_rate": 250,
  "employment_type": "full-time"
}
```

### Team Performance Report

```http
GET /api/v1/team/performance-report
Authorization: Bearer <token>
Roles: OWNER, ADMIN
```

---

## Time Tracking Endpoints

**Base Route**: `/api/v1/time-entries`

### Create Time Entry

```http
POST /api/v1/time-entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "team_member_id": "uuid",
  "job_id": "uuid",
  "start_time": "2025-10-26T08:00:00Z",
  "end_time": "2025-10-26T12:00:00Z",
  "activity_type": "cleaning"
}
```

### Daily Summary

```http
GET /api/v1/time-entries/daily-summary?date=2025-10-26
Authorization: Bearer <token>
```

### Time Corrections

```http
POST /api/v1/time-corrections
Authorization: Bearer <token>
Content-Type: application/json

{
  "time_entry_id": "uuid",
  "requested_minutes": 240,
  "reason": "Forgot to clock out"
}
```

---

## Quality Control Endpoints

**Base Route**: `/api/v1/quality`

### Upload Photos

```http
POST /api/v1/quality/photos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

photos: File[] (max 10 files, 10MB each)
jobId: uuid
type: before|after|during|issue
```

### Create Quality Assessment

```http
POST /api/v1/quality/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "job_id": "uuid",
  "overall_score": 5,
  "items_completed": 10,
  "notes": "Perfect cleaning",
  "photos": ["url1", "url2"]
}
```

### Quality Metrics

```http
GET /api/v1/quality/metrics
Authorization: Bearer <token>
Roles: OWNER, ADMIN
```

---

## AI Friday Endpoints

**Base Route**: `/api/v1/ai-friday`

### Send Message

```http
POST /api/v1/ai-friday/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I schedule a deep cleaning?",
  "context": { ... }
}
```

### Transcribe Audio

```http
POST /api/v1/ai-friday/voice/transcribe
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: File
language: da
```

---

## Integration Endpoints

### Billy.dk (Accounting)

```http
POST /api/v1/integrations/billy/invoices
Authorization: Bearer <token>
Roles: OWNER, ADMIN
Content-Type: application/json

{
  "customer_id": "uuid",
  "job_id": "uuid",
  "items": [...]
}
```

### TekupVault (Knowledge Base)

```http
POST /api/v1/integrations/vault/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "cleaning procedures for office",
  "limit": 10
}
```

### Renos Calendar

```http
POST /api/v1/integrations/calendar/availability/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-10-26",
  "duration": 120,
  "team_member_ids": ["uuid1", "uuid2"]
}
```

---

## Pagination & Filtering

All list endpoints support:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Full-text search across relevant fields

Response format:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

---

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-10-25T12:00:00Z",
  "path": "/api/v1/jobs"
}
```

**Common Status Codes**:

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## API Documentation (Swagger)

Interactive API documentation available at:
```
http://localhost:3001/docs
```

When `ENABLE_SWAGGER=true` in environment.
