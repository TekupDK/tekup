# 🧪 CRUD Functionality Testing Guide\n\n\n\n**Created**: 2. Oktober 2025  
**Purpose**: Comprehensive testing guide for new CRUD features  
**Status**: Ready for deployment verification

---
\n\n## 📋 Prerequisites\n\n\n\nBefore testing, ensure:
\n\n1. ✅ Latest code deployed to production (`git commit 7232d17`)\n\n2. ✅ Backend running: `https://tekup-renos.onrender.com`\n\n3. ✅ Frontend running: `https://tekup-renos-1.onrender.com`\n\n4. ✅ Browser console open (F12) for monitoring API calls

---
\n\n## 🎯 Test Plan Overview\n\n\n\n| Feature Area | Endpoints to Test | Frontend Components | Priority |
|-------------|------------------|---------------------|----------|
| **Customer CRUD** | PUT, DELETE | Customers.tsx | HIGH |\n\n| **Lead CRUD** | POST, PUT, DELETE, Convert | Leads.tsx, CreateLeadModal.tsx | HIGH |\n\n| **Quote CRUD** | POST, PUT, DELETE, Send | Quotes.tsx, CreateQuoteModal.tsx | HIGH |\n\n| **Booking Calendar Sync** | PUT, DELETE | bookingRoutes.ts | MEDIUM |\n\n
---
\n\n## 🧪 Test Suite 1: Customer Management\n\n\n\n### Test 1.1: Update Customer (PUT /api/dashboard/customers/:id)\n\n\n\n**Expected Behavior**: Edit existing customer information

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/customers`\n\n2. Find any customer in the list\n\n3. Click the **Edit** button (pencil icon)\n\n4. Modify fields:
   - Change name to: "Updated Customer Test"\n\n   - Change email to: "updated@test.dk"\n\n   - Change phone to: "+4587654321"\n\n5. Click **Gem** (Save)\n\n
**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Customer list refreshes with updated data\n\n- ✅ No console errors\n\n- ✅ Toast notification: "Kunde opdateret"\n\n
**Verification**:\n\n```powershell\n\n# Check customer was updated in database\n\ntry {\n\n  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/customers" -UseBasicParsing
  $customers = $response.Content | ConvertFrom-Json
  $updated = $customers | Where-Object { $_.name -eq "Updated Customer Test" }
  Write-Host "Found updated customer: $($updated.email)"
} catch {
  Write-Host "Error: $_"
}\n\n```

---
\n\n### Test 1.2: Delete Customer (DELETE /api/dashboard/customers/:id)\n\n\n\n**Expected Behavior**: Remove customer from database

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/customers`\n\n2. Find a test customer (or the one you just updated)\n\n3. Click the **Delete** button (trash icon, red)\n\n4. Confirmation modal appears: "Er du sikker på, at du vil slette denne kunde?"\n\n5. Click **Slet** (Delete)\n\n
**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Customer removed from list immediately\n\n- ✅ Console shows: `DELETE /api/dashboard/customers/{id} 200`\n\n- ✅ Toast notification: "Kunde slettet"\n\n
**Edge Cases to Test**:\n\n- Try deleting customer with associated leads (should succeed, leads orphaned or cascade deleted based on schema)\n\n- Try deleting same customer twice (should fail gracefully)\n\n
---
\n\n## 🧪 Test Suite 2: Lead Management\n\n\n\n### Test 2.1: Create Lead (POST /api/dashboard/leads)\n\n\n\n**Expected Behavior**: Create new lead via modal form

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/leads`\n\n2. Click **Tilføj Lead** button (top right)\n\n3. CreateLeadModal opens\n\n4. Fill in form:
   - **Navn**: "Test Lead fra CRUD"\n\n   - **Email**: "testlead@example.com"\n\n   - **Telefon**: "+4512345678"\n\n   - **Opgavetype**: Select "Almindelig rengøring"\n\n   - **Adresse**: "Testvej 123, 2000 Frederiksberg"\n\n   - **Kunde**: Select existing customer (dropdown)\n\n   - **Noter**: "Dette er en test lead"\n\n5. Click **Opret Lead**

**Expected Results**:\n\n- ✅ Status: 201 Created\n\n- ✅ Modal closes\n\n- ✅ Lead list refreshes with new lead at top\n\n- ✅ Console shows: `POST /api/dashboard/leads 201`\n\n- ✅ New lead has status: "pending" or "new"\n\n
**Form Validation Tests**:\n\n- Empty name field → Should show error: "Navn er påkrævet"\n\n- Invalid email format → Should show error: "Ugyldig email"\n\n- Submit without task type → Should show error\n\n
**API Verification**:\n\n```powershell\n\n# Check lead was created\n\ntry {\n\n  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/leads" -UseBasicParsing
  $leads = $response.Content | ConvertFrom-Json
  $testLead = $leads | Where-Object { $_.name -eq "Test Lead fra CRUD" }
  Write-Host "Found test lead ID: $($testLead.id)"
  Write-Host "Lead status: $($testLead.status)"
} catch {
  Write-Host "Error: $_"
}\n\n```

---
\n\n### Test 2.2: Update Lead (PUT /api/dashboard/leads/:id)\n\n\n\n**Expected Behavior**: Full update of lead information

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/leads`\n\n2. Find the test lead created in 2.1\n\n3. Click **Edit** button (if exists) or test via API:\n\n\n\n```powershell\n\n# Update lead via API (assuming lead ID is 1)\n\n$leadId = 1  # Replace with actual test lead ID\n\n$body = @{\n\n  name = "Updated Test Lead"
  email = "updated@example.com"
  phone = "+4587654321"
  taskType = "Erhvervsrengøring"
  address = "Opdateret Vej 456, 2100 København"
  status = "contacted"
  notes = "Lead updated via PUT endpoint"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/leads/$leadId" `
    -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  $updated = $response.Content | ConvertFrom-Json
  Write-Host "Updated lead: $($updated.name)"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}\n\n```

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Lead data updated in database\n\n- ✅ All fields updated correctly\n\n
---
\n\n### Test 2.3: Delete Lead (DELETE /api/dashboard/leads/:id)\n\n\n\n**Expected Behavior**: Remove lead from database

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/leads`\n\n2. Find test lead\n\n3. Click **Delete** button (trash icon)\n\n4. Confirmation modal: "Er du sikker på, at du vil slette dette lead?"\n\n5. Click **Slet**

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Lead removed from list\n\n- ✅ Console shows: `DELETE /api/dashboard/leads/{id} 200`\n\n
---
\n\n### Test 2.4: Convert Lead to Customer (POST /api/dashboard/leads/:id/convert)\n\n\n\n**Expected Behavior**: Create new customer from lead data, mark lead as converted

**Steps**:\n\n```powershell\n\n# Test lead conversion via API\n\n$leadId = 2  # Replace with actual lead ID\n\ntry {\n\n  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/leads/$leadId/convert" `
    -Method POST -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  $result = $response.Content | ConvertFrom-Json
  Write-Host "New customer ID: $($result.customerId)"
  Write-Host "Lead status: $($result.lead.status)"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}\n\n```

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ New customer created with lead data\n\n- ✅ Lead status changed to "converted"\n\n- ✅ Lead.customerId field populated\n\n- ✅ Customer appears in customer list\n\n
**Verification**:\n\n- Check lead status is "converted"\n\n- Check customer exists with matching email\n\n- Check lead.customerId points to new customer\n\n
---
\n\n## 🧪 Test Suite 3: Quote Management\n\n\n\n### Test 3.1: Create Quote (POST /api/dashboard/quotes)\n\n\n\n**Expected Behavior**: Create quote with real-time price calculation

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/quotes`\n\n2. Click **Nyt Tilbud** button\n\n3. CreateQuoteModal opens\n\n4. Fill in form:
   - **Vælg Lead**: Select a non-converted lead\n\n   - **Timer (estimeret)**: 8\n\n   - **Timepris (DKK)**: 450\n\n   - **Moms**: Select "25% (Standard)"\n\n   - **Gyldig til**: Select date 30 days in future\n\n   - **Beskrivelse**: "Test tilbud for almindelig rengøring"\n\n5. Observe real-time calculation:
   - Subtotal: 8 × 450 = 3,600 DKK\n\n   - Moms (25%): 900 DKK\n\n   - Total: 4,500 DKK\n\n6. Click **Opret Tilbud**

**Expected Results**:\n\n- ✅ Status: 201 Created\n\n- ✅ Modal closes\n\n- ✅ Quote appears in list with status "draft"\n\n- ✅ Price calculations correct\n\n- ✅ Console shows: `POST /api/dashboard/quotes 201`\n\n
**Form Validation Tests**:\n\n- Empty lead selection → Error\n\n- Hours = 0 → Error: "Timer skal være større end 0"\n\n- Hourly rate < 0 → Error\n\n- Invalid date → Error\n\n
**API Verification**:\n\n```powershell
try {
  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/quotes" -UseBasicParsing
  $quotes = $response.Content | ConvertFrom-Json
  $testQuote = $quotes | Select-Object -First 1
  Write-Host "Quote ID: $($testQuote.id)"
  Write-Host "Total: $($testQuote.totalPrice) DKK"
  Write-Host "Status: $($testQuote.status)"
} catch {
  Write-Host "Error: $_"
}\n\n```

---
\n\n### Test 3.2: Update Quote (PUT /api/dashboard/quotes/:id)\n\n\n\n**Expected Behavior**: Recalculate prices on update

**Steps**:\n\n```powershell\n\n# Update quote via API\n\n$quoteId = 1  # Replace with actual quote ID\n\n$body = @{\n\n  estimatedHours = 12
  hourlyRate = 500
  vatRate = 25
  description = "Opdateret tilbud med højere timepris"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/quotes/$quoteId" `
    -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  $updated = $response.Content | ConvertFrom-Json
  Write-Host "New total: $($updated.totalPrice) DKK"
  # Expected: 12 × 500 = 6000, + 25% VAT = 7500 DKK\n\n} catch {\n\n  Write-Host "Error: $($_.Exception.Message)"\n\n}\n\n```

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Prices recalculated: subtotal = 6,000, total = 7,500 DKK\n\n- ✅ Quote updated in database\n\n
---
\n\n### Test 3.3: Send Quote via Email (POST /api/dashboard/quotes/:id/send)\n\n\n\n**Expected Behavior**: Send quote to lead's email via Gmail API

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/quotes`\n\n2. Find quote with status "draft"\n\n3. Click **Send** button (envelope icon, blue)\n\n4. Loading state appears\n\n5. Quote status changes to "sent"

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Email sent via Gmail API\n\n- ✅ Quote status changed from "draft" to "sent"\n\n- ✅ Console shows: `POST /api/dashboard/quotes/{id}/send 200`\n\n- ✅ Toast notification: "Tilbud sendt"\n\n
**Email Verification**:\n\n- Check recipient inbox for email\n\n- Email subject should contain quote ID\n\n- Email body should include:\n\n  - Total price\n\n  - Estimated hours\n\n  - Valid until date\n\n  - Company contact information\n\n
**API Test**:\n\n```powershell
$quoteId = 1  # Replace with actual quote ID\n\ntry {\n\n  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/dashboard/quotes/$quoteId/send" `
    -Method POST -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  $result = $response.Content | ConvertFrom-Json
  Write-Host "Email sent to: $($result.sentTo)"
  Write-Host "Quote status: $($result.quote.status)"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}\n\n```

---
\n\n### Test 3.4: Delete Quote (DELETE /api/dashboard/quotes/:id)\n\n\n\n**Expected Behavior**: Remove quote from database

**Steps**:\n\n1. Navigate to: `https://tekup-renos-1.onrender.com/quotes`\n\n2. Find a test quote\n\n3. Click **Delete** button (trash icon, red)\n\n4. Confirmation modal: "Er du sikker på, at du vil slette dette tilbud?"\n\n5. Click **Slet**

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Quote removed from list\n\n- ✅ Console shows: `DELETE /api/dashboard/quotes/{id} 200`\n\n
---
\n\n## 🧪 Test Suite 4: Booking Calendar Sync\n\n\n\n### Test 4.1: Update Booking with Calendar Sync (PUT /api/bookings/:id)\n\n\n\n**Expected Behavior**: Update booking and sync to Google Calendar

**Steps**:\n\n```powershell\n\n# Update booking via API\n\n$bookingId = 1  # Replace with actual booking ID\n\n$body = @{\n\n  startTime = "2025-10-10T10:00:00.000Z"
  endTime = "2025-10-10T12:00:00.000Z"
  serviceType = "Erhvervsrengøring"
  notes = "Booking updated via PUT endpoint"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/bookings/$bookingId" `
    -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  $updated = $response.Content | ConvertFrom-Json
  Write-Host "Updated booking: $($updated.id)"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}\n\n```

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Booking updated in database\n\n- ✅ Google Calendar event updated via `updateCalendarEvent()`\n\n- ✅ Event time matches new startTime/endTime\n\n
**Manual Verification**:\n\n- Open Google Calendar: "RenOS Automatisk Booking"\n\n- Find event by booking ID\n\n- Verify event time updated correctly\n\n- Verify event description updated\n\n
---
\n\n### Test 4.2: Delete Booking with Calendar Sync (DELETE /api/bookings/:id)\n\n\n\n**Expected Behavior**: Delete booking and remove from Google Calendar

**Steps**:\n\n```powershell\n\n# Delete booking via API\n\n$bookingId = 2  # Replace with actual booking ID\n\ntry {\n\n  $response = Invoke-WebRequest -Uri "https://tekup-renos.onrender.com/api/bookings/$bookingId" `
    -Method DELETE -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  Write-Host "Booking deleted"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}\n\n```

**Expected Results**:\n\n- ✅ Status: 200 OK\n\n- ✅ Booking removed from database\n\n- ✅ Google Calendar event deleted via `deleteCalendarEvent()`\n\n- ✅ Cache invalidated\n\n
**Manual Verification**:\n\n- Open Google Calendar: "RenOS Automatisk Booking"\n\n- Verify event no longer appears\n\n- Check cache was invalidated: `cache.invalidate('calendar_events')`\n\n
---
\n\n## 📊 Test Results Tracking\n\n\n\n### Session Test Results\n\n\n\n| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Update Customer | ⏳ Pending | Waiting for deployment |
| 1.2 | Delete Customer | ⏳ Pending | Waiting for deployment |
| 2.1 | Create Lead | ⏳ Pending | Waiting for deployment |
| 2.2 | Update Lead | ⏳ Pending | Waiting for deployment |
| 2.3 | Delete Lead | ⏳ Pending | Waiting for deployment |
| 2.4 | Convert Lead | ⏳ Pending | Waiting for deployment |
| 3.1 | Create Quote | ⏳ Pending | Waiting for deployment |
| 3.2 | Update Quote | ⏳ Pending | Waiting for deployment |
| 3.3 | Send Quote | ⏳ Pending | Waiting for deployment |
| 3.4 | Delete Quote | ⏳ Pending | Waiting for deployment |
| 4.1 | Update Booking (Calendar Sync) | ⏳ Pending | Waiting for deployment |
| 4.2 | Delete Booking (Calendar Sync) | ⏳ Pending | Waiting for deployment |

**Progress**: 0/12 tests completed (0%)

---
\n\n## 🐛 Known Issues & Edge Cases\n\n\n\n### Issue Tracking\n\n\n\n| Issue # | Component | Description | Severity | Status |\n\n|---------|-----------|-------------|----------|--------|\n\n| - | - | No issues found yet | - | - |\n\n\n\n### Edge Cases to Test\n\n\n\n1. **Concurrent Updates**: Two users editing same customer simultaneously\n\n2. **Orphaned Records**: Deleting customer with associated leads\n\n3. **Calendar Conflicts**: Updating booking to time slot already booked\n\n4. **Email Failures**: Send quote when Gmail API is down\n\n5. **Invalid Data**: Submit form with SQL injection attempts\n\n6. **Rate Limiting**: Rapid-fire DELETE requests

---
\n\n## 🚀 Deployment Verification Checklist\n\n\n\nBefore marking deployment as complete:
\n\n- [ ] All 12 tests pass\n\n- [ ] No console errors in production\n\n- [ ] API response times < 500ms\n\n- [ ] Database queries optimized (no N+1)\n\n- [ ] Google Calendar events sync correctly\n\n- [ ] Email sending works (quote send)\n\n- [ ] Form validations work on all modals\n\n- [ ] Delete confirmations appear correctly\n\n- [ ] Toast notifications show success/error\n\n- [ ] Mobile responsive on all new modals\n\n
---
\n\n## 📝 Post-Deployment Actions\n\n\n\nAfter successful testing:
\n\n1. ✅ Update DEPLOYMENT_STATUS.md with test results\n\n2. ✅ Mark all TODOs as complete in session tracker\n\n3. ✅ Create GitHub release notes (v1.1.0)\n\n4. ✅ Update README.md with new API endpoints\n\n5. ✅ Notify stakeholders of new features\n\n6. ✅ Schedule user training session

---
\n\n## 🔗 Related Documentation\n\n\n\n- `SESSION_SUMMARY_2_OKT.md` - Implementation details\n\n- `INCOMPLETE_FEATURES_ANALYSIS.md` - Original gap analysis\n\n- `src/api/dashboardRoutes.ts` - Backend endpoints\n\n- `client/src/components/Create*Modal.tsx` - Frontend modals\n\n- `docs/CALENDAR_BOOKING.md` - Booking system docs\n\n
---

**Next Steps**:\n\n1. Wait for Render deployment to complete (~3-5 min)\n\n2. Run all 12 tests systematically\n\n3. Document any issues found\n\n4. Update this guide with actual test results\n\n5. Mark deployment as production-ready if all pass

**Status**: 📋 **READY FOR TESTING** (awaiting deployment)
