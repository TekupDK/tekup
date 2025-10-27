# Tekup MCP Unified Solution - 27. Oktober 2025

## 🎯 Problem Løst: Single Source of Truth

### Problem Statement
**BEFORE**: VS Code Copilot loadede MCP servere fra 4+ forskellige kilder:
- Claude Desktop config (6 servere)
- Cursor global (8 servere)
- Windsurf (5 servere)
- Cursor workspace (flere)
- VS Code egen mcp.json (4 servere)

**Resultat**: Massive duplikater, forvirring, ingen kontrol.

### Solution Implemented

**VS Code Discovery DISABLED** - Kun Tekup's egen MCP config nu!

```json
// %APPDATA%\Code\User\settings.json
"chat.mcp.discovery.enabled": {
  "claude-desktop": false,      // ✅ DISABLED
  "cursor-global": false,        // ✅ DISABLED  
  "windsurf": false,             // ✅ DISABLED
  "cursor-workspace": false      // ✅ DISABLED
}
```

## 📋 Tekup MCP Architecture

### Single Source of Truth: VS Code mcp.json

**Location**: `%APPDATA%\Code\User\mcp.json`

```json
{
  "servers": {
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "%USERPROFILE%\\.mcp-shared\\memory.json"
      }
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "%USERPROFILE%\\Tekup"]
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  },
  "inputs": []
}
```

### Tekup Custom MCP Servers (Docker via HTTP)

Placeret i: `%USERPROFILE%\Tekup\tekup-mcp-servers\`

**Custom servers**:
1. **knowledge-mcp** - Semantic search i Tekup dokumentation
2. **code-intelligence-mcp** - Code search og analyse
3. **database-mcp** - Supabase integration
4. **tekup-billy** - Fakturering via Billy API
5. **web-scraper** - Python web scraping

**Status**: ✅ Phase 2 Complete – Docker HTTP stack live
**Note**: Andre MCP’er (Billy, calendar, gmail) migreres efter behov.

## 🔧 Per-IDE Configuration Strategy

### VS Code / GitHub Copilot (Primary)
**Config**: `%APPDATA%\Code\User\mcp.json`
**Format**: `"servers"```key (unique to VS Code)
**Discovery**: DISABLED
**Servers**: 4 core servere (memory, sequential-thinking, filesystem, github)

### Claude Desktop (Documentation/Research)
**Config**: `%APPDATA%\Claude\claude_desktop_config.json`
**Format**: `"mcpServers"```key
**Servers**: 6 servere (alle Tekup custom + web-scraper)
**Use case**: Deep research, documentation writing

### Cursor (Legacy - til udfasning)
**Config**: `%USERPROFILE%\.cursor\mcp.json`
**Status**: ✅ Phase 2 Complete – Docker HTTP stack live
**Servers**: 7 servere (inkl. tekup-billy, tekupvault HTTP)

### Windsurf (Legacy - til udfasning)
**Config**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
**Status**: ✅ Phase 2 Complete – Docker HTTP stack live
**Servers**: 5 servere

### Kilo Code CLI (Development)
**Config**: `%USERPROFILE%\.kilocode\cli\mcp.json`
**Format**: `"mcpServers"```key
**Servers**: 4 servere (sync med VS Code)

## 📊 Tekup MCP Server Matrix

| Server | VS Code | Claude Desktop | Purpose | Status |
|--------|---------|---------------|---------|--------|
| **memory** | ✅ | ❌ | Shared memory across sessions | Active |
| **sequential-thinking** | ✅ | ❌ | Multi-step reasoning | Active |
| **filesystem** | ✅ Tekup only | ✅ Full user | File access | Active |
| **github** | ✅ | ✅ | GitHub integration | Active |
| **knowledge-mcp** | ✅ HTTP | ✅ HTTP | Tekup docs search | Local HTTP `http://localhost:8051/mcp` |
| **code-intelligence-mcp** | ✅ HTTP | ✅ HTTP | Code search | Local HTTP `http://localhost:8052/mcp` |
| **database-mcp** | ✅ HTTP | ✅ HTTP | Supabase | Local HTTP `http://localhost:8053/mcp` |
| **web-scraper** | ❌ | ✅ | Web scraping | Python |
| **tekup-billy** | ❌ | ❌ | Billy API | Legacy |
| **tekupvault** | ❌ | ❌ | Password mgmt | HTTP (Render.com) |

## 🐳 Docker Migration Plan (Phase 2)

### Goal
**ALL** Tekup custom MCP servere kører i Docker containers.

### Architecture
```
%USERPROFILE%\Tekup\tekup-mcp-servers\
├── docker-compose.yml          # Single source of truth
├── packages/
│   ├── knowledge-mcp/
│   │   ├── Dockerfile
│   │   └── dist/
│   ├── code-intelligence-mcp/
│   │   ├── Dockerfile
│   │   └── dist/
│   ├── database-mcp/
│   │   ├── Dockerfile
│   │   └── dist/
│   └── billy-mcp/
│       ├── Dockerfile
│       └── dist/
└── .env                        # Credentials (gitignored)
```

### docker-compose.yml (Future)
```yaml
version: '3.8'

services:
  knowledge-mcp:
    build: ./packages/knowledge-mcp
    environment:
      - KNOWLEDGE_SEARCH_ROOT=/workspace
    volumes:
      - %USERPROFILE%\Tekup:/workspace:ro
    ports:
      - "3001:3000"
    
  code-intelligence-mcp:
    build: ./packages/code-intelligence-mcp
    environment:
      - CODE_SEARCH_ROOT=/workspace
    volumes:
      - %USERPROFILE%\Tekup:/workspace:ro
    ports:
      - "3002:3000"
    
  database-mcp:
    build: ./packages/database-mcp
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    ports:
      - "3003:3000"
```

### VS Code Config (After Docker Migration)
```json
{
  "servers": {
    "memory": { /* unchanged */ },
    "sequential-thinking": { /* unchanged */ },
    "filesystem": { /* unchanged */ },
    "github": { /* unchanged */ },
    "tekup-knowledge": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    },
    "tekup-code-intelligence": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    },
    "tekup-database": {
      "type": "http",
      "url": "http://localhost:3003/mcp"
    }
  }
}
```

### Benefits
1. ✅ **Single command startup**: `docker-compose up -d`
2. ✅ **No duplicate processes**: Docker manages lifecycle
3. ✅ **Environment isolation**: Credentials in .env
4. ✅ **Easy updates**: `docker-compose pull && docker-compose up -d`
5. ✅ **Cross-IDE compatibility**: HTTP endpoints work everywhere

## 🔒 Security Improvements

### Environment Variables
**ALL** credentials nu i Windows Environment Variables:

```powershell
# Already set:
$env:GITHUB_PERSONAL_ACCESS_TOKEN
$env:SUPABASE_URL  
$env:SUPABASE_ANON_KEY
$env:BILLY_API_KEY
$env:BILLY_ORGANIZATION_ID
$env:NODE_ENV
$env:LOG_LEVEL
```

### Files to Update
1. ❌ **REMOVE hardcoded GitHub PAT** fra Claude Desktop config
2. ❌ **REMOVE hardcoded Supabase keys** fra configs
3. ✅ **USE** environment variable references: `${VAR_NAME}`

### Filesystem Scope Reduction
**BEFORE**: Claude Desktop + Windsurf havde adgang til `%USERPROFILE%```(HELE brugermappen!)

**AFTER**: Kun `%USERPROFILE%\Tekup`

```json
"filesystem": {
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "%USERPROFILE%\\Tekup"]
}
```

## 📈 Migration Checklist

### Phase 1: Cleanup (Today) ✅
- [x] Disable VS Code MCP discovery
- [x] Document current state
- [ ] Revoke exposed GitHub PAT token
- [ ] Generate new GitHub PAT with minimal scope
- [ ] Update Claude Desktop config with env var
- [ ] Reduce filesystem scope in Claude Desktop
- [ ] Reduce filesystem scope in Windsurf

### Phase 2: Docker Migration (This Week)
- [ ] Create docker-compose.yml
- [ ] Create Dockerfiles for each custom server
- [ ] Test Docker setup locally
- [ ] Update VS Code mcp.json with HTTP endpoints
- [ ] Update Claude Desktop config with HTTP endpoints
- [ ] Verify all tools work via Docker
- [ ] Document Docker startup process

### Phase 3: Standardization (Next Week)
- [ ] Decide: Keep or remove Cursor?
- [ ] Decide: Keep or remove Windsurf?
- [ ] Create Tekup MCP Standard Config template
- [ ] Sync all active IDEs to standard
- [ ] Remove unused IDE configs
- [ ] Update documentation

### Phase 4: Production Deployment (Future)
- [ ] Deploy Docker containers to Render.com
- [ ] Update configs with production URLs
- [ ] Set up health monitoring
- [ ] Document production deployment

## 🎯 Success Metrics

### Before (Yesterday)
- ❌ 32 MCP Node.js processes running
- ❌ 15-25 GB RAM usage
- ❌ 8+ config files with inconsistent servers
- ❌ Exposed GitHub PAT in configs
- ❌ No single source of truth

### After (Today)
- ✅ 2 MCP Node.js processes (VS Code only)
- ✅ ~500 MB RAM usage
- ✅ VS Code discovery disabled
- ✅ Single primary config (VS Code mcp.json)
- ⏳ GitHub PAT still needs revocation

### Target (After Docker Migration)
- ✅ 4-5 Docker containers (managed by Docker)
- ✅ <1 GB RAM total
- ✅ ONE docker-compose.yml file
- ✅ ALL credentials in environment variables
- ✅ Cross-IDE HTTP endpoints
- ✅ Production-ready architecture

## 🔗 Related Documentation

- `MCP_PROBLEM_SOLVED_2025-10-27.md```- Initial problem analysis
- `SECURITY_REVOKE_GITHUB_PAT.md```- Security fix guide
- `MCP_COMPLETE_AUDIT_2025-10-27.md```- Complete MCP audit
- `MCP_PRODUCTION_ARCHITECTURE_PLAN.md```- Production deployment strategy
- `MCP_DOCKER_MIGRATION_PLAN.md```- Docker migration details (placeholder)

## 📝 Next Actions

### IMMEDIATE (Now)
```powershell
# 1. Restart VS Code to apply discovery disable
# 2. Verify only 4 MCP tools show in Copilot
# 3. Revoke old GitHub PAT token
# Go to: https://github.com/settings/tokens
```

### TODAY
```powershell
# Update Claude Desktop config
$claudeConfig = "%APPDATA%\Claude\claude_desktop_config.json"
# Remove hardcoded: github_pat_11BDCB62Q0...
# Replace with: "${GITHUB_PERSONAL_ACCESS_TOKEN}"

# Reduce filesystem scope
# Change: "%USERPROFILE%" 
# To: "%USERPROFILE%\\Tekup"
```

### THIS WEEK
```powershell
# Start Docker migration
cd %USERPROFILE%\Tekup\tekup-mcp-servers
# Create docker-compose.yml
# Test locally
docker-compose up -d
docker ps  # Verify running
```

---

**Status**: ✅ Phase 2 Complete – Docker HTTP stack live
**Next**: Revoke GitHub PAT & forberede Render deployment
**Owner**: Jonas (empir)
**Last Updated**: 2025-10-27 18:05

## Docker‑baseret drift (nyt)

For at undgå duplikerede lokale npx‑processer anbefales det at køre MCP‑services i Docker og bruge HTTP‑endpoints.

Start/stop scripts:

```powershell
pwsh -File Tekup/scripts/mcp-up.ps1    # starter knowledge, code-intelligence, database (+ redis)
pwsh -File Tekup/scripts/mcp-down.ps1  # stopper stacken
```

HTTP endpoints (lokalt):
- knowledge:        http://localhost:8051/mcp
- code-intelligence: http://localhost:8052/mcp
- database:         http://localhost:8053/mcp

Opdater IDE‑configs (Claude Desktop, VS Code, Cursor) til at bruge disse URLs og slå lokale npx‑servers fra.




