# Rendetalje Inbox AI - Docker Setup

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose installed
- Google OAuth credentials configured in `.env` files

### 2. Environment Setup
Ensure these `.env` files exist with proper credentials:

**`services/google-mcp/.env`:**
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret  
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

**`services/tekup-ai/packages/inbox-orchestrator/.env`:**
```
GEMINI_API_KEY=your_gemini_key
GOOGLE_MCP_URL=http://google-mcp:3010
TEKUP_BILLY_URL=http://tekup-billy:3012
```

### 3. Build & Run
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Access Points
- **Tekup Cloud Dashboard**: http://localhost:3000
- **Rendetalje Inbox**: http://localhost:3000/rendetalje/inbox
- **Google MCP API**: http://localhost:3010
- **Inbox Orchestrator**: http://localhost:3011

### 5. Development Mode
```bash
# Use development overrides (hot reload)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### 6. Health Checks
```bash
# Check service health
docker-compose ps

# View specific service logs
docker-compose logs google-mcp
docker-compose logs inbox-orchestrator
docker-compose logs tekup-cloud-dashboard
```

### 7. Troubleshooting
```bash
# Rebuild specific service
docker-compose build google-mcp

# Restart specific service
docker-compose restart google-mcp

# View service status
docker-compose ps
```

## Services Architecture

- **google-mcp**: Gmail & Calendar API integration
- **inbox-orchestrator**: AI routing and policy enforcement
- **tekup-cloud-dashboard**: Frontend UI interface

All services communicate through the `rendetalje-network` Docker network.
