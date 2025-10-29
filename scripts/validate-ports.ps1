# TekupDK Port Conflict Detection Script
# Validates port usage across all docker-compose files
# Usage: .\scripts\validate-ports.ps1

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "TekupDK Port Conflict Detection Script" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Validates port usage across all docker-compose files" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\validate-ports.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Help    Show this help message" -ForegroundColor White
    exit 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Port registry - maps ports to services
$PortRegistry = @{}
$ConflictsFound = @{}

Write-Host "🔍 TekupDK Port Conflict Detection" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Function to extract ports from docker-compose.yml
function Extract-Ports {
    param(
        [string]$ComposeFile,
        [string]$ServiceName
    )

    if (!(Test-Path $ComposeFile)) {
        Write-Host "⚠️  Warning: $ComposeFile not found" -ForegroundColor Yellow
        return
    }

    Write-Host "📄 Analyzing: $ComposeFile" -ForegroundColor Blue

    try {
        $content = Get-Content $ComposeFile -Raw

        # Extract port mappings using regex
        $portMatches = [regex]::Matches($content, 'ports:\s*\n((?:\s*-.*\n?)*)', [System.Text.RegularExpressions.RegexOptions]::Multiline)

        foreach ($match in $portMatches) {
            $portsSection = $match.Groups[1].Value
            $portLines = $portsSection -split '\n' | Where-Object { $_ -match '\s*-\s*["'']?([^"'':]+):' }

            foreach ($line in $portLines) {
                if ($line -match '\s*-\s*["'']?([^"'':]+):') {
                    $externalPort = $matches[1]

                    # Handle variable substitution (e.g., ${PORT:-3001})
                    if ($externalPort -match '\$\{.*:-([^}]+)\}') {
                        $externalPort = $matches[1]
                    }

                    # Skip if not a number
                    if ($externalPort -notmatch '^\d+$') {
                        continue
                    }

                    # Check for conflicts
                    if ($PortRegistry.ContainsKey($externalPort)) {
                        $ConflictsFound[$externalPort] = "$($PortRegistry[$externalPort]) vs $ServiceName ($ComposeFile)"
                        Write-Host "❌ Conflict: Port $externalPort used by $($PortRegistry[$externalPort]) and $ServiceName" -ForegroundColor Red
                    } else {
                        $PortRegistry[$externalPort] = "$ServiceName ($ComposeFile)"
                        Write-Host "✅ Port $externalPort`: $ServiceName" -ForegroundColor Green
                    }
                }
            }
        }
    } catch {
        Write-Host "❌ Error reading $ComposeFile`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main validation function
function Validate-AllComposeFiles {
    Write-Host ""
    Write-Host "🔍 Scanning Docker Compose Files" -ForegroundColor Blue
    Write-Host "==================================" -ForegroundColor Blue

    # List of docker-compose files to check
    $composeFiles = @(
        @{ File = "docker-compose.mobile.yml"; Service = "Rendetalje Mobile" },
        @{ File = "apps\rendetalje\services\calendar-mcp\docker-compose.yml"; Service = "Calendar MCP" },
        @{ File = "tekup-mcp-servers\docker-compose.yml"; Service = "Tekup MCP Servers" },
        @{ File = "services\tekup-gmail-services\docker-compose.yml"; Service = "Gmail Services" }
    )

    foreach ($composeEntry in $composeFiles) {
        $filePath = Join-Path $ProjectRoot $composeEntry.File
        Extract-Ports -ComposeFile $filePath -ServiceName $composeEntry.Service
    }
}

# Generate report
function Generate-Report {
    Write-Host ""
    Write-Host "📊 Port Allocation Report" -ForegroundColor Blue
    Write-Host "==========================" -ForegroundColor Blue

    Write-Host ""
    Write-Host "✅ Valid Ports:" -ForegroundColor Green
    foreach ($port in ($PortRegistry.Keys | Sort-Object { [int]$_ })) {
        if (!$ConflictsFound.ContainsKey($port)) {
            Write-Host "  $port`: $($PortRegistry[$port])"
        }
    }

    if ($ConflictsFound.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ Port Conflicts:" -ForegroundColor Red
        foreach ($port in ($ConflictsFound.Keys | Sort-Object { [int]$_ })) {
            Write-Host "  $port`: $($ConflictsFound[$port])"
        }
        return $false
    } else {
        Write-Host ""
        Write-Host "🎉 No port conflicts detected!" -ForegroundColor Green
        return $true
    }
}

# Check system ports
function Check-SystemPorts {
    Write-Host ""
    Write-Host "🔍 Checking System Port Usage" -ForegroundColor Blue
    Write-Host "===============================" -ForegroundColor Blue

    $systemConflicts = @()

    foreach ($port in $PortRegistry.Keys) {
        if (!$ConflictsFound.ContainsKey($port)) {
            try {
                $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
                if ($connections) {
                    $systemConflicts += $port
                    Write-Host "⚠️  Port $port is already in use on system" -ForegroundColor Yellow
                }
            } catch {
                # Get-NetTCPConnection might not be available or might fail
                Write-Host "⚠️  Could not check system port $port" -ForegroundColor Yellow
            }
        }
    }

    if ($systemConflicts.Count -eq 0) {
        Write-Host "✅ No system port conflicts detected" -ForegroundColor Green
    }
}

# Main execution
function Main {
    Validate-AllComposeFiles
    Check-SystemPorts

    if (Generate-Report) {
        Write-Host ""
        Write-Host "✅ Port validation completed successfully" -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "❌ Port conflicts found! Please resolve before starting services." -ForegroundColor Red
        Write-Host "💡 Check PORT_ALLOCATION_MASTER.md for port assignments" -ForegroundColor Yellow
        exit 1
    }
}

# Run main function
Main