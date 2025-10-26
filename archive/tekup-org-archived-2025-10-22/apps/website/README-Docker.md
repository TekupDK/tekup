# Tekup Website - Docker Development Setup

## 🚀 Quick Start

The Tekup website is now fully containerized for development. You can run it in Docker while keeping your terminal free for other tasks.

### Prerequisites
- Docker Desktop installed and running
- PowerShell (Windows)

### Start the Website
```powershell
# Navigate to website directory
cd apps/website

# Start in detached mode
.\docker-up.ps1
```

The website will be available at: **http://localhost:8080**

### Useful Commands

#### View Container Status
```powershell
docker ps --filter "name=tekup-website-dev"
```

#### View Logs
```powershell
# Show recent logs
.\docker-logs.ps1

# Follow logs in real-time
.\docker-logs.ps1 -Follow

# Show last 100 lines
.\docker-logs.ps1 -Tail 100
```

#### Stop the Website
```powershell
.\docker-down.ps1
```

#### Access Container Shell
```powershell
.\docker-shell.ps1
```

### Manual Docker Commands

If you prefer manual Docker commands:

```powershell
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f website

# Stop and remove
docker-compose down

# Access shell
docker exec -it tekup-website-dev /bin/sh
```

## 🔧 Configuration

### Files Overview
- `Dockerfile` - Container definition with Node.js 20 Alpine
- `docker-compose.yml` - Service configuration with volume mounts
- `docker-*.ps1` - PowerShell helper scripts

### Volume Mounts
Hot-reloading is enabled through volume mounts:
- Source code (`./src`)
- Public assets (`./public`)
- Configuration files (`vite.config.ts`, `tailwind.config.ts`, etc.)

### Environment Variables
- `NODE_ENV=development`
- `VITE_API_URL=http://localhost:3000`
- `CHOKIDAR_USEPOLLING=true` (for file watching in containers)

## 🛠️ Development Workflow

1. **Start the container**: `.\docker-up.ps1`
2. **Make changes** to your source code
3. **See changes instantly** - hot-reload is enabled
4. **View logs** if needed: `.\docker-logs.ps1`
5. **Stop when done**: `.\docker-down.ps1`

## ✅ Benefits

- ✨ **Terminal stays free** - No blocking processes
- 🔄 **Hot-reloading works** - Changes reflected instantly
- 🐳 **Consistent environment** - Same setup across machines
- 🚀 **Quick start** - One command to run
- 📊 **Easy debugging** - Accessible logs and shell

## 🎯 Fixed Issues

- ✅ Fixed `createLogger` import errors from `@tekup/shared`
- ✅ Proper Tailwind CSS 4.1 support
- ✅ Vite development server configured for containers
- ✅ Health checks implemented
- ✅ Volume mounts for hot-reloading

## 🆘 Troubleshooting

### Container won't start
```powershell
# Check what went wrong
docker-compose logs website

# Rebuild from scratch
docker-compose down
docker-compose up --build -d
```

### Port already in use
```powershell
# Find what's using port 8080
netstat -ano | findstr :8080

# Stop conflicting processes or change port in docker-compose.yml
```

### Can't see changes
- Ensure volume mounts are correct
- Check that CHOKIDAR_USEPOLLING is enabled
- Try restarting the container

---

**Happy coding! 🎉**