# TekUp API Health Check Endpoints

## Standardized Health Check Endpoints

All TekUp APIs now support the following standardized health check endpoints:

### Core Health Endpoints

#### `GET /health`
**Comprehensive system health check**
- **Query Parameters:** 
  - `detailed=true` - Include detailed system information
- **Response Codes:**
  - `200` - System is healthy or degraded
  - `503` - System is unhealthy
- **Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "service": "Flow API",
  "dependencies": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metrics": {
    "memoryUsage": {...},
    "cpuUsage": {...}
  }
}
```

#### `GET /health/ready`
**Kubernetes readiness probe**
- Determines if the service can handle traffic
- **Response Codes:** `200` (ready) or `503` (not ready)

#### `GET /health/live`
**Kubernetes liveness probe**
- Determines if the service is alive and should not be restarted
- **Response Codes:** `200` (alive) or `503` (not responding)

#### `GET /health/dependencies`
**Individual dependency health status**
- Returns detailed status of all service dependencies
- **Response Code:** `200`

#### `GET /health/metrics`
**System performance metrics**
- Returns current system performance metrics
- **Response Code:** `200`

---

## Service-Specific Health Endpoints

### VoiceDK API (Port 4003)

**Base URL:** `http://localhost:4003`

**Standard Endpoints:** All endpoints above
**Dependencies Monitored:**
- PostgreSQL Database (TypeORM)
- Redis Cache
- Google Speech API
- OpenAI API
- Stripe API

### MCP Studio Backend (Port 4004)

**Base URL:** `http://localhost:4004`

**Standard Endpoints:** All endpoints above
**Service-Specific Endpoints:**
- `GET /health/mcp-studio` - MCP Studio specific health with Docker daemon status
- `GET /health/docker` - Docker daemon health check

**Dependencies Monitored:**
- PostgreSQL Database (Prisma)
- Docker Daemon
- Recent MCP Server Activity

### Flow API (Port 4000)

**Base URL:** `http://localhost:4000`

**Standard Endpoints:** All endpoints above (already implemented)
**Additional Endpoints:**
- `GET /health/database` - Database-specific health
- `GET /health/cache` - Redis cache health
- `GET /health/external` - External services health

**Dependencies Monitored:**
- PostgreSQL Database (Prisma)
- Redis Cache
- IMAP Workers
- Compliance Services
- External API endpoints

### TekUp CRM API (Port 4001)

**Base URL:** `http://localhost:4001`

**Current Endpoints:**
- `GET /health` - Basic health check (will be enhanced)

### Lead Platform API (Port 4002)

**Base URL:** `http://localhost:4002`

**Current Endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies (will be enhanced)

---

## Monitoring Dashboard

**URL:** `http://localhost:3100`

### Features:
- **Real-time Health Monitoring**: Updates every 30 seconds
- **Visual Health Status**: Color-coded status indicators
- **System Overview**: Aggregate health statistics
- **Health Trends**: Historical health data charts
- **Alerts Panel**: Service failure notifications
- **Service Cards**: Individual service health details

### Dashboard Sections:
1. **System Overview**: Overall health statistics and critical service monitoring
2. **Health Trends**: Time-series charts showing health status over time
3. **Service Grid**: Individual health cards for each API service
4. **Alerts Panel**: Active alerts and service failure notifications

---

## Health Status Levels

| Status | Description | HTTP Code |
|--------|-------------|-----------|
| `healthy` | All dependencies are working normally | 200 |
| `degraded` | Some non-critical dependencies are having issues | 200 |
| `unhealthy` | Critical dependencies are failing | 503 |
| `unknown` | Unable to determine health status | 503 |

---

## Usage Examples

### Check Flow API Health
```bash
curl http://localhost:4000/health?detailed=true
```

### Check VoiceDK API Readiness
```bash
curl http://localhost:4003/health/ready
```

### Monitor MCP Studio Docker Status
```bash
curl http://localhost:4004/health/docker
```

### Access Monitoring Dashboard
Open browser to: `http://localhost:3100`

---

## Integration Notes

- All health endpoints support CORS for dashboard integration
- Responses are cached for 30 seconds to prevent overwhelming services
- Health checks include timeout handling (10 seconds max)
- Failed health checks are logged with detailed error information
- Critical services failure triggers system-wide unhealthy status
