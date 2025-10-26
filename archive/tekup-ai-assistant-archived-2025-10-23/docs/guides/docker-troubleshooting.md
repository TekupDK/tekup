# Docker Troubleshooting Guide - TekUp AI Assistant

## Common Issues & Solutions

---

## 1. Docker Daemon Not Running

### Symptoms:
```
docker: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping": 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

### Solutions:

#### Option A: Start Docker Desktop

```powershell
# Open Docker Desktop application
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for daemon to start
Start-Sleep -Seconds 15

# Verify it's running
docker ps
```

#### Option B: Check if already running

```powershell
# Check running processes
tasklist | findstr docker

# Should show: Docker.exe, DockerD.exe
```

#### Option C: Restart Docker Service

```powershell
# Stop Docker
taskkill /F /IM docker.exe
taskkill /F /IM dockerd.exe

# Wait a moment
Start-Sleep -Seconds 5

# Start again
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 20
```

### Prevention:
Add Docker Desktop to Windows startup:
1. Open Settings
2. Apps → Startup
3. Toggle Docker Desktop ON

---

## 2. Port 3000 Already in Use

### Symptoms:
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: 
listen tcp 0.0.0.0:3000: bind: An attempt was made to use a port in an illegal way.
```

### Find Process Using Port

```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
  Select-Object OwningProcess, State | 
  ForEach-Object { Get-Process -Id $_.OwningProcess }
```

### Solutions:

#### Option A: Kill the Process

```powershell
# Find PID
$pid = (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill it
taskkill /PID $pid /F
```

#### Option B: Use Different Port

Edit `configs/open-webui/docker-compose.yml`:
```yaml
services:
  open-webui:
    ports:
      - "3001:8080"  # Changed from 3000:8080
```

Then start:
```powershell
docker-compose -f configs/open-webui/docker-compose.yml up -d
```

Access on: http://localhost:3001

#### Option C: Restart Everything

```powershell
# Stop all containers
docker stop $(docker ps -q)

# Wait a moment
Start-Sleep -Seconds 5

# Start Open WebUI
./scripts/manage-docker.ps1 -Action start
```

---

## 3. Open WebUI Container Won't Start

### Symptoms:
- Container exits immediately
- Status shows "unhealthy"
- Log shows errors

### Debug Steps:

```powershell
# Check container status
docker ps -a | findstr open-webui

# View logs
./scripts/manage-docker.ps1 -Action logs

# Or raw Docker logs
docker logs open-webui --tail 50

# Watch real-time logs
docker logs -f open-webui
```

### Common Log Errors:

#### Memory Issues
```
Out of memory
Process exited with status code 1
```

**Solution:** Increase Docker memory allocation
1. Docker Desktop → Settings → Resources
2. Set Memory to 8GB or higher

#### Permission Denied
```
Permission denied while trying to connect to Docker daemon
```

**Solution:** 
```powershell
# Run PowerShell as Administrator
# Then retry command
```

#### Image Not Found
```
docker: Error response from daemon: manifest not found
```

**Solution:** Pull image again
```powershell
docker pull ghcr.io/open-webui/open-webui:latest

# Then start
./scripts/manage-docker.ps1 -Action start
```

---

## 4. Container Unhealthy

### Symptoms:
```
Status: Up 2 minutes (unhealthy)
```

### Debug:

```powershell
# Check health status
docker inspect open-webui --format='{{.State.Health.Status}}'

# Should be: starting, healthy, or unhealthy
```

### Solutions:

#### Wait for Startup
Container typically takes 20-30 seconds to be healthy:
```powershell
# Wait then check
Start-Sleep -Seconds 30
./scripts/monitor-stack.ps1
```

#### Restart Container
```powershell
./scripts/manage-docker.ps1 -Action stop
Start-Sleep -Seconds 5
./scripts/manage-docker.ps1 -Action start
Start-Sleep -Seconds 30
./scripts/monitor-stack.ps1
```

#### Check Dependencies
```powershell
# Verify Ollama is running
./scripts/monitor-stack.ps1

# Ollama must be running for Open WebUI health check to pass
```

---

## 5. Can't Access http://localhost:3000

### Symptoms:
- Browser shows "Connection refused"
- "Unable to reach server"

### Debug:

```powershell
# 1. Check container is running
docker ps | findstr open-webui

# 2. Check port mapping
netstat -an | findstr 3000

# Should show: LISTENING on 0.0.0.0:3000

# 3. Check health
./scripts/manage-docker.ps1 -Action health

# 4. Try curl
curl http://localhost:3000

# 5. View logs
./scripts/manage-docker.ps1 -Action logs
```

### Solutions:

#### Restart Container
```powershell
./scripts/manage-docker.ps1 -Action stop
Start-Sleep -Seconds 5
./scripts/manage-docker.ps1 -Action start
Start-Sleep -Seconds 15

# Try again
Start-Process "http://localhost:3000"
```

#### Check Firewall
Windows Firewall might block localhost access:

1. Settings → Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find Docker Desktop
4. Check "Private" and "Public"

#### Try Different Port
```powershell
# Edit docker-compose.yml
# Change port from 3000 to 3001

docker-compose -f configs/open-webui/docker-compose.yml down
docker-compose -f configs/open-webui/docker-compose.yml up -d

# Visit http://localhost:3001
```

---

## 6. Ollama Connection Failed

### Symptoms:
- Open WebUI shows "Cannot connect to Ollama"
- Models list is empty
- Connection error in logs

### Debug:

```powershell
# 1. Check Ollama is running
ollama list

# 2. Check Ollama API
curl http://localhost:11434/api/tags

# 3. Inside container, can it reach host?
docker exec -it open-webui curl http://host.docker.internal:11434/api/tags
```

### Solutions:

#### Start Ollama if Stopped
```powershell
ollama serve
```

#### Verify Connection String
In Open WebUI Settings → Models:
- **Must be:** `http://host.docker.internal:11434` (for Docker on Windows)
- **NOT:** `http://localhost:11434` (that's the container's localhost)

#### Firewall Block
```powershell
# Allow Ollama through firewall
netsh advfirewall firewall add rule name="Ollama" dir=in action=allow program="C:\Users\empir\AppData\Local\Programs\Ollama\ollama.exe" enable=yes
```

#### DNS/Network Issue
```powershell
# Test connectivity from container
docker exec -it open-webui ping host.docker.internal

# Should show responses
```

---

## 7. Models Not Loading in Open WebUI

### Symptoms:
- Connected to Ollama but models list is empty
- Model selector shows nothing
- Error loading models

### Debug:

```powershell
# 1. Check models exist in Ollama
ollama list

# 2. Check API returns models
curl http://localhost:11434/api/tags | ConvertFrom-Json

# 3. Check Open WebUI logs
./scripts/manage-docker.ps1 -Action logs | findstr -i model

# 4. Test from container
docker exec -it open-webui curl http://host.docker.internal:11434/api/tags
```

### Solutions:

#### Download Missing Models
```powershell
# If Ollama list shows empty, download models
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
ollama pull llama3.3:8b-instruct-q5_K_M
ollama pull mistral:7b-instruct-q4_K_M

# Verify
ollama list
```

#### Reconnect in Open WebUI
1. Open WebUI Settings → Models
2. Test connection: Should show "✓ Connected"
3. If not, remove connection and re-add:
   - `http://host.docker.internal:11434`
4. Refresh page (F5)
5. Models should appear

#### Check Model Compatibility
Not all quantized models work. If model doesn't load:
```powershell
# Download different quantization
ollama pull qwen2.5-coder:14b-instruct-q5_K_S

# Retry in Open WebUI
```

---

## 8. High Memory Usage / Container Crashes

### Symptoms:
- Container keeps crashing
- "Out of Memory" in logs
- System becomes unresponsive

### Debug:

```powershell
# Check container memory usage
docker stats open-webui --no-stream

# Check system memory
Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory

# View logs
./scripts/manage-docker.ps1 -Action logs | tail -20
```

### Solutions:

#### Limit Container Memory
Edit `configs/open-webui/docker-compose.yml`:
```yaml
services:
  open-webui:
    deploy:
      resources:
        limits:
          memory: 4G  # Limit to 4GB
```

Then restart:
```powershell
docker-compose -f configs/open-webui/docker-compose.yml restart
```

#### Free System Memory
```powershell
# Check what's using memory
Get-Process | Sort-Object WorkingSet -Descending | Select-Object Name, WorkingSet -First 10

# Close unnecessary applications
```

#### Reduce Model Size
Use smaller quantization (faster download, less memory):
```powershell
# Instead of Q5, use Q4
ollama pull qwen2.5-coder:14b-instruct-q4_K_M

# Instead of 14B, use 7B
ollama pull mistral:7b-instruct-q4_K_M
```

---

## 9. Docker Takes Too Long to Start

### Symptoms:
- `docker ps` hangs
- Scripts timeout
- "Waiting for Docker daemon..."

### Solutions:

#### Restart Docker Desktop
```powershell
# Close Docker completely
taskkill /F /IM docker.exe
taskkill /F /IM dockerd.exe
taskkill /F /IM Docker Desktop.exe

# Wait
Start-Sleep -Seconds 10

# Start again
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Monitor startup
Start-Sleep -Seconds 20
docker ps
```

#### Check Docker Desktop Logs
1. Docker Desktop → Settings
2. Go to "General" section
3. Check if there are startup errors

#### Disable WSL2 Integration (if issues persist)
1. Docker Desktop → Settings → Resources
2. Uncheck "Use the WSL 2 based engine"
3. Restart

---

## 10. Permission Denied Errors

### Symptoms:
```
open /var/run/docker.sock: permission denied
```

### Solutions:

#### Run as Administrator
```powershell
# Right-click PowerShell → "Run as Administrator"
# Then run docker commands
```

#### Add User to Docker Group (Linux only)
Not applicable on Windows, but if running WSL2:
```bash
sudo usermod -aG docker $USER
```

---

## 11. Container Port Binding Fails on Restart

### Symptoms:
```
Error: port is already allocated
```

### Solutions:

#### Full Reset
```powershell
# Stop everything
docker stop open-webui
docker rm open-webui

# Wait
Start-Sleep -Seconds 5

# Restart
./scripts/manage-docker.ps1 -Action start
```

#### Alternative Port
```powershell
# Recreate with different port
docker rm open-webui
docker run -d -p 3001:8080 `
  --add-host=host.docker.internal:host-gateway `
  --name open-webui `
  ghcr.io/open-webui/open-webui:latest
```

---

## 12. Network Issues (Behind Corporate Firewall)

### Symptoms:
- Can't pull Docker images
- Can't access external APIs
- Timeout errors

### Solutions:

#### Configure Docker Proxy
Edit Docker daemon config at:
```
C:\Users\empir\AppData\Docker\daemon.json
```

Add:
```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.company.com:8080",
      "httpsProxy": "https://proxy.company.com:8080",
      "noProxy": "localhost,127.0.0.1,host.docker.internal"
    }
  }
}
```

Restart Docker Desktop.

#### Use VPN/Proxy Outside Network
If at home/public network:
- Most issues resolved automatically
- Ensure firewall allows port 3000

---

## Useful Diagnostic Commands

### Quick Health Check
```powershell
./scripts/monitor-stack.ps1
```

### Full System Status
```powershell
# Docker status
docker ps -a

# Running containers with stats
docker stats

# Container details
docker inspect open-webui

# Network check
docker network ls

# Volume check
docker volume ls
```

### Logs Analysis
```powershell
# Last 50 lines
docker logs open-webui --tail 50

# Real-time follow
docker logs -f open-webui

# Since specific time
docker logs --since 10m open-webui
```

### System Information
```powershell
# Docker version
docker version

# Docker system info
docker system info

# Disk usage
docker system df
```

---

## When All Else Fails

### Complete Reset
```powershell
# 1. Stop everything
docker stop open-webui 2>$null
docker rm open-webui 2>$null

# 2. Restart Docker
taskkill /F /IM docker.exe 2>$null
Start-Sleep -Seconds 10

# 3. Restart Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30

# 4. Verify Docker is working
docker ps

# 5. Run setup script
./scripts/setup-open-webui.ps1
```

### Docker Desktop Factory Reset
1. Docker Desktop → Settings → General
2. Click "Reset" button
3. Click "Reset Docker Desktop to factory defaults"
4. Confirm
5. Restart computer

---

## Getting Help

If issues persist:

1. **Check logs:** `./scripts/manage-docker.ps1 -Action logs`
2. **Check status:** `./scripts/monitor-stack.ps1`
3. **Try restart:** `./scripts/manage-docker.ps1 -Action stop/start`
4. **Check documentation:** See [CLI Control Guide](cli-control.md)
5. **Search:** GitHub issues at https://github.com/open-webui/open-webui/issues

---

**Last Updated:** 2025-01-15  
**For:** TekUp AI Assistant on Windows 11
