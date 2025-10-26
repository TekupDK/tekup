# 🚨 DEPLOYMENT SAFETY CHECKLIST

**CRITICAL:** Complete this checklist BEFORE deploying to production or enabling auto-email features.

Last Updated: October 5, 2025  
Version: 1.0  
Author: RenOS Development Team

---

## ⚠️ PRE-DEPLOYMENT VERIFICATION

### 1. Environment Configuration

#### RUN_MODE Setting
- [ ] Verify `RUN_MODE` setting in deployment environment
- [ ] For testing: `RUN_MODE=dry-run` (emails logged, not sent)
- [ ] For production: `RUN_MODE=live` (emails actually sent)
- [ ] **WARNING:** Double-check Render.com environment variables

#### Email Automation Flags
- [ ] `AUTO_RESPONSE_ENABLED=false` (default OFF for safety)
- [ ] `FOLLOW_UP_ENABLED=false` (default OFF for safety)
- [ ] `ESCALATION_ENABLED=true` (can be ON - it's safe)

**RULE:** Never enable AUTO_RESPONSE or FOLLOW_UP without:
1. Thorough testing in dry-run mode
2. Manual review of generated emails
3. Approval from Jonas
4. 24-hour monitoring after activation

---

## 📧 EMAIL QUALITY VALIDATION

### Template Quality Checks
Run these checks before enabling auto-response:

#### 1. Business Hours Enforcement
```bash
# Check calendar slot suggestions
npm run booking:next-slot 120
```
**Expected:** All suggested times between 08:00-17:00 (no midnight/after-hours)

**Test Cases:**
- [ ] 56m² flytterengøring → Times should be 08:00-17:00
- [ ] Request on Friday afternoon → Should suggest Monday morning
- [ ] Request at 23:00 → Should suggest next day 08:00

#### 2. Placeholder Prevention
**Manually test email generation with missing data:**

```bash
# Create test lead with missing squareMeters
# Expected: Email should ASK for info, not show [Ukendt]
```

**Check for:**
- [ ] No `[Ukendt]` in email body
- [ ] No `[X]`, `[Y]`, `[navn]` placeholders
- [ ] Professional fallback messages for missing data

#### 3. Competitive Pricing
**Test pricing for common scenarios:**

```bash
# Test 56m² apartment
node -e "import('./src/services/pricingService').then(m => console.log(m.estimateCleaningJob(56, 'flytterengøring')))"
```

**Expected Results:**
- [ ] 56m² flytterengøring: `1.396-2.094kr` (shows RANGE, not just max)
- [ ] 80m² almindelig: Reasonable estimate
- [ ] 120m² dybderengøring: Shows both min and max

**Email should emphasize:**
- [ ] Minimum price first (competitive positioning)
- [ ] Range format: "ca. 1.400-2.100kr"
- [ ] "Du betaler kun faktisk tidsforbrug" text included

---

## 🔒 SECURITY VERIFICATION

### Auto-Send Locations Audit
Verify ALL 4 auto-send locations are safe:

#### 1. leadMonitor.ts (Line 173-206)
- [ ] Auto-response code is commented out
- [ ] Contains detailed safety comments
- [ ] Checks `isAutoResponseEnabled()` if uncommented
- [ ] Status: **DISABLED ✅**

#### 2. followUpService.ts (Line 269)
- [ ] `sendGenericEmail` call disabled
- [ ] Early return statement present
- [ ] Warning log about skipped emails
- [ ] Imports `isFollowUpEnabled` (for future use)
- [ ] Status: **DISABLED ✅**

#### 3. escalationService.ts (Line 175-187)
- [ ] Checks `isEscalationEnabled()` before sending
- [ ] Checks `isLiveMode` before sending
- [ ] Only triggers on conflict detection (safety feature)
- [ ] Status: **SAFE (can be enabled) ✅**

#### 4. dashboardRoutes.ts (API Endpoints)
- [ ] Line 731: POST /threads/:id/reply
- [ ] Line 1189: Email approval endpoint
- [ ] **⚠️ WARNING:** These require authentication
- [ ] Status: **REQUIRES AUTH (pending) ⚠️**

### Rate Limiting Test
```bash
# Test email gateway rate limiting
# Should block after 10 emails in 5 minutes
```

- [ ] Rate limit enforced for each source
- [ ] Blocked requests logged properly
- [ ] Counter resets after 5 minute window

---

## 🧪 PRE-PRODUCTION TESTING

### Dry-Run Mode Testing
**Environment:** `RUN_MODE=dry-run`

1. **Test Auto-Response (if enabling):**
   ```bash
   # Temporarily set AUTO_RESPONSE_ENABLED=true in .env
   npm run leads:check
   ```
   - [ ] Email logged but NOT sent
   - [ ] Gmail API NOT called
   - [ ] Logs show "[DRY-RUN]" prefix

2. **Test Follow-Up (if enabling):**
   ```bash
   npm run email:monitor
   ```
   - [ ] Follow-ups logged but NOT sent
   - [ ] Status remains "pending" in database
   - [ ] No Gmail API calls

3. **Test Escalation:**
   ```bash
   # Create test email with conflict keywords
   ```
   - [ ] Conflict detected correctly
   - [ ] Escalation logged
   - [ ] Email would send in live mode (dry-run shows intent)

### Email Quality Manual Review
Before going live, manually review 5-10 generated emails:

- [ ] Professional tone maintained
- [ ] No grammatical errors
- [ ] Correct pricing calculations
- [ ] Business hours times only
- [ ] No placeholders or [Ukendt] text
- [ ] Proper Danish spelling

---

## 🚀 GO-LIVE CHECKLIST

### Before Enabling AUTO_RESPONSE
- [ ] All template quality checks passed
- [ ] 7+ days of testing in dry-run mode
- [ ] Manual review of 20+ generated emails
- [ ] No customer complaints about email quality
- [ ] Jonas approved activation
- [ ] Monitoring dashboard ready
- [ ] Set `AUTO_RESPONSE_ENABLED=true` in production env
- [ ] Set `RUN_MODE=live` in production env
- [ ] Deploy to Render.com
- [ ] **Monitor for 24 hours continuously**

### Before Enabling FOLLOW_UP
- [ ] AUTO_RESPONSE stable for 14+ days
- [ ] Follow-up templates tested thoroughly
- [ ] No spam-like behavior in logs
- [ ] Follow-up intervals validated (5 days)
- [ ] Jonas approved activation
- [ ] Set `FOLLOW_UP_ENABLED=true` in production env
- [ ] Deploy to Render.com
- [ ] **Monitor for 48 hours**

---

## 📊 POST-DEPLOYMENT MONITORING

### First 24 Hours After Go-Live
Monitor these metrics every 2 hours:

#### Email Sending Metrics
```bash
# Check sent emails
npm run email:pending
```
- [ ] Total emails sent < 50 per day
- [ ] No rate limit violations
- [ ] No quality validation failures
- [ ] Response rate acceptable

#### Customer Feedback
- [ ] Monitor Gmail inbox for customer replies
- [ ] Check for complaints or confusion
- [ ] Watch for "unsubscribe" requests
- [ ] Track response sentiment

#### Error Monitoring
```bash
# Check logs in Render.com
# Look for ERROR or WARN level messages
```
- [ ] No Gmail API errors
- [ ] No calendar booking failures
- [ ] No database connection issues
- [ ] No unhandled exceptions

### Week 1 Monitoring
Check daily:

- [ ] Email quality remains high
- [ ] No customer complaints
- [ ] Pricing estimates accurate
- [ ] Booking times appropriate
- [ ] No [Ukendt] placeholders in sent emails

---

## 🆘 EMERGENCY ROLLBACK PROCEDURE

### If Problems Detected

#### Immediate Actions (< 5 minutes)
1. **Disable Auto-Send:**
   ```bash
   # In Render.com dashboard
   AUTO_RESPONSE_ENABLED=false
   FOLLOW_UP_ENABLED=false
   ```

2. **Switch to Dry-Run:**
   ```bash
   RUN_MODE=dry-run
   ```

3. **Redeploy:**
   - Trigger manual deploy in Render.com
   - Wait 5-10 minutes for deployment
   - Verify no emails sending

#### Investigation (< 1 hour)
- Check logs for error patterns
- Review last 10 sent emails
- Identify root cause
- Document issue in GitHub

#### Resolution
- Fix code issues
- Test thoroughly in dry-run mode
- Update this checklist with lessons learned
- Get approval before re-enabling

---

## 📋 SAFETY RULES

### Golden Rules (NEVER VIOLATE)

1. **Default to OFF:** All auto-email features start disabled
2. **Test in Dry-Run:** Never test directly in live mode
3. **Manual Review:** Always review generated emails before enabling auto-send
4. **Gradual Rollout:** Enable one feature at a time, never all at once
5. **Monitor Intensively:** First 24 hours require constant monitoring
6. **Quick Rollback:** Be prepared to disable instantly if problems arise

### Red Flags (Disable Immediately)
- Multiple customer complaints about email quality
- Emails sent outside business hours
- [Ukendt] or placeholder text in sent emails
- Pricing significantly off market rates
- Rate limit violations
- Gmail API errors

---

## ✅ VERIFICATION SIGNATURES

Before deploying with auto-send enabled, get these sign-offs:

- [ ] **Developer:** Code reviewed, tests passed, dry-run successful
- [ ] **Jonas:** Email quality approved, pricing acceptable, go-live authorized
- [ ] **Support:** Monitoring dashboard ready, rollback procedure understood

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Approved By:** _______________  

---

## 📞 EMERGENCY CONTACTS

**Jonas (Owner):** +45 22 65 02 26  
**Email:** <jonas@rendetalje.dk>

**Render.com Dashboard:** <https://dashboard.render.com>  
**GitHub Repository:** <https://github.com/JonasAbde/tekup-renos>

---

## 📝 DEPLOYMENT LOG

Keep a log of all production deployments:

| Date | Feature Enabled | Result | Issues | Rollback |
|------|----------------|--------|--------|----------|
| 2025-10-05 | Template fixes | ✅ Success | None | No |
| | | | | |
| | | | | |

---

**REMEMBER:** It's better to have auto-send disabled than to send one bad email to a customer. Quality > Automation.
