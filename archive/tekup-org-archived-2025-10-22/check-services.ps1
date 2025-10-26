# Check Status of All Tekup Services

Write-Host "Checking Tekup Services Status..." -ForegroundColor Green

# Check if services are running on their respective ports
$services = @(
    @{ Name = "Tekup Unified Platform"; Port = 3000; URL = "http://localhost:3000" },
    @{ Name = "AgentScope Backend"; Port = 8000; URL = "http://localhost:8000/health" },
    @{ Name = "Jarvis Frontend"; Port = 3001; URL = "http://localhost:3001" }
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is running on port $($service.Port)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($service.Name) responded with status $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($service.Name) is not responding on port $($service.Port)" -ForegroundColor Red
    }
}

Write-Host "`nProcess Information:" -ForegroundColor Cyan
# Check for Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Node.js processes running: $($nodeProcesses.Count)" -ForegroundColor White
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Yellow
}

# Check for Python processes
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "Python processes running: $($pythonProcesses.Count)" -ForegroundColor White
} else {
    Write-Host "No Python processes found" -ForegroundColor Yellow
}
