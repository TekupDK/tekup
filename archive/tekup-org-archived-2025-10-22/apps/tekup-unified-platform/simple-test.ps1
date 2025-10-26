# Simple Lead Platform API Test
$baseUrl = "http://localhost:3000/api"
$headers = @{
    'Content-Type' = 'application/json'
    'x-tenant-id' = 'test-tenant'
}

Write-Host "Starting Lead Platform API Tests..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "Health check passed: $($health.status)" -ForegroundColor Green
}
catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: List Leads
Write-Host "Test 2: List Leads" -ForegroundColor Cyan
try {
    $leads = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get -Headers $headers
    Write-Host "Listed $($leads.leads.Count) leads, total: $($leads.total)" -ForegroundColor Green
}
catch {
    Write-Host "List leads failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create New Lead
Write-Host "Test 3: Create New Lead" -ForegroundColor Cyan
$newLead = @{
    name = "Test Suite Lead 2"
    email = "testsuite2@lead.dk"
    phone = "+45 12 34 56 78"
    company = "Test Suite 2 ApS"
    source = "automated_test"
    notes = "Created by simple test suite"
} | ConvertTo-Json

try {
    $createdLead = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Post -Headers $headers -Body $newLead
    Write-Host "Created lead: $($createdLead.name) (ID: $($createdLead.id))" -ForegroundColor Green
    $testLeadId = $createdLead.id
}
catch {
    Write-Host "Create lead failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Specific Lead
Write-Host "Test 4: Get Specific Lead" -ForegroundColor Cyan
try {
    $lead = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Get -Headers $headers
    Write-Host "Retrieved lead: $($lead.name)" -ForegroundColor Green
}
catch {
    Write-Host "Get lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Update Lead
Write-Host "Test 5: Update Lead" -ForegroundColor Cyan
$updateData = @{
    notes = "Updated by simple test suite - $(Get-Date)"
    company = "Updated Test Suite 2 ApS"
} | ConvertTo-Json

try {
    $updatedLead = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Put -Headers $headers -Body $updateData
    Write-Host "Updated lead: $($updatedLead.company)" -ForegroundColor Green
}
catch {
    Write-Host "Update lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Calculate Lead Score
Write-Host "Test 6: Calculate Lead Score" -ForegroundColor Cyan
try {
    $scoreResult = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/score" -Method Post -Headers $headers
    Write-Host "Calculated lead score: $($scoreResult.score)" -ForegroundColor Green
}
catch {
    Write-Host "Calculate score failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Analytics - Conversion Analytics
Write-Host "Test 7: Conversion Analytics" -ForegroundColor Cyan
try {
    $conversionAnalytics = Invoke-RestMethod -Uri "$baseUrl/leads/analytics/conversion" -Method Get -Headers $headers
    Write-Host "Conversion rate: $($conversionAnalytics.conversionRate)%" -ForegroundColor Green
}
catch {
    Write-Host "Conversion analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Delete Lead
Write-Host "Test 8: Delete Test Lead" -ForegroundColor Cyan
try {
    $deleteResult = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Delete -Headers $headers
    if ($deleteResult.success) {
        Write-Host "Deleted test lead successfully" -ForegroundColor Green
    }
}
catch {
    Write-Host "Delete lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Lead Platform API Tests Completed!" -ForegroundColor Green
