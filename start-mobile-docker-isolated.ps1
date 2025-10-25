#!/usr/bin/env pwsh
# Start mobile Expo in Docker with branch isolation
# Automatically sets up ports, project name, and HOST_IP per branch

param(
    [switch]$Build,
    [switch]$Interactive,
    [string]$Compose = "docker-compose.mobile.yml"
)

# Get current branch name
$branch = & git rev-parse --abbrev-ref HEAD
$gitBranch = $branch -replace '[^a-zA-Z0-9\-]', '-'
$projectName = "tekup-$gitBranch"

# Calculate ports based on branch hash to avoid conflicts
$branchHash = [System.Text.Encoding]::UTF8.GetBytes($branch).GetHashCode() -band 0xFFFF
$portBase = 19000 + ($branchHash % 50) * 10  # Spread across 19000-19490
$expoGoPort = $portBase
$expoMetroPort = $portBase + 1
$expoDevtoolsPort = $portBase + 2
$rcMetroPort = 8000 + ($branchHash % 100)

# Get HOST_IP (first non-loopback, non-virtual IPv4 address)
$hostIp = @(Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notmatch '^169\.254|^127\.' -and
        $_.InterfaceAlias -notmatch 'vEthernet|Loopback'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress)[0] || "localhost"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Mobile Expo Docker - Branch Isolated" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Branch:        $branch" -ForegroundColor Yellow
Write-Host "📦 Project:       $projectName" -ForegroundColor Yellow
Write-Host "🌐 Host IP:       $hostIp" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔌 Port Allocation (isolated per branch):" -ForegroundColor Cyan
Write-Host "   Expo Go DevTools:     $expoGoPort" -ForegroundColor Blue
Write-Host "   Metro Bundler:        $expoMetroPort" -ForegroundColor Blue
Write-Host "   Expo DevTools Web:    $expoDevtoolsPort" -ForegroundColor Blue
Write-Host "   React Native Metro:   $rcMetroPort" -ForegroundColor Blue
Write-Host ""
Write-Host "📱 Connect with Expo Go:" -ForegroundColor Cyan
Write-Host "   Open http://localhost:$expoDevtoolsPort on this PC" -ForegroundColor Blue
Write-Host "   Scan QR code with Expo Go app on phone" -ForegroundColor Blue
Write-Host ""
Write-Host "💾 Environment Variables:" -ForegroundColor Cyan
Write-Host "   COMPOSE_PROJECT_NAME=$projectName" -ForegroundColor Blue
Write-Host "   HOST_IP=$hostIp" -ForegroundColor Blue
Write-Host "   GIT_BRANCH=$gitBranch" -ForegroundColor Blue
Write-Host ""

# Set environment variables for docker-compose
$env:COMPOSE_PROJECT_NAME = $projectName
$env:HOST_IP = $hostIp
$env:GIT_BRANCH = $gitBranch
$env:EXPO_GO_PORT = $expoGoPort
$env:EXPO_METRO_PORT = $expoMetroPort
$env:EXPO_DEVTOOLS_PORT = $expoDevtoolsPort
$env:RCT_METRO_PORT = $rcMetroPort

# Build flags
$buildFlag = if ($Build) { "--build" } else { "" }

# Run docker-compose
if ($Interactive) {
    Write-Host "🔧 Starting in interactive mode..." -ForegroundColor Green
    docker-compose -f $Compose -p $projectName up $buildFlag --no-deps mobile
} else {
    Write-Host "🔧 Starting in detached mode..." -ForegroundColor Green
    docker-compose -f $Compose -p $projectName up $buildFlag --no-deps -d mobile
    Start-Sleep 2
    Write-Host ""
    Write-Host "📊 Container Status:" -ForegroundColor Green
    docker-compose -f $Compose -p $projectName ps mobile
    Write-Host ""
    Write-Host "📋 Logs (last 20 lines):" -ForegroundColor Green
    docker-compose -f $Compose -p $projectName logs --tail=20 mobile
    Write-Host ""
    Write-Host "💡 To view live logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f $Compose -p $projectName logs -f mobile" -ForegroundColor Blue
    Write-Host ""
    Write-Host "⏹️  To stop:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f $Compose -p $projectName down" -ForegroundColor Blue
}
