# Stop Tekup MCP Servers
# Kills all Node.js processes running on MCP ports

Write-Host "Stopping Tekup MCP Servers..." -ForegroundColor Cyan

$ports = @(8051, 8052, 8053, 8054, 8055, 8056, 8057)
$stopped = 0

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($conn in $connections) {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping process on port $port (PID: $($process.Id))..." -ForegroundColor Yellow
                    Stop-Process -Id $process.Id -Force
                    $stopped++
                }
            }
        }
    }
    catch {
        # Port not in use, skip
    }
}

if ($stopped -gt 0) {
    Write-Host "[OK] Stopped $stopped MCP server(s)" -ForegroundColor Green
} else {
    Write-Host "No MCP servers were running" -ForegroundColor Gray
}

Write-Host "`n[DONE]" -ForegroundColor Cyan
