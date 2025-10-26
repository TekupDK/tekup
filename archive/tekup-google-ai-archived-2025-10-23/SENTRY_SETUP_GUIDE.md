# 🔥 Sentry Setup Guide - RenOS

## Quick Setup (30 minutter)

### Step 1: Create Sentry Account (5 min)
1. Go to: https://sentry.io/signup/
2. Sign up with GitHub account (anbefalet) eller email
3. Vælg "Free" plan (100k errors/month)
4. Project name: `renos` eller `tekup-renos`
5. Platform: **Node.js**

### Step 2: Get DSN Key (2 min)
Efter project creation:
1. Klik på "Settings" → "Projects" → "renos"
2. Klik på "Client Keys (DSN)"
3. Kopier DSN URL (starter med `https://...@sentry.io/...`)

DSN format:
```
https://[PUBLIC_KEY]@[ORGANIZATION].ingest.sentry.io/[PROJECT_ID]
```

### Step 3: Add to Render Environment (5 min)
1. Go to: https://dashboard.render.com/
2. Select service: `tekup-renos` (backend)
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add:
   - **Key:** `SENTRY_DSN`
   - **Value:** [paste your DSN from step 2]
6. Click "Save Changes"
7. Service will auto-redeploy (2-3 min)

### Step 4: Verify Integration (5 min)
Check backend logs in Render:
```
Look for: "Sentry initialized successfully"
```

Test error capture:
```bash
# Trigger a test error
curl https://tekup-renos.onrender.com/api/test-error
```

Check Sentry dashboard - error should appear within 1 minute.

### Step 5: Configure Alerts (10 min)

#### Email Alerts:
1. Sentry Dashboard → "Alerts"
2. Click "Create Alert"
3. Choose "Issues"
4. Set conditions:
   - Issue is **First Seen**
   - Severity is **Error** or **Fatal**
5. Action: **Send email to Jonas**
6. Save alert

#### Slack Integration (optional):
1. Sentry → "Settings" → "Integrations"
2. Search for "Slack"
3. Click "Install"
4. Authorize Slack workspace
5. Choose channel: `#renos-errors` eller `#alerts`
6. Configure alert rules

#### Alert Rules Anbefaling:
```
✅ First seen error → Email + Slack
✅ Error spike (>10 in 5 min) → Email + Slack
✅ Fatal error → Email + SMS (upgrade til paid plan)
⚠️ Ignore known issues (add fingerprints)
```

### Step 6: Test Full Flow (3 min)
```bash
# 1. Trigger test error
curl https://tekup-renos.onrender.com/api/test-error

# 2. Check email inbox (should receive alert within 1 min)

# 3. Check Sentry dashboard (error should be visible)

# 4. Check Slack (if integrated)
```

---

## 🎯 Sentry Features til RenOS

### Error Tracking:
- ✅ Uncaught exceptions
- ✅ Promise rejections
- ✅ API errors (500, 503, etc.)
- ✅ Database connection failures
- ✅ Google API failures

### Performance Monitoring (optional):
- ⚠️ Requires paid plan
- Track slow API endpoints
- Monitor database query performance
- Track email send times

### Release Tracking:
```javascript
// Add to deployment
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "renos@" + process.env.RENDER_GIT_COMMIT,
  environment: process.env.NODE_ENV
});
```

### User Context:
```javascript
// Track which customer/lead caused error
Sentry.setUser({
  id: customerId,
  email: customerEmail
});
```

---

## ⚠️ Privacy & GDPR

### Data Sent to Sentry:
- ✅ Error messages & stack traces
- ✅ Request URLs (without query params)
- ✅ User IDs (hashed)
- ❌ Customer personal data (scrubbed)
- ❌ Passwords or API keys (filtered)

### Data Scrubbing Rules:
```javascript
beforeSend(event) {
  // Remove sensitive data
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers['Authorization'];
  }
  
  // Scrub email addresses from error messages
  if (event.message) {
    event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  }
  
  return event;
}
```

---

## 📊 Sentry Dashboard Overview

### Issue Priority:
- 🔴 **P0 (Critical):** Database down, app crash, data loss
- 🟡 **P1 (High):** API failures, email send failures
- 🟢 **P2 (Medium):** Slow queries, cache misses
- ⚪ **P3 (Low):** Warnings, deprecations

### Useful Views:
- **Issues:** All errors grouped by fingerprint
- **Releases:** Errors per deployment
- **Performance:** Slow transactions (paid plan)
- **Discover:** Custom queries on error data

---

## 🔗 Useful Links

- Sentry Dashboard: https://sentry.io/
- Documentation: https://docs.sentry.io/platforms/node/
- Best Practices: https://docs.sentry.io/product/best-practices/
- Pricing: https://sentry.io/pricing/

---

## ✅ Success Checklist

- [ ] Sentry account created
- [ ] DSN key obtained
- [ ] Environment variable added to Render
- [ ] Backend redeployed successfully
- [ ] Test error captured in Sentry
- [ ] Email alert received
- [ ] Alert rules configured
- [ ] Slack integration setup (optional)

**Estimated time:** 30 minutter  
**Cost:** Free (up to 100k errors/month)
