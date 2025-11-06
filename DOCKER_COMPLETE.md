# 🐳 Docker Setup - Alle Services i Containere

**Date:** 2. november 2025
**Status:** ✅ Alle services containerized

---

## ✅ Services i Containere

### 1. **Friday AI** (Main Application)

- **Container:** `friday-ai-container`
- **Port:** 3000
- **URL:** http://localhost:3000
- **Type:** Fullstack (React + Express + tRPC)

### 2. **Inbox Orchestrator** (API Service)

- **Container:** `inbox-orchestrator-container`
- **Port:** 3011
- **URL:** http://localhost:3011
- **Type:** Express API Microservice

### 3. **MySQL** (Friday AI Database)

- **Container:** `friday-ai-db`
- **Port:** 3306
- **Database:** `friday_ai`

### 4. **PostgreSQL** (Metrics Database)

- **Container:** `friday-postgres`
- **Port:** 5432
- **Database:** `friday_ai_metrics`

### 5. **Redis** (Cache - Optional)

- **Container:** `friday-redis`
- **Port:** 6379

### 6. **Adminer** (Database Admin UI)

- **Container:** `friday-adminer`
- **Port:** 8080
- **URL:** http://localhost:8080

---

## 🚀 Quick Start

### Start Alle Containers

```powershell
cd C:\Users\empir\Tekup\services\tekup-ai-v2
docker-compose up -d
```

### Tjek Status

```powershell
docker-compose ps
# Eller
docker ps
```

### Se Logs

```powershell
# Friday AI
docker-compose logs -f friday-ai

# Inbox Orchestrator
docker-compose logs -f inbox-orchestrator

# Alle logs
docker-compose logs -f
```

### Stop Alle Containers

```powershell
docker-compose down
```

### Stop og Fjern Volumes (Clear Data)

```powershell
docker-compose down -v
```

---

## 🔧 Container Management

### Rebuild Container (efter kodeændringer)

```powershell
# Rebuild Friday AI
docker-compose build friday-ai
docker-compose up -d friday-ai

# Rebuild Inbox Orchestrator
docker-compose build inbox-orchestrator
docker-compose up -d inbox-orchestrator

# Rebuild alle
docker-compose build
docker-compose up -d
```

### Restart Container

```powershell
docker-compose restart friday-ai
docker-compose restart inbox-orchestrator
```

### Exec into Container (Debug)

```powershell
# Friday AI container
docker exec -it friday-ai-container sh

# Database container
docker exec -it friday-ai-db mysql -u friday_user -p friday_ai
```

---

## 🌐 Access URLs

| Service                | URL                          | Description       |
| ---------------------- | ---------------------------- | ----------------- |
| **Friday AI**          | http://localhost:3000        | Main application  |
| **Inbox Orchestrator** | http://localhost:3011        | API service       |
| **Inbox Health**       | http://localhost:3011/health | Health check      |
| **Adminer**            | http://localhost:8080        | Database admin UI |

---

## 💾 Database Access

### MySQL (Friday AI)

```powershell
# Via Adminer
URL: http://localhost:8080
System: MySQL
Server: db
Username: friday_user
Password: friday_password
Database: friday_ai

# Via Command Line
docker exec -it friday-ai-db mysql -u friday_user -pfriday_password friday_ai
```

### PostgreSQL (Metrics)

```powershell
# Via Command Line
docker exec -it friday-postgres psql -U postgres -d friday_ai_metrics
```

---

## 🔑 Environment Variables

Alle environment variables er sat i `docker-compose.yml` og læses fra `.env` filen:

```bash
# Friday AI
DATABASE_URL=mysql://friday_user:friday_password@db:3306/friday_ai
JWT_SECRET=your-secret
GOOGLE_SERVICE_ACCOUNT_KEY={...}
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
GOOGLE_CALENDAR_ID=...
BILLY_API_KEY=...
BILLY_ORGANIZATION_ID=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...

# Inbox Orchestrator
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/friday_ai_metrics
GOOGLE_MCP_URL=...
```

---

## 🏗️ Build Process

### Friday AI Container

```dockerfile
1. Install pnpm
2. Copy package.json + patches
3. Install dependencies
4. Copy source code
5. Build (vite + esbuild)
6. Start (pnpm start)
```

### Inbox Orchestrator Container

```dockerfile
1. Copy package.json
2. Install dependencies (production only)
3. Copy dist folder
4. Start (npm start)
```

---

## ✅ Health Checks

Alle containere har health checks:

```yaml
# Friday AI
healthcheck:
  test: node health check
  interval: 30s
  start_period: 40s

# Inbox Orchestrator
healthcheck:
  test: /health endpoint
  interval: 30s
  start_period: 10s

# MySQL
healthcheck:
  test: mysqladmin ping
  interval: 10s

# PostgreSQL
healthcheck:
  test: pg_isready
  interval: 10s
```

---

## 📊 Container Status

Tjek status med:

```powershell
docker-compose ps
```

Output viser:

- Container navn
- Status (Up, Restarting, etc.)
- Health status
- Ports

---

## 🔍 Troubleshooting

### Container starter ikke?

```powershell
# Se logs
docker-compose logs friday-ai

# Tjek om port er optaget
Get-NetTCPConnection -LocalPort 3000

# Restart container
docker-compose restart friday-ai
```

### Database connection fejl?

```powershell
# Tjek database container
docker-compose logs db

# Tjek database health
docker-compose exec db mysqladmin ping -h localhost -u root -p
```

### Rebuild nødvendig?

```powershell
# Efter kodeændringer
docker-compose build --no-cache friday-ai
docker-compose up -d friday-ai
```

---

## 🎯 Development Workflow

### Local Development (Hot Reload)

```powershell
# Start lokalt (ikke i container)
pnpm dev
```

### Production Testing (Container)

```powershell
# Build og start
docker-compose up -d --build

# Se logs
docker-compose logs -f
```

---

## 📝 Notes

- **Alle services** kører i separate containere
- **Networks** - Alle i samme `tekup-network`
- **Volumes** - Persistent data for databases
- **Health checks** - Automatisk restart ved fejl
- **Environment** - Læst fra `.env` fil

---

**Status:** ✅ **ALL SERVICES CONTAINERIZED**
**Ready:** ✅ **PRODUCTION READY**
