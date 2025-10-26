# Docker Development Environment

This guide explains how to set up and use the Docker development environment for the TekUp monorepo.

## Prerequisites

- Docker Desktop (latest version)
- At least 8GB RAM allocated to Docker
- Windows: Enable WSL2 and Developer Mode
- macOS/Linux: Docker should work out of the box

## Quick Start

### Windows
```bash
./docker-dev.bat
```

### Linux/macOS
```bash
./docker-dev.sh
```

This will:
- Check Docker installation
- Set up environment files
- Build all services
- Start the development environment
- Display service URLs and useful commands

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Website | http://localhost:5173 | Public website (Vite) |
| Flow Web | http://localhost:3000 | Main web application (Next.js) |
| Voice Agent | http://localhost:3001 | Voice agent interface (Next.js) |
| Agents Hub | http://localhost:3002 | Agents management (Next.js) |
| Flow API | http://localhost:4000 | Backend API (NestJS) |
| Secure Platform | http://localhost:4010 | Security backend (NestJS) |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Session store |

## Development Tools

Enable development tools by running:
```bash
docker compose --profile tools up -d
```

| Tool | URL | Description |
|------|-----|-------------|
| pgAdmin | http://localhost:5050 | PostgreSQL admin interface |
| Redis Commander | http://localhost:8081 | Redis management interface |

## Useful Commands

### Basic Operations
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Rebuild a service
docker compose up --build [service-name]
```

### Development Workflow
```bash
# View all running services
docker compose ps

# Execute commands in a running container
docker compose exec [service-name] sh

# View service logs
docker compose logs [service-name]

# Clean restart (removes containers and volumes)
docker compose down -v && docker compose up -d
```

### Database Operations
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U tekup -d tekup_dev

# Reset database
docker compose down -v && docker compose up -d postgres

# Run Prisma migrations
docker compose exec flow-api pnpm prisma migrate dev
```

### Troubleshooting

#### Services won't start
```bash
# Check service logs
docker compose logs [service-name]

# Check service health
docker compose ps

# Restart with verbose logging
docker compose up --build --force-recreate
```

#### Node modules issues
```bash
# Clean node_modules and reinstall
docker compose exec [service-name] rm -rf node_modules
docker compose exec [service-name] pnpm install

# Or rebuild the service
docker compose up --build [service-name]
```

#### Port conflicts
```bash
# Check what's using the port
netstat -tulpn | grep :[port]

# Or on Windows
netstat -ano | findstr :[port]
```

#### Performance issues
```bash
# Increase Docker memory allocation
# Docker Desktop > Settings > Resources > Memory

# Clean Docker system
docker system prune -f

# Use development overrides for better performance
# Edit docker-compose.override.yml
```

## Architecture

### Multi-stage Dockerfiles
- `Dockerfile`: Production builds with multi-stage optimization
- `Dockerfile.dev`: Development builds with hot reload
- `Dockerfile.base`: Shared base configuration

### Volume Mounting
Development containers use volume mounts for:
- Hot reload of source code
- Persistent node_modules caching
- Shared package dependencies

### Health Checks
All services include health checks for:
- Database connectivity
- API availability
- Service dependencies

## Environment Variables

### Auto-generated
The system automatically generates `.env` files for each app using `scripts/env-auto.mjs`.

### Manual Configuration
Override in `docker-compose.override.yml` (gitignored):
```yaml
services:
  flow-api:
    environment:
      - DEBUG=*
      - LOG_LEVEL=debug
```

## Production Deployment

For production, use the optimized Dockerfiles:
```bash
# Build production images
docker build -f apps/flow-api/Dockerfile -t tekup/flow-api:latest .

# Use production docker-compose
docker compose -f docker-compose.prod.yml up -d
```

### Images & Tags
Recommended tagging strategy:
```
tekup/flow-api:<git-sha>
tekup/flow-web:<git-sha>
tekup/secure-platform:<git-sha>
```
Promote by re-tagging to :staging then :prod after validation.

### Production Compose Highlights (`docker-compose.prod.yml`)
- Minimal services (no dev volumes, no hot reload)
- Health checks for core services
- Environment variable overrides via standard shell env or `.env` file
- Replace image names using variables: `FLOW_API_IMAGE`, `FLOW_WEB_IMAGE`, `SECURE_PLATFORM_IMAGE`

### Updating Images
```
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## CI Integration

A lightweight smoke test pipeline (`.github/workflows/docker-smoke.yml`) builds core images and verifies the `flow-api` health endpoint.

### Smoke Workflow Steps
1. Build optimized images (flow API, web, secure platform)
2. Generate a temporary compose referencing local tags
3. Start infra + `flow-api`
4. Poll `/health` until success or timeout
5. Output a truncated health response
6. Tear down

Extend by adding quick DB migrations:
```
docker compose -f docker-compose.smoke.yml exec flow-api pnpm prisma migrate deploy
```

## Health Endpoint Standardization
Current endpoints:
- `flow-api`: `/health`
- `secure-platform`: `/health`

Planned standard (optional):
- Liveness: `/health/live`
- Readiness: `/health/ready`
Add alias routes to maintain backward compatibility.

## Best Practices

1. **Use the scripts**: Always use `docker-dev.sh`/`docker-dev.bat` to start
2. **Check logs**: Use `docker compose logs -f` for debugging
3. **Clean rebuild**: Use `docker compose down && docker system prune -f` for clean state
4. **Volume management**: Use named volumes for persistent data
5. **Resource allocation**: Ensure Docker has adequate resources
6. **Network isolation**: Services communicate via Docker networks

## Common Issues & Solutions

### pnpm install hangs
- **Cause**: Network timeouts or lock file corruption
- **Solution**:
  ```bash
  docker compose exec [service-name] rm pnpm-lock.yaml
  docker compose exec [service-name] pnpm install
  ```

### Port already in use
- **Cause**: Another process using the port
- **Solution**: Change port in `docker-compose.yml` or stop conflicting service

### Database connection fails
- **Cause**: PostgreSQL not ready
- **Solution**: Wait for health check or restart database service

### Hot reload not working
- **Cause**: Volume mount issues
- **Solution**: Rebuild service with `docker compose up --build [service-name]`

## Contributing

When adding new services:
1. Create `Dockerfile.dev` in the app directory
2. Add service to `docker-compose.yml`
3. Update this README
4. Test with `docker compose up --build`

## Support

For issues:
1. Check `docker compose logs`
2. Verify Docker resources
3. Try clean rebuild
4. Check GitHub issues
