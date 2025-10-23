# PowerShell test runner with env vars
# Usage: .\run-tests.ps1

Write-Host "Setting environment variables..."
$env:SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co"
$env:SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8"
$env:SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo"
$env:ENCRYPTION_KEY = "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947"
$env:ENCRYPTION_SALT = "9b2af923a0665b2f47c7a799b9484b28"
$env:BILLY_TEST_MODE = "true"
$env:BILLY_DRY_RUN = "true"

Write-Host "Environment ready"
Write-Host ""
Write-Host "Running integration tests..."
npx tsx test-integration.ts
