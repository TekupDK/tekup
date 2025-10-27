# Docker Guide - Tekup Cloud Dashboard

## 🐳 Local Docker Setup

### Prerequisites

- Docker Desktop installed and running
- Port 8080 available (or change in docker-compose.yml)
- **Tekup Secrets** configured (see Configuration section below)

### Quick Start

#### Option 1: Using docker-compose (Recommended)

```powershell
# From apps/web/tekup-cloud-dashboard directory

# Step 1: Sync Supabase credentials from tekup-secrets
cd ..\..\..
cd tekup-secrets
.\scripts\sync-to-project.ps1 -Project "tekup-cloud-dashboard" -Environment "development"

# Step 2: Return to dashboard directory and start Docker
cd ..\apps\web\tekup-cloud-dashboard
Copy-Item .env.docker .env -Force  # Docker-compose reads .env by default
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Option 2: Using Docker directly

```powershell
# Build image with build arguments
docker build \
  --build-arg VITE_SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your_anon_key_here \
  -t tekup-cloud-dashboard .

# Run container
docker run -d -p 8080:80 --name tekup-dashboard tekup-cloud-dashboard

# View logs
docker logs -f tekup-dashboard

# Stop
docker stop tekup-dashboard
docker rm tekup-dashboard
```

### Access Dashboard

- **URL:** http://localhost:8080
- **Login:** Use Supabase credentials (synced from tekup-secrets)
- **Demo Mode:** Click "Continue in Demo Mode" if you want to test without login
- **Health check:** http://localhost:8080 (nginx will return 200 OK)

---

## ⚙️ Configuration

### Tekup Secrets Integration (Recommended)

This project uses **centralized secret management** via `tekup-secrets` repository:

```powershell
# 1. Navigate to tekup-secrets
cd C:\Users\empir\Tekup\tekup-secrets

# 2. Sync credentials to Cloud Dashboard
.\scripts\sync-to-project.ps1 -Project "tekup-cloud-dashboard" -Environment "development"

# 3. Return to dashboard and copy for Docker
cd ..\apps\web\tekup-cloud-dashboard
Copy-Item .env.docker .env -Force

# 4. Rebuild Docker with new credentials
docker-compose up -d --build
```

**What gets synced:**

- ✅ Supabase URL and ANON key from `tekup-secrets/config/databases.env`
- ✅ All shared configuration from `.env.shared`
- ✅ Environment-specific secrets from `.env.development`

**File structure after sync:**

```
tekup-cloud-dashboard/
├── .env               # Complete environment (229 lines) - used by Docker build
├── .env.docker        # Docker-specific (clean, 9 lines) - template
└── .env.backup        # Auto-generated full backup
```

### Manual Configuration (Not Recommended)

If you cannot use tekup-secrets, manually edit `.env.docker`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# App Configuration
VITE_APP_NAME=Tekup Cloud Dashboard
VITE_ENVIRONMENT=production
```

Then reference it in docker-compose.yml:

```yaml
services:
  tekup-dashboard:
    env_file:
      - .env
```

### Custom Port

Change port in `docker-compose.yml`:

```yaml
ports:
  - "3000:80" # Use port 3000 instead of 8080
```

---

## 🔍 Troubleshooting

### Container won't start

```powershell
# Check logs
docker-compose logs

# Check if port is in use
netstat -ano | findstr :8080

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Build fails

```powershell
# Check Docker is running
docker info

# Check available disk space
docker system df

# Clean up old images
docker system prune -a
```

### Can't access dashboard

```powershell
# Check container is running
docker ps

# Check container health
docker inspect tekup-dashboard | findstr Health

# Test nginx inside container
docker exec tekup-dashboard wget -O- http://localhost
```

---

## 🚀 Production Deployment

### Build for production

```powershell
# Build optimized image
docker build --target builder -t tekup-dashboard:latest .

# Tag for registry
docker tag tekup-dashboard:latest your-registry/tekup-dashboard:latest

# Push to registry
docker push your-registry/tekup-dashboard:latest
```

### Docker Compose Production

```yaml
version: "3.8"
services:
  tekup-dashboard:
    image: your-registry/tekup-dashboard:latest
    restart: always
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
```

---

## 📊 Monitoring

### View logs

```powershell
# Follow logs
docker-compose logs -f tekup-dashboard

# Last 100 lines
docker-compose logs --tail=100 tekup-dashboard
```

### Container stats

```powershell
# Real-time stats
docker stats tekup-dashboard

# Inspect container
docker inspect tekup-dashboard
```

### Health check

```powershell
# Manual health check
docker exec tekup-dashboard wget --spider http://localhost/

# View health status
docker inspect --format='{{json .State.Health}}' tekup-dashboard
```

---

## 🔧 Development with Docker

### Mount source code for development

```yaml
services:
  tekup-dashboard:
    volumes:
      - ./src:/app/src # Mount source code
      - ./public:/app/public
```

### Run development server in Docker

```powershell
# Override command
docker-compose run --rm --service-ports tekup-dashboard npm run dev
```

---

## 📝 Multi-stage Build Explanation

1. **Builder Stage**

   - Uses Node.js 18 Alpine (lightweight)
   - Installs dependencies
   - Builds production bundle

2. **Production Stage**
   - Uses Nginx Alpine (minimal image)
   - Copies built files from builder
   - Serves static files efficiently

**Result:** Small final image (~50MB vs ~1GB with Node)

---

## 🌐 Integration with Other Tekup Services

### Connect to other containers

```yaml
networks:
  tekup-network:
    external: true

services:
  tekup-dashboard:
    networks:
      - tekup-network
```

### Link with Tekup Billy MCP

```yaml
services:
  tekup-dashboard:
    depends_on:
      - tekup-billy
    environment:
      - VITE_BILLY_API_URL=http://tekup-billy:3000
```

---

## ✅ Best Practices

1. **Use .dockerignore** - Exclude unnecessary files
2. **Multi-stage builds** - Keep final image small
3. **Health checks** - Enable automatic restarts
4. **Environment variables** - Never hardcode secrets
5. **Volume mounts** - Persist data if needed
6. **Network isolation** - Use Docker networks
7. **Resource limits** - Set memory/CPU limits in production

---

## 🆘 Support

For issues:

1. Check container logs: `docker-compose logs`
2. Verify environment variables
3. Test build locally: `npm run build`
4. Check DEPLOYMENT.md for production setup
