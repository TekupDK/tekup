# TekupDK MCP Setup - Complete Guide

## ✅ Setup Complete - October 29, 2025

The TekupDK Model Context Protocol (MCP) servers are now configured and running with VS Code integration.

## 🚀 Running MCP Servers

### Currently Active (Non-Docker)

The following MCP servers are running directly via Node.js in development mode:

1. **Knowledge MCP** - Port 8051

   - Tool: `search_knowledge`
   - Searches documentation (MD, MDX, TXT files)
   - Search root: `C:\Users\empir\Tekup`

2. **Code Intelligence MCP** - Port 8052

   - Tool: `search_code`
   - Code analysis and search
   - Search root: `C:\Users\empir\Tekup`

3. **Database MCP** - Port 8053 (intermittent)
   - Tools: Database query operations
   - Connected to: Supabase (https://oaevagdgrasfppbrxbey.supabase.co)
   - Status: Configured but requires stable background process

### How They Were Started

```powershell
# Knowledge MCP (Terminal 1)
cd c:\Users\empir\Tekup\tekup-mcp-servers\packages\knowledge-mcp
$env:PORT="8051"
$env:KNOWLEDGE_SEARCH_ROOT="C:\Users\empir\Tekup"
npm run dev

# Code Intelligence MCP (Terminal 2)
cd c:\Users\empir\Tekup\tekup-mcp-servers\packages\code-intelligence-mcp
$env:PORT="8052"
$env:CODE_SEARCH_ROOT="C:\Users\empir\Tekup"
npm run dev

# Database MCP (Terminal 3)
cd c:\Users\empir\Tekup\tekup-mcp-servers\packages\database-mcp
$env:PORT="8053"
npm run dev
```

## 🔧 VS Code Configuration

### Settings Location

`C:\Users\empir\Tekup\.vscode\settings.json`

### MCP Configuration Added

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.servers": {
    "knowledge-mcp": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8051/mcp"
      },
      "description": "Search TekupDK documentation and knowledge base"
    },
    "code-intelligence-mcp": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8052/mcp"
      },
      "description": "Code analysis and intelligence for TekupDK projects"
    },
    "database-mcp": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8053/mcp"
      },
      "description": "Supabase database queries and operations"
    }
  }
}
```

### MCP Protocol Endpoints

- **SSE Connection**: `GET http://localhost:805X/mcp`
- **Message POST**: `POST http://localhost:805X/mcp/messages?sessionId=<id>`
- **Health Check**: `GET http://localhost:805X/health`

## 📋 How to Use MCP in VS Code

### 1. Restart VS Code

Close and reopen VS Code to load the new MCP settings.

### 2. Open Copilot Chat

Press `Ctrl+Shift+I` or click the Copilot Chat icon.

### 3. Use MCP Tools

```
@knowledge search for authentication documentation
@code-intelligence find all function definitions in backend
@database query users table
```

### 4. Alternative: Direct Tool Invocation

Copilot will automatically detect and offer MCP tools when appropriate based on your conversation context.

## 🔍 Available MCP Tools

### Knowledge MCP (`search_knowledge`)

**Purpose**: Search through all documentation files in the Tekup workspace

**Example queries**:

- "Find authentication setup docs"
- "Search for Docker configuration"
- "Look for API documentation"

**What it searches**:

- `**/*.md` - Markdown files
- `**/*.mdx` - MDX files
- `**/*.txt` - Text files

**Excludes**: node_modules, .git, dist, build, .next, .cache

### Code Intelligence MCP (`search_code`)

**Purpose**: Search and analyze code files

**Example queries**:

- "Find function definitions"
- "Search for class implementations"
- "Locate API endpoints"

### Database MCP (multiple tools)

**Purpose**: Query Supabase database

**Connected to**: `https://oaevagdgrasfppbrxbey.supabase.co`

**Example queries**:

- "Query users table"
- "Show database schema"
- "Get recent records"

## 🛠️ Server Management

### Check Server Status

```powershell
cd c:\Users\empir\Tekup\tekup-mcp-servers
.\test-mcp-connectivity.ps1
```

### View Server Logs

Check the terminal windows where servers are running. Look for:

- `Knowledge MCP HTTP server listening on port 8051`
- `Tekup Code Intelligence MCP HTTP server listening on port 8052`
- `Tekup Database MCP HTTP server listening on port 8053`

### Restart a Server

1. Find the terminal running the server (check port)
2. Press `Ctrl+C` to stop
3. Re-run the startup command (see "How They Were Started" above)

### Check Listening Ports

```powershell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 8051,8052,8053}
```

## 📦 Additional MCP Servers (Not Yet Started)

The following servers are configured in `docker-compose.yml` but require additional setup:

- **Billy MCP** (Port 8054) - Billy.dk accounting integration
- **Calendar MCP** (Port 8055) - Google Calendar integration
- **Gmail MCP** (Port 8056) - Gmail automation
- **Vault MCP** (Port 8057) - Secrets management

### To Start Additional Servers

Each requires proper directory structure and may need external services. See `tekup-mcp-servers/docker-compose.yml` for details.

## 🐛 Troubleshooting

### MCP Server Not Responding

1. Check if process is running: `Get-NetTCPConnection -LocalPort 805X`
2. Check terminal for error messages
3. Verify environment variables are set
4. Restart the server

### VS Code Not Detecting MCP

1. Verify `settings.json` has correct configuration
2. Restart VS Code completely (File > Exit)
3. Check Copilot extension is enabled
4. Try: `Ctrl+Shift+P` → "Developer: Reload Window"

### Port Already in Use

```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 8051 | Select-Object -ExpandProperty OwningProcess

# Kill the process
Stop-Process -Id <PID> -Force
```

### Health Check Fails

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8051/health"
```

## 📁 File Locations

- **MCP Servers**: `c:\Users\empir\Tekup\tekup-mcp-servers\packages\`
- **Configuration**: `c:\Users\empir\Tekup\tekup-mcp-servers\.env`
- **VS Code Settings**: `c:\Users\empir\Tekup\.vscode\settings.json`
- **Test Script**: `c:\Users\empir\Tekup\tekup-mcp-servers\test-mcp-connectivity.ps1`

## 🔐 Environment Variables

Located in: `c:\Users\empir\Tekup\tekup-mcp-servers\.env`

Key variables configured:

- `KNOWLEDGE_MCP_PORT=8051`
- `CODE_INTELLIGENCE_PORT=8052`
- `DATABASE_MCP_PORT=8053`
- `KNOWLEDGE_SEARCH_ROOT=C:\Users\empir\Tekup`
- `CODE_SEARCH_ROOT=C:\Users\empir\Tekup`
- `SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co`
- `SUPABASE_ANON_KEY=<configured>`
- `SUPABASE_SERVICE_ROLE_KEY=<configured>`

## 🚀 Next Steps

1. **Test in Copilot Chat**: Try the @ mention syntax with MCP server names
2. **Start Database MCP Stable**: Configure as a Windows service or Docker container
3. **Add More Servers**: Set up Billy, Calendar, Gmail, and Vault MCP servers
4. **Docker Migration**: Move from `npm run dev` to production Docker containers

## 📚 Documentation

- Knowledge MCP: `tekup-mcp-servers/packages/knowledge-mcp/README.md`
- Code Intelligence: `tekup-mcp-servers/packages/code-intelligence-mcp/README.md`
- Database MCP: `tekup-mcp-servers/packages/database-mcp/README.md`
- Quick Start: `tekup-mcp-servers/QUICKSTART.md`

## ✅ Verification Checklist

- [x] .env file configured with credentials
- [x] Knowledge MCP running on port 8051
- [x] Code Intelligence MCP running on port 8052
- [x] Database MCP configured (needs stable process)
- [x] VS Code settings.json updated with MCP configuration
- [x] Health endpoints responding
- [x] Test script created (`test-mcp-connectivity.ps1`)
- [ ] Copilot Chat integration tested (requires VS Code restart)
- [ ] Docker production deployment
- [ ] Additional MCP servers (Billy, Calendar, Gmail, Vault)

## 📝 Notes

- Servers are running in **development mode** (`npm run dev`) - this is good for testing but not production
- **Docker deployment** is available but had dependency issues with `performance-monitor` package
- VS Code MCP integration uses **SSE (Server-Sent Events)** transport
- Each server exposes **JSON-RPC 2.0** protocol over HTTP
