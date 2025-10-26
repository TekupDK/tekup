# 🧪 End-to-End Testing Guide\n\n\n\n## 📋 Overview\n\n\n\nThis guide provides a comprehensive test plan for verifying that all integrated systems work together correctly in RenOS. The testing covers:
\n\n1. Complete lead workflow (email → quote → booking)\n\n2. Conflict detection and escalation\n\n3. Duplicate quote prevention\n\n4. Label application and state tracking\n\n5. Follow-up system\n\n6. Database persistence
\n\n## 🎯 Test Environment Setup\n\n\n\n### Prerequisites\n\n\n\n```bash\n\n# 1. Ensure database is up-to-date\n\nnpx prisma db push\n\n\n\n# 2. Verify all services build\n\nnpm run build\n\n\n\n# 3. Check environment variables\n\n# Required: DATABASE_URL, GOOGLE_PRIVATE_KEY, GEMINI_KEY\n\n```\n\n\n\n### Test Mode Configuration\n\n\n\n```env\n\n# In .env file\n\nRUN_MODE=dry-run  # For testing (safe, doesn't send real emails)\n\n# RUN_MODE=live   # For production (actually sends emails)\n\n```\n\n\n\n### Gmail Test Thread\n\n\n\nTo test label application, you need a real Gmail thread ID:
\n\n```bash\n\n# List recent threads\n\nnpm run label:list\n\n\n\n# Or search for specific customer\n\n# Use Gmail web UI to get thread ID from URL\n\n# Format: https://mail.google.com/mail/u/0/#inbox/thread_id_here\n\n```\n\n\n\n## 🧪 Test Suite\n\n\n\n### Test 1: Basic Lead Processing\n\n\n\n**Objective**: Verify that a new lead is processed correctly without conflicts or duplicates.
\n\n#### Setup\n\n\n\n```typescript\n\n// Test lead data
const testLead = {
  name: "Test Kunde",
  email: "test.kunde.unik@example.com",
  phone: "+45 12345678",
  address: "Testvej 123, 2100 København Ø",
  cleaningType: "Almindelig rengøring",
  squareMeters: 80,
  frequency: "Én gang",
  preferredDate: "2025-01-15",
  message: "Jeg har brug for hjælp til rengøring af min lejlighed."
};\n\n```
\n\n#### Execution Steps\n\n\n\n1. **Parse Lead**
\n\n```bash\n\n# Manually insert lead or simulate Leadmail email\n\n# This would normally come from email ingestion\n\n```\n\n\n\n2. **Verify Duplicate Check**

Expected behavior:
\n\n- ✅ No existing quotes found (new customer)\n\n- ✅ QuoteCheck.action = "OK"\n\n- ✅ Processing continues\n\n\n\n3. **Verify Conflict Check**

Expected behavior:
\n\n- ✅ No conflict keywords detected\n\n- ✅ Conflict score = 0\n\n- ✅ No auto-escalation triggered\n\n\n\n4. **Generate Quote**

Expected output:
\n\n- ✅ AI-generated quote with pricing\n\n- ✅ Available booking slots included\n\n- ✅ Professional Danish language\n\n- ✅ Warning if >90 sqm (requires manual calculation)\n\n\n\n5. **Apply Label**
\n\n```bash\n\n# If we have thread ID from email ingestion\n\nnpm run label:test <threadId> quote_sent\n\n```\n\n
Expected behavior:
\n\n- ✅ Label "quote_sent" applied\n\n- ✅ Success logged: "✅ Label applied successfully"\n\n\n\n#### Success Criteria\n\n\n\n- [ ] Lead parsed without errors\n\n- [ ] No duplicates detected\n\n- [ ] No conflicts detected\n\n- [ ] Quote generated with correct pricing\n\n- [ ] Label applied (if thread ID available)\n\n- [ ] All logs show expected flow\n\n
---
\n\n### Test 2: Duplicate Quote Detection\n\n\n\n**Objective**: Verify that duplicate quote check blocks sending a second quote too soon.
\n\n#### Setup\n\n\n\n```typescript\n\n// Use existing customer email
const existingCustomerEmail = "kunde.med.tilbud@rendetalje.dk";
// This customer received a quote 3 days ago\n\n```
\n\n#### Execution Steps\n\n\n\n1. **Check for Existing Quotes**
\n\n```bash
npm run duplicate:check kunde.med.tilbud@rendetalje.dk\n\n```

Expected output:
\n\n```
🔍 Checking for existing quotes sent to: kunde.med.tilbud@rendetalje.dk

📧 Found 1 threads in Gmail

Thread: 18a2b3c4d5e6f7g8
  Date: 2025-01-01 (3 days ago)
  Subject: Tilbud på rengøring - Rendetalje.dk\n\n  Contains keywords: [tilbud, pris, 349 kr]

🚫 ACTION: STOP
   Reason: Quote sent less than 7 days ago

⚠️ RECOMMENDATION: Do NOT send another quote. Reply in existing thread instead.\n\n```
\n\n2. **Verify Email Response Generator**

Expected behavior in `emailResponseGenerator.ts`:
\n\n- ✅ `checkExistingQuotes()` returns STOP\n\n- ✅ `shouldSend` set to false\n\n- ✅ Warning added: "🚫 EKSISTERENDE TILBUD DETEKTERET"\n\n- ✅ Recommendation: Reply in existing thread\n\n- ✅ AI generation blocked\n\n\n\n#### Success Criteria\n\n\n\n- [ ] Existing quote detected correctly\n\n- [ ] Time since last quote calculated correctly\n\n- [ ] STOP action returned for <7 days\n\n- [ ] Quote generation blocked\n\n- [ ] Clear warning message provided\n\n- [ ] Existing thread ID returned\n\n
---
\n\n### Test 3: Conflict Detection & Escalation\n\n\n\n**Objective**: Verify that conflict detection identifies problematic emails and escalates correctly.
\n\n#### Setup\n\n\n\n```typescript\n\n// Test email with critical conflict keyword
const conflictEmail = {
  from: "vred.kunde@example.com",
  subject: "Klage over rengøring",
  body: `
    Jeg er meget utilfreds med jeres service.
    Rengøringen var uacceptabel og jeg overvejer at kontakte min advokat
    hvis dette ikke løses med det samme.
    Dette er sidste advarsel før jeg eskalerer sagen.
  `
};\n\n```
\n\n#### Execution Steps\n\n\n\n1. **Manual Conflict Analysis**
\n\n```bash
npm run conflict:test\n\n```

Test the email text directly in the tool to verify detection.
\n\n2. **Check Escalation Created**

Expected behavior:
\n\n- ✅ Conflict detected with score > 50\n\n- ✅ Keywords matched: ["advokat", "utilfreds", "uacceptabel"]\n\n- ✅ Severity: CRITICAL\n\n- ✅ Auto-escalate: true\n\n\n\n3. **Verify Database Record**
\n\n```bash
npx prisma studio\n\n```

Navigate to Escalation model and verify:
\n\n- ✅ New escalation record created\n\n- ✅ `leadId` set correctly\n\n- ✅ `severity` = "critical"\n\n- ✅ `conflictScore` matches analysis\n\n- ✅ `matchedKeywords` array contains detected keywords\n\n- ✅ `jonasNotified` = true (if email sent)\n\n- ✅ `escalatedBy` = "system"\n\n\n\n4. **Check AI Response Blocked**

Expected behavior:
\n\n- ✅ `shouldSend` = false\n\n- ✅ Warning: "🚨 KONFLIKT DETEKTERET - Eskaleret til Jonas"\n\n- ✅ No AI-generated response\n\n\n\n5. **Verify Label Applied**
\n\n```bash
npm run label:status <threadId>\n\n```

Expected:
\n\n- ✅ Label "conflict" applied\n\n- ✅ Label "requires_review" applied\n\n\n\n#### Success Criteria\n\n\n\n- [ ] Conflict keywords detected correctly\n\n- [ ] Severity classified correctly (critical > high > medium)\n\n- [ ] Auto-escalation triggered for critical/high\n\n- [ ] Escalation record created in database\n\n- [ ] Jonas notification triggered (check logs)\n\n- [ ] AI response blocked\n\n- [ ] Conflict labels applied\n\n
---
\n\n### Test 4: Complete Booking Workflow\n\n\n\n**Objective**: Verify that booking confirmation updates all systems correctly.
\n\n#### Setup\n\n\n\n```typescript\n\n// Existing lead with quote sent
const leadWithQuote = {
  id: "lead_12345",
  email: "kunde.klar.til.booking@example.com",
  status: "quote_sent"
};

// Booking details
const bookingDetails = {
  date: "2025-01-20",
  startTime: "09:00",
  duration: 120,
  confirmed: true
};\n\n```
\n\n#### Execution Steps\n\n\n\n1. **Check Available Slots**
\n\n```bash
npm run booking:availability 2025-01-20\n\n```

Expected output:
\n\n```
📅 Checking availability for: 2025-01-20

✅ Available slots found:
  - 09:00-11:00 (120 minutes)\n\n  - 13:00-16:00 (180 minutes)\n\n
⚠️ Busy periods:
  - 11:00-12:30 (Existing booking)\n\n```
\n\n2. **Create Booking**
\n\n```bash\n\n# Create booking via API or directly in database\n\n# This would normally happen through dashboard or confirmation email\n\n```\n\n\n\n3. **Send Confirmation Email**

Expected behavior:
\n\n- ✅ Confirmation email generated\n\n- ✅ Booking details included (date, time, address)\n\n- ✅ Calendar invitation attached\n\n- ✅ Email sent to customer\n\n\n\n4. **Apply "booked" Label**
\n\n```bash
npm run label:test <threadId> booked\n\n```

Expected:
\n\n- ✅ Previous "quote_sent" label removed\n\n- ✅ New "booked" label applied\n\n- ✅ State transition logged\n\n\n\n5. **Verify Calendar Event**

Check Google Calendar:
\n\n- ✅ Event created with correct date/time\n\n- ✅ Duration matches booking\n\n- ✅ Customer email added as attendee\n\n- ✅ Location set to customer address\n\n\n\n#### Success Criteria\n\n\n\n- [ ] Availability check works correctly\n\n- [ ] Booking created in database\n\n- [ ] Confirmation email sent\n\n- [ ] "booked" label applied\n\n- [ ] Calendar event created\n\n- [ ] Lead status updated to "booked"\n\n
---
\n\n### Test 5: Follow-up System\n\n\n\n**Objective**: Verify that follow-up emails are sent automatically for quotes without response.
\n\n#### Setup\n\n\n\n```bash\n\n# Ensure we have leads with quotes sent >5 days ago\n\n# Check current follow-up stats\n\nnpm run follow:stats\n\n```\n\n\n\n#### Execution Steps\n\n\n\n1. **Check Pending Follow-ups**
\n\n```bash
npm run follow:check\n\n```

Expected output:
\n\n```
📊 Follow-up Check Results

⏰ Leads requiring follow-up:
\n\n1. Lead ID: lead_abc123
   Customer: test@example.com
   Quote sent: 2024-12-28 (7 days ago)
   Follow-up attempts: 0
   Status: Needs first follow-up
\n\n2. Lead ID: lead_def456
   Customer: another@example.com
   Quote sent: 2024-12-25 (10 days ago)
   Follow-up attempts: 1
   Last follow-up: 2024-12-30
   Status: Needs second follow-up

✅ Total pending: 2 leads\n\n```
\n\n2. **Generate Follow-up Emails**
\n\n```bash\n\n# In dry-run mode, this will log what would be sent\n\nnpm run follow:send\n\n```\n\n
Expected behavior:
\n\n- ✅ Follow-up email generated for each pending lead\n\n- ✅ Email references original quote\n\n- ✅ Friendly reminder tone\n\n- ✅ Call to action (respond or call)\n\n\n\n3. **Apply "follow_up_needed" Label**

Expected:
\n\n- ✅ Label applied to each follow-up thread\n\n- ✅ Logged: "✅ Applied follow_up_needed label to thread XYZ"\n\n\n\n4. **Update Database**

Verify in database:
\n\n- ✅ `followUpAttempts` incremented\n\n- ✅ `lastFollowUpDate` updated to current date\n\n- ✅ Lead status unchanged (still "quote_sent")\n\n\n\n5. **Check Follow-up Stats After**
\n\n```bash
npm run follow:stats\n\n```

Expected:
\n\n```
📊 Follow-up Statistics

Total leads with quotes: 45
Pending follow-ups: 0 (was 2)
Follow-ups sent today: 2

Breakdown by attempts:
  - 0 attempts: 40 leads\n\n  - 1 attempt: 3 leads\n\n  - 2 attempts: 2 leads\n\n  - 3+ attempts: 0 leads\n\n
⚠️ Leads at max attempts (3): None\n\n```
\n\n#### Success Criteria\n\n\n\n- [ ] Pending follow-ups identified correctly\n\n- [ ] Follow-up emails generated appropriately\n\n- [ ] Labels applied to threads\n\n- [ ] Database updated with attempt counts\n\n- [ ] Stats reflect changes\n\n- [ ] Max attempts respected (stop at 3)\n\n
---
\n\n### Test 6: Label State Transitions\n\n\n\n**Objective**: Verify that labels transition correctly as leads progress through the workflow.
\n\n#### Expected State Flow\n\n\n\n```\n\nnew_lead
   ↓
quote_sent
   ↓
[booked OR completed OR requires_review]\n\n```
\n\n#### Test Scenarios\n\n\n\n**Scenario A: Happy Path (Lead → Quote → Booking)**
\n\n1. Initial: `new_lead`\n\n2. After quote sent: `quote_sent` (replaces `new_lead`)\n\n3. After booking: `booked` (replaces `quote_sent`)\n\n4. After completion: `completed` (replaces `booked`)

**Scenario B: Follow-up Path**
\n\n1. Initial: `quote_sent`\n\n2. After 5 days: `quote_sent` + `follow_up_needed`\n\n3. After response: Remove `follow_up_needed`

**Scenario C: Conflict Path**
\n\n1. Initial: `new_lead`\n\n2. After conflict detected: `conflict` + `requires_review`\n\n3. After Jonas resolves: Remove `requires_review`, add outcome label
\n\n#### Execution\n\n\n\n```bash\n\n# Test each transition\n\nnpm run label:test <threadId> quote_sent\n\nnpm run label:test <threadId> booked
npm run label:test <threadId> completed
\n\n# Check current state\n\nnpm run label:status <threadId>\n\n```\n\n\n\n#### Success Criteria\n\n\n\n- [ ] Only one primary label at a time (new_lead, quote_sent, booked, completed)\n\n- [ ] Secondary labels can stack (follow_up_needed, conflict, requires_review)\n\n- [ ] Transitions respect state machine\n\n- [ ] Invalid transitions rejected\n\n
---
\n\n## 🔍 Integration Points Verification\n\n\n\n### 1. Email Pipeline → Conflict Detection\n\n\n\n**File**: `src/services/emailResponseGenerator.ts`

**Test**:
\n\n```typescript
// Lines 115-183
const result = await analyzeEmailForConflict(originalEmailText);
if (result.autoEscalate) {
  await escalateToJonas(...);
  shouldSend = false;
}\n\n```

**Verify**:
\n\n- [ ] Conflict analysis runs before AI generation\n\n- [ ] High/critical conflicts trigger escalation\n\n- [ ] AI response blocked when escalated\n\n- [ ] Escalation record created\n\n\n\n### 2. Email Pipeline → Duplicate Check\n\n\n\n**File**: `src/services/emailResponseGenerator.ts`

**Test**:
\n\n```typescript
// Lines 89-158
const quoteCheck = await checkExistingQuotes(lead.email);
if (quoteCheck.action === "STOP") {
  shouldSend = false;
  warnings.push("🚫 EKSISTERENDE TILBUD DETEKTERET");
}\n\n```

**Verify**:
\n\n- [ ] Quote check runs before conflict check\n\n- [ ] STOP action blocks quote generation\n\n- [ ] WARN action adds context but allows quote\n\n- [ ] Existing thread ID provided\n\n\n\n### 3. Email Sending → Label Application\n\n\n\n**File**: `src/services/emailResponseGenerator.ts`

**Test**:
\n\n```typescript
// After email sent successfully
await applyEmailActionLabel(threadId, "quote_sent");\n\n```

**Verify**:
\n\n- [ ] Label applied only after successful send\n\n- [ ] Thread ID validated before application\n\n- [ ] Errors logged but don't crash system\n\n- [ ] Returns boolean for error handling\n\n\n\n### 4. Escalation → Database Persistence\n\n\n\n**File**: `src/services/escalationService.ts`

**Test**:
\n\n```typescript
await prisma.escalation.create({
  data: {
    leadId,
    severity: conflictResult.severity,
    conflictScore: conflictResult.score,
    // ...
  }
});\n\n```

**Verify**:
\n\n- [ ] Escalation record created\n\n- [ ] All required fields populated\n\n- [ ] Timestamps set correctly\n\n- [ ] Relationships established (Lead ↔ Escalation)\n\n
---
\n\n## 🚨 Error Handling Tests\n\n\n\n### Test 7: Missing Thread ID\n\n\n\n**Scenario**: Try to apply label without thread ID.
\n\n```bash
npm run label:test "" quote_sent\n\n```

**Expected**:
\n\n```
❌ Error: Thread ID is required\n\n```

**Verify**:
\n\n- [ ] Graceful error message\n\n- [ ] No crash\n\n- [ ] Error logged\n\n- [ ] Returns false\n\n\n\n### Test 8: Invalid Gmail API Credentials\n\n\n\n**Scenario**: Temporarily use wrong credentials.

**Expected**:
\n\n- [ ] Clear error message about authentication\n\n- [ ] Suggests checking GOOGLE_PRIVATE_KEY\n\n- [ ] Doesn't expose sensitive info\n\n- [ ] System continues running\n\n\n\n### Test 9: Database Connection Lost\n\n\n\n**Scenario**: Temporarily disconnect database.

**Expected**:
\n\n- [ ] Retry logic attempts reconnection\n\n- [ ] Clear error after retries exhausted\n\n- [ ] Operations queued (if possible)\n\n- [ ] System doesn't crash\n\n
---
\n\n## 📊 Performance Tests\n\n\n\n### Test 10: Duplicate Check Performance\n\n\n\n```bash\n\n# Measure time for duplicate check\n\ntime npm run duplicate:check test@example.com\n\n```\n\n
**Target**: < 1 second

**Verify**:
\n\n- [ ] Gmail search completes quickly\n\n- [ ] Database query optimized\n\n- [ ] Results cached (if implemented)\n\n\n\n### Test 11: Conflict Analysis Performance\n\n\n\n**Target**: < 100ms (keyword matching)

**Verify**:
\n\n- [ ] Analysis completes quickly\n\n- [ ] No unnecessary loops\n\n- [ ] Efficient keyword matching\n\n
---
\n\n## ✅ Final Verification Checklist\n\n\n\n### Code Quality\n\n\n\n- [ ] TypeScript compiles without errors\n\n- [ ] No console errors in logs\n\n- [ ] All imports resolve correctly\n\n- [ ] Linter warnings addressed\n\n\n\n### Functionality\n\n\n\n- [ ] Complete lead workflow works end-to-end\n\n- [ ] Conflict detection identifies issues\n\n- [ ] Duplicate checking prevents double quotes\n\n- [ ] Label application updates Gmail\n\n- [ ] Follow-up system triggers correctly\n\n- [ ] Database persistence works\n\n\n\n### Safety\n\n\n\n- [ ] Dry-run mode prevents real actions\n\n- [ ] Live mode requires explicit configuration\n\n- [ ] Error handling prevents crashes\n\n- [ ] Sensitive data not logged\n\n\n\n### Documentation\n\n\n\n- [ ] All test results documented\n\n- [ ] Known issues listed\n\n- [ ] Workarounds provided\n\n- [ ] Performance metrics recorded\n\n
---
\n\n## 🚀 Post-Testing Actions\n\n\n\n### If All Tests Pass\n\n\n\n1. **Document Results**

Create `TEST_RESULTS.md` with:
\n\n- All test outcomes\n\n- Performance metrics\n\n- Screenshots/logs\n\n- Known limitations\n\n\n\n2. **Create User Guide** (Task 6)\n\n
Document for Jonas:
\n\n- How to use CLI tools\n\n- How to handle escalations\n\n- How to interpret labels\n\n- Troubleshooting guide\n\n\n\n3. **Prepare for Production**
\n\n- Switch to `RUN_MODE=live`\n\n- Test with 1-2 real leads\n\n- Monitor closely\n\n- Have rollback plan ready\n\n\n\n### If Tests Fail\n\n\n\n1. **Document Failure**
\n\n- Which test failed\n\n- Error messages\n\n- Steps to reproduce\n\n- Expected vs. actual behavior\n\n\n\n2. **Debug & Fix**
\n\n- Review code in failing component\n\n- Add more logging\n\n- Test fix in isolation\n\n- Re-run full test suite\n\n\n\n3. **Update Documentation**
\n\n- Note limitations\n\n- Document workarounds\n\n- Update known issues\n\n
---
\n\n## 📝 Test Log Template\n\n\n\n```markdown\n\n# Test Execution Log\n\n\n\n**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [dry-run/live]
\n\n## Test 1: Basic Lead Processing\n\n\n\n- [ ] Setup completed\n\n- [ ] Lead parsed successfully\n\n- [ ] No duplicates detected\n\n- [ ] No conflicts detected\n\n- [ ] Quote generated\n\n- [ ] Label applied\n\n- **Result**: PASS/FAIL\n\n- **Notes**: [Any observations]\n\n\n\n## Test 2: Duplicate Quote Detection\n\n\n\n- [ ] Setup completed\n\n- [ ] Existing quote found\n\n- [ ] STOP action returned\n\n- [ ] Quote blocked\n\n- **Result**: PASS/FAIL\n\n- **Notes**: [Any observations]\n\n\n\n[Continue for all tests...]
\n\n## Summary\n\n\n\n- **Total Tests**: 11\n\n- **Passed**: X\n\n- **Failed**: Y\n\n- **Skipped**: Z\n\n\n\n## Issues Found\n\n\n\n1. [Description of issue]
   - Severity: High/Medium/Low\n\n   - Impact: [What doesn't work]\n\n   - Workaround: [If available]\n\n\n\n## Performance Metrics\n\n\n\n- Duplicate check: Xms\n\n- Conflict analysis: Yms\n\n- Quote generation: Zs\n\n\n\n## Recommendations\n\n\n\n- [Actions to take before production]\n\n```\n\n
---

**Next Step**: Execute test suite and document results.
