# Subcontractor Management Feature

**Version:** 2.1.0  
**Date:** October 28, 2025  
**Status:** ✅ Implemented (Database migration pending)

## 📋 Overview

Complete subcontractor management system for RenOS, enabling efficient coordination of external cleaning service providers.

## 🎯 Key Features

### 1. Subcontractor Profiles

- Company and contact information management
- CVR number and business registration tracking
- Rating system (0-5 stars based on performance reviews)
- Status management (active, inactive, suspended)
- Document storage (insurance, licenses, certifications, contracts)
- Service capabilities and experience tracking
- Availability scheduling (recurring + one-time slots)

### 2. Smart Task Assignment

- **Automatic Assignment Algorithm**:
  - Rating-based scoring (40% weight)
  - Review count reliability (20% weight)
  - Service capability matching (20% weight)
  - Availability checking (20% weight)
- **Manual Assignment**: Override automatic selection
- Real-time availability checking
- Conflict detection

### 3. Performance Tracking

- 1-5 star rating system with weighted averages
- Detailed scoring:
  - Punctuality score
  - Work quality score
  - Communication score
- Review comments and feedback
- Aggregate statistics and trends

### 4. Task Management

- Assignment lifecycle: assigned → accepted → in-progress → completed
- Rejection handling with reason tracking
- Completion verification
- Time tracking (hours worked, hourly rates)
- Assignment notes and communication log

### 5. PWA Support

- Progressive Web App for mobile access
- Push notifications for new assignments
- Offline task viewing
- Background sync when connection restored
- Native app-like experience on mobile devices

### 6. Integrations

- **Billy.dk**: Automatic invoice generation on task completion
- **Google Calendar**: Event creation and synchronization
- **Real-time notifications**: WebSocket updates for status changes

## 💾 Database Schema

### Core Tables

**subcontractors**

- id (UUID, PK)
- company_name, contact_name, email, phone
- address, cvr_number, website_url
- status (enum: active/inactive/suspended)
- rating (decimal 0-5)
- notes (text)
- created_at, updated_at

**services**

- id (UUID, PK)
- name, description
- base_price (DKK)
- estimated_hours
- 8 default services pre-populated

**subcontractor_services** (many-to-many)

- subcontractor_id, service_id
- experience_years
- certified (boolean)

**task_assignments**

- id (UUID, PK)
- job_id (FK → bookings)
- subcontractor_id (FK → subcontractors)
- status (enum: assigned/accepted/rejected/completed/cancelled)
- assigned_at, accepted_at, completed_at
- notes, rejection_reason
- calendar_event_id, billy_invoice_id
- hours_worked, hourly_rate

**subcontractor_reviews**

- id (UUID, PK)
- subcontractor_id (FK)
- rating (1-5)
- punctuality_score, quality_score, communication_score
- comments (text)
- created_at

**subcontractor_documents**

- id (UUID, PK)
- subcontractor_id (FK)
- document_type (enum: insurance/license/certification/contract)
- file_url (Supabase Storage)
- expiry_date, verified_at

**subcontractor_availability**

- id (UUID, PK)
- subcontractor_id (FK)
- day_of_week (0-6)
- start_time, end_time
- is_recurring (boolean)
- specific_date (for one-time slots)

**subcontractor_agreements**

- id (UUID, PK)
- subcontractor_id (FK)
- contract_type, hourly_rate, payment_terms
- start_date, end_date
- terms_url

**push_subscriptions**

- id (UUID, PK)
- subcontractor_id (FK)
- endpoint, p256dh_key, auth_key
- created_at

### Database Features

- **Row-Level Security (RLS)**: 12 policies protecting data access
- **Indexes**: 17 optimized indexes for performance
- **Triggers**: Automatic rating aggregation on new reviews
- **Views**: Helper views for common queries

## 🔌 API Endpoints

### Subcontractors

- `POST /api/subcontractors` - Create profile
- `GET /api/subcontractors` - List with filters (status, minRating, search)
- `GET /api/subcontractors/:id` - Get details with services, documents, reviews
- `PATCH /api/subcontractors/:id` - Update profile
- `DELETE /api/subcontractors/:id` - Deactivate (soft delete)

### Task Assignments

- `POST /api/subcontractors/assign-task` - Assign job to subcontractor
  - Body: `{ jobId, subcontractorId?, useSmartAssignment }`
- `GET /api/subcontractors/assignments/all` - List assignments with filters
- `PATCH /api/subcontractors/assignments/:id` - Update status

### Reviews

- `POST /api/subcontractors/:id/reviews` - Create review
  - Body: `{ rating, punctualityScore?, qualityScore?, communicationScore?, comments? }`

### Push Notifications (PWA)

- `POST /api/push/subscribe` - Register push subscription
- `POST /api/push/unsubscribe` - Remove subscription

## 🎨 Frontend Components

### SubcontractorList

- **Location**: `frontend-nextjs/src/components/subcontractors/SubcontractorList.tsx`
- **Features**:
  - Grid view with company cards
  - Search by company name, contact, email
  - Filter by status and minimum rating
  - Star rating display
  - Quick actions: view details, edit

### AssignmentModal

- **Location**: `frontend-nextjs/src/components/subcontractors/AssignmentModal.tsx`
- **Features**:
  - Smart vs. manual assignment toggle
  - Job details display
  - Subcontractor selection list
  - Loading states and error handling
  - Success confirmation

### ReviewForm

- **Location**: `frontend-nextjs/src/components/subcontractors/ReviewForm.tsx`
- **Features**:
  - Overall rating (1-5 stars, required)
  - Detailed scores (punctuality, quality, communication)
  - Comments textarea (max 2000 chars)
  - Real-time character count
  - Validation and error messages

## ⚙️ Configuration

### Environment Variables (82 total)

**Feature Flags**

```env
ENABLE_SUBCONTRACTOR_MODULE=true
ENABLE_PWA=true
```

**PWA Settings**

```env
PWA_ENABLED=true
PWA_NAME="RenOS Subcontractor Portal"
PWA_THEME_COLOR=#2563eb
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
```

**File Upload**

```env
STORAGE_PROVIDER=supabase
STORAGE_BUCKET_SUBCONTRACTORS=subcontractor-documents
FILE_MAX_SIZE_MB=10
FILE_ALLOWED_TYPES=pdf,png,jpg,jpeg,doc,docx
```

**Assignment Logic**

```env
AUTO_ASSIGNMENT_ENABLED=true
SMART_ASSIGNMENT_ALGORITHM=score_based
ASSIGNMENT_RATING_WEIGHT=40
ASSIGNMENT_AVAILABILITY_WEIGHT=30
ASSIGNMENT_DISTANCE_WEIGHT=20
ASSIGNMENT_EXPERIENCE_WEIGHT=10
```

**Reviews**

```env
SUBCONTRACTOR_REVIEWS_ENABLED=true
MIN_REVIEW_RATING=1
MAX_REVIEW_RATING=5
REVIEW_REQUIRES_COMMENT=false
```

**Integrations**

```env
BILLY_INTEGRATION_ENABLED=true
BILLY_AUTO_INVOICE_SUBCONTRACTORS=true
SUBCONTRACTOR_CALENDAR_SYNC=true
CALENDAR_AUTO_CREATE_EVENTS=true
```

See `tekup-secrets/config/subcontractor-services.env` for complete list.

## 🚀 Deployment Steps

### 1. Database Migration

```bash
# Open Supabase SQL Editor
# https://supabase.com/dashboard/project/{projectId}/sql/new
# Paste content from: apps/rendetalje/services/database/migrations/001_subcontractor_schema.sql
# Run migration
```

### 2. Environment Variables

```bash
# Already synced via tekup-secrets
# Verify: apps/rendetalje/services/backend-nestjs/.env
```

### 3. Generate VAPID Keys (PWA)

```bash
cd apps/rendetalje/services/backend-nestjs
npx web-push generate-vapid-keys
# Add to .env:
# VAPID_PUBLIC_KEY=<output>
# VAPID_PRIVATE_KEY=<output>
```

### 4. Create Supabase Storage Bucket

- Bucket name: `subcontractor-documents`
- Public access: Disabled
- Allowed MIME types: PDF, images, Office docs
- Max file size: 10 MB

### 5. Update Next.js Config (PWA)

See `apps/rendetalje/services/frontend-nextjs/PWA_SETUP_GUIDE.md`

### 6. Restart Services

```bash
# Backend
cd apps/rendetalje/services/backend-nestjs
npm run start:dev

# Frontend
cd apps/rendetalje/services/frontend-nextjs
npm run dev
```

## 📊 Usage Examples

### Example 1: Create Subcontractor

```typescript
POST /api/subcontractors
{
  "companyName": "RenGør ApS",
  "contactName": "Anders Hansen",
  "email": "anders@rengoer.dk",
  "phone": "+45 12 34 56 78",
  "address": "Hovedgade 123, 2000 Frederiksberg",
  "cvrNumber": "DK12345678",
  "websiteUrl": "https://rengoer.dk",
  "status": "active"
}
```

### Example 2: Smart Task Assignment

```typescript
POST /api/subcontractors/assign-task
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "useSmartAssignment": true
}
// System selects best subcontractor based on algorithm
```

### Example 3: Manual Assignment

```typescript
POST /api/subcontractors/assign-task
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "subcontractorId": "789e4567-e89b-12d3-a456-426614174111",
  "useSmartAssignment": false
}
```

### Example 4: Create Review

```typescript
POST /api/subcontractors/789.../reviews
{
  "rating": 5,
  "punctualityScore": 5,
  "qualityScore": 5,
  "communicationScore": 4,
  "comments": "Excellent work, very professional. Completed on time."
}
// Automatically updates aggregate rating
```

## 🔒 Security

- **Authentication**: JWT bearer token required for all endpoints
- **Authorization**: RLS policies enforce data access rules
- **Input Validation**: Zod schemas + class-validator decorators
- **Rate Limiting**: Throttler guard (100 req/min)
- **File Upload**: Type and size restrictions enforced
- **SQL Injection**: Protected via Prisma ORM
- **XSS**: Sanitized user input in frontend components

## 🧪 Testing Checklist

### Unit Tests

- [ ] SubcontractorsService.create()
- [ ] SubcontractorsService.findBestSubcontractor()
- [ ] SubcontractorsService.updateAggregateRating()
- [ ] SubcontractorList component rendering
- [ ] AssignmentModal smart assignment logic
- [ ] ReviewForm validation

### Integration Tests

- [ ] Create subcontractor → Verify in database
- [ ] Assign task (smart) → Check algorithm selection
- [ ] Complete task → Verify Billy invoice + calendar event
- [ ] Submit review → Check rating recalculation
- [ ] Push notification subscription → Test delivery

### E2E Tests

- [ ] Full workflow: Create profile → Assign task → Complete → Review
- [ ] Error handling: Invalid email, duplicate subcontractor
- [ ] Permission handling: Unauthorized access blocked
- [ ] PWA installation and offline mode

## 📈 Performance Considerations

- **Indexes**: 17 indexes on frequently queried columns
- **Pagination**: List endpoints support page/limit parameters
- **Caching**: Consider Redis for frequently accessed subcontractors
- **Lazy Loading**: Components load data on demand
- **Optimistic Updates**: UI updates immediately, server sync async

## 🐛 Known Issues

1. **Database Migration**: Manual execution required (psql not available in dev environment)
2. **VAPID Keys**: Must be generated manually before PWA push works
3. **TypeScript Errors**: Prisma types require migration execution first
4. **Icon Assets**: PWA icons (72x72 to 512x512) not yet generated

## 📚 Related Documentation

- [tekup-secrets/SUBCONTRACTOR_CONFIG_GUIDE.md](../../tekup-secrets/SUBCONTRACTOR_CONFIG_GUIDE.md)
- [tekup-secrets/IMPLEMENTATION_SUMMARY.md](../../tekup-secrets/IMPLEMENTATION_SUMMARY.md)
- [SUBCONTRACTOR_INTEGRATION_GUIDE.md](./SUBCONTRACTOR_INTEGRATION_GUIDE.md)
- [PWA_SETUP_GUIDE.md](../services/frontend-nextjs/PWA_SETUP_GUIDE.md)
- [Database Schema](../services/database/migrations/001_subcontractor_schema.sql)

## 🤝 Contributing

When adding features:

1. Update database schema in `migrations/` folder
2. Add DTOs with validation in `backend/dto/`
3. Implement business logic in service layer
4. Create API endpoints with Swagger docs
5. Build React components with TypeScript
6. Update environment variables in `tekup-secrets`
7. Write tests (unit + integration + E2E)
8. Update this documentation

## 📝 Change Log

See [CHANGELOG.md](../CHANGELOG.md) for version history.

**v2.1.0 (October 28, 2025)**

- ✅ Complete database schema (9 tables)
- ✅ Backend API (8 endpoints)
- ✅ Frontend components (3 components)
- ✅ Smart assignment algorithm
- ✅ PWA foundation (manifest, service worker, push notifications)
- ✅ 82 configuration variables
- ⏳ Database migration pending manual execution
- ⏳ Billy.dk integration pending implementation
- ⏳ Calendar MCP integration pending implementation
