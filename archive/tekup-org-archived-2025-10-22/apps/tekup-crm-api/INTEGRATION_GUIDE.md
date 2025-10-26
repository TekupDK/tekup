# Danish Cleaning System - Backend API Integration Guide

## 🚀 Quick Start

### 1. Start the Backend API
```bash
cd apps/tekup-crm-api
pnpm install
pnpm dev
```

API will be available at: `http://localhost:3001`
Swagger documentation: `http://localhost:3001/api-docs`

### 2. Run Database Setup
```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

### 3. Test the API
```bash
# Run comprehensive API tests
node test-api.js
```

## 📋 API Endpoints Overview

### Authentication & Users
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user

### Tenants
- `GET /api/v1/tenants` - List tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/:id` - Get tenant details
- `PATCH /api/v1/tenants/:id` - Update tenant
- `GET /api/v1/tenants/:id/statistics` - Tenant statistics

### Customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers` - List customers (with pagination & filtering)
- `GET /api/v1/customers/search?q=query` - Search customers
- `GET /api/v1/customers/segment/:segment` - Filter by segment
- `GET /api/v1/customers/:id` - Get customer details
- `GET /api/v1/customers/:id/statistics` - Customer statistics
- `PATCH /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer (soft delete)

### Customer Locations
- `POST /api/v1/customers/:customerId/locations` - Create location
- `GET /api/v1/customers/:customerId/locations` - List locations
- `GET /api/v1/customers/:customerId/locations/:id` - Get location
- `PATCH /api/v1/customers/:customerId/locations/:id` - Update location
- `DELETE /api/v1/customers/:customerId/locations/:id` - Delete location

### Jobs
- `POST /api/v1/jobs` - Create cleaning job
- `GET /api/v1/jobs` - List jobs (with pagination & filtering)
- `GET /api/v1/jobs/status/:status` - Filter by status
- `GET /api/v1/jobs/customer/:customerId` - Jobs by customer
- `GET /api/v1/jobs/date-range?startDate=2025-01-01&endDate=2025-01-31` - Jobs by date range
- `GET /api/v1/jobs/statistics` - Job statistics
- `GET /api/v1/jobs/:id` - Get job details
- `PATCH /api/v1/jobs/:id` - Update job
- `PATCH /api/v1/jobs/:id/status` - Update job status
- `DELETE /api/v1/jobs/:id` - Delete job (soft delete)

### Job Team Members
- `POST /api/v1/jobs/:jobId/team-members/assign` - Assign team member
- `GET /api/v1/jobs/:jobId/team-members` - Get assigned team members
- `PATCH /api/v1/jobs/:jobId/team-members/:teamMemberId/role` - Update role
- `DELETE /api/v1/jobs/:jobId/team-members/:teamMemberId` - Remove team member

### Job Photos
- `POST /api/v1/jobs/:jobId/photos` - Add photo
- `GET /api/v1/jobs/:jobId/photos` - Get all photos
- `GET /api/v1/jobs/:jobId/photos/type/:type` - Photos by type
- `GET /api/v1/jobs/:jobId/photos/statistics` - Photo statistics
- `PATCH /api/v1/jobs/:jobId/photos/:photoId` - Update photo
- `DELETE /api/v1/jobs/:jobId/photos/:photoId` - Delete photo

### Job Notes
- `POST /api/v1/jobs/:jobId/notes` - Add note
- `GET /api/v1/jobs/:jobId/notes` - Get all notes
- `GET /api/v1/jobs/:jobId/notes/type/:type` - Notes by type
- `GET /api/v1/jobs/:jobId/notes/statistics` - Note statistics
- `PATCH /api/v1/jobs/:jobId/notes/:noteId` - Update note
- `DELETE /api/v1/jobs/:jobId/notes/:noteId` - Delete note

### Team Management
- `POST /api/v1/team` - Create team member
- `GET /api/v1/team` - List team members (with pagination & filtering)
- `GET /api/v1/team/role/:role` - Filter by role
- `GET /api/v1/team/skill/:skill` - Filter by skill
- `GET /api/v1/team/available?date=2025-09-15&startTime=09:00&endTime=17:00` - Find available members
- `GET /api/v1/team/statistics` - Team statistics
- `GET /api/v1/team/:id` - Get team member details
- `GET /api/v1/team/:id/statistics` - Team member statistics
- `PATCH /api/v1/team/:id` - Update team member
- `DELETE /api/v1/team/:id` - Delete team member (soft delete)

### Route Optimization
- `POST /api/v1/routes` - Create route
- `GET /api/v1/routes` - List routes (with pagination & filtering)
- `GET /api/v1/routes/team-member/:teamMemberId` - Routes by team member
- `GET /api/v1/routes/statistics` - Route statistics
- `GET /api/v1/routes/:id` - Get route details
- `PATCH /api/v1/routes/:id` - Update route
- `POST /api/v1/routes/:id/optimize` - Optimize route
- `DELETE /api/v1/routes/:id` - Delete route

### Analytics & Reporting
- `GET /api/v1/analytics/dashboard` - Dashboard metrics
- `GET /api/v1/analytics/revenue` - Revenue analytics
- `GET /api/v1/analytics/performance` - Performance analytics
- `GET /api/v1/analytics/jobs/by-type` - Job analytics by type
- `GET /api/v1/analytics/team/performance` - Team performance analytics
- `GET /api/v1/analytics/customers` - Customer analytics

### Danish Business Logic
- `GET /api/v1/danish-business/postal-codes?postalCode=2100` - Validate postal code
- `GET /api/v1/danish-business/holidays?year=2025` - Get Danish holidays
- `POST /api/v1/danish-business/validate-phone` - Validate phone number
- `POST /api/v1/danish-business/validate-cvr` - Validate CVR number

### Health Checks
- `GET /api/v1/health` - API health status
- `GET /api/v1/health/database` - Database health
- `GET /api/v1/health/detailed` - Detailed health check

## 🔐 Authentication

All endpoints (except health checks) require JWT authentication:

```javascript
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};
```

## 📊 Data Models

### Customer
```typescript
interface Customer {
  id: string;
  tenantId: string;
  name: string;
  segment: 'COMMERCIAL' | 'RESIDENTIAL' | 'PUBLIC' | 'HOSPITALITY';
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  cvrNumber?: string;
  annualContractValue?: number;
  contractStart?: Date;
  contractEnd?: Date;
  serviceLevel: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  cleaningPreferences?: any;
  accessInstructions?: string;
  specialRequirements?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cleaning Job
```typescript
interface CleaningJob {
  id: string;
  tenantId: string;
  customerId: string;
  locationId?: string;
  title: string;
  description?: string;
  jobType: 'KONTORRENHOLD' | 'PRIVATRENHOLD' | 'VINDUESPUDSNING' | 'GULVRENS' | 'KEMISK_RENS' | 'SPECIALRENHOLD';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration?: number;
  actualDuration?: number;
  completedAt?: Date;
  locationDetails?: any;
  recurringConfig?: any;
  equipmentRequirements?: any[];
  supplyRequirements?: any[];
  specialRequirements?: string[];
  costDetails?: any;
  createdAt: Date;
  updatedAt: Date;
}
```

### Team Member
```typescript
interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'CLEANER' | 'SPECIALIST';
  phone?: string;
  email?: string;
  hourlyRate: number;
  skills: CleaningSkill[];
  certifications: string[];
  availability: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🇩🇰 Danish Business Logic

### Postal Code Validation
```javascript
// Validate Danish postal code
const response = await fetch('/api/v1/danish-business/postal-codes?postalCode=2100', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
// Returns: { valid: true, city: 'København Ø', region: 'Hovedstaden' }
```

### Phone Number Validation
```javascript
// Validate Danish phone number
const response = await fetch('/api/v1/danish-business/validate-phone', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ phone: '+45 33 12 34 56' })
});
const data = await response.json();
// Returns: { valid: true, formatted: '+45 33 12 34 56' }
```

### CVR Number Validation
```javascript
// Validate Danish CVR number
const response = await fetch('/api/v1/danish-business/validate-cvr', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ cvrNumber: '87654321' })
});
const data = await response.json();
// Returns: { valid: true, formatted: '87654321' }
```

## 🔄 Frontend Integration

### Replace Mock Data
Update your frontend to use real API calls instead of mock data:

```javascript
// Before (mock data)
import { mockCustomers, mockCleaningJobs } from './lib/types/mockData';

// After (API calls)
const fetchCustomers = async (tenantId) => {
  const response = await fetch(`/api/v1/customers`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  return response.json();
};

const fetchJobs = async (tenantId) => {
  const response = await fetch(`/api/v1/jobs`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  return response.json();
};
```

### Error Handling
```javascript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (error.response?.status === 403) {
    // Show access denied message
    showError('Du har ikke adgang til denne funktion');
  } else if (error.response?.status === 404) {
    // Show not found message
    showError('Ressource ikke fundet');
  } else {
    // Show generic error
    showError('Der opstod en fejl. Prøv igen senere.');
  }
};
```

## 🧪 Testing

### Run API Tests
```bash
# Install test dependencies
npm install axios

# Run comprehensive tests
node test-api.js
```

### Manual Testing with Swagger
1. Go to `http://localhost:3001/api-docs`
2. Click "Authorize" and enter your JWT token
3. Test endpoints directly in the browser

### Postman Collection
Import the API endpoints into Postman for easier testing:
1. Import the OpenAPI spec from `/api-docs-json`
2. Set up environment variables for `baseUrl` and `authToken`
3. Test all endpoints systematically

## 🚀 Production Deployment

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tekup_cleaning"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# API
PORT=3001
NODE_ENV="production"

# Danish Business API (optional)
DANISH_BUSINESS_API_KEY="your-api-key"
```

### Docker Deployment
```bash
# Build Docker image
docker build -t tekup-cleaning-api .

# Run with Docker Compose
docker-compose up -d
```

### Database Migration
```bash
# Run migrations in production
pnpm prisma migrate deploy

# Seed production data (if needed)
pnpm db:seed
```

## 📈 Monitoring

### Health Checks
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/database` - Database connectivity
- `GET /api/v1/health/detailed` - Comprehensive health status

### Logging
The API includes comprehensive logging for:
- Request/response logging
- Error tracking
- Performance metrics
- Danish business logic validation

### Metrics
Access analytics endpoints for business metrics:
- Revenue tracking
- Job completion rates
- Team performance
- Customer satisfaction

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Ensure database is running
   - Verify network connectivity

2. **JWT Token Invalid**
   - Check token expiration
   - Verify `JWT_SECRET` is set
   - Ensure token is properly formatted

3. **Danish Validation Errors**
   - Check postal code format (4 digits)
   - Verify phone number format (+45 prefix)
   - Ensure CVR number is 8 digits

4. **CORS Issues**
   - Check CORS configuration in `main.ts`
   - Verify frontend domain is allowed
   - Test with different browsers

### Support
For technical support or questions about the API, please refer to:
- Swagger documentation: `http://localhost:3001/api-docs`
- API test results: Run `node test-api.js`
- Log files: Check application logs for detailed error information

---

**Backend API er nu klar til production! 🎉**

