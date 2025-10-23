# RenOS Calendar MCP - Port Conflict Detector

# Load ports from .env.ports if exists
if (Test-Path '.env.ports') {
    Write-Host "Loading ports from .env.ports..." -ForegroundColor Cyan
    Get-Content '.env.ports' | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        $name = $name.Trim()
        $value = $value.Trim()
        if ($name -and $value) {
            Set-Item -Path "env:$name" -Value $value -ErrorAction SilentlyContinue
        }
    }
}

# Get ports with fallback defaults
$mcp_port = if ($env:MCP_PORT) { $env:MCP_PORT } else { '3001' }
$dashboard_port = if ($env:DASHBOARD_PORT) { $env:DASHBOARD_PORT } else { '3006' }
$chatbot_port = if ($env:CHATBOT_PORT) { $env:CHATBOT_PORT } else { '3005' }
$redis_port = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { '6379' }
$nginx_http_port = if ($env:NGINX_HTTP_PORT) { $env:NGINX_HTTP_PORT } else { '80' }
$nginx_https_port = if ($env:NGINX_HTTPS_PORT) { $env:NGINX_HTTPS_PORT } else { '443' }

Write-Host "Checking for port conflicts..." -ForegroundColor Yellow
Write-Host ""

$ports = @(
    @{ Name = 'MCP Server'; Port = $mcp_port }
    @{ Name = 'Dashboard'; Port = $dashboard_port }
    @{ Name = 'Chatbot'; Port = $chatbot_port }
    @{ Name = 'Redis'; Port = $redis_port }
    @{ Name = 'Nginx HTTP'; Port = $nginx_http_port }
    @{ Name = 'Nginx HTTPS'; Port = $nginx_https_port }
)

$conflicts = @()
foreach ($p in $ports) {
    try {
        $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port ([int]$p.Port) -WarningAction SilentlyContinue -ErrorAction Stop
        if ($conn.TcpTestSucceeded) {
            Write-Host "[X] Port $($p.Port) ($($p.Name)) is IN USE" -ForegroundColor Red
            $conflicts += $p
        } else {
            Write-Host "[OK] Port $($p.Port) ($($p.Name)) is available" -ForegroundColor Green
        }
    } catch {
        Write-Host "[OK] Port $($p.Port) ($($p.Name)) is available" -ForegroundColor Green
    }
}

Write-Host ""

if ($conflicts.Count -eq 0) {
    Write-Host "All ports available. Ready to start." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Found $($conflicts.Count) port conflict(s)!" -ForegroundColor Red
    foreach ($c in $conflicts) {
        Write-Host "   - $($c.Name): port $($c.Port)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Solution: Edit .env or .env.ports to change ports" -ForegroundColor Yellow
    exit 1
}
