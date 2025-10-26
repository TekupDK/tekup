# Jarvis AgentScope Enhanced Server Manager

![Jarvis Server Manager](https://img.shields.io/badge/Jarvis-Server%20Manager-blue?style=for-the-badge&logo=python)
![AgentScope](https://img.shields.io/badge/AgentScope-Enhanced-green?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.13+-yellow?style=for-the-badge&logo=python)

En avanceret Python terminal script til håndtering af AgentScope Enhanced Backend serveren med omfattende logging, overvågning og kontrolfunktioner.

## 🚀 Funktioner

- **🖥️ Interaktiv terminal interface** - Kommando-baseret styring med farvet output
- **⚡ Server livscyklus management** - Start, stop, genstart med graceful shutdown
- **📊 Real-time status overvågning** - Live monitoring med CPU, memory og connection metrics
- **🔧 Konfigurationsstyring** - Automatisk indlæsning af .env filer
- **🛠️ API testing capabilities** - Automatisk test af alle endpoints inkl. WebSocket
- **📁 Omfattende logging** - Roterende log filer med struktureret formatting
- **🎯 Process management** - Intelligent process finding og cleanup

## 📋 Krav

### Python Dependencies
```bash
pip install fastapi uvicorn agentscope pydantic requests websocket-client psutil
```

### System krav
- Python 3.8+
- Windows/Linux/macOS
- Tilgang til port 8001 (standard)

## 🔧 Installation

1. **Kopier scriptet til AgentScope backend mappen:**
```bash
cp jarvis_server.py /path/to/agentscope-enhanced/
cd /path/to/agentscope-enhanced/
```

2. **Installer dependencies:**
```bash
pip install websocket-client psutil
```

3. **Sørg for at .env.local filen findes** med nødvendige API keys:
```env
OPENAI_API_KEY=your_api_key_here
NODE_ENV=development
```

## 🎮 Brug

### Kommando-baseret brug

#### Start server
```bash
# Start i forground med real-time output
python jarvis_server.py start

# Start i baggrund
python jarvis_server.py start --background

# Start med custom konfiguration
python jarvis_server.py start --host 127.0.0.1 --port 8002 --log-level debug
```

#### Server management
```bash
# Stop server gracefully
python jarvis_server.py stop

# Genstart server
python jarvis_server.py restart

# Vis detaljeret status
python jarvis_server.py status

# Test alle API endpoints
python jarvis_server.py test
```

#### Monitoring og debugging
```bash
# Live monitoring mode (opdateres hvert 5. sekund)
python jarvis_server.py monitor

# Vis configuration
python jarvis_server.py config

# Vis seneste logs
python jarvis_server.py logs
```

### Interaktiv mode

Start den interaktive terminal:
```bash
python jarvis_server.py interactive
# eller bare:
python jarvis_server.py
```

**Tilgængelige kommandoer i interaktiv mode:**

```
jarvis-server> help
```

| Kommando  | Beskrivelse                                  |
|-----------|---------------------------------------------|
| `start`   | Start AgentScope Enhanced Backend server    |
| `stop`    | Stop serveren gracefully                   |
| `restart` | Genstart serveren                          |
| `status`  | Vis detaljeret server status               |
| `config`  | Vis konfiguration og miljøvariabler        |
| `test`    | Test alle API endpoints                     |
| `monitor` | Live monitoring mode (Ctrl+C for at exit)  |
| `logs`    | Vis seneste logs                           |
| `help`    | Vis denne hjælp                           |
| `exit`    | Exit interaktiv mode                       |

## 🎨 Output eksempler

### Status visning
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Jarvis AgentScope Enhanced Server Manager                 ║
║                                                                              ║
║  🤖 Multi-Agent AI Platform with Real-time Steering                         ║
║  🧠 Jarvis Foundation Model Integration                                      ║
║  🚀 Danish Language & Business Intelligence Optimized                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Server Status:
==================================================
Status: RUNNING
Host: 0.0.0.0
Port: 8001
API Base: http://localhost:8001

Health Information:
Version: 1.0.0
Jarvis Model: jarvis-foundation-1.0
Active Sessions: 0
Active Tasks: 0
Timestamp: 2025-09-09T23:53:22.385684

Process Information:
PID: 38196
CPU Usage: 0.2%
Memory Usage: 125.4 MB
Started: 2025-09-09 23:49:28

Configuration:
Reload: True
Log Level: info
OpenAI API Key: test-key********elopment
```

### API Testing
```
[23:49:38] [TESTING] Testing API endpoints...
[23:49:40] [✓] Health endpoint working
[23:49:42] [✗] Jarvis generate failed: 500
[23:49:42] [INFO] This might be due to API key configuration
[23:49:44] [✓] WebSocket connection working
```

### Live Monitoring
```
Live Server Monitoring
==================================================
Time: 2025-09-09 23:51:52
Status: ONLINE
Active Sessions: 0
Active Tasks: 0
CPU: 0.1%
Memory: 127.8 MB
Connections: 2

Press Ctrl+C to exit monitoring
```

## 📁 Log filer

Scriptet opretter automatisk en `logs/` mappe med:

- **jarvis_server.log** - Hovedlog fil med roterende backup
- Maksimum 10MB per fil
- Op til 5 backup filer

Log niveau kan kontrolleres med `--log-level` parameter:
- `debug` - Detaljeret debugging information
- `info` - Standard informationsniveau
- `warning` - Kun advarsler og fejl
- `error` - Kun fejl

## 🔧 Konfiguration

### Environment variabler

Scriptet indlæser automatisk fra `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key  
NODE_ENV=development
```

### Kommando-linje parametre

```bash
python jarvis_server.py start \
  --host 0.0.0.0 \
  --port 8001 \
  --log-level info \
  --background \
  --no-reload
```

| Parameter      | Standard | Beskrivelse                    |
|---------------|----------|--------------------------------|
| `--host`      | 0.0.0.0  | Server host address           |
| `--port`      | 8001     | Server port nummer            |
| `--log-level` | info     | Log niveau (debug/info/warning/error) |
| `--background`| false    | Kør server i baggrund         |
| `--no-reload` | false    | Deaktiver auto-reload         |

## 🔍 Fejlfinding

### Server starter ikke

1. **Tjek dependencies:**
```bash
python -c "import fastapi, uvicorn, agentscope, pydantic, requests, websocket, psutil"
```

2. **Tjek port tilgængelighed:**
```bash
netstat -an | grep :8001  # Linux/Mac
netstat -an | findstr :8001  # Windows
```

3. **Tjek logs:**
```bash
python jarvis_server.py logs
```

### API endpoints fejler

1. **Tjek API keys i .env.local:**
```bash
python jarvis_server.py config
```

2. **Test individuelt endpoint:**
```bash
curl http://localhost:8001/health
```

3. **Tjek server logs for fejlmeddelelser**

### WebSocket connection fejl

1. **Firewall indstillinger** - Sørg for at port 8001 er åben
2. **Proxy indstillinger** - WebSocket forbindelser kan blive blokeret af proxies

## 🔄 Integration med eksisterende workflow

### Erstat direkte uvicorn kald

**Før:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Efter:**
```bash
python jarvis_server.py start
```

### Automatiseret deployment

```bash
#!/bin/bash
# deployment script
cd /path/to/agentscope-enhanced
python jarvis_server.py stop
git pull
python jarvis_server.py start --background
python jarvis_server.py test
```

### Docker integration

```dockerfile
# Dockerfile excerpt
COPY jarvis_server.py .
RUN pip install websocket-client psutil

# Start script
CMD ["python", "jarvis_server.py", "start"]
```

## 🛡️ Sikkerhed

### API Key håndtering
- API keys masked i logs og status output
- Environment variabler bruges konsistent
- Ingen hardcoded secrets

### Process management
- Graceful shutdown med cleanup
- Signal handling for SIGINT/SIGTERM
- Process isolation og fejlhåndtering

## 📈 Performance

### Resource monitoring
- CPU og memory usage tracking
- Connection count monitoring
- Real-time metrics i monitor mode

### Optimizations
- Lazy loading af dependencies
- Effektiv process discovery
- Minimal memory footprint

## 🤝 Bidrag

### Development setup
```bash
git clone [repo]
cd agentscope-enhanced
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install websocket-client psutil
```

### Testing
```bash
python jarvis_server.py test
python jarvis_server.py monitor  # Manual monitoring test
```

## 📄 Licens

Dette projekt er en del af Tekup 2.0 AgentScope integration.

---

## 🚨 Quick Start

```bash
# 1. Start serveren
python jarvis_server.py start --background

# 2. Test at alt virker
python jarvis_server.py test

# 3. Monitor live
python jarvis_server.py monitor

# 4. Stop når færdig
python jarvis_server.py stop
```

**For detaljeret hjælp og alle kommandoer:**
```bash
python jarvis_server.py --help
python jarvis_server.py interactive
jarvis-server> help
```
