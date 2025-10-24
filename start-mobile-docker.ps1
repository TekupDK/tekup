# Start only the Expo Mobile container in Docker with tunnel mode
# Detect host IP (10.* or 192.168.*)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*" } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) { $ip = "127.0.0.1" }

Write-Host "Using HOST_IP=$ip" -ForegroundColor Cyan

# Start only the mobile service, skip dependencies (backend/redis/postgres)
$env:HOST_IP = $ip

docker-compose -f docker-compose.mobile.yml up --build --no-deps mobile