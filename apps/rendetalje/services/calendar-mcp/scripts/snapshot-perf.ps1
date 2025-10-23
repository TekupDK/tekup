$ErrorActionPreference = 'Stop'

$mcpUrl = $Env:MCP_URL
if (-not $mcpUrl) { $mcpUrl = 'http://localhost:3001' }

Write-Host "Taking snapshot from $mcpUrl ..."

$now = Get-Date
$outDir = Join-Path (Get-Location) 'snapshots'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function Get-Json($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing
    if ($r.StatusCode -ne 200) { return @{ error = "HTTP $($r.StatusCode)" } }
    return $r.Content | ConvertFrom-Json
  } catch {
    return @{ error = $_.Exception.Message }
  }
}

$snapshot = [ordered]@{
  createdAt = $now.ToString('o')
  host = $env:COMPUTERNAME
  node = $null
  platform = $env:OS
  arch = $env:PROCESSOR_ARCHITECTURE
  process = @{ pid = $PID; cwd = (Get-Location).Path }
  system = @{ }
  mcp = @{ }
}

try { $snapshot.mcp.health = Get-Json "$mcpUrl/health" } catch {}
try { $snapshot.mcp.diagnostics = Get-Json "$mcpUrl/diagnostics/snapshot" } catch {}

$fileName = "snapshot-" + ($now.ToString('o').Replace(':','-').Replace('.','-')) + ".json"
$file = Join-Path $outDir $fileName

$snapshot | ConvertTo-Json -Depth 8 | Out-File -FilePath $file -Encoding UTF8
Write-Host "Snapshot written: $file"


