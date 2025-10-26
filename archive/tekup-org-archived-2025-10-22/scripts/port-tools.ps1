# TekUp Port Tools - Developer Convenience Scripts
# Quick helpers for common port management operations

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("find-free", "kill-port", "tunnel", "proxy", "scan-range", "export-env", "docker-gen")]
    [string]$Operation,
    
    [string]$Port = "",
    [string]$Range = "8000-8010",
    [string]$Category = "",
    [string]$RemoteHost = "",
    [int]$LocalPort = 0,
    [int]$RemotePort = 0,
    [string]$Environment = "development"
)

function Write-PortTool {
    param($Message, $Color = "Green")
    Write-Host "[Port Tools] $Message" -ForegroundColor $Color
}

function Find-NextFreePort {
    param([string]$Range = "8000-8010", [string]$Category = "")
    
    if ($Range -match "^(\d+)-(\d+)$") {
        $startPort = [int]$matches[1]
        $endPort = [int]$matches[2]
    } else {
        Write-PortTool "Invalid range format. Use format: 8000-8010" "Red"
        return
    }
    
    Write-PortTool "Scanning for free ports in range $startPort-$endPort..."
    
    for ($port = $startPort; $port -le $endPort; $port++) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $connection) {
            Write-PortTool "Found free port: $port" "Green"
            
            if ($Category) {
                Write-PortTool "To allocate this port: .\scripts\port-manager.ps1 allocate -Service 'your-service' -Category '$Category' -Port $port" "Blue"
            }
            
            return $port
        }
    }
    
    Write-PortTool "No free ports found in range $startPort-$endPort" "Yellow"
    return $null
}

function Kill-ProcessOnPort {
    param([int]$Port)
    
    if ($Port -eq 0) {
        Write-PortTool "Port number required" "Red"
        return
    }
    
    Write-PortTool "Finding processes using port $Port..."
    
    try {
        # Get process using the port
        $netstat = netstat -ano | Select-String ":$Port "
        
        if ($netstat) {
            foreach ($line in $netstat) {
                if ($line -match "\s+(\d+)$") {
                    $pid = $matches[1]
                    try {
                        $process = Get-Process -Id $pid -ErrorAction Stop
                        Write-PortTool "Found process: $($process.ProcessName) (PID: $pid)" "Yellow"
                        
                        $confirm = Read-Host "Kill process $($process.ProcessName) (PID: $pid)? [y/N]"
                        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                            Stop-Process -Id $pid -Force
                            Write-PortTool "Process killed successfully" "Green"
                        } else {
                            Write-PortTool "Operation cancelled" "Blue"
                        }
                    } catch {
                        Write-PortTool "Could not get process info for PID $pid" "Yellow"
                    }
                }
            }
        } else {
            Write-PortTool "No processes found using port $Port" "Green"
        }
    } catch {
        Write-PortTool "Error: $($_.Exception.Message)" "Red"
    }
}

function Create-PortTunnel {
    param([int]$LocalPort, [string]$RemoteHost, [int]$RemotePort)
    
    if ($LocalPort -eq 0 -or $RemoteHost -eq "" -or $RemotePort -eq 0) {
        Write-PortTool "LocalPort, RemoteHost, and RemotePort are required for tunneling" "Red"
        Write-PortTool "Example: -LocalPort 8080 -RemoteHost 'remote.server.com' -RemotePort 80" "Blue"
        return
    }
    
    Write-PortTool "Creating SSH tunnel: localhost:$LocalPort -> $RemoteHost`:$RemotePort" "Blue"
    Write-PortTool "Command to run: ssh -L $LocalPort`:$RemoteHost`:$RemotePort user@$RemoteHost" "Green"
    Write-PortTool "Press Ctrl+C to stop the tunnel" "Yellow"
    
    # Note: This would require SSH to be configured
    # The actual SSH command would be:
    # ssh -L $LocalPort:$RemoteHost:$RemotePort user@$RemoteHost
}

function Create-PortProxy {
    param([int]$LocalPort, [string]$RemoteHost, [int]$RemotePort)
    
    if ($LocalPort -eq 0 -or $RemoteHost -eq "" -or $RemotePort -eq 0) {
        Write-PortTool "LocalPort, RemoteHost, and RemotePort are required for proxy" "Red"
        return
    }
    
    Write-PortTool "Creating port proxy: localhost:$LocalPort -> $RemoteHost`:$RemotePort" "Blue"
    
    try {
        # Windows netsh command for port forwarding
        $cmd = "netsh interface portproxy add v4tov4 listenport=$LocalPort listenaddress=127.0.0.1 connectport=$RemotePort connectaddress=$RemoteHost"
        Write-PortTool "Running: $cmd" "Yellow"
        
        Invoke-Expression $cmd
        Write-PortTool "Port proxy created successfully" "Green"
        Write-PortTool "To remove: netsh interface portproxy delete v4tov4 listenport=$LocalPort listenaddress=127.0.0.1" "Blue"
    } catch {
        Write-PortTool "Error creating proxy: $($_.Exception.Message)" "Red"
        Write-PortTool "Note: This command requires administrator privileges" "Yellow"
    }
}

function Scan-PortRange {
    param([string]$Range = "8000-8010")
    
    if ($Range -match "^(\d+)-(\d+)$") {
        $startPort = [int]$matches[1]
        $endPort = [int]$matches[2]
    } else {
        Write-PortTool "Invalid range format. Use format: 8000-8010" "Red"
        return
    }
    
    Write-PortTool "Scanning port range $startPort-$endPort..." "Blue"
    
    $results = @()
    for ($port = $startPort; $port -le $endPort; $port++) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        $status = if ($connection) { "Open" } else { "Closed" }
        
        $results += [PSCustomObject]@{
            Port = $port
            Status = $status
        }
    }
    
    Write-Host ""
    Write-PortTool "Port scan results:" "Green"
    $results | Format-Table -AutoSize
    
    $openPorts = ($results | Where-Object { $_.Status -eq "Open" }).Count
    $closedPorts = ($results | Where-Object { $_.Status -eq "Closed" }).Count
    
    Write-PortTool "Summary: $openPorts open, $closedPorts closed" "Blue"
}

function Export-EnvironmentVariables {
    param([string]$Environment = "development")
    
    Write-PortTool "Generating environment variables for $Environment..." "Blue"
    
    # Get service configuration from port-manager
    $services = @{
        "TEKUP_UNIFIED_PLATFORM_PORT" = 8000
        "TEKUP_CRM_WEB_PORT" = 3005
        "FLOW_API_PORT" = 8001
        "FLOW_WEB_PORT" = 3001
        "VOICE_AGENT_PORT" = 8002
        "LEAD_PLATFORM_PORT" = 8003
        "AGENTSCOPE_PORT" = 8004
        "WEBSITE_PORT" = 3080
        "POSTGRES_PORT" = 5432
        "REDIS_PORT" = 6379
        "PROMETHEUS_PORT" = 9090
        "GRAFANA_PORT" = 9091
    }
    
    $envContent = @"
# TekUp Port Environment Variables - $Environment
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

"@
    
    foreach ($service in $services.GetEnumerator()) {
        $envContent += "$($service.Key)=$($service.Value)`n"
    }
    
    $envFile = ".env.ports.$Environment"
    Set-Content -Path $envFile -Value $envContent
    
    Write-PortTool "Environment variables exported to: $envFile" "Green"
    Write-PortTool "To use: source $envFile (Linux/Mac) or Get-Content $envFile | Invoke-Expression (PowerShell)" "Blue"
}

function Generate-DockerCompose {
    param([string]$Environment = "development")
    
    Write-PortTool "Generating Docker Compose file for $Environment..." "Blue"
    
    $services = @{
        "tekup-unified-platform" = 8000
        "tekup-crm-web" = 3005
        "flow-api" = 8001
        "flow-web" = 3001
        "voice-agent" = 8002
        "lead-platform" = 8003
        "agentscope-enhanced" = 8004
        "website" = 3080
    }
    
    $compose = @"
# TekUp Docker Compose - Generated for $Environment
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

version: '3.8'

networks:
  tekup-network:
    driver: bridge

services:
"@

    foreach ($service in $services.GetEnumerator()) {
        $serviceName = $service.Key
        $port = $service.Value
        
        $compose += "`n
  $serviceName`:
    image: tekup/$serviceName`:latest
    ports:
      - `"$port`:$port`"
    environment:
      - NODE_ENV=$Environment
      - PORT=$port
    networks:
      - tekup-network
    restart: unless-stopped
"
    }
    
    $composeFile = "docker-compose.$Environment.generated.yml"
    Set-Content -Path $composeFile -Value $compose
    
    Write-PortTool "Docker Compose file generated: $composeFile" "Green"
    Write-PortTool "To use: docker-compose -f $composeFile up -d" "Blue"
}

# Main execution
switch ($Operation.ToLower()) {
    "find-free" {
        $result = Find-NextFreePort -Range $Range -Category $Category
        if ($result) {
            Write-Host $result  # Return the port number for scripting
        }
    }
    "kill-port" {
        if ($Port) {
            Kill-ProcessOnPort -Port ([int]$Port)
        } else {
            Write-PortTool "Port parameter required" "Red"
        }
    }
    "tunnel" {
        Create-PortTunnel -LocalPort $LocalPort -RemoteHost $RemoteHost -RemotePort $RemotePort
    }
    "proxy" {
        Create-PortProxy -LocalPort $LocalPort -RemoteHost $RemoteHost -RemotePort $RemotePort
    }
    "scan-range" {
        Scan-PortRange -Range $Range
    }
    "export-env" {
        Export-EnvironmentVariables -Environment $Environment
    }
    "docker-gen" {
        Generate-DockerCompose -Environment $Environment
    }
    default {
        Write-PortTool "Unknown operation: $Operation" "Red"
        Write-PortTool "Available operations: find-free, kill-port, tunnel, proxy, scan-range, export-env, docker-gen" "Blue"
    }
}