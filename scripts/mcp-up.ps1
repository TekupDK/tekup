<#
  Start Tekup MCP stack via Docker Compose
  - Starts knowledge, code-intelligence, database MCP (and dependencies)
  - Verifies health endpoints
#>
param(
  [switch]$All
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$composeDir = Join-Path $repoRoot 'tekup-mcp-servers'

Write-Host "Starting Docker Desktop (ensure it is running)..." -ForegroundColor Yellow
try { docker version | Out-Null } catch { Write-Error "Docker is not available. Start Docker Desktop and retry."; exit 1 }

Push-Location $composeDir
try {
  if ($All) {
    docker compose up -d
  } else {
    docker compose up -d knowledge-mcp code-intelligence-mcp database-mcp
  }
} finally { Pop-Location }

Start-Sleep -Seconds 4

function Test-Health($name, $url, $attempts = 5) {
  for ($i = 1; $i -le $attempts; $i++) {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
        Write-Host ("OK  - {0} ({1})" -f $name,$url) -ForegroundColor Green
        return
      }
      Write-Host ("WARN- {0} returned {1}" -f $name,$r.StatusCode) -ForegroundColor Yellow
      return
    } catch {
      if ($i -eq $attempts) {
        Write-Host ("FAIL- {0} not healthy: {1}" -f $name,$_.Exception.Message) -ForegroundColor Red
      } else {
        Start-Sleep -Seconds 1
      }
    }
  }
}

Write-Host "Health checks:" -ForegroundColor Cyan
Test-Health "knowledge-mcp"      "http://localhost:${env:KNOWLEDGE_MCP_PORT:-8051}/health"
Test-Health "code-intelligence"   "http://localhost:${env:CODE_INTELLIGENCE_PORT:-8052}/health"
Test-Health "database-mcp"        "http://localhost:${env:DATABASE_MCP_PORT:-8053}/health"

Write-Host "Done. Configure IDEs to use http://localhost:{8051,8052,8053}/mcp" -ForegroundColor Cyan
