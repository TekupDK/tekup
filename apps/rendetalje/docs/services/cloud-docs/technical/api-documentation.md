# RendetaljeOS API Documentation

## Overview

The RendetaljeOS API is a RESTful API built with NestJS that provides comprehensive functionality for managing cleaning service operations. The API supports multi-tenant architecture with role-based access control.

## Base URL

```
Production: https://api.rendetalje.dk
Development: http://localhost:3000
```

## Authentication

### JWT Bearer Token

All API endpoints require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "owner",
    "organizationId": "uuid"
  }
}
```

## Core Entities

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  preferences?: string;
  totalJobs: number;
  averageRating: number;
  lastService?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Job

```typescript
interface Job {
  id: string;
  customerId: string;
  customer?: Customer;
  assignedTo?: string;
  assignedTeamMember?: TeamMember;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // minutes
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  notes?: string;
  specialInstructions?: string;
  checklist: ChecklistItem[];
  photos: Photo[];
  timeEntries: TimeEntry[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

### TeamMember

```typescript
interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'employee' | 'supervisor' | 'admin';
  skills: string[];
  hourlyRate?: number;
  active: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Customers

#### Get All Customers

```http
GET /customers
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by name or email
- `sortBy` (string): Sort field (default: 'name')
- `sortOrder` ('asc' | 'desc'): Sort order (default: 'asc')

**Response:**
```json
{
  "data": [Customer],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Get Customer by ID

```http
GET /customers/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+45 12345678",
  "address": "123 Main St, Copenhagen",
  "preferences": "Eco-friendly products only",
  "totalJobs": 25,
  "averageRating": 4.8,
  "lastService": "2025-10-20",
  "jobs": [Job],
  "communicationLog": [CommunicationEntry],
  "organizationId": "uuid",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-10-22T14:30:00Z"
}
```

#### Create Customer

```http
POST /customers
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+45 87654321",
  "address": "456 Oak Ave, Copenhagen",
  "preferences": "No pets, prefer morning appointments"
}
```

#### Update Customer

```http
PUT /customers/:id
Content-Type: application/json

{
  "name": "Jane Smith-Johnson",
  "phone": "+45 11111111",
  "preferences": "Updated preferences"
}
```

#### Delete Customer

```http
DELETE /customers/:id
```

### Jobs

#### Get All Jobs

```http
GET /jobs
```

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `assignedTo` (string): Filter by team member ID
- `customerId` (string): Filter by customer ID
- `startDate` (string): Filter from date (YYYY-MM-DD)
- `endDate` (string): Filter to date (YYYY-MM-DD)
- `serviceType` (string): Filter by service type

#### Get Job by ID

```http
GET /jobs/:id
```

#### Create Job

```http
POST /jobs
Content-Type: application/json

{
  "customerId": "uuid",
  "serviceType": "Standard Cleaning",
  "scheduledDate": "2025-10-25",
  "scheduledTime": "10:00",
  "duration": 120,
  "price": 800,
  "notes": "First time customer",
  "specialInstructions": "Key under doormat"
}
```

#### Update Job

```http
PUT /jobs/:id
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Started cleaning",
  "checklist": [
    {
      "id": "uuid",
      "task": "Clean bathroom",
      "completed": true,
      "notes": "Extra attention to shower",
      "photos": ["photo-uuid-1", "photo-uuid-2"]
    }
  ]
}
```

#### Assign Job

```http
POST /jobs/:id/assign
Content-Type: application/json

{
  "teamMemberId": "uuid"
}
```

#### Upload Job Photo

```http
POST /jobs/:id/photos
Content-Type: multipart/form-data

photo: <file>
type: "before" | "after" | "during" | "issue"
checklistItemId?: "uuid"
description?: "string"
```

### Team Members

#### Get All Team Members

```http
GET /team
```

#### Get Team Member by ID

```http
GET /team/:id
```

#### Create Team Member

```http
POST /team
Content-Type: application/json

{
  "name": "Mike Johnson",
  "email": "mike@rendetalje.dk",
  "phone": "+45 22334455",
  "role": "employee",
  "skills": ["standard_cleaning", "deep_cleaning"],
  "hourlyRate": 200
}
```

#### Update Team Member

```http
PUT /team/:id
Content-Type: application/json

{
  "skills": ["standard_cleaning", "deep_cleaning", "window_cleaning"],
  "hourlyRate": 220,
  "active": true
}
```

### Time Tracking

#### Get Time Entries

```http
GET /time-entries
```

**Query Parameters:**

- `userId` (string): Filter by user ID
- `jobId` (string): Filter by job ID
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date

#### Create Time Entry

```http
POST /time-entries
Content-Type: application/json

{
  "jobId": "uuid",
  "startTime": "2025-10-22T10:00:00Z",
  "endTime": "2025-10-22T12:30:00Z",
  "breakDuration": 15,
  "notes": "Completed all tasks successfully"
}
```

### Analytics and Reports

#### Dashboard Statistics

```http
GET /analytics/dashboard
```

**Query Parameters:**

- `period` ('today' | 'week' | 'month' | 'year'): Time period
- `startDate` (string): Custom start date
- `endDate` (string): Custom end date

**Response:**
```json
{
  "revenue": {
    "total": 45000,
    "change": 12.5,
    "period": "month"
  },
  "jobs": {
    "total": 156,
    "completed": 142,
    "cancelled": 8,
    "pending": 6
  },
  "customers": {
    "total": 89,
    "new": 12,
    "retention": 94.2
  },
  "team": {
    "utilization": 87.3,
    "averageRating": 4.7,
    "totalHours": 1240
  }
}
```

#### Revenue Report

```http
GET /analytics/revenue
```

#### Customer Report

```http
GET /analytics/customers
```

#### Team Performance Report

```http
GET /analytics/team
```

## Real-time Features

### WebSocket Events

Connect to WebSocket at `/socket.io`

#### Job Status Updates

```javascript
socket.on('job:status-updated', (data) => {
  console.log('Job status changed:', data);
  // { jobId, status, timestamp, teamMemberId }
});
```

#### Team Location Updates

```javascript
socket.on('team:location-updated', (data) => {
  console.log('Team member location:', data);
  // { teamMemberId, latitude, longitude, timestamp }
});
```

#### New Booking

```javascript
socket.on('booking:created', (data) => {
  console.log('New booking:', data);
  // { jobId, customerId, scheduledDate, serviceType }
});
```

## Error Handling

### Error Response Format

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

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited:

- **Authenticated users**: 1000 requests per hour
- **Public endpoints**: 100 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

## Pagination

List endpoints support pagination:

**Request:**
```http
GET /customers?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 50,
    "total": 234,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## Filtering and Sorting

### Filtering

Use query parameters for filtering:
```http
GET /jobs?status=completed&serviceType=Deep Cleaning&startDate=2025-10-01
```

### Sorting

```http
GET /customers?sortBy=name&sortOrder=desc
```

### Search

```http
GET /customers?search=john
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Webhook Events

- `job.created`
- `job.updated`
- `job.completed`
- `customer.created`
- `payment.received`

### Webhook Payload

```json
{
  "event": "job.completed",
  "timestamp": "2025-10-22T14:30:00Z",
  "data": {
    "jobId": "uuid",
    "customerId": "uuid",
    "completedAt": "2025-10-22T14:30:00Z",
    "rating": 5
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript

```bash
npm install @rendetalje/api-client
```

```typescript
import { RendetaljeAPI } from '@rendetalje/api-client';

const api = new RendetaljeAPI({
  baseURL: 'https://api.rendetalje.dk',
  apiKey: 'your-api-key'
});

const customers = await api.customers.list();
```

### Python

```bash
pip install rendetalje-api
```

```python
from rendetalje import RendetaljeAPI

api = RendetaljeAPI(api_key='your-api-key')
customers = api.customers.list()
```

## Testing

### Test Environment

```
Base URL: https://api-test.rendetalje.dk
```

### Test Data

Test environment includes sample data:

- 50 test customers
- 200 test jobs
- 10 test team members

### API Testing Tools

- **Postman Collection**: [Download](https://api.rendetalje.dk/postman)
- **OpenAPI Spec**: [View](https://api.rendetalje.dk/swagger)
- **Insomnia Collection**: [Download](https://api.rendetalje.dk/insomnia)

## Changelog

### v2.1.0 (2025-10-22)

- Added GDPR compliance endpoints
- Enhanced analytics with real-time data
- Improved error handling and validation

### v2.0.0 (2025-09-15)

- Major API restructure
- Added multi-tenant support
- Enhanced security with JWT tokens

### v1.5.0 (2025-08-01)

- Added WebSocket support
- Real-time job tracking
- Team location updates

---

*For more information, contact our developer support at <dev@rendetalje.dk>*
