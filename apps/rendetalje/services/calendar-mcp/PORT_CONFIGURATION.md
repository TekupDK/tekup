# ðŸ”Œ RenOS Calendar MCP - Port Configuration Guide

**Last Updated**: 22. Oktober 2025

## âœ… Port Configuration System

All ports are now **fully configurable** via environment variables. No more hardcoded ports!

### Default Port Mapping

| Service | Default Port | Environment Var | Purpose |
|---------|------------|------------------|---------|
| MCP Server | 3001 | MCP_PORT | Main API server |
| Dashboard | 3006 | DASHBOARD_PORT | Dashboard UI |
| Chatbot | 3005 | CHATBOT_PORT | Chatbot UI |
| Redis | 6379 | REDIS_PORT | Caching & sessions |
| Nginx HTTP | 80 | NGINX_HTTP_PORT | HTTP proxy |
| Nginx HTTPS | 443 | NGINX_HTTPS_PORT | HTTPS proxy |

## ðŸš€ Quick Start with Custom Ports

### 1ï¸âƒ£ Copy Port Configuration Template

\\\ash
cp .env.ports.example .env.ports
\\\

### 2ï¸âƒ£ Edit Port Configuration

\\\ash

# .env.ports - Change any ports you need

MCP_PORT=4001          # â† Change from 3001 to 4001
DASHBOARD_PORT=3010    # â† Change from 3006 to 3010
CHATBOT_PORT=3011      # â† Change from 3005 to 3011
REDIS_PORT=6380        # â† Change from 6379 to 6380
NGINX_HTTP_PORT=8080   # â† Change from 80 to 8080
NGINX_HTTPS_PORT=8443  # â† Change from 443 to 8443
\\\

### 3ï¸âƒ£ Load Config & Check for Conflicts

\\\ash

# Load environment

set -a
source .env.ports
set +a

# Check if ports are available

npm run check:ports

# Or manually with docker-compose

docker-compose up --check-ports
\\\

### 4ï¸âƒ£ Start with Docker Compose

\\\ash

# Start in background with automatic port check

npm run docker:up:detached

# Or foreground with logs

npm run docker:up

# View logs

npm run docker:logs
\\\

## ðŸŽ¯ Common Port Scenarios

### Development Environment (No Conflicts)

\\\env
MCP_PORT=4001
DASHBOARD_PORT=3010
CHATBOT_PORT=3011
REDIS_PORT=6380
NGINX_HTTP_PORT=8080
NGINX_HTTPS_PORT=8443
\\\

### Testing/CI Environment (Isolated)

\\\env
MCP_PORT=5001
DASHBOARD_PORT=5006
CHATBOT_PORT=5005
REDIS_PORT=6381
NGINX_HTTP_PORT=9080
NGINX_HTTPS_PORT=9443
\\\

### Production (Standard)

\\\env
MCP_PORT=3001
DASHBOARD_PORT=3006
CHATBOT_PORT=3005
REDIS_PORT=6379
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
\\\

## âš ï¸ Port Conflict Detection

### Check if Port is Available

\\\ash
npm run check:ports
\\\

Output examples:
\\\
âœ… Port 3001 (mcp) is available
âœ… Port 3006 (dashboard) is available
âœ… Port 3005 (chatbot) is available
âœ… Port 6379 (redis) is available
âœ… Port 80 (nginxHttp) is available
âœ… Port 443 (nginxHttps) is available

âœ… All ports are available! Ready to start.
\\\

If ports are in use:
\\\
âŒ Port 3001 (mcp) is IN USE
âŒ Port 3006 (dashboard) is IN USE

âŒ Found 2 port conflict(s):

- mcp: port 3001
- dashboard: port 3006

ðŸ’¡ Solution: Change ports in .env or .env.ports
\\\

## ðŸ”§ Linux/macOS

### Check which process uses a port

\\\ash

# Find process on port 3001

lsof -i :3001

# Or with netstat

netstat -tlnp | grep 3001
\\\

### Kill process

\\\ash
kill -9 <PID>
\\\

## ðŸªŸ Windows

### Check which process uses a port

\\\powershell
netstat -ano | findstr :3001
\\\

### Kill process

\\\powershell
taskkill /PID <PID> /F
\\\

## ðŸ“ Using Ports in Application Code

### Access Configured Ports

\\\ ypescript
import config from './config';

console.log('MCP Server running on port:', config.ports.mcp);
console.log('Dashboard running on port:', config.ports.dashboard);
console.log('Chatbot running on port:', config.ports.chatbot);
console.log('Redis running on port:', config.ports.redis);
console.log('Nginx HTTP on port:', config.ports.nginxHttp);
console.log('Nginx HTTPS on port:', config.ports.nginxHttps);
\\\

## ðŸ³ Docker Compose Usage

### Start with Custom Ports

\\\ash

# Via environment variables

MCP_PORT=4001 DASHBOARD_PORT=3010 CHATBOT_PORT=3011 docker-compose up

# Via .env file

docker-compose --env-file .env.ports up
\\\

### Scale Services (if not using fixed ports)

\\\ash

# Note: Fixed ports prevent scaling; use load balancer instead

docker-compose up --scale mcp-server=3
\\\

## âœ… Verification

After starting containers, verify ports:

\\\ash

# Check container status

docker-compose ps

# Check port mappings

docker-compose port mcp-server 3001
docker-compose port dashboard 3006
docker-compose port chatbot 3005

# Test connectivity

curl <http://localhost:MCP_PORT/health>
curl <http://localhost:DASHBOARD_PORT>
curl <http://localhost:CHATBOT_PORT>
\\\

## ðŸš¨ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in .env.ports or kill existing process |
| Containers can't communicate | Ensure all services use same docker network |
| External can't reach app | Check Nginx ports (80, 443) and firewall |
| Services timeout | Run port check:
pm run check:ports |
