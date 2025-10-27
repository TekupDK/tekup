# 🚀 Tekup MCP Servers - Quick Start Guide

**Start alle dine MCP servere i Docker på 5 minutter!**

---

## ⚡ TL;DR - Hurtig Start

```bash
cd C:\Users\empir\Tekup\tekup-mcp-servers
cp .env.example .env
# Rediger .env med dine credentials
docker-compose up -d
docker-compose ps
```

---

## 📋 Detaljeret Guide

### Step 1: Naviger til mappen

```bash
cd C:\Users\empir\Tekup\tekup-mcp-servers
```

### Step 2: Opret .env fil

```bash
# Kopier template
cp .env.example .env

# Åbn i editor (vælg én)
notepad .env
code .env
nano .env
```

### Step 3: Udfyld credentials i .env

Rediger `.env` filen med dine rigtige værdier:

```env
# MCP SERVER PORTS (lad være som de er)
KNOWLEDGE_MCP_PORT=8051
CODE_INTELLIGENCE_PORT=8052
DATABASE_MCP_PORT=8053
BILLY_MCP_PORT=8054
CALENDAR_MCP_PORT=8055
GMAIL_MCP_PORT=8056
VAULT_MCP_PORT=8057

# SUPABASE (udfyld fra https://supabase.com/dashboard)
SUPABASE_URL=https://uagsdymcvdwcgfvqbtwj.supabase.co
SUPABASE_ANON_KEY=din-anon-key-her
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key-her

# BILLY.DK (udfyld fra https://app.billy.dk/settings/api)
BILLY_API_KEY=din-billy-api-key
BILLY_ORGANIZATION_ID=din-org-id

# GOOGLE CALENDAR (valgfrit - kun hvis du bruger calendar-mcp)
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account",...}
CALENDAR_ID=primary
CALENDAR_TIMEZONE=Europe/Copenhagen

# LOGGING (lad være som det er)
LOG_LEVEL=info
NODE_ENV=production
```

**💡 TIP:** Brug dine nye roterede credentials fra Windows Environment Variables!

### Step 4: Build og start containers

```bash
# Build alle images (første gang - tager 2-5 min)
docker-compose build

# Start alle servere i background
docker-compose up -d

# Eller start med logs synlige
docker-compose up
```

### Step 5: Verificer at alt kører

```bash
# Check status (skal vise "Up" for alle)
docker-compose ps

# Output skal ligne:
# NAME                      STATUS
# tekup-knowledge-mcp       Up (healthy)
# tekup-code-intelligence-mcp   Up (healthy)
# tekup-database-mcp        Up (healthy)
# tekup-billy-mcp           Up (healthy)
# tekup-calendar-mcp        Up (healthy)
```

### Step 6: Test en MCP server

```bash
# Test knowledge MCP
curl http://localhost:8051/health

# Skal returnere: {"status":"ok"}

# Test code intelligence MCP
curl http://localhost:8052/health

# Test database MCP
curl http://localhost:8053/health
```

---

## 🔍 Debugging

### Se logs

```bash
# Alle servere
docker-compose logs -f

# Én specifik server
docker-compose logs -f knowledge-mcp

# Sidste 50 linjer
docker-compose logs --tail=50 code-intelligence-mcp
```

### Genstart en service

```bash
# Genstart én
docker-compose restart knowledge-mcp

# Genstart alle
docker-compose restart
```

### Stop og slet alt

```bash
# Stop containers (bevarer data)
docker-compose down

# Stop og slet volumes (fjerner alt data!)
docker-compose down -v
```

### Container crashed?

```bash
# Check hvad der skete
docker-compose logs knowledge-mcp

# Rebuild og genstart
docker-compose build knowledge-mcp
docker-compose up -d knowledge-mcp
```

---

## 🧪 Test med Claude Code

### Step 1: Verificer containers kører

```bash
docker-compose ps
```

Alle skal vise `Up (healthy)`.

### Step 2: Genstart Claude Code eller VSCode

Luk og genåbn editor for at loade den nye `.claude/mcp.json` config.

### Step 3: Test MCP servere

Åbn Claude Code og prøv:

**Test Knowledge MCP:**
```
Search for "Docker deployment" in documentation
```

**Test Code Intelligence MCP:**
```
Find all React components in the codebase
```

**Test Database MCP:**
```
Show me all tables in Supabase
```

Hvis de virker, ser du resultater! 🎉

---

## ⚙️ Advanced

### Udvikling med hot-reload

```bash
# Start én service i dev mode
docker-compose run --rm -p 8051:8050 knowledge-mcp npm run dev
```

### Exec ind i container

```bash
# Åbn shell i container
docker exec -it tekup-knowledge-mcp sh

# Kør kommandoer
node dist/index.js --help
```

### Build kun én service

```bash
# Build kun knowledge MCP
docker-compose build knowledge-mcp
docker-compose up -d knowledge-mcp
```

### Resource limits

Tilføj i `docker-compose.yml` under hver service:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

---

## 🔧 Troubleshooting

### Port allerede i brug

```bash
# Find hvilken proces bruger porten
netstat -ano | findstr :8051

# Dræb processen (erstat <PID>)
taskkill /PID <PID> /F

# Eller skift port i .env
KNOWLEDGE_MCP_PORT=9051
```

### Docker daemon not running

```bash
# Windows: Start Docker Desktop
# Eller fra CMD som admin:
net start com.docker.service
```

### Permission denied (Linux/Mac)

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up -d
```

### Build fejler

```bash
# Ryd Docker cache
docker system prune -a

# Rebuild fra scratch
docker-compose build --no-cache
docker-compose up -d
```

### Container genstartes hele tiden

```bash
# Check logs for fejl
docker-compose logs knowledge-mcp

# Tjek health status
docker inspect tekup-knowledge-mcp | grep -A 10 Health
```

---

## 📊 Monitoring

### Resource usage

```bash
# Live stats
docker stats

# Specifik container
docker stats tekup-knowledge-mcp
```

### Disk space

```bash
# Se hvor meget Docker bruger
docker system df

# Cleanup unused data
docker system prune
```

---

## 🚀 Production Deployment

### Deploy til Render.com

```bash
# Opret render.yaml i root
services:
  - type: docker
    name: tekup-knowledge-mcp
    dockerfilePath: ./packages/knowledge-mcp/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
```

### Deploy til Railway

```bash
railway up
```

### Deploy til fly.io

```bash
fly deploy
```

---

## 💡 Tips

1. **Udvikling:** Brug `docker-compose logs -f` i ét terminal vindue
2. **Hot reload:** Mount din `src/` folder som volume under udvikling
3. **Environment:** Hold `.env` opdateret men ALDRIG commit den!
4. **Backup:** Tag backup af volumes: `docker run --rm -v tekup-mcp_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data`
5. **Health checks:** Tjek http://localhost:8051/health regelmæssigt

---

## 🆘 Hjælp

**Virker det ikke?**

1. Check Docker kører: `docker ps`
2. Check logs: `docker-compose logs -f`
3. Rebuild: `docker-compose build --no-cache`
4. Genstart: `docker-compose down && docker-compose up -d`

**Stadig problemer?**

- Se [README.md](./README.md) for fuld dokumentation
- Check [GitHub Issues](https://github.com/TekupDK/tekup/issues)

---

🎉 **Færdig! Dine MCP servere kører nu i Docker!**
