# Port Allocation - RendetaljeOS Platform

**Last Updated**: 2025-10-24
**Purpose**: Single source of truth for all port allocations to prevent conflicts

## 🎯 Active Services

| Port | Service | Technology | Status | Docker Container |
|------|---------|------------|--------|------------------|
| **3001** | Backend API | NestJS | ✅ Active | `rendetalje-backend` |
| **3002** | Frontend | Next.js | ⚠️ Reserved | - |
| **5432** | PostgreSQL | Database | ✅ Active | `rendetalje-postgres` |
| **6379** | Redis | Cache | ✅ Active | `rendetalje-redis` |
| **8081** | Mobile - Metro Bundler | Expo | ✅ Active | `rendetalje-mobile-expo` |
| **19000** | Mobile - Expo DevTools | Expo | ✅ Active | `rendetalje-mobile-expo` |
| **19001** | Mobile - Expo Metro | Expo | ✅ Active | `rendetalje-mobile-expo` |
| **19002** | Mobile - Expo Web | Expo | ✅ Active | `rendetalje-mobile-expo` |

## 📦 Calendar MCP Services (Separate Docker Compose)

| Port | Service | Technology | Status |
|------|---------|------------|--------|
| **3005** | Chatbot | Express | ✅ Active |
| **3006** | Dashboard | Vite | ✅ Active |

## 🧪 Testing Ports

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **5433** | PostgreSQL Test | Test Database | Reserved |
| **6380** | Redis Test | Test Cache | Reserved |

## ⚠️ Port Conflicts Resolved

### Issue 1: Backend vs Frontend
- **Problem**: Both tried to use port 3001
- **Solution**:
  - Backend (NestJS): `3001` (Docker)
  - Frontend (Next.js): `3002` (Local dev)
  - Playwright: Updated to use `3002`

### Issue 2: Calendar MCP Overlap
- **Problem**: Calendar MCP used 3001 (conflicted with backend)
- **Solution**: Calendar MCP moved to separate ports (3005, 3006)

## 📋 Configuration Files to Update

### Backend
- `apps/rendetalje/services/backend-nestjs/src/main.ts` - Port 3001
- `docker-compose.mobile.yml` - Backend service port 3001

### Frontend
- `apps/rendetalje/services/frontend-nextjs/package.json` - Dev script with PORT=3002
- `apps/rendetalje/services/frontend-nextjs/playwright.config.ts` - baseURL: `http://localhost:3002`

### Mobile
- `docker-compose.mobile.yml` - Expo ports 8081, 19000-19002

### Testing
- `apps/rendetalje/services/frontend-nextjs/playwright.config.ts`
- `apps/rendetalje/services/TESTING.md`

## 🔧 Quick Commands

```bash
# Check what's using a port (Windows)
netstat -ano | findstr ":3001"
netstat -ano | findstr ":3002"

# Kill process on port (Windows)
$proc = Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
Stop-Process -Id $proc.Id -Force

# Check Docker containers
docker ps

# Check all listening ports
netstat -ano | findstr "LISTENING"
```

## 🎯 Port Assignment Rules

1. **3000-3099**: Application servers
   - 3001: Backend API (NestJS)
   - 3002: Frontend (Next.js)
   - 3005: Calendar Chatbot
   - 3006: Calendar Dashboard

2. **5000-5999**: Databases
   - 5432: PostgreSQL (production)
   - 5433: PostgreSQL (test)

3. **6000-6999**: Cache/Queue
   - 6379: Redis (production)
   - 6380: Redis (test)

4. **8000-8999, 19000-19999**: Mobile/Development
   - 8081: Expo Metro Bundler
   - 19000-19002: Expo Development Tools

## ⚡ Next Steps

When adding new services:
1. Check this file first
2. Choose unused port from appropriate range
3. Update this file
4. Update docker-compose files
5. Update documentation
6. Commit all changes together

---
**Maintained by**: DevOps Team
**Questions**: Create issue in repo
