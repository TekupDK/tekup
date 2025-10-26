# CLI Control Guide - TekUp AI Assistant

## Overview

All TekUp AI components can be controlled directly from the command line, allowing you to:
- Start/stop/monitor services from PowerShell or terminal
- View logs and status in real-time
- Integrate with your IDE and development workflow
- Automate routine tasks

---

## Stack Components

| Component | Port | Command | Purpose |
|-----------|------|---------|---------|
| **Ollama** | 11434 | `ollama serve` | Local AI model server |
| **Open WebUI** | 3000 | `docker start open-webui` | Web chat interface |
| **Docker** | - | `docker` | Container management |

---

## Quick Start

### 1. Start Ollama Server

```powershell
# Windows (PowerShell)
ollama serve

# Or use Windows terminal with Ollama auto-start
```

**Expected output:**
```
Listening on 127.0.0.1:11434
```

### 2. Start Open WebUI Container

```powershell
./scripts/manage-docker.ps1 -Action start
```

**Expected output:**
```
════════════════════════════════════════
  Starting Docker Container: open-webui
════════════════════════════════════════
✓ Container started successfully
```

### 3. Open Web Interface

Visit: http://localhost:3000

---

## Docker Management Scripts

### Monitor Entire Stack

```powershell
./scripts/monitor-stack.ps1
```

Shows status of:
- Ollama server
- Open WebUI web interface
- Docker container

### Manage Open WebUI Container

#### Start Container
```powershell
./scripts/manage-docker.ps1 -Action start
```

#### Stop Container
```powershell
./scripts/manage-docker.ps1 -Action stop
```

#### View Container Status
```powershell
./scripts/manage-docker.ps1 -Action status
```

#### View Container Logs
```powershell
./scripts/manage-docker.ps1 -Action logs
```

Last 50 lines of container output.

#### Check Health Status
```powershell
./scripts/manage-docker.ps1 -Action health
```

Returns: `starting`, `healthy`, or `unhealthy`

#### Remove Container
```powershell
./scripts/manage-docker.ps1 -Action remove
```

**Warning:** This deletes the container (data is preserved in volumes)

---

## Alternative: Docker Compose

You can also use docker-compose for centralized management:

### Start with docker-compose
```powershell
docker-compose -f configs/open-webui/docker-compose.yml up -d
```

### Stop with docker-compose
```powershell
docker-compose -f configs/open-webui/docker-compose.yml down
```

### View logs
```powershell
docker-compose -f configs/open-webui/docker-compose.yml logs -f
```

---

## Direct Docker Commands

If you prefer raw Docker commands:

### Start container
```powershell
docker start open-webui
```

### Stop container
```powershell
docker stop open-webui
```

### View running containers
```powershell
docker ps
```

### View all containers (including stopped)
```powershell
docker ps -a
```

### View container logs
```powershell
docker logs open-webui
```

### Follow logs in real-time
```powershell
docker logs -f open-webui
```

### View container resource usage
```powershell
docker stats open-webui
```

---

## Ollama Commands

### Start Ollama Server
```powershell
ollama serve
```

### List available models
```powershell
ollama list
```

### Check model details
```powershell
curl http://localhost:11434/api/tags
```

### Pull a new model
```powershell
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
```

### Remove a model
```powershell
ollama rm model-name
```

---

## API Endpoints

### Ollama API

**List all models:**
```bash
curl http://localhost:11434/api/tags
```

**Response:**
```json
{
  "models": [
    {
      "name": "qwen2.5-coder:14b-instruct-q4_K_M",
      "size": 8589934592,
      "modified_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Open WebUI API

**Health check:**
```bash
curl http://localhost:3000
```

---

## Troubleshooting

### Open WebUI not responding

1. Check Docker status:
```powershell
./scripts/monitor-stack.ps1
```

2. View logs:
```powershell
./scripts/manage-docker.ps1 -Action logs
```

3. Restart container:
```powershell
./scripts/manage-docker.ps1 -Action stop
./scripts/manage-docker.ps1 -Action start
```

### Ollama not responding

1. Check Ollama is running:
```powershell
curl http://localhost:11434/api/tags
```

2. Start Ollama if needed:
```powershell
ollama serve
```

### Port 3000 already in use

```powershell
# Find process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Stop the process or use a different port
# Update docker-compose.yml to use different port (e.g., 3001)
```

### Container unhealthy

Wait a few moments, then check:
```powershell
./scripts/manage-docker.ps1 -Action health
```

If it persists:
```powershell
./scripts/manage-docker.ps1 -Action logs
```

---

## IDE Integration

### Visual Studio Code

Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start TekUp Stack",
      "type": "shell",
      "command": "powershell",
      "args": ["-Command", "./scripts/monitor-stack.ps1"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Monitor Stack",
      "type": "shell",
      "command": "powershell",
      "args": ["-Command", "./scripts/monitor-stack.ps1; Read-Host 'Press Enter to continue'"],
      "group": "build"
    }
  ]
}
```

Then use: `Ctrl+Shift+B` to run tasks

### PowerShell Alias

Add to your PowerShell profile:
```powershell
# In $PROFILE file
Set-Alias -Name tekup-start -Value "C:\path\to\tekup-ai-assistant\scripts\manage-docker.ps1"
Set-Alias -Name tekup-monitor -Value "C:\path\to\tekup-ai-assistant\scripts\monitor-stack.ps1"
```

Then use:
```powershell
tekup-start -Action start
tekup-monitor
```

---

## Next Steps

1. **Create admin account** at http://localhost:3000
2. **Connect to Ollama** in Settings → Models
3. **Load models** in Open WebUI
4. **Start chatting** with local AI!

For more details, see:
- [SETUP.md](../SETUP.md) - Installation guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System overview
