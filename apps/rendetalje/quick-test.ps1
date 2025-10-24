# Quick Test Script for Rendetalje v1.2.0
# Run this to verify backend is working

Write-Host "
 Testing Rendetalje Backend...
" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health"
    Write-Host " PASS: Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host " FAIL: Backend not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "
Test 2: Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@rendetalje.dk"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host " PASS: Login successful, token received" -ForegroundColor Green
} catch {
    Write-Host " FAIL: Login failed" -ForegroundColor Red
    exit 1
}

# Test 3: Get Jobs
Write-Host "
Test 3: Get Jobs..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $jobs = Invoke-RestMethod -Uri "http://localhost:3000/jobs" -Method GET -Headers $headers
    Write-Host " PASS: Jobs retrieved ($($jobs.Count) jobs found)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: Could not get jobs" -ForegroundColor Red
}

# Test 4: Get Customers
Write-Host "
Test 4: Get Customers..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "http://localhost:3000/customers" -Method GET -Headers $headers
    Write-Host " PASS: Customers retrieved ($($customers.Count) customers found)" -ForegroundColor Green
} catch {
    Write-Host " FAIL: Could not get customers" -ForegroundColor Red
}

Write-Host "
 All tests completed!
" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Login: admin@rendetalje.dk / admin123
" -ForegroundColor Yellow
