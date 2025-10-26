# 🚨 URGENT: Deployment Fixes Påkrævet\n\n\n\n## Status: 2 Kritiske Issues Identificeret\n\n\n\n### ❌ Problem 1: Frontend kalder forkert API URL\n\n\n\n**Symptom:**
\n\n```
GET https://tekup-renos-1.onrender.com/api/dashboard/customers 404 (Not Found)\n\n```

**Root Cause:**
\n\n- Frontend services på Render hedder `tekup-renos-1` (ikke `renos-frontend` som i render.yaml)\n\n- Backend services på Render hedder `tekup-renos` (ikke `renos-backend` som i render.yaml)\n\n- Environment variable `VITE_API_URL` er ikke sat korrekt på frontend\n\n
**Frontend kode (KORREKT):**
\n\n```tsx
// client/src/components/Leads.tsx line 22
const API_URL = import.meta.env.VITE_API_URL || 'https://tekup-renos.onrender.com';\n\n```

**Problem:** `VITE_API_URL` er ikke sat i Render dashboard, så den falder tilbage til default - men den default bliver overskrevet af Vite's base URL (tekup-renos-1.onrender.com).\n\n
**Løsning:**
\n\n1. Gå til Render Dashboard: <https://dashboard.render.com/>\n\n2. Find service: `tekup-renos-1` (Static Site - Frontend)\n\n3. Klik "Environment" tab\n\n4. Tilføj ny environment variable:

   ```
   Key:   VITE_API_URL
   Value: https://tekup-renos.onrender.com
   ```
\n\n5. Klik "Save Changes"\n\n6. Trigger Manual Deploy

---
\n\n### ❌ Problem 2: Backend 500 Error på /api/leads/process\n\n\n\n**Symptom:**
\n\n```
tekup-renos.onrender.com/api/leads/process:1  Failed to load resource: 
the server responded with a status of 500 ()

Error processing lead: Error: Failed to process lead\n\n```

**Root Cause:** Ukendt - skal checke Render logs\n\n
**Mulige Årsager:**
\n\n1. **Gemini API Key mangler** - leadParsingService.ts kræver `GEMINI_KEY`\n\n2. **Import error** - service files blev committed sent (commit b8ab93e)\n\n3. **Environment variable fejl** - kan være `GOOGLE_PRIVATE_KEY` escape issues\n\n
**Debug Steps:**
\n\n1. Gå til Render Dashboard: <https://dashboard.render.com/web/srv-d3dv61ffte5s73f1uccg/logs>\n\n2. Scroll til latest logs omkring tidspunkt for 500 error (se browser Console timestamp)\n\n3. Find exact error stack trace

**Sandsynlige Fejl:**
\n\n```typescript
// leadParsingService.ts line 44
const apiKey = appConfig.llm.GEMINI_KEY;
if (!apiKey) {
  logger.warn("GEMINI_KEY not set, using fallback parsing");
  return fallbackParseLeadEmail(emailBody);
}\n\n```

**Check:**
\n\n- Er `GEMINI_KEY` sat i Render environment variables?\n\n- Er fallback parsing fejler også?\n\n- Er der TypeScript compilation errors der blev overset?\n\n
---
\n\n## 📋 Action Plan\n\n\n\n### Trin 1: Fix Frontend API URL (5 min)\n\n\n\n✅ Identificeret root cause
🔧 **NEXT:** Sæt `VITE_API_URL` i Render dashboard\n\n⏸️ **VENT PÅ:** Manual deploy completion (~3-5 min)\n\n\n\n### Trin 2: Debug Backend 500 Error (10-15 min)\n\n\n\n🔍 Check Render logs for exact error
🔧 Fix baseret på findings:
\n\n- **If Gemini issue:** Verify `GEMINI_KEY` environment variable\n\n- **If import issue:** Check build logs for compilation errors\n\n- **If environment issue:** Check all required variables are set\n\n\n\n### Trin 3: Verify Fixes (5 min)\n\n\n\n✅ Test `/api/leads/process` endpoint returns 200
✅ Test frontend Dashboard loads customer data
✅ Test AI Process button på lead virker

---
\n\n## 🔍 Environment Variables Checklist\n\n\n\n**Backend (tekup-renos) Required:**
\n\n- ✅ `DATABASE_URL` - Set via Render database connection\n\n- ⚠️  `GEMINI_KEY` - **CHECK IF SET!**\n\n- ⚠️  `GOOGLE_PROJECT_ID` - **CHECK IF SET!**\n\n- ⚠️  `GOOGLE_PRIVATE_KEY` - **CHECK IF PROPERLY ESCAPED!**\n\n- ⚠️  `GOOGLE_IMPERSONATED_USER` - **CHECK IF SET!**\n\n- ✅ `RUN_MODE` - Set to `production`\n\n
**Frontend (tekup-renos-1) Required:**
\n\n- ❌ `VITE_API_URL` - **MISSING! MUST ADD!**\n\n
---
\n\n## 💡 Quick Win: Test Locally First\n\n\n\nBefore deploying, test backend fix locally:
\n\n```powershell\n\n# Terminal 1: Start backend\n\nnpm run dev\n\n\n\n# Terminal 2: Test endpoint\n\n$body = @{emailBody="Test lead fra kunde@firma.dk"} | ConvertTo-Json\n\nInvoke-RestMethod -Uri "http://localhost:3000/api/leads/process" `
  -Method Post -Body $body -ContentType "application/json"\n\n```

**Expected:**
\n\n- ✅ Returns 200 OK\n\n- ✅ JSON response with parsed lead data\n\n- ✅ No errors in backend console\n\n
**If 500 error locally:**
\n\n- Check `.env` file has all required variables\n\n- Check `GEMINI_KEY` is valid\n\n- Run `npm run build` to catch TypeScript errors\n\n
---
\n\n## 📊 Progress Tracker\n\n\n\n| Issue | Status | ETA |
|-------|--------|-----|
| Frontend API URL | 🔧 In Progress | 5 min |
| Backend 500 Error | 🔍 Debugging | 15 min |
| Full Deployment | ⏸️ Pending | 25 min |

---

**Updated:** 2025-10-03 01:35 AM
**Priority:** URGENT - Blocking all AI features
**Impact:** High - Frontend completely broken, AI processing unusable
