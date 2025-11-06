# Tekup AI v2 - Log Monitor med Ngrok Status
# Viser live server logs og ngrok tunnel info

param(
    [string]$Filter = "",
    [int]$Lines = 30
)

$Host.UI.RawUI.WindowTitle = "Tekup Logs Monitor"

function Get-NgrokTunnels {
    try {
        # Bypass any system proxy when calling local ngrok API
        $response = Invoke-RestMethod -Proxy $null -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        return $response.tunnels
    } catch {
        return $null
    }
}

function Show-NgrokStatus {
    $tunnels = Get-NgrokTunnels
    
    if ($tunnels -and $tunnels.Count -gt 0) {
        Write-Host "`nNGROK TUNNELS ACTIVE:" -ForegroundColor Magenta
        foreach ($tunnel in $tunnels) {
            $proto = $tunnel.proto.ToUpper()
            $publicUrl = $tunnel.public_url
            $config = $tunnel.config.addr
            Write-Host "  [$proto] $publicUrl -> $config" -ForegroundColor Green
        }
        Write-Host ""
    } else {
        Write-Host "`nNgrok ikke aktiv (start med dev:tunnel)" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Header
Clear-Host
Write-Host "=== TEKUP AI V2 - LIVE LOG MONITOR + NGROK STATUS ===" -ForegroundColor Cyan

# Show ngrok status
Show-NgrokStatus

Write-Host "Monitoring: logs/dev-server.log" -ForegroundColor Cyan
if ($Filter) {
    Write-Host "Filter: $Filter" -ForegroundColor Yellow
}
Write-Host "---------------------------------------------------`n" -ForegroundColor DarkGray

# Check if log file exists
if (-not (Test-Path "logs/dev-server.log")) {
    Write-Host "Log fil ikke fundet! Start dev server med: pnpm run dev:tunnel" -ForegroundColor Red
    exit 1
}

# Monitor logs
$lineCount = 0
$lastNgrokCheck = [DateTime]::MinValue

Get-Content "logs/dev-server.log" -Wait -Tail $Lines | ForEach-Object {
    $lineCount++
    
    # Check ngrok status every 10 lines
    if ($lineCount % 10 -eq 0) {
        $now = [DateTime]::Now
        if (($now - $lastNgrokCheck).TotalSeconds -gt 30) {
            $lastNgrokCheck = $now
            $tunnels = Get-NgrokTunnels
            if ($tunnels -and $tunnels.Count -gt 0) {
                $url = $tunnels[0].public_url
                Write-Host "Tunnel: $url" -ForegroundColor DarkGreen
            }
        }
    }
    
    try {
        $json = $_ | ConvertFrom-Json
        
        # Apply filter if specified
        if ($Filter -and $json.msg -notmatch $Filter) {
            return
        }
        
        # Parse timestamp
        $epoch = [DateTimeOffset]::FromUnixTimeMilliseconds($json.time)
        $time = $epoch.LocalDateTime.ToString("HH:mm:ss")
        
        # Parse log level
        $levelNum = $json.level
        $level = switch($levelNum) {
            10 { "TRACE" }
            20 { "DEBUG" }
            30 { "INFO " }
            40 { "WARN " }
            50 { "ERROR" }
            60 { "FATAL" }
            default { "UNKN " }
        }
        
        # Color based on level
        $color = switch($levelNum) {
            {$_ -ge 50} { "Red" }
            {$_ -eq 40} { "Yellow" }
            {$_ -eq 30} { "Green" }
            {$_ -eq 20} { "Cyan" }
            default { "Gray" }
        }
        
        # Extract category from message
        $msg = $json.msg
        if ($msg -match '^\[([^\]]+)\]') {
            $category = $matches[1]
            Write-Host "$time " -NoNewline -ForegroundColor DarkGray
            Write-Host "[$level] " -NoNewline -ForegroundColor $color
            Write-Host "[$category] " -NoNewline -ForegroundColor Magenta
            Write-Host ($msg -replace '^\[[^\]]+\]\s*', '')
        } else {
            Write-Host "$time " -NoNewline -ForegroundColor DarkGray
            Write-Host "[$level] " -NoNewline -ForegroundColor $color
            Write-Host $msg
        }
        
        # Add extra fields if they exist
        if ($json.port) {
            Write-Host "         Port: $($json.port)" -ForegroundColor DarkGray
        }
        if ($json.env) {
            Write-Host "         Env: $($json.env)" -ForegroundColor DarkGray
        }
        
    } catch {
        # If not JSON, just print raw
        Write-Host $_ -ForegroundColor DarkGray
    }
}
