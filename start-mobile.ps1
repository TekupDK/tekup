# 🚀 Start RendetaljeOS Mobile Development (Windows)
#
# Dette script starter hele mobile development stack

Write-Host "🚀 RendetaljeOS Mobile Development Starter" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker is running
Write-Host "✓ Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Get local IP address
Write-Host ""
Write-Host "🌐 Finding your local IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✓ Your IP address: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "✗ Could not find IP address automatically" -ForegroundColor Red
    $ipAddress = Read-Host "Please enter your IP address manually (e.g., 192.168.1.100)"
}

# Set environment variable
$env:HOST_IP = $ipAddress

# Display setup info
Write-Host ""
Write-Host "📱 Mobile App Configuration:" -ForegroundColor Cyan
Write-Host "   Backend API: http://${ipAddress}:3001" -ForegroundColor White
Write-Host "   Expo Server: exp://${ipAddress}:19000" -ForegroundColor White
Write-Host "   Web DevTools: http://localhost:19002" -ForegroundColor White
Write-Host ""

# Ask to continue
Write-Host "Ready to start? This will:" -ForegroundColor Yellow
Write-Host "  1. Start PostgreSQL database" -ForegroundColor White
Write-Host "  2. Start Redis cache" -ForegroundColor White
Write-Host "  3. Start NestJS backend API" -ForegroundColor White
Write-Host "  4. Start Expo development server" -ForegroundColor White
Write-Host ""
$continue = Read-Host "Continue? (y/n)"

if ($continue -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

# Start Docker Compose
Write-Host ""
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host ""

docker-compose -f docker-compose.mobile.yml up

# Cleanup on exit
Write-Host ""
Write-Host "Shutting down..." -ForegroundColor Yellow
docker-compose -f docker-compose.mobile.yml down
