# 🚨 Production Deployment Troubleshooting

**Date:** 5. Oktober 2025  
**Issue:** Google Auth + Redis Connection Errors

---

## 🔴 KRITISK: Google Auth Fejl

### Error Message
```
unauthorized_client: Client is unauthorized to retrieve access tokens 
using this method, or client not authorized for any of the scopes requested.
```

### Root Cause
**Domain-wide delegation er ikke konfigureret korrekt** i Google Workspace Admin Console.

Service account har IKKE adgang til at impersonate `info@rendetalje.dk`.

---

## ✅ FIX: Setup Domain-Wide Delegation

### Step 1: Find Service Account Client ID

1. Gå til [Google Cloud Console](https://console.cloud.google.com)
2. Vælg dit projekt: `renos-465008`
3. Gå til **IAM & Admin** → **Service Accounts**
4. Find din service account (typisk `renos@renos-465008.iam.gserviceaccount.com`)
5. Klik på service account → **DETAILS** tab
6. Kopier **Client ID** (21-digit nummer)

### Step 2: Enable Domain-Wide Delegation i Google Workspace

1. Gå til [Google Admin Console](https://admin.google.com)
2. Log ind som **Workspace Admin** (ikke <info@rendetalje.dk> - skal være super admin!)
3. Gå til **Security** → **Access and data control** → **API Controls**
4. Scroll ned til **Domain-wide delegation**
5. Klik **MANAGE DOMAIN-WIDE DELEGATION**
6. Klik **Add new**

### Step 3: Configure Delegation

Indtast følgende:

**Client ID:** (fra Step 1 - 21-digit nummer)

**OAuth Scopes:** (kopier PRÆCIST)
```
https://www.googleapis.com/auth/gmail.readonly,
https://www.googleapis.com/auth/gmail.send,
https://www.googleapis.com/auth/gmail.modify,
https://www.googleapis.com/auth/calendar,
https://www.googleapis.com/auth/calendar.events
```

**VIGTIGT:** 
- Ingen mellemrum mellem scopes!
- Skal være komma-separeret på én linje
- Præcis som vist ovenfor

Klik **AUTHORIZE**

### Step 4: Verificer Setup

⏰ **Vent 5-10 minutter** for at ændringer propagerer i Google's systemer.

Derefter test med:

```bash
npm run verify:google
```

Eller check Render logs - fejlen skulle være væk.

---

## 🟡 MEDIUM: Redis Connection Error

### Error Message
```
Redis client error: ECONNREFUSED
Redis connection failed after 10 retries
Redis not available, using in-memory cache fallback
```

### Status
✅ **Ikke kritisk** - Systemet falder automatisk tilbage til in-memory cache.

### Impact
- Cache data går tabt ved restart
- Ingen persistence af cache mellem deploys
- Funktionalitet påvirkes IKKE

### Fix (Optional - for bedre performance)

#### Option 1: Add Redis on Render.com (Anbefalet)

1. Gå til Render.com dashboard
2. Klik **New** → **Redis**
3. Vælg navn: `tekup-renos-redis`
4. Plan: **Free** (25MB, perfect til cache)
5. Klik **Create Redis**

6. Når created, kopier **Internal Redis URL**
7. Gå til din backend service
8. **Environment** → Add variable:
   - Key: `REDIS_URL`
   - Value: `redis://...` (internal URL)
9. Klik **Save Changes** (auto-deploys)

#### Option 2: Use Upstash Redis (Gratis tier)

1. Gå til [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Kopier connection URL
4. Add til Render environment variables som ovenfor

#### Option 3: Ignore (Systemet virker fint uden Redis)

In-memory cache er tilstrækkeligt for de fleste use cases.

---

## 🔍 Verification Checklist

Efter du har fixet Google Auth:

### Backend Health Check
```bash
# Check hvis service er live
curl https://tekup-renos.onrender.com/health

# Forventet response:
{
  "status": "ok",
  "timestamp": "2025-10-05T18:30:00.000Z"
}
```

### Google Auth Verification
```bash
# Lokalt (hvis du har env vars sat)
npm run verify:google

# Eller check Render logs for:
✅ "Google auth client impersonating workspace user"
✅ "Gmail service initialized successfully"
❌ Ingen "unauthorized_client" fejl
```

### Dashboard Access
```bash
# Backend dashboard endpoints
curl https://tekup-renos.onrender.com/api/dashboard/environment/status

# Frontend dashboard
https://tekup-renos-frontend.onrender.com
```

---

## 📋 Complete Deployment Checklist

### Google Cloud Setup
- [ ] Service account created
- [ ] Service account keys downloaded (JSON)
- [ ] Domain-wide delegation enabled
- [ ] Correct scopes configured (gmail + calendar)
- [ ] Client ID verified
- [ ] Wait 5-10 minutes for propagation

### Render.com Environment Variables
- [ ] `GOOGLE_PRIVATE_KEY` set (escaped newlines)
- [ ] `GOOGLE_CLIENT_EMAIL` set
- [ ] `GOOGLE_IMPERSONATED_USER=info@rendetalje.dk`
- [ ] `DATABASE_URL` set (PostgreSQL)
- [ ] `RUN_MODE=dry-run` (safety!)
- [ ] `AUTO_RESPONSE_ENABLED=false` (safety!)
- [ ] `FOLLOW_UP_ENABLED=false` (safety!)
- [ ] `ESCALATION_ENABLED=true` (safe feature)
- [ ] `REDIS_URL` set (optional)

### Testing
- [ ] Backend health check responds
- [ ] Google auth logs show success
- [ ] Dashboard loads
- [ ] No critical errors in logs

---

## 🔧 Common Issues & Solutions

### Issue: Still getting "unauthorized_client" after 10 minutes

**Solutions:**
1. Verify Client ID is correct (21-digit number)
2. Verify scopes are EXACTLY as specified (no spaces!)
3. Try removing and re-adding delegation
4. Ensure logged in as Super Admin (not regular user)
5. Clear browser cache og prøv igen

### Issue: "Invalid grant" error

**Solution:**
- Service account key er muligvis expired eller invalid
- Generate new key i Google Cloud Console
- Update `GOOGLE_PRIVATE_KEY` i Render
- Husk at escape newlines: `\n` → `\\n`

### Issue: "Insufficient permissions"

**Solution:**
- Scopes mangler eller er forkerte
- Tilføj alle 5 scopes (gmail.readonly, gmail.send, gmail.modify, calendar, calendar.events)
- Vent 10 min efter update

### Issue: Redis keeps retrying

**Solution:**
- Normal behavior hvis Redis ikke er konfigureret
- Ignorer advarsler - systemet virker fint
- Eller tilføj Redis for at stoppe warnings

---

## 📞 Debug Commands

### Check Render Logs
```bash
# Via Render Dashboard
https://dashboard.render.com/web/YOUR_SERVICE_ID/logs

# Eller via CLI
render logs -s YOUR_SERVICE_ID
```

### Test Google Auth Locally
```bash
# Set environment variables først
export GOOGLE_PRIVATE_KEY="..."
export GOOGLE_CLIENT_EMAIL="..."
export GOOGLE_IMPERSONATED_USER="info@rendetalje.dk"

# Run verification
npm run verify:google
```

### Test Gmail Access
```bash
# Via CLI tool
npm run gmail:test

# Expected output:
✅ Successfully authenticated with Gmail API
✅ Found X messages in inbox
```

---

## 🎯 Expected Log Output (When Fixed)

**Good logs should show:**

```json
{"level":30,"msg":"Google auth client impersonating workspace user"}
{"level":30,"msg":"Gmail service initialized successfully"}
{"level":30,"msg":"Database connection test successful"}
{"level":30,"msg":"Assistant service is listening","port":3000}
```

**No errors like:**
- ❌ `unauthorized_client`
- ❌ `Invalid grant`
- ❌ `Insufficient permissions`

**Redis warnings OK (if not configured):**
- ⚠️ `Redis client error: ECONNREFUSED` - Harmless
- ✅ `Redis not available, using in-memory cache fallback` - Expected

---

## 🚀 Quick Fix Summary

**PRIORITY 1: Fix Google Auth (5-10 min)**

1. Get Service Account Client ID from Google Cloud Console
2. Go to Google Admin Console → Security → API Controls → Domain-wide delegation
3. Add delegation med Client ID + scopes
4. Wait 5-10 minutes
5. Check Render logs - error should disappear

**PRIORITY 2: Add Redis (Optional - 2 min)**

1. Create Redis on Render.com (Free tier)
2. Add `REDIS_URL` to environment variables
3. Redeploy

**PRIORITY 3: Verify Dashboard**

1. Open `https://tekup-renos-frontend.onrender.com`
2. Check all 5 widgets load
3. Verify System Safety Status shows correct mode

---

## 📚 Related Documentation

- [Google Workspace Domain-Wide Delegation Guide](https://developers.google.com/workspace/guides/create-credentials#domain-wide_delegation)
- [Render Redis Documentation](https://render.com/docs/redis)
- [RenOS Troubleshooting Guide](../TROUBLESHOOTING_AUTH.md)
- [Deployment Checklist](../DEPLOYMENT.md)

---

**Status efter fix:** ✅ Production ready  
**Next check:** Render logs efter 10 minutter  
**Support:** Check Render logs eller kør `npm run verify:google` lokalt
