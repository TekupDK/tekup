# Jarvis Frontend Manager

![Jarvis Frontend Manager](https://img.shields.io/badge/Jarvis-Frontend%20Manager-blue?style=for-the-badge&logo=next.js)
![Next.js](https://img.shields.io/badge/Next.js-15.5+-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.8+-yellow?style=for-the-badge&logo=python)

En avanceret Python terminal script til håndtering af Jarvis Next.js frontend applikationen med omfattende udviklings-workflow, build management og deployment funktioner.

## 🚀 Funktioner

- **🖥️ Interaktiv Next.js management** - Kommando-baseret styring med farvet output
- **⚡ Development & production server management** - Start, stop, restart med graceful shutdown
- **🔧 Build management** - Production builds med størrelse analyse og bundle optimization
- **📊 Real-time monitoring** - Live monitoring af servere og AgentScope backend integration
- **🛠️ Quality assurance** - ESLint, TypeScript checking og automated testing
- **🔧 Dependency management** - Automatisk håndtering af npm/yarn/pnpm dependencies
- **🤖 AgentScope integration testing** - HTTP API og WebSocket connectivity tests
- **📁 Omfattende logging** - Roterende log filer med struktureret formatting

## 📋 Krav

### System Dependencies
- **Node.js** 18+ (anbefalet 20+)
- **Package Manager**: npm (inkluderet med Node.js), yarn eller pnpm
- **Python** 3.8+ med følgende packages:

```bash
pip install requests psutil websocket-client
```

### Next.js Dependencies
Automatisk detekteret og installeret:
- Next.js 15.5+
- React 18+
- TypeScript
- Tailwind CSS 4.1+
- ESLint

## 🔧 Installation

1. **Sørg for at Node.js er installeret:**
```bash
# Download fra https://nodejs.org/ eller brug package manager
# Windows (Chocolatey):
choco install nodejs

# macOS (Homebrew):
brew install node

# Verify installation:
node --version
npm --version
```

2. **Installer Python dependencies:**
```bash
pip install requests psutil websocket-client
```

3. **Placer scriptet i Jarvis frontend mappen:**
```bash
# Script er placeret i apps/jarvis/jarvis_frontend.py
cd /path/to/apps/jarvis/
python jarvis_frontend.py status  # Test installation
```

4. **Sørg for at .env.local filen eksisterer** med nødvendige konfigurationer:
```env
# AgentScope Integration (Enhanced Backend på port 8001)
AGENTSCOPE_API_URL=http://localhost:8001
NEXT_PUBLIC_AGENTSCOPE_API_URL=http://localhost:8001
NEXT_PUBLIC_AGENTSCOPE_WS_URL=ws://localhost:8001

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
SPEECH_API_KEY=your_speech_api_key_here

# Jarvis Configuration
JARVIS_NAME="Jarvis AI Assistant"
JARVIS_VERSION="2.1.0"

# Features
NEXT_PUBLIC_VOICE_ENABLED=true
NEXT_PUBLIC_DANISH_SUPPORT=true
NEXT_PUBLIC_WEBSOCKET_ENABLED=true
NEXT_PUBLIC_REAL_TIME_STEERING=true

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

## 🎮 Brug

### Kommando-baseret brug

#### Development Server
```bash
# Start development server med browser
python jarvis_frontend.py dev

# Start i baggrund uden browser
python jarvis_frontend.py dev --background --no-browser

# Start på custom port
python jarvis_frontend.py dev --dev-port 3006
```

#### Production Management
```bash
# Build for production
python jarvis_frontend.py build

# Build med bundle analyse
python jarvis_frontend.py build --analyze

# Start production server
python jarvis_frontend.py start

# Full deploy (build + start)
python jarvis_frontend.py deploy
```

#### Server Management
```bash
# Stop alle servere
python jarvis_frontend.py stop

# Vis detaljeret status
python jarvis_frontend.py status

# Test AgentScope backend integration
python jarvis_frontend.py test
```

#### Quality Assurance
```bash
# Kør ESLint og TypeScript checks
python jarvis_frontend.py lint

# Kør tests og backend integration
python jarvis_frontend.py test
```

#### Monitoring og debugging
```bash
# Live monitoring mode (opdateres hvert 3. sekund)
python jarvis_frontend.py monitor

# Vis konfiguration og dependencies
python jarvis_frontend.py config

# Vis seneste logs
python jarvis_frontend.py logs

# Dependency management
python jarvis_frontend.py deps
```

#### Maintenance
```bash
# Clean build artifacts og logs
python jarvis_frontend.py clean
```

### Interaktiv Mode

Start den interaktive terminal:
```bash
python jarvis_frontend.py interactive
# eller bare:
python jarvis_frontend.py
```

**Tilgængelige kommandoer i interaktiv mode:**

```
jarvis-frontend> help
```

| Kommando  | Beskrivelse                                       |
|-----------|--------------------------------------------------|
| `dev`     | Start Next.js development server                |
| `build`   | Build applikation for production                |
| `start`   | Start production server                         |
| `stop`    | Stop alle servere gracefully                   |
| `test`    | Kør tests og AgentScope integration tests      |
| `lint`    | Kør ESLint og TypeScript checks                |
| `deps`    | Check dependencies status                       |
| `status`  | Vis detaljeret application status               |
| `config`  | Vis konfiguration og environment variabler     |
| `monitor` | Live monitoring mode (Ctrl+C for at exit)      |
| `logs`    | Vis seneste logs                               |
| `clean`   | Clean project artifacts                        |
| `backend` | Test AgentScope backend integration            |
| `help`    | Vis denne hjælp                               |
| `exit`    | Exit interaktiv mode                           |

## 🎨 Output Eksempler

### Status Visning
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          Jarvis Frontend Manager                             ║
║                                                                              ║
║  🚀 Next.js Development & Production Management                              ║
║  🤖 AgentScope Integration & Real-time Features                              ║
║  🇩🇰 Danish Language & Voice Support                                        ║
║                                                                              ║
║  App: @tekup/jarvis             Version: 1.0.0                         ║
║  Package Manager: pnpm                                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Application Status:
==================================================
Project: @tekup/jarvis
Version: 1.0.0
Description: Komplet Jarvis AI Assistant - Voice, Chat og AI Integration
Package Manager: pnpm

Server Status:
Development Server: RUNNING (Port 3005)
  └─ URL: http://localhost:3005
Production Server: STOPPED (Port 3002)

Build Status:
Production Build: EXISTS

Build Information:
==============================
Build size: 68.3 MB
Build directory: C:\...\jarvis\.next

Dependencies:
node_modules: INSTALLED

Process Information:
Dev Server PID: 12345
  └─ CPU: 2.1%
  └─ Memory: 145.2 MB

Configuration:
AgentScope API: http://localhost:8001
WebSocket URL: ws://localhost:8001
OPENAI_API_KEY: your_ope********key_here
NODE_ENV: development
NEXT_PUBLIC_DEBUG: true
```

### Development Server Start
```
[00:03:45] [STARTING] Starting Next.js development server...
[00:03:45] [SUCCESS] Node.js found: v20.11.0
[00:03:45] [SUCCESS] Package manager found: pnpm 8.15.1
[00:03:46] [SUCCESS] Dev Server started (PID: 12345)
[Dev Server]   ▲ Next.js 15.5.2
[Dev Server]   - Local:        http://localhost:3005
[Dev Server]   - Network:      http://192.168.1.100:3005
[Dev Server] 
[Dev Server]  ✓ Ready in 2.8s
[00:03:49] [READY] Development server ready at http://localhost:3005
```

### Build Process
```
[00:05:12] [BUILDING] Building Next.js application for production...
[00:05:12] [CLEANING] Cleaning build artifacts...
[00:05:12] [CLEANED] Removed .next
[00:05:13] [SUCCESS] Node.js found: v20.11.0
[00:05:13] [SUCCESS] Package manager found: pnpm 8.15.1
[00:05:35] [SUCCESS] Build completed successfully in 22.3s

Build Information:
==============================
Build size: 45.2 MB
Build directory: C:\...\jarvis\.next
Pages built: 12
```

### Integration Testing
```
[00:07:21] [TESTING] Testing AgentScope backend integration...
[00:07:22] [✓] AgentScope HTTP API connection working
[00:07:22] [INFO] Jarvis model: jarvis-foundation-1.0
[00:07:22] [INFO] Active sessions: 0
[00:07:23] [✓] AgentScope WebSocket connection working
```

### Live Monitoring
```
Live Application Monitoring
============================================================
Time: 2025-09-10 00:07:45

Dev Server: ONLINE (:3005)
Prod Server: OFFLINE (:3002)
AgentScope Backend: CONNECTED

Dev Process: PID 12345 | CPU 1.8% | Memory 142.1 MB

Press Ctrl+C to exit monitoring
```

## 📁 Log Filer

Scriptet opretter automatisk en `logs/` mappe med:

- **jarvis_frontend.log** - Hovedlog fil med roterende backup
- Maksimum 10MB per fil
- Op til 5 backup filer

## 🔧 Konfiguration

### Environment Variables

Scriptet indlæser automatisk fra flere .env filer i prioriteret rækkefølge:
1. `.env.local` (højeste prioritet)
2. `.env.development` 
3. `.env`

**Vigtige konfigurationer:**
```env
# AgentScope Backend Integration
AGENTSCOPE_API_URL=http://localhost:8001
NEXT_PUBLIC_AGENTSCOPE_API_URL=http://localhost:8001
NEXT_PUBLIC_AGENTSCOPE_WS_URL=ws://localhost:8001

# API Keys (vil blive maskeret i logs)
OPENAI_API_KEY=your_actual_api_key_here
SPEECH_API_KEY=your_speech_api_key_here

# Jarvis Features
JARVIS_NAME="Jarvis AI Assistant"
JARVIS_VERSION="2.1.0"
NEXT_PUBLIC_VOICE_ENABLED=true
NEXT_PUBLIC_DANISH_SUPPORT=true
NEXT_PUBLIC_WEBSOCKET_ENABLED=true
NEXT_PUBLIC_REAL_TIME_STEERING=true

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_DEFAULT_LANGUAGE=da
```

### Package Manager Detection

Scriptet detekterer automatisk hvilken package manager der bruges baseret på lock filer:
- `pnpm-lock.yaml` → **pnpm**
- `yarn.lock` → **yarn**  
- `package-lock.json` → **npm**
- Ingen lock fil → **npm** (fallback)

### Port Konfiguration

Standard porte kan overrides:
```bash
python jarvis_frontend.py dev --dev-port 3006 --prod-port 3003
```

Eller ændres permanent i `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev -p 3005",
    "start": "next start -p 3002"
  }
}
```

## 🔍 Fejlfinding

### Node.js ikke fundet

**Problem:**
```
[ERROR] Node.js is not installed or not in PATH
```

**Løsning:**
1. **Installer Node.js:**
   - Download fra https://nodejs.org/
   - Eller brug package manager: `choco install nodejs` (Windows) eller `brew install node` (macOS)

2. **Verificer installation:**
   ```bash
   node --version
   npm --version
   ```

3. **Tilføj til PATH** hvis nødvendigt

### Package Manager Fejl

**Problem:**
```
[ERROR] pnpm is not installed or not in PATH
```

**Løsning:**
```bash
# For pnpm
npm install -g pnpm

# For yarn
npm install -g yarn

# Verificer
pnpm --version  # eller yarn --version
```

### Dependencies Fejler

**Problem:**
```
[ERROR] node_modules not found. Installing dependencies...
[ERROR] Failed to install dependencies
```

**Løsning:**
1. **Manual installation:**
   ```bash
   # Baseret på detected package manager
   pnpm install  # eller npm install / yarn install
   ```

2. **Clear cache og reinstaller:**
   ```bash
   # For pnpm
   pnpm store prune
   rm -rf node_modules pnpm-lock.yaml
   pnpm install

   # For npm
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Port Already in Use

**Problem:**
```
[ERROR] Development server failed to start
```

**Løsning:**
1. **Check hvilken proces bruger porten:**
   ```bash
   # Windows
   netstat -ano | findstr :3005
   
   # Linux/Mac
   lsof -i :3005
   ```

2. **Stop eksisterende server:**
   ```bash
   python jarvis_frontend.py stop
   ```

3. **Brug anden port:**
   ```bash
   python jarvis_frontend.py dev --dev-port 3006
   ```

### Build Fejler

**Problem:**
```
[ERROR] Build failed
```

**Løsning:**
1. **Check TypeScript fejl:**
   ```bash
   python jarvis_frontend.py lint
   ```

2. **Clear build cache:**
   ```bash
   python jarvis_frontend.py clean
   ```

3. **Reinstaller dependencies:**
   ```bash
   rm -rf node_modules
   python jarvis_frontend.py deps
   ```

### AgentScope Backend Connection Fejl

**Problem:**
```
[✗] AgentScope API connection failed
[✗] AgentScope WebSocket error
```

**Løsning:**
1. **Check backend status:**
   ```bash
   # I backend directory
   cd ../../backend/agentscope-enhanced
   python jarvis_server.py status
   ```

2. **Start backend hvis nødvendigt:**
   ```bash
   python jarvis_server.py start --background
   ```

3. **Verificer URL konfiguration i .env.local:**
   ```env
   AGENTSCOPE_API_URL=http://localhost:8001
   NEXT_PUBLIC_AGENTSCOPE_WS_URL=ws://localhost:8001
   ```

## 🔄 Integration med Development Workflow

### VS Code Integration

**tasks.json:**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Jarvis: Start Dev Server",
      "type": "shell",
      "command": "python",
      "args": ["jarvis_frontend.py", "dev", "--background"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Jarvis: Build Production",
      "type": "shell",
      "command": "python",
      "args": ["jarvis_frontend.py", "build"],
      "group": "build"
    },
    {
      "label": "Jarvis: Run Tests",
      "type": "shell",
      "command": "python",
      "args": ["jarvis_frontend.py", "test"],
      "group": "test"
    }
  ]
}
```

### Git Hooks

**pre-commit hook (.git/hooks/pre-commit):**
```bash
#!/bin/sh
cd apps/jarvis
python jarvis_frontend.py lint
if [ $? -ne 0 ]; then
  echo "Frontend linting failed. Please fix errors before committing."
  exit 1
fi
```

### Docker Integration

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy scripts and configs
COPY jarvis_frontend.py requirements.txt ./
COPY package*.json ./

# Install Python dependencies
RUN pip install -r requirements.txt

# Install Node dependencies
RUN python jarvis_frontend.py deps

# Copy source code
COPY . .

# Build application
RUN python jarvis_frontend.py build

# Start production server
CMD ["python", "jarvis_frontend.py", "start"]

EXPOSE 3002
```

### CI/CD Pipeline

**GitHub Actions (.github/workflows/jarvis-frontend.yml):**
```yaml
name: Jarvis Frontend CI/CD

on:
  push:
    paths: ['apps/jarvis/**']
  pull_request:
    paths: ['apps/jarvis/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install Python dependencies
        run: pip install requests psutil websocket-client
        
      - name: Install dependencies
        working-directory: apps/jarvis
        run: python jarvis_frontend.py deps
        
      - name: Run linting
        working-directory: apps/jarvis
        run: python jarvis_frontend.py lint
        
      - name: Run tests
        working-directory: apps/jarvis
        run: python jarvis_frontend.py test
        
      - name: Build application
        working-directory: apps/jarvis
        run: python jarvis_frontend.py build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        working-directory: apps/jarvis
        run: |
          python jarvis_frontend.py build
          python jarvis_frontend.py deploy
```

## 🛡️ Sikkerhed

### API Key Management
- API keys automatisk masked i logs og status output
- Environment variabler bruges konsistent
- Ingen hardcoded secrets i kode

### Process Security
- Graceful shutdown med cleanup af child processes
- Signal handling for SIGINT/SIGTERM
- Process isolation og fejlhåndtering

### Network Security
- Localhost-only binding som standard
- Konfigurérbar host binding for production
- WebSocket connections med timeout handling

## 📈 Performance

### Build Optimization
- Bundle size analyse med `--analyze` flag
- Dead code elimination med Next.js tree shaking
- Image optimization med Next.js Image component
- CSS optimization med Tailwind CSS purging

### Development Performance
- Fast Refresh med Next.js hot module replacement
- TypeScript incremental compilation
- ESLint caching for hurtigere linting

### Monitoring Metrics
- Server CPU og memory usage tracking  
- Build time measurement
- Real-time connection status
- Process lifecycle monitoring

## 🤝 Udviklingsmiljø

### Development Setup
```bash
# Clone repository
git clone [repo-url]
cd apps/jarvis

# Setup environment
cp .env.example .env.local
# Edit .env.local med dine API keys

# Test installation
python jarvis_frontend.py status

# Start development
python jarvis_frontend.py interactive
jarvis-frontend> dev
```

### Bidrag til Projektet

1. **Fork repository og lav feature branch**
2. **Test dine ændringer:**
   ```bash
   python jarvis_frontend.py lint
   python jarvis_frontend.py test
   python jarvis_frontend.py build
   ```
3. **Lav commit med beskrivende besked**
4. **Submit pull request**

### Debugging

**Enable debug mode:**
```env
NEXT_PUBLIC_DEBUG=true
NODE_ENV=development
```

**View debug logs:**
```bash
python jarvis_frontend.py logs
python jarvis_frontend.py monitor  # Live debugging
```

## 📄 Licens

Dette projekt er en del af Tekup 2.0 AgentScope integration.

---

## 🚨 Quick Start Guide

```bash
# 1. Verificer Node.js installation
node --version  # skal være 18+

# 2. Test frontend manager
cd apps/jarvis
python jarvis_frontend.py status

# 3. Start development server
python jarvis_frontend.py dev

# 4. I ny terminal - start AgentScope backend
cd ../../backend/agentscope-enhanced
python jarvis_server.py start --background

# 5. Test integration
cd ../../apps/jarvis
python jarvis_frontend.py test

# 6. Monitor begge servere
python jarvis_frontend.py monitor
```

**For interaktiv hjælp:**
```bash
python jarvis_frontend.py interactive
jarvis-frontend> help
```

**Fejlfinding:**
- Hvis Node.js fejler: Installer fra https://nodejs.org/
- Hvis dependencies fejler: `python jarvis_frontend.py deps`
- Hvis ports er optaget: `python jarvis_frontend.py stop` derefter `python jarvis_frontend.py dev --dev-port 3006`
- Hvis AgentScope fejler: Start backend først med `python jarvis_server.py start --background`

Dette frontend management system giver dig nu professionel kontrol over hele Jarvis Next.js udviklings- og deployment-processen! 🎉
