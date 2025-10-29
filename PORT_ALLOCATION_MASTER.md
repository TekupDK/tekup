# TekupDK Master Port Allocation

**Last Updated**: 2025-10-29
**Scope**: Entire TekupDK workspace
**Purpose**: Prevent port conflicts across all services and projects

**Phase 1 Implementation Status**: ✅ COMPLETED
- Fixed critical Calendar MCP port conflicts (3001→3003, 6379→6378)
- Updated docker-compose.yml with new port assignments
- Created environment variable configuration (.env.ports)
- Master port registry document updated with implementation details

## 🎯 Port Allocation Summary

### Rendetalje Services (Main Docker Compose)

| Port | Service | Container | Status |
|------|---------|-----------|--------|
| **3001** | Backend API (NestJS) | `rendetalje-backend` | ✅ Active |
| **5432** | PostgreSQL | `rendetalje-postgres` | ✅ Active |
| **6379** | Redis | `rendetalje-redis` | ✅ Active |
| **8081** | Expo Metro Bundler | `rendetalje-mobile-expo` | ✅ Active |
| **19000** | Expo DevTools | `rendetalje-mobile-expo` | ✅ Active |
| **19001** | Expo Metro Bundler Alt | `rendetalje-mobile-expo` | ✅ Active |
| **19002** | Expo Web Interface | `rendetalje-mobile-expo` | ✅ Active |

### Rendetalje Frontend (Local Dev)

| Port | Service | Technology | Status |
|------|---------|------------|--------|
| **3002** | Frontend Dev Server | Next.js | 📝 Reserved |

### Calendar MCP Services (Separate Compose)

| Port | Service | Container | Status |
|------|---------|-----------|--------|
| **3003** | MCP Server API | `calendar-mcp-server` | ✅ **FIXED** |
| **3005** | Chatbot | `calendar-chatbot` | ✅ Active |
| **3006** | Dashboard | `calendar-dashboard` | ✅ Active |
| **6378** | Redis | `calendar-redis` | ✅ **FIXED** |

### Testing Infrastructure

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **5433** | PostgreSQL Test | Test DB (Mobile) | 📝 Reserved |
| **6380** | Redis Test | Test Cache | 📝 Reserved |

### GitHub Actions CI/CD

| Port | Service | Context | Status |
|------|---------|---------|--------|
| **3000** | Playwright Tests | CI Pipeline | ⚙️ CI Only |
| **5432** | Test Database | CI Pipeline | ⚙️ CI Only |

## ⚠️ CRITICAL PORT CONFLICTS

### Conflict 1: Port 3001 ✅ RESOLVED

**Problem**: Both Backend API and Calendar MCP Server used port 3001
**Impact**: Cannot run both services simultaneously
**Solution Applied**: Moved Calendar MCP to port 3003
**Status**: ✅ Fixed - Calendar MCP now uses port 3003

### Conflict 2: Port 6379 ✅ RESOLVED

**Problem**: Both main Redis and Calendar Redis used port 6379
**Impact**: Redis connection conflicts
**Solution Applied**: Moved Calendar Redis to port 6378
**Status**: ✅ Fixed - Calendar Redis now uses port 6378

## 🔧 Recommended Port Reassignment

### Calendar MCP Services (NEW)

```yaml
# docker-compose.yml
services:
  mcp-server:
    ports:
      - "3003:3001"  # External 3003, Internal 3001

  redis:
    ports:
      - "6378:6379"  # External 6378, Internal 6379
```

### Updated Port Table (After Fix)

| Port | Service | Project | Container |
|------|---------|---------|-----------|
| 3001 | Backend API | Rendetalje | `rendetalje-backend` |
| 3002 | Frontend | Rendetalje | Local Dev |
| 3003 | MCP Server | Calendar | `calendar-mcp-server` |
| 3005 | Chatbot | Calendar | `calendar-chatbot` |
| 3006 | Dashboard | Calendar | `calendar-dashboard` |
| 5432 | PostgreSQL | Rendetalje | `rendetalje-postgres` |
| 5433 | PostgreSQL Test | Rendetalje | Test env |
| 6378 | Redis | Calendar | `calendar-redis` |
| 6379 | Redis | Rendetalje | `rendetalje-redis` |
| 6380 | Redis Test | Rendetalje | Test env |
| 8081 | Expo Metro | Rendetalje Mobile | `rendetalje-mobile-expo` |
| 19000-19002 | Expo Dev Tools | Rendetalje Mobile | `rendetalje-mobile-expo` |

## 📋 Port Ranges by Category

### Application Servers (3000-3099)

- **3000**: Reserved for frontend tests (CI)
- **3001**: Backend API (Rendetalje)
- **3002**: Frontend Dev (Rendetalje)
- **3003**: MCP Server (Calendar) - **NEW**
- **3005**: Chatbot (Calendar)
- **3006**: Dashboard (Calendar)
- **3010-3099**: Available

### Databases (5000-5999)

- **5432**: PostgreSQL Production (Rendetalje)
- **5433**: PostgreSQL Test (Rendetalje Mobile)
- **5434-5999**: Available

### Cache/Queue (6000-6999)

- **6378**: Redis (Calendar) - **NEW**
- **6379**: Redis Production (Rendetalje)
- **6380**: Redis Test (Rendetalje)
- **6381-6999**: Available

### Mobile/Dev Tools (8000-8999, 19000-19999)

- **8081**: Expo Metro Bundler
- **19000**: Expo DevTools
- **19001**: Expo Metro Bundler Alt
- **19002**: Expo Web Interface

## 🔍 How to Check Port Usage

### Windows PowerShell

```powershell
# Check specific port
netstat -ano | findstr ":3001"

# Check all listening ports
netstat -ano | findstr "LISTENING"

# Kill process on port
$proc = Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
Stop-Process -Id $proc.Id -Force
```

### Docker

```bash
# Check all running containers
docker ps

# Check Docker port mappings
docker port <container_name>

# Check all Docker networks
docker network ls
```

## 📝 Configuration Files to Update

### When Changing Ports

#### Backend (Port 3001)

- `apps/rendetalje/services/backend-nestjs/src/main.ts`
- `docker-compose.mobile.yml` - backend service
- All CORS configurations

#### Frontend (Port 3002)

- `apps/rendetalje/services/frontend-nextjs/package.json`
- `apps/rendetalje/services/frontend-nextjs/playwright.config.ts`
- `apps/rendetalje/services/frontend-nextjs/next.config.js`
- `.github/workflows/renos-tests.yml`

#### Calendar MCP (Port 3003)

- `apps/rendetalje/services/calendar-mcp/docker-compose.yml`
- `apps/rendetalje/services/calendar-mcp/chatbot/src/services/PluginManager.ts`
- `apps/rendetalje/services/calendar-mcp/dashboard/src/api.ts`
- All health check URLs

#### Mobile (Ports 8081, 19000-19002)

- `apps/rendetalje/services/mobile/src/services/api.ts`
- `docker-compose.mobile.yml` - mobile service

## ⚡ Action Items

### Immediate (Priority 1) ✅ COMPLETED

- [x] Fix Calendar MCP port conflict (3001 → 3003)
- [x] Fix Calendar Redis port conflict (6379 → 6378)
- [ ] Update Playwright config (3001 → 3002)
- [ ] Test all services start without conflicts

### Short Term (Priority 2)

- [ ] Update all documentation with correct ports
- [ ] Add port validation to CI/CD pipeline
- [ ] Create `scripts/check-ports.sh` utility

### Long Term (Priority 3)

- [ ] Implement service discovery (avoid hardcoded ports)
- [ ] Use Docker networking for service communication
- [ ] Document port allocation in README files

## 🚨 Emergency Port Change Procedure

If you must change a port urgently:

1. **Search all files**:
   ```bash
   grep -r ":<OLD_PORT>" .
   ```

2. **Update configuration files** (see list above)

3. **Update environment files**:
   - `.env`
   - `.env.local`
   - `.env.test`

4. **Update Docker Compose**:
   - Main `docker-compose.mobile.yml`
   - Service-specific compose files

5. **Update CI/CD**:
   - `.github/workflows/renos-tests.yml`

6. **Test locally**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

7. **Update this file**

8. **Commit all changes together**

## 📚 References

- **Main Compose**: `docker-compose.mobile.yml`
- **Calendar Compose**: `apps/rendetalje/services/calendar-mcp/docker-compose.yml`
- **Playwright Config**: `apps/rendetalje/services/frontend-nextjs/playwright.config.ts`
- **Backend Main**: `apps/rendetalje/services/backend-nestjs/src/main.ts`
- **CI/CD**: `.github/workflows/renos-tests.yml`

---
**Maintained by**: DevOps Team
**Last Audit**: 2025-10-24
**Next Review**: When adding new services
