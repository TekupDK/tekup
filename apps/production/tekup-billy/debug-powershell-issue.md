# PowerShell Issue Debugging Guide

**Problem:** PowerShell kommandoer fejler med "Signal was cancelled"
**Status:** Systemisk problem der kræver debugging
**Dato:** October 22, 2025

## Nuværende Debugging Værktøjer

### 1. Brug Eksisterende Debug Tools

Da PowerShell ikke virker, kan vi bruge de indbyggede MCP debug tools:

#### Test System Health

```javascript
// Via MCP client (Claude Desktop, VS Code, etc.)
await mcp.call("validate_auth", {});
await mcp.call("test_connection", { endpoint: "organization" });
await mcp.call("run_ops_check", { includeDiagnostics: true });
```

#### Check Audit Logs

```javascript
await mcp.call("list_audit_logs", {
  sinceDate: "2025-10-22",
  limit: 100,
});
```

### 2. Alternative Debugging Metoder

#### Via HTTP API (hvis Render.com deployment virker)

```bash
# Test health endpoint
curl https://tekup-billy.onrender.com/health

# Test MCP tools via HTTP
curl -X POST https://tekup-billy.onrender.com/api/v1/tools/validate_auth \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d "{}"
```

#### Via Node.js direkte

```bash
# Hvis PowerShell ikke virker, prøv Node.js direkte
node -e "console.log('Node.js test'); process.exit(0);"
```

## V2.0 Debugging Forbedringer

Vores v2.0 specifikation adresserer præcis denne type problemer:

### Task 3.3: Enhanced Debugging and Diagnostics

- **Comprehensive diagnostic tools** med system health overview
- **Request tracing** med correlation ID tracking
- **PII filtering** og sensitive data redaction

### Task 1.3: Enhanced Health Monitoring System

- **Dependency health checks** (Billy API, Supabase, Redis, PowerShell)
- **Prometheus metrics** collection
- **Render monitoring** integration

### Foreslået Løsning

#### 1. Implementer System Diagnostics Tool

```typescript
// Ny diagnostic tool til v2.0
export async function runSystemDiagnostics(client: BillyClient, args: unknown) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
    dependencies: {
      billyApi: await testBillyConnection(),
      supabase: await testSupabaseConnection(),
      redis: await testRedisConnection(),
      powershell: await testPowerShellExecution(),
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      renderService: !!process.env.RENDER_SERVICE_ID,
      hasApiKey: !!process.env.BILLY_API_KEY,
    },
  };

  return diagnostics;
}

async function testPowerShellExecution(): Promise<DiagnosticResult> {
  try {
    // Test basic PowerShell execution
    const { exec } = require("child_process");
    const result = await new Promise((resolve, reject) => {
      exec(
        'powershell -Command "echo test"',
        { timeout: 5000 },
        (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve({ stdout, stderr });
        }
      );
    });

    return {
      status: "healthy",
      message: "PowerShell execution successful",
      details: result,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "PowerShell execution failed",
      error: error.message,
      recommendation: "Check Windows PowerShell installation and permissions",
    };
  }
}
```

#### 2. Implementer Correlation ID Tracking

```typescript
// Enhanced error tracking med correlation IDs
interface DiagnosticContext {
  correlationId: string;
  timestamp: string;
  source: "powershell" | "nodejs" | "mcp" | "http";
  operation: string;
}

export function createDiagnosticContext(operation: string): DiagnosticContext {
  return {
    correlationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: "mcp",
    operation,
  };
}
```

## Øjeblikkelige Handlinger

### 1. Test Nuværende System

Brug MCP tools til at teste systemet:

- `validate_auth` - Test Billy.dk forbindelse
- `run_ops_check` - Komplet system check
- `list_audit_logs` - Se seneste aktivitet

### 2. Alternativ Terminal

Hvis PowerShell ikke virker:

- Prøv Command Prompt (cmd)
- Prøv Git Bash (hvis installeret)
- Prøv Windows Terminal
- Brug VS Code integrated terminal

### 3. Check System Resources

- Task Manager → Se CPU/Memory usage
- Event Viewer → Check for system errors
- Windows Updates → Se om der er pending updates

## V2.0 Implementation Priority

Baseret på dette problem, skal vi prioritere:

1. **Task 1.3: Enhanced Health Monitoring** - Øjeblikkelig implementering
2. **Task 3.3: Enhanced Debugging** - Høj prioritet
3. **Task 3.1: Structured Error Responses** - Medium prioritet

Dette PowerShell problem viser præcis hvorfor v2.0 debugging forbedringerne er kritiske!
