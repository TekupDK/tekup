# MCP Server Troubleshooting Guide

## Expected MCP Servers (from workspace config)

We configured these 4 MCP servers in `.vscode/settings.json` and `tekup-ai-v2.code-workspace`:

1. **playwright** - Browser automation (@playwright/mcp@latest)
2. **postgres** - PostgreSQL database (@modelcontextprotocol/server-postgres)
3. **filesystem** - File operations (@modelcontextprotocol/server-filesystem)
4. **fetch** - Web scraping (@modelcontextprotocol/server-fetch)

## What You're Seeing

In the "Configure Tools" panel, you're seeing:

- ✅ MCP Server: filesystem (THIS IS OURS!)
- ✅ MCP Server: github
- ✅ MCP Server: GitKraken
- ✅ MCP Server: Java App Modernization Deploy
- ✅ MCP Server: memory
- ✅ MCP Server: sequential-thinking

## Why playwright/postgres might not show

Possible reasons:

1. **They're there but named differently** - The UI might show them as "Extension: Playwright" or just bundle them under "filesystem"
2. **They failed to start** - Check VS Code Output panel:
   - Press `Ctrl+Shift+U`
   - Select "GitHub Copilot Chat" from dropdown
   - Look for `[MCP]` logs showing server start/errors
3. **User settings override** - VS Code User Settings might override workspace settings

## How to Fix

### Step 1: Check VS Code Output Panel

```
Ctrl+Shift+U → Select "GitHub Copilot Chat" → Look for [MCP] logs
```

### Step 2: Reload VS Code Window

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### Step 3: Verify DATABASE_URL is Set

The postgres MCP server needs this environment variable:

```powershell
echo $env:DATABASE_URL
```

If empty, add to your PowerShell profile or run:

```powershell
$env:DATABASE_URL = "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require"
```

### Step 4: Test MCP Directly

Ask Copilot: "List all available MCP tools and their capabilities"

## Browser Task Fix

The tasks in `.vscode/tasks.json` use native PowerShell commands, so they don't need any extension:

- **Open App in Browser** - `Start-Process http://localhost:3000`
- **Open Dev Login in Browser** - `Start-Process http://localhost:3000/api/auth/login`
- **Open Adminer in Browser** - `Start-Process http://localhost:8080`

To use: `Ctrl+Shift+P` → "Tasks: Run Task" → Select task

If you get "Open browser failed", try running the command directly in terminal:

```powershell
Start-Process http://localhost:3000/api/auth/login
```
