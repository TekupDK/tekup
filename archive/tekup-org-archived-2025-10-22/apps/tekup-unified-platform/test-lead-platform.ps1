# Tekup Lead Platform API Test Suite
# Comprehensive testing of all Lead Platform endpoints

$baseUrl = "http://localhost:3000/api"
$headers = @{
    'Content-Type' = 'application/json'
    'x-tenant-id' = 'test-tenant'
}

Write-Host "🚀 Starting Lead Platform API Test Suite..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n📋 Test 1: Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check passed: $($health.status)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: List Leads (GET /leads)
Write-Host "`n📋 Test 2: List Leads" -ForegroundColor Cyan
try {
    $leads = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get -Headers $headers
    Write-Host "✅ Listed $($leads.leads.Count) leads, total: $($leads.total)" -ForegroundColor Green
}
catch {
    Write-Host "❌ List leads failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create New Lead (POST /leads)
Write-Host "`n📋 Test 3: Create New Lead" -ForegroundColor Cyan
$newLead = @{
    name = "Test Suite Lead"
    email = "testsuite@lead.dk"
    phone = "+45 12 34 56 78"
    company = "Test Suite ApS"
    source = "automated_test"
    notes = "Created by test suite"
} | ConvertTo-Json

try {
    $createdLead = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Post -Headers $headers -Body $newLead
    Write-Host "✅ Created lead: $($createdLead.name) (ID: $($createdLead.id))" -ForegroundColor Green
    $testLeadId = $createdLead.id
}
catch {
    Write-Host "❌ Create lead failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Specific Lead (GET /leads/:id)
Write-Host "`n📋 Test 4: Get Specific Lead" -ForegroundColor Cyan
try {
    $lead = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Get -Headers $headers
    Write-Host "✅ Retrieved lead: $($lead.name)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Get lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Update Lead (PUT /leads/:id)
Write-Host "`n📋 Test 5: Update Lead" -ForegroundColor Cyan
$updateData = @{
    notes = "Updated by test suite - $(Get-Date)"
    company = "Updated Test Suite ApS"
} | ConvertTo-Json

try {
    $updatedLead = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Put -Headers $headers -Body $updateData
    Write-Host "✅ Updated lead: $($updatedLead.company)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Update lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Calculate Lead Score (POST /leads/:id/score)
Write-Host "`n📋 Test 6: Calculate Lead Score" -ForegroundColor Cyan
try {
    $scoreResult = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/score" -Method Post -Headers $headers
    Write-Host "✅ Calculated lead score: $($scoreResult.score)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Calculate score failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Qualify Lead (POST /leads/:id/qualify)
Write-Host "`n📋 Test 7: Qualify Lead" -ForegroundColor Cyan
$qualificationData = @{
    criteria = "Budget and Authority"
    result = "Qualified"
    score = 85
    notes = "Has budget and decision making authority"
} | ConvertTo-Json

try {
    $qualification = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/qualify" -Method Post -Headers $headers -Body $qualificationData
    Write-Host "✅ Qualified lead: $($qualification.result)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Qualify lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Get Lead Qualifications (GET /leads/:id/qualifications)
Write-Host "`n📋 Test 8: Get Lead Qualifications" -ForegroundColor Cyan
try {
    $qualifications = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/qualifications" -Method Get -Headers $headers
    Write-Host "✅ Retrieved $($qualifications.Count) qualification(s)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Get qualifications failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Assign Lead (POST /leads/:id/assign)
Write-Host "`n📋 Test 9: Assign Lead" -ForegroundColor Cyan
$assignmentData = @{
    assignedTo = "test-user@tekup.dk"
    notes = "Assigned by test suite"
} | ConvertTo-Json

try {
    $assignedLead = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/assign" -Method Post -Headers $headers -Body $assignmentData
    Write-Host "✅ Assigned lead successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Assign lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Schedule Follow-up (POST /leads/:id/follow-up)
Write-Host "`n📋 Test 10: Schedule Follow-up" -ForegroundColor Cyan
$followUpData = @{
    scheduledAt = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    type = "phone_call"
    notes = "Follow-up call scheduled by test suite"
} | ConvertTo-Json

try {
    $followUp = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/follow-up" -Method Post -Headers $headers -Body $followUpData
    Write-Host "✅ Scheduled follow-up: $($followUp.followUpId)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Schedule follow-up failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: Convert Lead (POST /leads/:id/convert)
Write-Host "`n📋 Test 11: Convert Lead" -ForegroundColor Cyan
$conversionData = @{
    conversionType = "customer"
    notes = "Converted by test suite"
} | ConvertTo-Json

try {
    $conversion = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/convert" -Method Post -Headers $headers -Body $conversionData
    Write-Host "✅ Converted lead: $($conversion.message)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Convert lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Get Lead Insights (POST /leads/:id/insights)
Write-Host "`n📋 Test 12: Get Lead Insights" -ForegroundColor Cyan
$insightData = @{
    analysisType = "comprehensive"
    includeMarketData = $true
} | ConvertTo-Json

try {
    $insights = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId/insights" -Method Post -Headers $headers -Body $insightData
    Write-Host "✅ Generated lead insights successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Get lead insights failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 13: Analytics - Conversion Analytics (GET /leads/analytics/conversion)
Write-Host "`n📋 Test 13: Conversion Analytics" -ForegroundColor Cyan
try {
    $conversionAnalytics = Invoke-RestMethod -Uri "$baseUrl/leads/analytics/conversion" -Method Get -Headers $headers
    Write-Host "✅ Conversion rate: $($conversionAnalytics.conversionRate)%" -ForegroundColor Green
}
catch {
    Write-Host "❌ Conversion analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 14: Analytics - Source Analytics (GET /leads/analytics/sources)
Write-Host "`n📋 Test 14: Source Analytics" -ForegroundColor Cyan
try {
    $sourceAnalytics = Invoke-RestMethod -Uri "$baseUrl/leads/analytics/sources" -Method Get -Headers $headers
    Write-Host "✅ Retrieved source performance data for $($sourceAnalytics.sourcePerformance.Count) sources" -ForegroundColor Green
}
catch {
    Write-Host "❌ Source analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 15: Analytics - Pipeline Analytics (GET /leads/analytics/pipeline)
Write-Host "`n📋 Test 15: Pipeline Analytics" -ForegroundColor Cyan
try {
    $pipelineAnalytics = Invoke-RestMethod -Uri "$baseUrl/leads/analytics/pipeline" -Method Get -Headers $headers
    Write-Host "✅ Pipeline total value: $($pipelineAnalytics.totalValue)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Pipeline analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 16: Search and Filter Leads
Write-Host "`n📋 Test 16: Search and Filter Leads" -ForegroundColor Cyan
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/leads?search=test&status=converted&limit=10" -Method Get -Headers $headers
    Write-Host "✅ Search returned $($searchResults.leads.Count) leads" -ForegroundColor Green
}
catch {
    Write-Host "❌ Search leads failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 17: Delete Lead (DELETE /leads/:id)
Write-Host "`n📋 Test 17: Delete Test Lead" -ForegroundColor Cyan
try {
    $deleteResult = Invoke-RestMethod -Uri "$baseUrl/leads/$testLeadId" -Method Delete -Headers $headers
    if ($deleteResult.success) {
        Write-Host "✅ Deleted test lead successfully" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Delete lead failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Lead Platform API Test Suite Completed!" -ForegroundColor Green
Write-Host "All core functionality has been tested." -ForegroundColor Green
