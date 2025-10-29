# Port Management & Conflict Resolution

## Status: âœ… PORTS FULLY CONFIGURABLE

### Current Implementation

All ports are configured via environment variables with safe defaults:

- **MCP Server**: PORT 3001 (env: MCP_PORT)
- **Dashboard**: PORT 3006 (env: DASHBOARD_PORT)
- **Chatbot**: PORT 3005 (env: CHATBOT_PORT)
- **Redis**: PORT 6379 (env: REDIS_PORT)
- **Nginx HTTP**: PORT 80 (env: NGINX_HTTP_PORT)
- **Nginx HTTPS**: PORT 443 (env: NGINX_HTTPS_PORT)

### How to Avoid Port Conflicts

#### Method 1: Use .env.ports File (RECOMMENDED)

\\\ash

# 1. Copy template

cp .env.ports.example .env.ports

# 2. Edit ports (example for development)

cat > .env.ports << 'EOF'
MCP_PORT=4001
DASHBOARD_PORT=3010
CHATBOT_PORT=3011
REDIS_PORT=6380
NGINX_HTTP_PORT=8080
NGINX_HTTPS_PORT=8443
EOF

# 3. Check for conflicts before starting

powershell -File scripts/check-ports.ps1

# 4. Load and start

docker-compose --env-file .env.ports up
\\\

#### Method 2: Environment Variables

\\\ash

# Windows PowerShell

\ = '4001'
\ = '3010'
\ = '3011'

# Start containers

docker-compose up
\\\

#### Method 3: Docker Compose Override

\\\ash

# Create override file

cp docker-compose.override.yml.example docker-compose.override.yml

# Edit as needed

# Edit docker-compose.override.yml with custom ports

# Start with override

docker-compose up
\\\

### Checking Port Conflicts

#### PowerShell (Windows)

\\\powershell

# Check if port is available

Test-NetConnection -ComputerName 127.0.0.1 -Port 3001

# Check all configured ports

powershell -File scripts/check-ports.ps1
\\\

#### Command Line (Windows)

\\\cmd

# Find process using port

netstat -ano | findstr :3001

# Kill process

taskkill /PID <PID> /F
\\\

#### Linux/macOS

\\\ash

# Find process

lsof -i :3001
netstat -tlnp | grep 3001

# Kill process

kill -9 <PID>
\\\

### Integration Points

1. **src/config.ts**: Loads and validates all port variables
2. **docker-compose.yml**: Uses \ syntax for flexibility
3. **scripts/check-ports.ps1**: Validates all ports are available
4. **package.json**: npm scripts for port management

### Security Considerations

- Ports 80/443 require admin/sudo privileges
- Use ports 8080/8443 for development without sudo
- Nginx reverse proxy adds SSL termination layer
- Internal container communication uses service names (not localhost)

### Multi-Instance Deployment

To run multiple instances:

\\\ash

# Instance 1 - Development

.env.ports:
MCP_PORT=4001
DASHBOARD_PORT=3010
CHATBOT_PORT=3011

docker-compose --env-file .env.ports up

# Instance 2 - Testing (different terminal)

.env.test:
MCP_PORT=5001
DASHBOARD_PORT=5006
CHATBOT_PORT=5005

docker-compose --env-file .env.test up
\\\

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Run port check script, change port |
| Containers can't reach each other | Use service names, not localhost |
| External can't reach app | Check firewall, Nginx ports (80/443) |
| Forgot which ports are used | Run \
pm run check:ports\ |
| Need to change ports at runtime | Edit .env.ports, rebuild, restart |
