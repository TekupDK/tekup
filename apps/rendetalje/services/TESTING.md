# RenOS Test Infrastructure

## Automated Testing

All RenOS services have comprehensive test coverage with automated CI/CD pipelines.

### Test Coverage

- ✅ **Backend (@renos/backend)**: NestJS + Jest + Supertest
  - Unit tests for services and controllers
  - E2E tests for API endpoints
  - Integration tests with database mocking
- ✅ **Frontend (@renos/frontend)**: Next.js + Jest + React Testing Library
  - Component tests with user interactions
  - Page rendering tests
  - API route tests
- ✅ **Shared (@renos/shared)**: Jest + ts-jest
  - Validation utility tests
  - Schema validation tests
  - Formatting utility tests
  - 80% minimum coverage threshold

### Running Tests Locally

**Backend:**

```bash
cd apps/rendetalje/services/backend-nestjs
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # E2E tests
```

**Frontend:**

```bash
cd apps/rendetalje/services/frontend-nextjs
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Shared Library:**

```bash
cd apps/rendetalje/services/shared
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### CI/CD Pipeline

GitHub Actions automatically runs all tests on:

- Push to `master` or `develop` branches
- Pull requests to `master` or `develop`
- Changes in `apps/rendetalje/**` paths

**Pipeline Jobs:**

1. **backend-tests**: Linting, unit tests, E2E tests
2. **frontend-tests**: Linting, tests, build verification
3. **shared-tests**: Linting, tests, coverage thresholds, build
4. **quality-check**: Final verification that all tests passed

### Coverage Reports

Coverage reports are automatically uploaded to Codecov:

- Backend: `backend-coverage`
- Frontend: `frontend-coverage`
- Shared: `shared-coverage`

View coverage at: https://codecov.io/gh/TekupDK/tekup

### Test Structure

**Backend Tests:**

```
backend-nestjs/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts
│   ├── customers/
│   │   └── customers.service.spec.ts
│   └── ...
└── test/
    ├── app.e2e-spec.ts
    ├── auth.e2e-spec.ts
    ├── jest-e2e.json
    └── setup.ts
```

**Frontend Tests:**

```
frontend-nextjs/
├── __tests__/
│   ├── api/
│   │   └── auth/
│   │       └── login.test.ts
│   └── page.test.tsx
├── src/
│   └── components/
│       └── __tests__/
│           └── LoginForm.test.tsx
├── jest.config.js
└── jest.setup.js
```

**Shared Tests:**

```
shared/
├── src/
│   └── utils/
│       └── __tests__/
│           ├── formatting.test.ts
│           ├── validation.test.ts
│           └── schemas.test.ts
└── jest.config.js
```

### Quality Standards

**All tests must:**

- ✅ Pass consistently without flakiness
- ✅ Test both success and error scenarios
- ✅ Mock external dependencies appropriately
- ✅ Maintain >80% code coverage (shared library)
- ✅ Follow testing best practices from official docs

**Test Patterns:**

- Unit tests: Test individual functions/methods
- Integration tests: Test component interactions
- E2E tests: Test complete user workflows
- Component tests: Test UI rendering and interactions

### Continuous Integration

**On every commit:**

1. Checkout code
2. Setup Node.js 20
3. Install dependencies (cached)
4. Run linters
5. Run all tests with coverage
6. Build applications
7. Upload coverage reports
8. Verify quality gates

**Pull Request Requirements:**

- ✅ All tests must pass
- ✅ Linting must pass
- ✅ Build must succeed
- ✅ Coverage must meet thresholds
- ✅ Code review approval required

### Next Steps

- [ ] Add Playwright/Cypress for E2E testing
- [ ] Setup test database with Docker
- [ ] Add visual regression testing
- [ ] Implement performance testing
- [ ] Add security scanning in CI

---

## **Last Updated:** October 24, 2025

## Playwright E2E Testing

### Setup Complete ✅

- Playwright 1.56+ installed in frontend-nextjs
- Multi-browser configuration (Chromium, Firefox, WebKit)
- Mobile viewport testing (Pixel 5, iPhone 12)
- Automatic dev server startup for tests

### Test Scenarios

**Authentication Flow** (`e2e/auth.spec.ts`)

- Login page display and validation
- Empty form validation errors
- Invalid email format detection
- Valid credentials login with dashboard redirect
- Session persistence after page reload
- Logout functionality with redirect to login
- Registration page navigation
- New user registration with validation
- Password mismatch error handling

**Job Management** (`e2e/job-management.spec.ts`)

- Jobs list page display with "Create Job" button
- Job creation modal opening
- Window cleaning job creation with all fields
- Required field validation (type, customer, address)
- Job filtering by status (pending, in_progress, completed)
- Customer name search functionality
- Job details viewing (navigation to detail page)
- Status updates (pending → in-progress)
- Employee assignment to jobs
- Job deletion with confirmation dialog
- Cancellation of job deletion

**Customer Management** (`e2e/customer-management.spec.ts`)

- Customer list page display
- Customer creation with all details (name, email, phone, address, CVR)
- Email format validation
- Phone number validation (Danish format)
- Postal code validation (4 digits)
- Customer search by name
- Customer type filtering (private/business)
- Customer details viewing
- Customer information editing
- Job history viewing per customer
- Customer deletion with confirmation
- CSV export functionality

### Running E2E Tests

```bash
cd frontend-nextjs

# Run all E2E tests (headless)
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View HTML report
npm run playwright:report

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### E2E Test Configuration (`playwright.config.ts`)

- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 in CI (sequential), unlimited locally (parallel)
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Trace**: Captured on first retry for debugging
- **Screenshot**: Only on failure to save space
- **Video**: Retained on failure for debugging
- **Reporters**: HTML + JSON in CI, List + HTML locally
- **Web Server**: Automatically starts `npm run dev` before tests

### CI/CD Integration ✅

Playwright E2E tests are **fully integrated** into the GitHub Actions pipeline!

**Pipeline Flow:**

1. **backend-tests** → Unit + E2E tests
2. **frontend-tests** → Jest + RTL component tests
3. **shared-tests** → Utilities + schema tests
4. **frontend-e2e-tests** → Playwright E2E (runs after backend + frontend tests pass)
5. **quality-check** → Final verification gate (depends on all previous jobs)

**E2E Job Configuration:**

- Runs only after basic tests pass (needs: [backend-tests, frontend-tests])
- Installs Chromium, Firefox, and WebKit browsers
- Executes all E2E test suites (auth, jobs, customers)
- Uploads Playwright HTML report (retained for 30 days)
- Uploads test results and traces (retained for 30 days)

**View Results:**

- GitHub Actions: [https://github.com/TekupDK/tekup/actions](https://github.com/TekupDK/tekup/actions)
- Download Playwright Report artifact from completed workflow runs
- View test traces for failed tests in Playwright UI mode locally

---

## Test Database Infrastructure

### Docker Setup Complete ✅

**File:** `docker-compose.test.yml`

**Services:**

- **PostgreSQL 15** on port 5433 (`renos-postgres-test`)
  - User: `renos_test`
  - Password: `renos_test_password`
  - Database: `renos_test`
  - Health check: `pg_isready` every 10s
- **Redis 7** on port 6380 (`renos-redis-test`)
  - Password: `renos_test_redis_password`
  - Persistence: RDB snapshots to volume
  - Health check: `redis-cli ping` every 10s

**Volumes:**

- `renos-postgres-test-data` - PostgreSQL data persistence
- `renos-redis-test-data` - Redis cache persistence

**Network:**

- `renos-test-network` - Bridge network for inter-service communication

### Database Schema (`scripts/init-test-db.sql`)

```sql
renos.users              -- Authentication and user profiles (JWT-based)
  ├─ id (UUID, PK)
  ├─ email (VARCHAR, UNIQUE)
  ├─ password_hash (VARCHAR, bcrypt)
  ├─ role (owner, employee, customer)
  └─ created_at, updated_at, last_login_at

renos.customers          -- Customer information (private/business)
  ├─ id (UUID, PK)
  ├─ user_id (UUID, FK → users.id)
  ├─ type (private, business)
  ├─ cvr (VARCHAR, for businesses)
  └─ address fields (street, postal_code, city)

renos.jobs               -- Job tracking (window, facade, gutter, etc.)
  ├─ id (UUID, PK)
  ├─ customer_id (UUID, FK → customers.id)
  ├─ assigned_to (UUID, FK → users.id)
  ├─ type (window, facade, gutter, pressure_wash, other)
  ├─ status (pending, in_progress, completed, cancelled)
  └─ scheduled_at, started_at, completed_at

renos.job_logs           -- Audit trail for job changes
  ├─ id (UUID, PK)
  ├─ job_id (UUID, FK → jobs.id)
  ├─ user_id (UUID, FK → users.id)
  ├─ action (VARCHAR)
  └─ details (TEXT)

renos.invoices           -- Billing and payment tracking
  ├─ id (UUID, PK)
  ├─ job_id (UUID, FK → jobs.id)
  ├─ invoice_number (VARCHAR, UNIQUE)
  ├─ status (draft, sent, paid, overdue, cancelled)
  └─ due_date, paid_at
```

**Indexes Created:**

- `idx_users_email`, `idx_users_role`
- `idx_customers_user_id`
- `idx_jobs_customer_id`, `idx_jobs_assigned_to`, `idx_jobs_status`
- `idx_job_logs_job_id`
- `idx_invoices_job_id`, `idx_invoices_customer_id`

### Seed Data (Pre-loaded)

**Test Users (password: `securePassword123` for all):**

```
owner@example.com       → Test Owner (role: owner)
employee@example.com    → Test Employee (role: employee)
customer@example.com    → Test Customer (role: customer)
```

**Test Customers:**

```
Lars Hansen             → Private customer, Nørregade 10, 1234 København
Test Virksomhed ApS     → Business customer, Industrivej 5, 2000 Frederiksberg
```

**Test Jobs:**

```
Window cleaning (pending)      → Assigned to employee, scheduled in 2 days
Facade polishing (in_progress) → Business customer, scheduled tomorrow
Window cleaning (completed)    → Completed 3 days ago, has paid invoice
```

**Test Invoices:**

```
INV-2025-0001 (paid)    → 450 DKK, due 10 days ago, paid
```

### Starting Test Database

```powershell
# Navigate to services directory
cd c:\Users\Jonas-dev\tekup\apps\rendetalje\services

# Start PostgreSQL + Redis containers
.\scripts\start-test-db.ps1

# Expected output:
# 🚀 Starting RenOS Test Database...
# 📦 Starting containers...
# ⏳ Waiting for PostgreSQL to be ready...
# ✅ PostgreSQL is ready!
# ⏳ Waiting for Redis to be ready...
# ✅ Redis is ready!
#
# 🔗 Test Database Connection Details:
# PostgreSQL: postgresql://renos_test:renos_test_password@localhost:5433/renos_test
# Redis: redis://:renos_test_redis_password@localhost:6380
#
# ✅ Test database is ready for integration tests!
```

### Stopping Test Database

```powershell
# Stop containers (preserve data volumes)
.\scripts\stop-test-db.ps1

# Stop and remove volumes (complete reset)
.\scripts\stop-test-db.ps1 -RemoveVolumes
```

### Test Environment Variables (`.env.test`)

```bash
# Database
DATABASE_URL=postgresql://renos_test:renos_test_password@localhost:5433/renos_test
DATABASE_SCHEMA=renos

# Cache
REDIS_URL=redis://:renos_test_redis_password@localhost:6380

# Authentication
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRES_IN=1h

# Application
NODE_ENV=test
PORT=3001

# External Services (mocked)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_LOGGING=false

# Testing
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
CI=false
```

### Using Test Database in Backend Tests

```typescript
// In test/setup.ts (already configured)
process.env.DATABASE_URL =
  "postgresql://renos_test:renos_test_password@localhost:5433/renos_test";
process.env.REDIS_URL = "redis://:renos_test_redis_password@localhost:6380";

// In E2E tests (test/*.e2e-spec.ts)
describe("Jobs E2E", () => {
  beforeAll(async () => {
    // Database is already seeded with test data
    // Test users, customers, and jobs are ready to use
  });

  it("should create a new job", async () => {
    const response = await request(app.getHttpServer())
      .post("/jobs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId: "44444444-4444-4444-4444-444444444444", // Lars Hansen
        type: "window",
        address: "Test address",
        // ... other fields
      });

    expect(response.status).toBe(201);
  });

  afterAll(async () => {
    // Optional: Clean up test data if needed
    // Or just reset with: .\scripts\stop-test-db.ps1 -RemoveVolumes
  });
});
```

### Database Management Commands

```bash
# Connect to test database with psql
docker exec -it renos-postgres-test psql -U renos_test -d renos_test

# Run SQL query
docker exec -it renos-postgres-test psql -U renos_test -d renos_test -c "SELECT * FROM renos.users;"

# Check Redis keys
docker exec -it renos-redis-test redis-cli -a renos_test_redis_password KEYS '*'

# View container logs
docker logs renos-postgres-test
docker logs renos-redis-test

# Check container health
docker ps --filter "name=renos-postgres-test"
docker ps --filter "name=renos-redis-test"
```

---

## Next Steps

### Phase 2: Integration Testing

- [ ] Integrate Playwright E2E into GitHub Actions pipeline (see YAML example above)
- [ ] Add visual regression testing with Playwright screenshots and pixel comparison
- [ ] Implement API contract testing with Pact or Postman collections
- [ ] Add database snapshot testing for schema migration validation
- [ ] Create test data factory for generating realistic datasets

### Phase 3: Performance Testing

- [ ] Add load testing with Artillery or k6 for API endpoints
- [ ] Implement performance benchmarks for critical user workflows
- [ ] Add memory leak detection with Node.js heap profiling
- [ ] Monitor test execution times and optimize slow tests (target: <30s for full suite)
- [ ] Set up Lighthouse CI for frontend performance metrics

### Phase 4: Mobile App Testing

- [ ] Set up React Native testing infrastructure (Jest + React Native Testing Library)
- [ ] Add Detox for mobile E2E tests (iOS and Android)
- [ ] Configure iOS Simulator and Android Emulator in CI
- [ ] Test platform-specific features (camera, geolocation, push notifications)
- [ ] Add accessibility testing with @testing-library/react-native-a11y

### Phase 5: Continuous Improvement

- [ ] Implement mutation testing with Stryker to validate test quality
- [ ] Add code quality gates (SonarQube or similar)
- [ ] Create test data versioning for reproducible test scenarios
- [ ] Set up test environment monitoring (database size, execution time trends)
- [ ] Document test writing guidelines and best practices

---

**Test Infrastructure Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** Tekup Portfolio
