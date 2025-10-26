# TekUp Simple Port Scanner
param(
    [string]$Range = "8000-8010",
    [switch]$FindFree,
    [switch]$ShowUsed
)

function Scan-PortRange {
    param([string]$Range)
    
    if ($Range -match "^(\d+)-(\d+)$") {
        $start = [int]$matches[1]
        $end = [int]$matches[2]
    } else {
        Write-Host "Invalid range. Use format: 8000-8010" -ForegroundColor Red
        return
    }
    
    Write-Host "Scanning ports $start to $end..." -ForegroundColor Blue
    
    $results = @()
    for ($port = $start; $port -le $end; $port++) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        
        $status = if ($connection) { "OPEN" } else { "CLOSED" }
        $color = if ($connection) { "Red" } else { "Green" }
        
        $results += [PSCustomObject]@{
            Port = $port
            Status = $status
        }
        
        if ($ShowUsed -and $connection) {
            Write-Host "Port $port is OPEN" -ForegroundColor Red
        }
        elseif ($FindFree -and -not $connection) {
            Write-Host "Port $port is FREE" -ForegroundColor Green
            return $port
        }
    }
    
    if (-not $FindFree -and -not $ShowUsed) {
        $results | Format-Table -AutoSize
        
        $openCount = ($results | Where-Object { $_.Status -eq "OPEN" }).Count
        $closedCount = ($results | Where-Object { $_.Status -eq "CLOSED" }).Count
        
        Write-Host "Summary: $openCount open, $closedCount closed" -ForegroundColor Blue
    }
}

Scan-PortRange -Range $Range