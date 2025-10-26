# TekUp Flow API & Nexus Dashboard Validation Guide

## Quick Start Commands

### 1. Start PostgreSQL Database
```bash
# Option A: Docker (recommended)
docker run -d --name tekup-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tekup -p 5432:5432 postgres:15

# Option B: Use existing PostgreSQL installation
# Ensure database 'tekup' exists with user 'postgres'/'postgres'
```

### 2. Setup Flow API
```bash
cd apps/flow-api
pnpm install
pnpm prisma generate
pnpm prisma db push  # Creates tables without migrations
pnpm dev  # Starts on port 4000
```

### 3. Setup Nexus Dashboard
```bash
cd apps/nexus-dashboard
pnpm install
pnpm dev  # Starts on port 5173
```

### 4. Run Integration Test
```bash
# Install node-fetch if needed
pnpm add node-fetch

# Run test script
node test-integration.js
```

## Manual Validation Steps

### ✅ Environment Configuration
- [x] `apps/flow-api/.env` contains `FLOW_API_URL=http://localhost:4000`
- [x] `apps/nexus-dashboard/.env.local` uses `VITE_TENANT_API_KEY=demo-tenant-key-1`
- [x] Enhanced API key service supports legacy keys for development

### 🔍 API Endpoints to Test

1. **Health Check** (no auth required)
   ```bash
   curl http://localhost:4000/metrics
   # Should return 200 OK with Prometheus metrics
   ```

2. **Form Submission** (requires valid API key)
   ```bash
   curl -X POST http://localhost:4000/ingest/form \
     -H "Content-Type: application/json" \
     -H "x-tenant-key: demo-tenant-key-1" \
     -d '{
       "source": "manual-test", 
       "payload": {
         "email": "test@example.com",
         "name": "Test User",
         "company": "Test Company"
       }
     }'
   # Should return 200 OK with lead data
   ```

3. **Invalid API Key** (should fail)
   ```bash
   curl -X POST http://localhost:4000/ingest/form \
     -H "Content-Type: application/json" \
     -H "x-tenant-key: invalid-key" \
     -d '{"source": "test", "payload": {"email": "test@example.com"}}'
   # Should return 401 Unauthorized
   ```

### 🌐 Frontend Validation

1. **Access Nexus Dashboard**
   - Navigate to `http://localhost:5173`
   - Should load TekUp landing page

2. **Submit Contact Form**
   - Fill out the project request form
   - Submit and check for success message
   - Verify no CORS or API key errors

### 🔧 Troubleshooting

**Flow API won't start:**
- Check PostgreSQL is running on port 5432
- Run `pnpm prisma db push` to ensure schema is applied
- Verify all dependencies installed with `pnpm install`

**Frontend form submission fails:**
- Check browser console for CORS errors
- Verify API is running on port 4000
- Confirm API key `demo-tenant-key-1` exists in database

**API key validation fails:**
- The enhanced service now checks legacy `key` column first
- Auto-seeded keys: `demo-tenant-key-1`, `demo-tenant-key-2`
- Check database for API key records: `SELECT key, tenantId FROM "ApiKey"`

### 📊 Expected Results

✅ **Success Indicators:**
- Flow API responds to `/metrics` endpoint
- Form submission returns 200 with lead ID
- Invalid API keys return 401 Unauthorized
- Frontend loads without errors
- Form submission shows success message

❌ **Common Issues:**
- CORS errors → Check API CORS configuration
- Database connection errors → Verify PostgreSQL running
- API key errors → Check `demo-tenant-key-1` exists
- Port conflicts → Ensure ports 4000, 5173, 5432 available

## Architecture Validated

This test validates the complete multi-tenant flow:

1. **Frontend** → Nexus Dashboard (Vite/React)
2. **API Gateway** → Flow API with API key middleware
3. **Authentication** → Enhanced API key service with legacy support
4. **Data Layer** → PostgreSQL with Prisma ORM
5. **Business Logic** → Lead ingestion and metrics tracking
