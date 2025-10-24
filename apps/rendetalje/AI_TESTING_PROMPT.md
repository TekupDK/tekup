# 🧪 Rendetalje v1.2.0 - AI Testing Prompt

**For Comet / AI Assistant / QA Testers**

---

## 📋 Test Mission

You are testing **Rendetalje v1.2.0** - a full-stack cleaning service management platform with:
- **Backend:** NestJS REST API (localhost:3000)
- **Frontend:** Next.js 15 App Router (localhost:3001)
- **Database:** PostgreSQL + Docker

**Your goal:** Verify all CRUD operations, authentication, and UI features work correctly.

---

## 🚀 Quick Setup (If Services Aren't Running)

### Start All Services:

```powershell
# 1. Start Database (PostgreSQL)
cd C:\Users\Jonas-dev\tekup\apps\production\tekup-database
docker-compose up -d
Start-Sleep -Seconds 8

# 2. Start Backend
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\backend-nestjs
npm run start:dev
# Wait ~15 seconds for compilation
Start-Sleep -Seconds 15

# 3. Start Frontend (new terminal)
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
npm run dev
```

---

## 🧪 Test Plan (45 minutes)

### **Phase 1: Backend API Tests (15 min)**

#### Test 1.1: Health Check
```powershell
curl http://localhost:3000/health
```
**Expected:** `{"status":"ok"}`

#### Test 1.2: Authentication - Login
```powershell
$body = @{
    email = "admin@rendetalje.dk"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.access_token
Write-Output "Token: $token"
```
**Expected:** JWT token returned

#### Test 1.3: Get All Jobs
```powershell
$headers = @{
    Authorization = "Bearer $token"
}
Invoke-RestMethod -Uri "http://localhost:3000/jobs" -Method GET -Headers $headers
```
**Expected:** JSON array of jobs

#### Test 1.4: Create New Job
```powershell
$jobBody = @{
    title = "Test Cleaning Job"
    description = "AI Test - Kitchen deep clean"
    customerId = "existing-customer-id-here"
    scheduledDate = "2025-10-25T10:00:00Z"
    estimatedDuration = 120
    priority = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/jobs" -Method POST -Body $jobBody -ContentType "application/json" -Headers $headers
```
**Expected:** New job created with ID

#### Test 1.5: Get All Customers
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers" -Method GET -Headers $headers
```
**Expected:** JSON array of customers

#### Test 1.6: Create New Customer
```powershell
$customerBody = @{
    name = "AI Test Customer"
    email = "aitest@example.com"
    phone = "+4512345678"
    address = "Test Street 123"
    city = "Copenhagen"
    postalCode = "2100"
    type = "residential"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/customers" -Method POST -Body $customerBody -ContentType "application/json" -Headers $headers
```
**Expected:** New customer created with ID

---

### **Phase 2: Frontend UI Tests (20 min)**

Open browser: `http://localhost:3001`

#### Test 2.1: Login Page
1. Navigate to login page (should redirect automatically if not logged in)
2. Enter credentials:
   - Email: `admin@rendetalje.dk`
   - Password: `admin123`
3. Click "Log ind"

**Expected:**
- ✅ Redirect to dashboard
- ✅ Toast notification: "Login successful"
- ✅ User info visible in header

#### Test 2.2: Dashboard Page
Check the dashboard displays:
- [ ] **Active Jobs** count (with emoji 🔵)
- [ ] **Pending Jobs** count (with emoji ⏳)
- [ ] **Completed Jobs** count (with emoji ✅)
- [ ] **Total Customers** count (with emoji 👥)
- [ ] User info in header (name + email)
- [ ] Quick action buttons (Ny Opgave, Se Kunder)

**Expected:** All stats show real numbers from backend (not 0)

#### Test 2.3: Jobs Page - List View
1. Click "Opgaver" in sidebar (or navigate to `/jobs`)
2. Verify you see:
   - [ ] Filter buttons (Alle, Afventer, I gang, Afsluttet)
   - [ ] Search input field
   - [ ] "Opret Opgave" button
   - [ ] List of job cards with:
     - Title
     - Customer name
     - Status badge (color-coded)
     - Scheduled date
     - Priority indicator
     - Edit/Delete buttons

#### Test 2.4: Jobs Page - Create Job
1. Click "Opret Opgave" button
2. Fill in form:
   - Title: "AI Test - Bathroom Cleaning"
   - Description: "Deep clean bathroom with tiles"
   - Customer: Select from dropdown
   - Scheduled Date: Tomorrow's date
   - Duration: 90 minutes
   - Priority: "high"
3. Click "Opret"

**Expected:**
- ✅ Modal closes
- ✅ Toast: "Job created successfully"
- ✅ New job appears in list with "Afventer" status

#### Test 2.5: Jobs Page - Filter & Search
1. Click "I gang" filter button
   - **Expected:** Only in-progress jobs shown
2. Click "Alle" to reset
3. Type "Bathroom" in search field
   - **Expected:** Only jobs with "Bathroom" in title/description shown

#### Test 2.6: Jobs Page - Edit Job
1. Find the AI test job you just created
2. Click "Rediger" button
3. Change title to "AI Test - Bathroom & Kitchen"
4. Click "Gem"

**Expected:**
- ✅ Toast: "Job updated successfully"
- ✅ Job title updated in list

#### Test 2.7: Jobs Page - Delete Job
1. Find the AI test job
2. Click "Slet" button
3. Confirm deletion in dialog

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Toast: "Job deleted successfully"
- ✅ Job removed from list

#### Test 2.8: Customers Page - List View
1. Click "Kunder" in sidebar (or navigate to `/customers`)
2. Verify you see:
   - [ ] Search input field
   - [ ] "Opret Kunde" button
   - [ ] Grid of customer cards with:
     - Customer name
     - Email (clickable)
     - Phone (clickable)
     - Address
     - Type badge (Privat/Erhverv)
     - Edit/Delete buttons

#### Test 2.9: Customers Page - Create Customer
1. Click "Opret Kunde" button
2. Fill in form:
   - Name: "AI Test Customer Ltd"
   - Email: "aitest@cleaning.dk"
   - Phone: "+4587654321"
   - Type: "business"
   - Address: "Innovation Street 42"
   - City: "Aarhus"
   - Postal Code: "8000"
   - CVR: "12345678" (8 digits)
3. Click "Opret"

**Expected:**
- ✅ Modal closes
- ✅ Toast: "Customer created successfully"
- ✅ New customer card appears in grid

#### Test 2.10: Customers Page - Search
1. Type "AI Test" in search field
2. **Expected:** Only AI test customer shown

#### Test 2.11: Customers Page - Edit Customer
1. Find AI test customer
2. Click "Rediger" button
3. Change name to "AI Test Customer ApS"
4. Click "Gem"

**Expected:**
- ✅ Toast: "Customer updated successfully"
- ✅ Customer name updated in card

#### Test 2.12: Customers Page - Delete Customer
1. Find AI test customer
2. Click "Slet" button
3. Confirm deletion

**Expected:**
- ✅ Toast: "Customer deleted successfully"
- ✅ Customer card removed from grid

---

### **Phase 3: Error Handling & Edge Cases (10 min)**

#### Test 3.1: Invalid Login
1. Logout (if logged in)
2. Try login with wrong password

**Expected:**
- ✅ Toast error: "Invalid credentials"
- ✅ Stays on login page

#### Test 3.2: Create Job Without Required Fields
1. Go to Jobs page
2. Click "Opret Opgave"
3. Leave title empty, click "Opret"

**Expected:**
- ✅ Validation error shown
- ✅ Form doesn't submit

#### Test 3.3: Create Customer With Invalid Email
1. Go to Customers page
2. Click "Opret Kunde"
3. Enter invalid email (e.g., "not-an-email")
4. Click "Opret"

**Expected:**
- ✅ Validation error: "Invalid email format"
- ✅ Form doesn't submit

#### Test 3.4: Network Error Simulation
1. Stop backend server:
   ```powershell
   # In backend terminal, press Ctrl+C
   ```
2. Try to create a job in frontend

**Expected:**
- ✅ Toast error: "Failed to create job"
- ✅ Error boundary doesn't crash app

#### Test 3.5: Token Expiration (Optional - long test)
1. Login and wait 7 days (or manually expire token in backend)
2. Try to create a job

**Expected:**
- ✅ Automatic token refresh
- ✅ OR redirect to login with message

---

## 📊 Test Results Template

Copy this and fill it out:

```markdown
# Rendetalje v1.2.0 Test Results
**Tester:** [Your Name/AI Model]
**Date:** October 24, 2025
**Duration:** [X minutes]

## Phase 1: Backend API Tests
- [ ] Health Check: PASS / FAIL
- [ ] Authentication: PASS / FAIL
- [ ] Get Jobs: PASS / FAIL
- [ ] Create Job: PASS / FAIL
- [ ] Get Customers: PASS / FAIL
- [ ] Create Customer: PASS / FAIL

## Phase 2: Frontend UI Tests
- [ ] Login Page: PASS / FAIL
- [ ] Dashboard Stats: PASS / FAIL
- [ ] Jobs List: PASS / FAIL
- [ ] Create Job: PASS / FAIL
- [ ] Filter Jobs: PASS / FAIL
- [ ] Search Jobs: PASS / FAIL
- [ ] Edit Job: PASS / FAIL
- [ ] Delete Job: PASS / FAIL
- [ ] Customers Grid: PASS / FAIL
- [ ] Create Customer: PASS / FAIL
- [ ] Search Customers: PASS / FAIL
- [ ] Edit Customer: PASS / FAIL
- [ ] Delete Customer: PASS / FAIL

## Phase 3: Error Handling
- [ ] Invalid Login: PASS / FAIL
- [ ] Form Validation: PASS / FAIL
- [ ] Network Errors: PASS / FAIL

## Issues Found:
1. [Issue description]
2. [Issue description]

## Overall Result: ✅ PASS / ❌ FAIL
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to backend"
**Fix:**
```powershell
# Check if backend is running on port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Restart backend
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\backend-nestjs
npm run start:dev
```

### Issue: "Database connection error"
**Fix:**
```powershell
# Restart Docker containers
cd C:\Users\Jonas-dev\tekup\apps\production\tekup-database
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 10
```

### Issue: "CORS errors in browser"
**Fix:** Backend is configured for `http://localhost:3001` - verify frontend is running on correct port

### Issue: "Token expired"
**Fix:** Just login again - tokens expire after 7 days

### Issue: Frontend build errors
**Fix:**
```powershell
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

---

## 📸 Screenshots to Capture

If you're doing visual testing, capture:
1. Dashboard with real stats
2. Jobs page with filter active
3. Job creation modal
4. Customers grid view
5. Customer creation form
6. Toast notification examples
7. Error boundary (if triggered)

---

## 🎯 Success Criteria

**Tests must show:**
- ✅ All backend endpoints return expected data
- ✅ Authentication works with JWT tokens
- ✅ CRUD operations complete successfully
- ✅ UI displays real backend data
- ✅ Toast notifications appear on actions
- ✅ Forms validate input correctly
- ✅ Error handling prevents crashes
- ✅ Search and filter work as expected

**If all checks pass → System is production-ready! 🚀**

---

## 💡 Testing Tips

1. **Use realistic data** - Don't create customers named "Test Test"
2. **Test edge cases** - Try empty strings, special characters, very long text
3. **Check responsiveness** - Resize browser window to mobile size
4. **Test multiple users** - Login as admin, employee, and customer
5. **Monitor console** - Check for JavaScript errors in browser DevTools
6. **Check network tab** - Verify API calls return 200/201 status codes

---

## 🤖 For AI Assistants (Comet, etc.)

You can automate this by:
1. Using PowerShell commands for backend API tests
2. Using Playwright/Puppeteer for frontend E2E tests
3. Generating test data programmatically
4. Capturing screenshots at each step
5. Logging results to a test report file

**Example Automation Script:**
```powershell
# Run all backend tests
$tests = @(
    @{name="Health Check"; url="http://localhost:3000/health"},
    @{name="Jobs List"; url="http://localhost:3000/jobs"; auth=$true}
)

foreach ($test in $tests) {
    try {
        $result = Invoke-RestMethod -Uri $test.url
        Write-Host "✅ $($test.name) PASSED"
    } catch {
        Write-Host "❌ $($test.name) FAILED: $($_.Exception.Message)"
    }
}
```

---

**Good luck with testing! Report any bugs you find.** 🧪
