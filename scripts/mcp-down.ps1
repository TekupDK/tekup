<#
  Stop Tekup MCP stack via Docker Compose
  - Stops services started by mcp-up
#>

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeDir = Join-Path $repoRoot 'tekup-mcp-servers'

try { docker version | Out-Null } catch { Write-Error "Docker is not available."; exit 1 }

Push-Location $composeDir
try {
  docker compose down
} finally { Pop-Location }

Write-Host "Stopped Tekup MCP stack." -ForegroundColor Cyan

