# Docker Development Environment for Tekup 🐳

Komplet Docker-baseret udviklingmiljø for Tekup monorepo med hot-reload, databaser, monitoring og udviklerværktøjer.

## 🎯 Oversigt

Dette udviklingmiljø indeholder:
- **Database Services**: PostgreSQL med flere databaser, Redis caching
- **Application Services**: Unified Platform, CRM Web, AgentScope, Flow API/Web, Voice Agent
- **Development Tools**: pgAdmin, Redis Commander, MailHog til email testing
- **Monitoring Stack**: Prometheus, Grafana, Elasticsearch, Kibana
- **Networking**: nginx reverse proxy med SSL support

## 🚀 Hurtig Start

### Forudsætninger
- Docker Desktop installeret og kørende
- Git og pnpm installeret
- Minimum 8GB RAM anbefales (16GB optimalt)

### 1. Start Udviklingmiljøet

```powershell
# Start alle services (anbefalet første gang)
.\scripts\dev-start.ps1

# Alternativt: Start kun essentielle services
.\scripts\dev-start.ps1 -Quick

# Start kun infrastruktur (databaser, etc.)
.\scripts\dev-start.ps1 -Services

# Start kun applikationer
.\scripts\dev-start.ps1 -Apps

# Start kun monitoring stack
.\scripts\dev-start.ps1 -Monitoring
```

### 2. Verificer at Alt Kører

```powershell
# Check status på alle services
.\scripts\dev-status.ps1

# Check health af alle endpoints
.\scripts\dev-status.ps1 -Health

# Se resource forbrug
.\scripts\dev-status.ps1 -Resources
```

### 3. Setup Databaser

```bash
# Kør database migrations
pnpm --filter tekup-unified-platform run db:migrate

# Seed development data
pnpm --filter tekup-unified-platform run db:seed

# Verificer database forbindelse
.\scripts\dev-status.ps1 -Health
```

## 📊 Service URLs

### 🌐 Hovedapplikationer
- **Tekup CRM Web**: http://localhost/crm
- **Tekup Unified API**: http://localhost:3000
- **AgentScope Backend**: http://localhost:8001
- **Flow API (Legacy)**: http://localhost:4000
- **Voice Agent**: http://localhost:3002

### 🛠️ Udviklerværktøjer
- **pgAdmin**: http://localhost:5050 (admin@tekup.dk / tekup_pgadmin_2024)
- **Redis Commander**: http://localhost:8081 (admin / tekup_redis_ui_2024)
- **MailHog**: http://localhost:8025 (email testing)

### 📊 Monitoring & Analytics
- **Grafana**: http://localhost:3333 (admin / tekup_grafana_2024)
- **Prometheus**: http://localhost:9090
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

## 🏗️ Arkitektur

### Database Setup
```
postgres (PostgreSQL 15)
├── tekup_dev (main database)
├── tekup_unified (Unified Platform)
├── tekup_crm (CRM data)
├── tekup_flow (Flow automation)
├── tekup_leads (Lead management)
└── tekup_test (Testing)
```

### Service Dependencies
```
nginx (reverse proxy)
├── tekup-crm-web (Next.js frontend)
├── tekup-unified-platform (NestJS API)
│   ├── postgres (database)
│   └── redis (caching)
├── agentscope-enhanced (Python FastAPI)
└── monitoring services
```

### Volume Management
```
Persistent Data:
├── postgres_dev_data (database data)
├── redis_dev_data (Redis persistence)
├── grafana_dev_data (dashboards)
└── prometheus_dev_data (metrics)

Development Caches:
├── tekup_node_modules
├── tekup_crm_web_node_modules
├── flow_api_node_modules
└── [other app caches]
```

## 🔧 Management Scripts

### Start/Stop Environment

```powershell
# Start entire environment
.\scripts\dev-start.ps1

# Start with different options
.\scripts\dev-start.ps1 -Quick       # Essential only
.\scripts\dev-start.ps1 -Services    # Infrastructure
.\scripts\dev-start.ps1 -Apps        # Applications
.\scripts\dev-start.ps1 -Monitoring  # Monitoring stack

# Stop environment
.\scripts\dev-stop.ps1

# Stop and clean up
.\scripts\dev-stop.ps1 -Clean

# Stop and remove all data (WARNING!)
.\scripts\dev-stop.ps1 -Volumes
```

### Logs & Monitoring

```powershell
# View all logs
.\scripts\dev-logs.ps1

# Follow logs in real-time
.\scripts\dev-logs.ps1 -Follow

# View specific service logs
.\scripts\dev-logs.ps1 tekup-unified-platform
.\scripts\dev-logs.ps1 postgres -Follow

# Show last 100 lines
.\scripts\dev-logs.ps1 -Tail -Lines 100

# Check environment status
.\scripts\dev-status.ps1
.\scripts\dev-status.ps1 -Health
.\scripts\dev-status.ps1 -Resources
```

## 🔐 Environment Configuration

### Environment Variables

Alle environment variables er defineret i `.env.dev` filen:

```bash
# Database
DATABASE_URL=postgresql://postgres:tekup_dev_2024@postgres:5432/tekup_unified
REDIS_URL=redis://:tekup_redis_2024@redis:6379

# AI Configuration (tilføj dine egne API nøgler)
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Development settings
NODE_ENV=development
DEBUG=true
ENABLE_AI_FEATURES=true
```

### Passwords & Credentials

**Database:**
- PostgreSQL: `postgres` / `tekup_dev_2024`
- Redis: `tekup_redis_2024`

**Development Tools:**
- pgAdmin: `admin@tekup.dk` / `tekup_pgadmin_2024`
- Grafana: `admin` / `tekup_grafana_2024`
- Redis Commander: `admin` / `tekup_redis_ui_2024`

## 🔄 Development Workflow

### 1. Daglig Workflow

```powershell
# Morgen - start environment
.\scripts\dev-start.ps1 -Quick

# Check at alt kører
.\scripts\dev-status.ps1

# Arbejd på koden (hot-reload er aktivt)
# ...

# Aften - stop environment
.\scripts\dev-stop.ps1
```

### 2. Database Changes

```bash
# Lav ændringer i Prisma schema
# apps/tekup-unified-platform/prisma/schema.prisma

# Generate migration
pnpm --filter tekup-unified-platform run db:migrate:dev

# Hvis du bruger Docker database
docker exec tekup-unified-platform-dev pnpm prisma migrate dev
```

### 3. Service Development

```bash
# Connect til running container for debugging
docker exec -it tekup-unified-platform-dev bash

# Install nye dependencies
docker exec tekup-unified-platform-dev pnpm add [package]

# Rebuild service efter større ændringer
docker-compose -f docker-compose.dev.yml build tekup-unified-platform
docker-compose -f docker-compose.dev.yml up -d tekup-unified-platform
```

### 4. Performance Optimization

```powershell
# Check resource usage
.\scripts\dev-status.ps1 -Resources

# Clean up unused resources
docker system prune -f

# Remove unused volumes (careful!)
docker volume prune -f
```

## 🚨 Troubleshooting

### Almindelige Problemer

**Port conflicts:**
```bash
# Check hvad der bruger port 3000
netstat -ano | findstr :3000

# Stop konfliktende services
.\scripts\dev-stop.ps1
```

**Database connection issues:**
```bash
# Reset database
docker-compose -f docker-compose.dev.yml restart postgres
docker exec tekup-postgres-dev pg_isready -U postgres
```

**Out of disk space:**
```bash
# Clean Docker system
docker system prune -a -f
docker volume prune -f

# Check disk usage
docker system df
```

**Container won't start:**
```powershell
# Check detailed logs
.\scripts\dev-logs.ps1 [service-name]

# Rebuild container
docker-compose -f docker-compose.dev.yml build [service-name]
docker-compose -f docker-compose.dev.yml up -d [service-name]
```

### Health Check Failures

```bash
# Manual health checks
curl http://localhost:3000/health
curl http://localhost:8001/health

# Database connectivity
docker exec tekup-postgres-dev pg_isready -U postgres
docker exec tekup-redis-dev redis-cli ping
```

### Performance Issues

```bash
# Increase Docker resources in Docker Desktop
# - Memory: 8GB minimum (16GB recommended)
# - CPU: 4 cores minimum
# - Disk: 50GB available

# Check container resources
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🔧 Customization

### Adding New Services

1. **Add to docker-compose.dev.yml:**
```yaml
new-service:
  build:
    context: .
    dockerfile: docker/app/Dockerfile.dev
    args:
      APP_NAME: new-service
  volumes:
    - ./apps/new-service:/app/apps/new-service
  environment:
    - NODE_ENV=development
  ports:
    - "3010:3010"
  networks:
    - tekup-dev
```

2. **Update scripts:**
- Add to service groups in `dev-start.ps1`
- Add health check in `dev-status.ps1`
- Add to nginx config if needed

### Environment Customization

```bash
# Copy and modify environment file
cp .env.dev .env.local

# Update docker-compose to use local env
docker-compose -f docker-compose.dev.yml --env-file .env.local up
```

## 📈 Monitoring & Metrics

### Grafana Dashboards

1. **Access Grafana**: http://localhost:3333
2. **Login**: admin / tekup_grafana_2024
3. **Import dashboards** fra `docker/grafana/dashboards/`

### Prometheus Metrics

1. **Access Prometheus**: http://localhost:9090
2. **Queries**:
   ```
   # Application metrics
   nodejs_heap_used_bytes
   http_requests_total
   
   # Database metrics  
   postgres_up
   redis_connected_clients
   
   # System metrics
   container_cpu_usage_seconds_total
   container_memory_usage_bytes
   ```

### Log Aggregation

1. **Elasticsearch**: http://localhost:9200
2. **Kibana**: http://localhost:5601
3. **View logs** i Kibana dashboard

## 🤝 Team Development

### Shared Development Environment

```bash
# Team members can use samme setup
git clone [repo]
cd tekup-org
.\scripts\dev-start.ps1

# Sync database schema
pnpm --filter tekup-unified-platform run db:migrate
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: Development Environment Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start Development Environment
        run: |
          ./scripts/dev-start.sh -Services
          sleep 30
      - name: Run Tests
        run: |
          pnpm test:ci
      - name: Cleanup
        run: |
          ./scripts/dev-stop.sh -Clean
```

## 📚 Referencer

- **Docker Compose**: [docs.docker.com](https://docs.docker.com/compose/)
- **PostgreSQL**: [postgresql.org](https://postgresql.org/docs/)
- **Redis**: [redis.io](https://redis.io/documentation)
- **Prometheus**: [prometheus.io](https://prometheus.io/docs/)
- **Grafana**: [grafana.com](https://grafana.com/docs/)

---

**🎉 Happy Development med Tekup Docker Environment! 🚀**

For spørgsmål eller problemer, check troubleshooting sektion eller kontakt development teamet.
