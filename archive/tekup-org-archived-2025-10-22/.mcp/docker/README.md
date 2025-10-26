# TekUp MCP Docker Architecture

## Oversigt

Dette dokument beskriver TekUp's Docker-baserede MCP (Model Context Protocol) arkitektur, der containeriserer alle MCP servere for bedre isolering, skalering og fejlhåndtering.

## Hvorfor Docker?

### 🔒 **Isolering & Sikkerhed**
- Hver MCP server kører i sin egen container med begrænsede ressourcer
- Sandboxing af potentielt usikker kode
- Netværkssegmentering mellem servere
- Automatisk cleanup ved crash eller timeout

### 🚀 **Skalering & Performance** 
- Automatisk load balancing mellem container instanser
- Horizontal skalering baseret på belastning
- Resource limits (CPU, memory) per service
- Health checks og automatic restart

### 🔧 **Operationel Excellens**
- Konsistente environments (dev/staging/prod)
- Standardiseret deployment pipeline
- Centraliseret logging og monitoring
- Versioneret container images

### 🏗️ **Development Experience**
- Hot-reload i development
- Isoleret testing af individuelle servere
- Nem tilføjelse af nye MCP servere
- Docker Compose orchestration

## Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    TekUp MCP Gateway                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Load Balancer│  │   API Gateway  │  │  Config Mgmt  │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼────┐         ┌──────▼──────┐      ┌──────▼──────┐
│Browser │         │ Filesystem  │      │  Search     │
│MCP     │         │ MCP         │      │  MCP        │
│Service │         │ Service     │      │  Service    │
└────────┘         └─────────────┘      └─────────────┘

    Docker Network: tekup-mcp-network
```

## Container Struktur

### 1. **MCP Gateway Container**
- **Image**: `tekup/mcp-gateway:latest`
- **Port**: `3000`
- **Rolle**: Central gateway og load balancer
- **Config**: Environment-aware konfiguration

### 2. **Browser MCP Service**
- **Image**: `tekup/mcp-browser:latest`
- **Port**: `3001`
- **Capabilities**: Browser automation, screenshot, scraping
- **Resources**: 2GB RAM, 1 CPU core

### 3. **Filesystem MCP Service** 
- **Image**: `tekup/mcp-filesystem:latest`
- **Port**: `3002`
- **Capabilities**: File operations, directory scanning
- **Volumes**: Bind mounts til arbejdsdirektories

### 4. **Search MCP Service**
- **Image**: `tekup/mcp-search:latest`
- **Port**: `3003`
- **Capabilities**: Code search, semantic search
- **Resources**: 1GB RAM, 0.5 CPU core

## Konfiguration

### Environment Variables

```bash
# Global MCP Configuration
MCP_ENV=development
MCP_LOG_LEVEL=debug
MCP_GATEWAY_PORT=3000

# Service Discovery
MCP_SERVICES_BROWSER_URL=http://mcp-browser:3001
MCP_SERVICES_FILESYSTEM_URL=http://mcp-filesystem:3002
MCP_SERVICES_SEARCH_URL=http://mcp-search:3003

# Resource Limits
MCP_BROWSER_MEMORY=2g
MCP_BROWSER_CPUS=1.0
MCP_FILESYSTEM_MEMORY=512m
MCP_FILESYSTEM_CPUS=0.5

# Security
MCP_ENABLE_SANDBOX=true
MCP_NETWORK_ISOLATION=true
MCP_API_KEY_ENCRYPTION=true
```

### Docker Compose Struktur

```yaml
# Produktionsmiljø: docker-compose.prod.yml
# Staging miljø: docker-compose.staging.yml  
# Development miljø: docker-compose.dev.yml
```

## Service Health & Monitoring

### Health Checks
Alle containere har built-in health checks:
- `/health` endpoint på hver service
- Automatisk restart ved failures
- Graceful shutdown med cleanup

### Logging & Metrics
- Struktureret JSON logging
- Centraliseret log aggregation
- Prometheus metrics export
- Jaeger distributed tracing

### Alerting
- Container restart alerts
- Resource usage warnings
- Service response time monitoring
- Error rate thresholds

## Development Workflow

```bash
# Start alle MCP services
docker-compose -f .mcp/docker/docker-compose.dev.yml up -d

# Se service status
docker-compose ps

# View logs fra specific service
docker-compose logs -f mcp-browser

# Rebuild efter kode ændringer
docker-compose build mcp-browser
docker-compose restart mcp-browser

# Skalér services under test
docker-compose up -d --scale mcp-browser=3
```

## Deployment Pipeline

### 1. **Build Stage**
```bash
# Build alle container images
docker build -t tekup/mcp-gateway:${VERSION} .mcp/docker/gateway/
docker build -t tekup/mcp-browser:${VERSION} .mcp/docker/browser/
docker build -t tekup/mcp-filesystem:${VERSION} .mcp/docker/filesystem/
docker build -t tekup/mcp-search:${VERSION} .mcp/docker/search/
```

### 2. **Test Stage**
```bash
# Integration tests mod containerized services
npm run test:integration:docker
```

### 3. **Deploy Stage**
```bash
# Deploy til staging
docker-compose -f .mcp/docker/docker-compose.staging.yml up -d

# Blue-green deployment til production
docker-compose -f .mcp/docker/docker-compose.prod.yml up -d
```

## Migration Fra Existing Setup

### Phase 1: Containerize Individual Services
1. ✅ Browser MCP → Docker container
2. ✅ Filesystem MCP → Docker container  
3. ✅ Search MCP → Docker container
4. ✅ Gateway service → Docker container

### Phase 2: Service Discovery
1. Implement service registry
2. Dynamic configuration loading
3. Health check integration
4. Load balancing setup

### Phase 3: Production Rollout
1. Canary deployment
2. Traffic shifting
3. Monitoring & alerting
4. Performance optimization

## Security Considerations

### Container Security
- Non-root user execution
- Read-only filesystems hvor muligt
- Minimal base images (Alpine/Distroless)
- Regular security scanning

### Network Security
- Internal Docker network isolation
- TLS mellem services i production
- API gateway authentication
- Rate limiting per client

### Resource Security
- Memory og CPU limits
- Disk space quotas
- Network bandwidth limits
- Process limits

## Backup & Disaster Recovery

### Configuration Backup
- Git-based konfiguration (Infrastructure as Code)
- Automated configuration versioning
- Rollback capabilities

### Data Backup
- Volume snapshots for persistent data
- Log retention policies
- Metrics retention

### Recovery Procedures
- Automated failover
- Multi-region deployment capability
- Data replication strategies

## Performance Optimizations

### Container Optimizations
- Multi-stage builds for smaller images
- Layer caching optimization
- Resource request/limit tuning
- JIT compilation pre-warming

### Network Optimizations
- HTTP/2 between services
- gRPC for high-performance communication
- Connection pooling
- Request/response caching

### Storage Optimizations
- Efficient volume mounts
- Temporary file cleanup
- Log rotation
- Cache volume optimization

## Next Steps

1. **Implement Gateway Service** - Central API gateway og load balancer
2. **Containerize Existing MCP Servers** - Migrer nuværende implementeringer
3. **Setup Service Discovery** - Dynamic service registration
4. **Implement Health Checks** - Comprehensive monitoring
5. **Production Deployment** - Blue-green rollout strategy
