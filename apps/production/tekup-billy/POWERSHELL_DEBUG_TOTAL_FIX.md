# PowerShell Total Debug & Fix Guide

**Problem:** `The terminal process "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe" terminated with exit code: -2147023895`

**Exit Code Analysis:** `-2147023895` = `0x80070005` = **ACCESS_DENIED** (Insufficient privileges)

## Øjeblikkelig Diagnose

### 1. Exit Code Betydning

```
-2147023895 (decimal) = 0x80070005 (hex) = ERROR_ACCESS_DENIED
```

Dette betyder PowerShell ikke har tilstrækkelige rettigheder til at køre.

### 2. Mulige Årsager

- **Execution Policy:** PowerShell execution policy blokerer scripts
- **Antivirus:** Real-time protection blokerer PowerShell
- **Group Policy:** Organisatoriske policies begrænser PowerShell
- **User Permissions:** Bruger mangler administrative rettigheder
- **Windows Defender:** SmartScreen eller ATP blokerer execution

## Øjeblikkelige Løsninger

### Løsning 1: Check Execution Policy

```cmd
# Åbn Command Prompt som Administrator
powershell -Command "Get-ExecutionPolicy -List"
```

**Hvis Restricted/AllSigned:**

```cmd
# Sæt execution policy (kræver admin)
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
```

### Løsning 2: Bypass Execution Policy

```cmd
# Kør PowerShell med bypass
powershell -ExecutionPolicy Bypass -Command "echo 'Test successful'"
```

### Løsning 3: Brug Command Prompt i stedet

```cmd
# Test basic functionality
echo "Testing CMD instead of PowerShell"
node --version
npm --version
```

### Løsning 4: Check Windows Defender

1. **Åbn Windows Security**
2. **Virus & threat protection**
3. **Manage settings** under Real-time protection
4. **Tilføj exclusion** for PowerShell: `C:\WINDOWS\System32\WindowsPowerShell\`

### Løsning 5: Alternative Terminal

```cmd
# Prøv Windows Terminal eller Git Bash
# Eller brug VS Code integrated terminal med CMD profile
```

## Tekup-Billy Specific Fixes

### 1. Test Nuværende System (Uden PowerShell)

```cmd
# Test Node.js direkte
node -e "console.log('Node.js works:', process.version)"

# Test npm
npm --version

# Test TypeScript compilation
npx tsc --version
```

### 2. Kør Tekup-Billy Tests (CMD)

```cmd
# Build project
npm run build

# Test integration (uden PowerShell scripts)
node dist/tests/test-integration.js

# Test production
node dist/tests/test-production.js

# Start server
npm start
```

### 3. Alternative Test Scripts

Opret `test-cmd.bat` i stedet for PowerShell:

```batch
@echo off
echo Starting Tekup-Billy Tests...

echo.
echo === Building Project ===
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo === Testing Integration ===
call npx tsx tests/test-integration.ts
if %errorlevel% neq 0 (
    echo Integration tests failed!
    exit /b 1
)

echo.
echo === Testing Production ===
call npx tsx tests/test-production.ts
if %errorlevel% neq 0 (
    echo Production tests failed!
    exit /b 1
)

echo.
echo === All Tests Passed ===
```

## V2.0 Specifikation - Løser Dette Problem

### Task 1.3: Enhanced Health Monitoring System

```typescript
// Implementer system diagnostics der detekterer PowerShell issues
export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    powershell: await checkPowerShellHealth(),
    permissions: await checkPermissions(),
    executionPolicy: await checkExecutionPolicy(),
    antivirus: await checkAntivirusStatus(),
  };

  return health;
}

async function checkPowerShellHealth(): Promise<HealthCheck> {
  try {
    const { exec } = require("child_process");
    const result = await execPromise('powershell -Command "echo test"', {
      timeout: 5000,
    });

    return {
      status: "healthy",
      message: "PowerShell execution successful",
      details: result,
    };
  } catch (error: any) {
    // Detect specific exit codes
    if (error.code === -2147023895 || error.code === 0x80070005) {
      return {
        status: "unhealthy",
        message: "PowerShell access denied (insufficient privileges)",
        error: error.message,
        exitCode: error.code,
        recommendations: [
          "Run as Administrator",
          "Check Execution Policy: Get-ExecutionPolicy",
          "Set Execution Policy: Set-ExecutionPolicy RemoteSigned",
          "Check Windows Defender exclusions",
          "Use Command Prompt as alternative",
        ],
      };
    }

    return {
      status: "unhealthy",
      message: "PowerShell execution failed",
      error: error.message,
      exitCode: error.code,
    };
  }
}
```

### Task 3.3: Enhanced Debugging and Diagnostics

```typescript
// Automatisk fallback til alternative execution methods
export class EnhancedExecutor {
  private preferredShell: "powershell" | "cmd" | "bash" = "powershell";

  async executeCommand(command: string): Promise<ExecutionResult> {
    const methods = [
      () => this.executePowerShell(command),
      () => this.executeCmd(command),
      () => this.executeBash(command),
      () => this.executeNode(command),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        return result;
      } catch (error) {
        console.warn(`Execution method failed, trying next...`, error.message);
      }
    }

    throw new Error("All execution methods failed");
  }

  private async executePowerShell(command: string): Promise<ExecutionResult> {
    // Try different PowerShell execution strategies
    const strategies = [
      `powershell -Command "${command}"`,
      `powershell -ExecutionPolicy Bypass -Command "${command}"`,
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`,
    ];

    for (const strategy of strategies) {
      try {
        return await this.execPromise(strategy);
      } catch (error) {
        if (error.code === -2147023895) {
          throw new Error("PowerShell access denied - insufficient privileges");
        }
      }
    }

    throw new Error("All PowerShell strategies failed");
  }
}
```

## Øjeblikkelig Action Plan

### 1. Øjeblikkelig Fix (5 minutter)

```cmd
# Åbn Command Prompt som Administrator og kør:
powershell -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
```

### 2. Test Fix

```cmd
# Test PowerShell virker nu
powershell -Command "echo 'PowerShell works now'"
```

### 3. Hvis Det Stadig Fejler - Brug CMD

```cmd
# Brug Command Prompt i stedet for PowerShell
npm run build
npx tsx tests/test-integration.ts
npx tsx tests/test-production.ts
```

### 4. Permanent Løsning - Windows Defender Exclusion

1. **Windows Security** → **Virus & threat protection**
2. **Manage settings** → **Add or remove exclusions**
3. **Add exclusion** → **Folder** → `C:\WINDOWS\System32\WindowsPowerShell\`
4. **Add exclusion** → **Folder** → Dit projekt directory

### 5. VS Code Terminal Fix

1. **Ctrl+Shift+P** → "Terminal: Select Default Profile"
2. **Vælg "Command Prompt"** i stedet for PowerShell
3. **Genstart VS Code**

## Test at Alt Virker

### 1. Test PowerShell Fix

```powershell
# Skulle virke nu
Get-ExecutionPolicy
echo "PowerShell test successful"
```

### 2. Test Tekup-Billy

```cmd
# Test core functionality
npm run build
npm run test:integration
npm run test:production
npm start
```

### 3. Test MCP Tools

```javascript
// Via MCP client
await mcp.call("validate_auth", {});
await mcp.call("run_ops_check", { includeDiagnostics: true });
```

## Hvis Intet Virker - Nuclear Option

### Reinstaller PowerShell

```cmd
# Download PowerShell 7 fra Microsoft
# https://github.com/PowerShell/PowerShell/releases
# Installer som Administrator
```

### Brug Windows Subsystem for Linux (WSL)

```cmd
# Installer WSL2
wsl --install
# Brug Linux terminal i stedet
```

**Exit Code -2147023895 er 100% et permissions problem. Følg løsning 1-4 og det skulle være løst! 🚀**
