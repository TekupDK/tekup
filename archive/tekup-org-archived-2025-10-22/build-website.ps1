# Build script for Tekup website with proper monorepo context

Write-Host "[Build] Building Tekup website Docker image..." -ForegroundColor Blue

# Stop and remove existing container
docker rm -f tekup-website-dev 2>$null

# Build from root context to include packages and scripts
Write-Host "[Build] Building with full monorepo context..." -ForegroundColor Yellow
docker build -f apps/website/Dockerfile.monorepo -t tekup-website-dev:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "[Build] Successfully built tekup-website-dev:latest" -ForegroundColor Green
    
    # Start the new container
    Write-Host "[Build] Starting website container..." -ForegroundColor Yellow
    docker run -d --name tekup-website-dev -p 8080:8080 --network tekup-development-network `
        -e NODE_ENV=development -e VITE_API_URL=http://localhost:3000 -e PORT=8080 `
        -v "${PWD}/apps/website:/app/apps/website" `
        -v "${PWD}/packages:/app/packages" `
        tekup-website-dev:latest
        
    # Test the website
    Start-Sleep -Seconds 10
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5
        Write-Host "[Build] Website is running: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "[Build] Visit http://localhost:8080 to view the website" -ForegroundColor Cyan
    } catch {
        Write-Host "[Build] Website test failed: $($_.Exception.Message)" -ForegroundColor Red
        docker logs --tail=20 tekup-website-dev
    }
} else {
    Write-Host "[Build] Docker build failed!" -ForegroundColor Red
}