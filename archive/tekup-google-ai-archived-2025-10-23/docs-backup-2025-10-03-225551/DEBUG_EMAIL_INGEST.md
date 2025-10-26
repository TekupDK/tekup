# 🐛 Debug Email Ingest 500 Error\n\n\n\n**Error:** `{"error":"Email ingest failed"}`  
**Endpoint:** `/api/dashboard/email-ingest/stats`\n\n
---
\n\n## 🔍 Step 1: Check Render Logs\n\n\n\n**Gå til:** https://dashboard.render.com → tekup-renos → Logs\n\n
**Find seneste deployment** og søg efter:\n\n\n\n```
Email ingest failed\n\n```

**Forventet output:**

Der skulle være en detaljeret fejlbesked OVER linjen "Email ingest failed".

**Eksempler:**
\n\n```
Error: Missing required environment variable: GOOGLE_CLIENT_EMAIL
Email ingest failed\n\n```

Eller:
\n\n```
Error: Invalid credentials
Email ingest failed\n\n```

---
\n\n## 🔍 Step 2: Verificer Environment Variables\n\n\n\n**I Render logs efter deployment, søg efter:**
\n\n```
🔧 Environment loaded:\n\n```

**Check disse værdier:**
\n\n```javascript
{
  NODE_ENV: 'production',        // ✅ Skal være 'production'
  RUN_MODE: 'dry-run',           // ❌ PROBLEM! Skal være 'production' eller 'live'
  HAS_GOOGLE_CALENDAR: false     // ❌ PROBLEM! Skal være true
}\n\n```

**Hvis RUN_MODE stadig er 'dry-run':**
→ Environment variables er ikke blevet opdateret endnu!

---
\n\n## ✅ Fix: Opdater Environment Variables Korrekt\n\n\n\n### Option A: Via Render Dashboard\n\n\n\n1. **Gå til:** https://dashboard.render.com\n\n2. **Find:** tekup-renos service\n\n3. **Klik:** "Environment" tab\n\n4. **Verificer disse er sat KORREKT:**
\n\n```
RUN_MODE=production
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com\n\n```

**VIGTIGT:** \n\n- Hvis variablen allerede findes med forkert værdi, REDIGER den (klik på den)\n\n- Hvis variablen ikke findes, TILFØJ den (klik "Add Environment Variable")\n\n\n\n5. **Klik:** "Save Changes" (nederst på siden)\n\n6. **Vent:** 2-3 minutter på auto-redeploy\n\n
---
\n\n### Option B: Tjek Om Render Bruger Forkert Value\n\n\n\n**Problem:** Render kan have cached den gamle værdi.\n\n
**Løsning:**
\n\n1. Find `RUN_MODE` i environment variables liste\n\n2. Klik på den for at redigere\n\n3. Verificer value er **PRÆCIS** `production` (uden quotes, ingen mellemrum)\n\n4. Save\n\n5. **Manual Deploy:**
   - Klik "Manual Deploy" knap øverst\n\n   - Vælg "Clear build cache & deploy"\n\n   - Vent på deployment\n\n
---
\n\n## 🔍 Step 3: Test Efter Fix\n\n\n\n**1. Check Logs:**

Efter deployment, søg efter:
\n\n```
🔧 Environment loaded: {
  RUN_MODE: 'production',           // ✅ Nu korrekt!
  HAS_GOOGLE_CALENDAR: true         // ✅ Nu korrekt!
}\n\n```

**2. Test Endpoint Igen:**

Åbn i browser:
\n\n```
https://tekup-renos.onrender.com/api/dashboard/email-ingest/stats\n\n```

**Forventet success response:**
\n\n```json
{
  "success": true,
  "stats": {
    "totalThreads": 150,
    "newThreads": 150,
    "updatedThreads": 0,
    "matchedThreads": 120,
    "unmatchedThreads": 30,
    "errors": 0,
    "errorLog": []
  },
  "message": "Email ingest completed: 150 new threads, 120 matched"
}\n\n```

---
\n\n## 🚨 Hvis Stadig Fejler\n\n\n\n### Check 1: Google Credentials\n\n\n\n**Verificer i Render Environment:**
\n\n```
GOOGLE_PROJECT_ID = renos-465008
GOOGLE_CLIENT_EMAIL = renos-319@renos-465008.iam.gserviceaccount.com  
GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----\n\nGOOGLE_IMPERSONATED_USER = info@rendetalje.dk\n\n```

**Tjek GOOGLE_PRIVATE_KEY formatering:**
\n\n- ✅ Starter med `-----BEGIN PRIVATE KEY-----`\n\n- ✅ Slutter med `-----END PRIVATE KEY-----`\n\n- ✅ Har `\n` for newlines (ikke rigtige newlines!)\n\n- ❌ Må IKKE have quotes rundt om\n\n
**Eksempel korrekt:**
\n\n```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n\n```

**Eksempel FORKERT:**
\n\n```
"-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG...
-----END PRIVATE KEY-----"\n\n```

---
\n\n### Check 2: Database Connection\n\n\n\n**I Render logs, søg efter:**
\n\n```
Database connection test successful\n\n```

**Hvis IKKE fundet:**

Problem med DATABASE_URL. Verificer:
\n\n```
DATABASE_URL=postgresql://neondb_owner:npg_...@ep-falling-night-...neon.tech/neondb?sslmode=require\n\n```

---
\n\n### Check 3: Service Account Permissions\n\n\n\n**Gmail API skal have:**
\n\n- ✅ Domain-wide delegation enabled\n\n- ✅ Scope: `https://www.googleapis.com/auth/gmail.modify`\n\n- ✅ Service account email: `renos-319@renos-465008.iam.gserviceaccount.com`\n\n
**Test Gmail adgang lokalt:**
\n\n```bash
npm run data:gmail\n\n```

**Forventet output:**
\n\n```
🔍 Fetching Gmail messages...
Found 10 messages:
────────────────────────────────────────
ID: 199a504e33e26850
From: "Rendetalje .dk" <info@rendetalje.dk>
Subject: Re: Claus Toft-Nielsen...\n\n```

**Hvis fejler:**

Service account har ikke adgang til Gmail. Kontakt Google Workspace admin.

---
\n\n## 📊 Debug Checklist\n\n\n\nGå gennem denne liste:
\n\n- [ ] Render logs viser `RUN_MODE: 'production'` (ikke 'dry-run')\n\n- [ ] Render logs viser `HAS_GOOGLE_CALENDAR: true`\n\n- [ ] Environment variables er saved i Render\n\n- [ ] Manual deploy kørt EFTER environment update\n\n- [ ] Database connection test successful\n\n- [ ] GOOGLE_PRIVATE_KEY er korrekt formateret (med `\n`)\n\n- [ ] Service account har Gmail domain-wide delegation\n\n- [ ] `npm run data:gmail` virker lokalt\n\n
---
\n\n## 🎯 Mest Sandsynlige Fix\n\n\n\n**90% sandsynlighed:**
\n\n```
RUN_MODE er stadig 'dry-run' i production

Fix:\n\n1. Render Dashboard → Environment\n\n2. Klik på RUN_MODE variabel\n\n3. Ændr til: production\n\n4. Save Changes\n\n5. Vent på auto-deploy\n\n6. Verificer i logs: RUN_MODE: 'production'\n\n```

---
\n\n## 📞 Næste Skridt\n\n\n\n**Hvis du har kørt gennem alle checks:**
\n\n1. **Copy-paste Render logs** - Send hele error stack\n\n2. **Screenshot environment variables** - Vis at de er sat korrekt\n\n3. **Test lokalt** - Kør `npm run email:ingest` lokalt\n\n
Vi kan så debugge dybere baseret på præcis fejlbesked.

---

**TL;DR:** \n\n
Mest sandsynligt er `RUN_MODE` stadig sat til `dry-run` i stedet for `production`. 

Gå til Render Dashboard → Environment → Rediger RUN_MODE → Sæt til `production` → Save → Vent 3 min → Test igen.

