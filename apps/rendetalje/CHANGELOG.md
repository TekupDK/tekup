# Changelog

All notable changes to the RenOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-10-28

### Added - Subcontractor Management System

**Backend (NestJS)**

- `SubcontractorsModule` with full CRUD API
  - POST/GET/PATCH/DELETE `/api/subcontractors` endpoints
  - POST `/api/subcontractors/assign-task` with smart assignment
  - GET/PATCH `/api/subcontractors/assignments/all`
  - POST `/api/subcontractors/:id/reviews`
- `SubcontractorsService` with business logic
  - Smart assignment algorithm (rating-based scoring)
  - Automatic rating aggregation from reviews
  - Conflict detection and availability checking
- DTOs with validation:
  - `CreateSubcontractorDto`, `UpdateSubcontractorDto`
  - `CreateTaskAssignmentDto`, `UpdateTaskAssignmentDto`, `AssignTaskDto`
  - `CreateReviewDto`
- Integrated into `app.module.ts`

**Frontend (Next.js)**

- `SubcontractorList` component
  - Grid view with search and filters
  - Status badges and star ratings
  - Quick actions (view, edit)
- `AssignmentModal` component
  - Smart vs. manual assignment toggle
  - Job details display
  - Subcontractor selection list
- `ReviewForm` component
  - 1-5 star rating system
  - Detailed scoring (punctuality, quality, communication)
  - Comments with character counter

**PWA Support**

- Progressive Web App configuration
  - `manifest.json` with app metadata
  - Service worker (`sw.js`) with caching strategy
  - Push notification infrastructure
- `push-notifications.ts` library
  - Service worker registration
  - Push subscription management
  - Backend API integration
- `PWA_SETUP_GUIDE.md` documentation

**Database**

- 9 new tables schema (`001_subcontractor_schema.sql`):
  - `subcontractors` - Profile and contact info
  - `services` - Service catalog (8 pre-populated)
  - `subcontractor_services` - Capabilities (many-to-many)
  - `subcontractor_documents` - File storage tracking
  - `subcontractor_availability` - Schedule management
  - `task_assignments` - Job assignments
  - `subcontractor_reviews` - Performance ratings
  - `subcontractor_agreements` - Contract terms
  - `push_subscriptions` - PWA notifications
- 17 optimized indexes
- 12 Row-Level Security (RLS) policies
- Automated triggers for rating aggregation
- Helper views for common queries

**Configuration**

- 82 environment variables in `subcontractor-services.env`
  - Feature flags (PWA, auto-assignment, reviews)
  - File upload settings (Supabase Storage)
  - Assignment algorithm weights
  - Billy.dk integration settings
  - Calendar sync configuration
- Synced to `backend-nestjs/.env` (356 total lines)

**Documentation**

- `SUBCONTRACTOR_FEATURE.md` - Complete feature documentation
- `SUBCONTRACTOR_INTEGRATION_GUIDE.md` - Billy + Calendar integration
- `PWA_SETUP_GUIDE.md` - PWA setup instructions
- `tekup-secrets/SUBCONTRACTOR_CONFIG_GUIDE.md` (existing)
- `tekup-secrets/IMPLEMENTATION_SUMMARY.md` (existing)

### Changed

- `app.module.ts` - Added `SubcontractorsModule` import
- `.env` files - Synced 82 new configuration variables

### Pending

- Database migration execution (manual via Supabase SQL Editor)
- VAPID key generation for PWA push notifications
- Billy.dk integration service implementation
- Calendar MCP integration service implementation
- PWA icon generation (72x72 to 512x512)
- Integration tests for complete workflow

### Migration Instructions

1. **Database Setup**

   ```bash
   # Open Supabase SQL Editor
   # Paste content from: apps/rendetalje/services/database/migrations/001_subcontractor_schema.sql
   # Execute migration
   ```

2. **Generate VAPID Keys**

   ```bash
   cd apps/rendetalje/services/backend-nestjs
   npx web-push generate-vapid-keys
   # Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env
   ```

3. **Create Storage Bucket**

   - Supabase dashboard → Storage → Create bucket: `subcontractor-documents`
   - Configure: Private, 10MB max, PDF/images allowed

4. **Restart Services**
   ```bash
   npm run start:dev  # backend-nestjs
   npm run dev        # frontend-nextjs
   ```

### Security

- JWT authentication required for all subcontractor endpoints
- RLS policies enforce data access control
- Input validation via Zod schemas and class-validator
- File upload type and size restrictions
- Rate limiting (100 req/min via Throttler)

### Performance

- 17 database indexes for query optimization
- Pagination support on list endpoints
- Lazy loading of related data
- Optimistic UI updates in frontend components

---

## [2.0.0] - Previous Version

(Previous changelog entries...)

[2.1.0]: https://github.com/TekupDK/tekup/compare/v2.0.0...v2.1.0
