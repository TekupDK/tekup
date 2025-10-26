# 🚀 Komplet Environment Variables til Render - renos-backend

## 📋 Kopier ALLE disse variabler til Render Dashboard

### 🔴 Kritiske Production Settings
```
NODE_ENV=production
PORT=10000
RUN_MODE=production
LOG_LEVEL=info
ORGANISATION_NAME=Rendetalje.dk
```

### 🔒 Email Automation (SLÅET FRA FOR SIKKERHED!)
```
AUTO_RESPONSE_ENABLED=false
FOLLOW_UP_ENABLED=false
ESCALATION_ENABLED=true
```

### 🧠 LLM Provider
```
LLM_PROVIDER=heuristic
GEMINI_KEY=AIzaSyCIrKq05UNN62NTcaTBWRgN2yj1YvHwu6I
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 🗄️ Database - Supabase (TRANSACTION POOLER til Render!)
```
DATABASE_URL=postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

### 🔗 Supabase API
```
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.9Kzr0aVZBx-D7hHBCvPiUlxl3TxpCQ5hvYZmGZ_4rVE
```

### 📧 Google Workspace Service Account
```
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyeQeQKH5fo2AY
Sy0FOEOydzpx2heoOOLqv6xfN62MYQaEQ2DG8Olrn9h9LRxP8ytOR3ck2liEpvuK
NijdP+k33M6F2jVbC7o1oBE2s8KOEKqxWHTyjl3Np7of17ScLBQzY6WNfZu3fbjY
Vuhdze NTGpCzBXVsEbq7N7q8GrufgT0tLPzRPLKsqtErBJza53nFgeGR0qh754+s
GlPPYVenxngCPfjsS3Nfu51odviVqzmIRxCZNNloTd+L7Rf7T+LJ0DoTIfomioJI
S9DjgzNsVoc7g8/s04l2pd4QuIPfQKbKs/zDrW5dqQCs267fp0iHtmc6sFy4fDtM
w9yTTWKvAgMBAAECggEAB1/g5CAIOMNzcQ2KKrEMew9aJuIwIA9ZsQGCidyvGyHX
Nxfho9bIjl3ogCOhC9ysaWuijK9JARI1Spy6S4ochOZm0jkWA1EUvKqEi5IZ8+zU
YMea7XrcfWb01eP/3oQjwYvYh2QtTwOu46GTsGyVfBWY7QzIsVJ6OMowuR0Rq6GF
zbCXEeYOohlhB2lyCj7LQnTZZiYYZl05RQBc1JnMckqwLGqSoGp6rmmnRhxNFBr8
IKALv1HppQOQYBrHoLJyPr+TIl3TzOfdyVGK5LQo8w3Xun3Wd5cjSsc2/+lOV25m
I/Gm3cAP1xXDshy83+k6Jww1NtDLYlK+SPFPVKgvgQKBgQDb0eZYuTvNNWCAxiEm
ZXMUsKdVq33ErZ0Sw7MCLgbKKOQAsUnFnirPVGqsTPX8D4owvN7rMCML21+j2mNf
/yeOvCBHOtNCxE5HrNPcg7ylu8hsCLrlBUXLmqB0/tLroBLFocTh8TM5EO5uXdn+
PJDwjI/yBeqX0P2zwwsFkEvbfwKBgQDP2PhLX75LK6lPL1ZHmUyMSik2iPqm4cz6
/vAILiamEO2TwuRot+be8xVqIlm8lH4I1NgKPo+hybJbHEDDYOyusaClJJnC2QCb
TIBA7Ihh5l1xARm/qWMeGo4g7ZEOiNimU67vA7ycO/Bh6yMP3eDUvaso6hbcbqq2
1cQogPjQ0QKBgQDE24YhIMnYbZvd1xGq9CGKfuVsiGbacux++HlgU13LP7FomVzK
uGn4QM5DPazxLe2A1jQAhZxtKunMsHBccQG5BusVPy4g1fKQp8sX6XZRKglEDtFo
9j7aJsDZ5bd4QmNtUAEkosBPs8UDW9M0poLamdbzVK8RhJ0flmVRdzcn+wKBgQCl
SJEKv3SAKpRVF/uwrEOnPEJRz9QjaWSsJJeUqb6qSMPkwRMKA1Rg70WURQS/ZgZj
136FhwKJUe+3bFxEAou00CRDrztnK1HELa2/81jxIVQlTQ7Az162zb9AiCrWOBSx
D9MI1xvh0fhypZ4YPAVSqBG4U48idA7lnlCDNSyoQQKBgBBYRvkaWDpk3GribxgW
ZyeIi++399w7ZBFKgUb5CXymMa1CSxqloZL/J+tTirg3mZ4noobYt/pJ2uFfPBk9
sgJ4utWCudIoNzFYDPhJ3YePd7u78+XXUrF8FSldJog4uyf1gOgQNHCLjfEwynSC
AqF3g2zJruhVwRKNlZpO9UEw
-----END PRIVATE KEY-----
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
DEFAULT_EMAIL_FROM=info@rendetalje.dk
```

### 📅 Google Calendar
```
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com
```

### 📬 Gmail OAuth2
```
GMAIL_CLIENT_ID=58625498177-h56dmhkijn8rh4s5qhhii98b5teil52r.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REDIRECT_URI=https://renos-backend.onrender.com/oauth/callback
GMAIL_PROJECT_ID=renos-465008
GMAIL_USER_EMAIL=info@rendetalje.dk
```

### 💾 Cache Configuration
```
CACHE_PROVIDER=memory
REDIS_ENABLED=false
```

### 🌐 URLs (Production)
```
FRONTEND_URL=https://www.renos.dk
API_URL=https://renos-backend.onrender.com
CORS_ORIGIN=https://www.renos.dk
```

### 🔐 Security
```
ENABLE_AUTH=false
SESSION_SECRET=renos-production-secret-2025-secure-random-key
```

### 📊 Sentry Error Monitoring
```
SENTRY_DSN=https://6c765ed5f2a857ea81da0a88d3bb6817@o4510143146033152.ingest.de.sentry.io/4510143153700944
```

---

## 🎯 Vigtige Noter

### ✅ Sikkerhed
- ✅ Email automation er SLÅET FRA (`AUTO_RESPONSE_ENABLED=false`)
- ✅ Follow-up er SLÅET FRA (`FOLLOW_UP_ENABLED=false`)
- ✅ Kun escalation er aktiveret (for fejlhåndtering)

### ✅ Database
- ✅ Bruger **Transaction Pooler** URL (anbefalet til Render)
- ✅ Password er URL-encoded (`Habibie12%40` = `Habibie12@`)

### ✅ LLM Provider
- ✅ Starter med `heuristic` (ingen API costs)
- ✅ Gemini key er inkluderet hvis du vil skifte til AI senere

### ✅ URLs
- ✅ Frontend: `https://www.renos.dk`
- ✅ Backend: `https://renos-backend.onrender.com`
- ✅ CORS er sat korrekt til production frontend

### ⚠️ OBS
- Google Private Key er på **FLERE LINJER** - Render skal have den UDEN anførselstegn og med rigtige linjeskift
- Gmail Redirect URI er opdateret til production URL

---

## 📝 Hvordan tilføjer du dem på Render

1. Gå til din service på Render Dashboard
2. Klik på "Environment" i venstre menu
3. Klik "Add Environment Variable"
4. Kopiér HVER linje (format: `KEY=value`)
5. **VIGTIG for GOOGLE_PRIVATE_KEY:**
   - Fjern anførselstegn i starten og slutningen
   - Behold `-----BEGIN PRIVATE KEY-----` og `-----END PRIVATE KEY-----`
   - Render vil automatisk håndtere linjeskift

---

---

## 🚀 STEP 1: Opret Backend Service på Render

✅ **Du har oprettet projektet "RenOS By Tekup" - Godt!**

Nu skal du oprette selve backend servicen:

### 1. Opret ny Web Service
1. Gå til dit projekt: **RenOS By Tekup → Production**
2. Klik **"Create new service"** eller gå til Dashboard → **New → Web Service**
3. Vælg **"Connect a repository"**

### 2. Connect til GitHub Repository
1. Find og vælg repository: `JonasAbde/tekup-renos`
2. Klik **"Connect"**
3. Giv Render adgang til dit repo (hvis bedt om det)

### 3. Configure Service Settings
**Basic settings:**
- **Name:** `renos-backend`
- **Region:** `Frankfurt` (tættest på Danmark)
- **Branch:** `main` (eller din aktive branch)
- **Root Directory:** lad stå tom (backend er i roden)
- **Runtime:** `Node`

**Build & Start Commands:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- **Free** (til test) eller **Starter** ($7/måned for production)

### 4. Advanced Settings (VIGTIGT!)
Scroll ned og klik **"Advanced"**

Tilføj **Auto-Deploy:**
- ✅ **Auto-Deploy:** `Yes` (deployer automatisk når du pusher til GitHub)

### 5. Environment Variables (KRITISK!)
Klik **"Add Environment Variable"** og tilføj ALLE disse variabler:

**Kopiér hver linje og tilføj som separat variable:**

```bash
NODE_ENV=production
PORT=10000
RUN_MODE=production
LOG_LEVEL=info
ORGANISATION_NAME=Rendetalje.dk
AUTO_RESPONSE_ENABLED=false
FOLLOW_UP_ENABLED=false
ESCALATION_ENABLED=true
LLM_PROVIDER=heuristic
GEMINI_KEY=AIzaSyCIrKq05UNN62NTcaTBWRgN2yj1YvHwu6I
GEMINI_MODEL=gemini-2.0-flash-exp
DATABASE_URL=postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.9Kzr0aVZBx-D7hHBCvPiUlxl3TxpCQ5hvYZmGZ_4rVE
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
DEFAULT_EMAIL_FROM=info@rendetalje.dk
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com
GMAIL_CLIENT_ID=58625498177-h56dmhkijn8rh4s5qhhii98b5teil52r.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REDIRECT_URI=https://renos-backend.onrender.com/oauth/callback
GMAIL_PROJECT_ID=renos-465008
GMAIL_USER_EMAIL=info@rendetalje.dk
CACHE_PROVIDER=memory
REDIS_ENABLED=false
FRONTEND_URL=https://www.renos.dk
API_URL=https://renos-backend.onrender.com
CORS_ORIGIN=https://www.renos.dk
ENABLE_AUTH=false
SESSION_SECRET=renos-production-secret-2025-secure-random-key
SENTRY_DSN=https://6c765ed5f2a857ea81da0a88d3bb6817@o4510143146033152.ingest.de.sentry.io/4510143153700944
```

**⚠️ GOOGLE_PRIVATE_KEY (Special handling):**

Tilføj som separat variable:
- **Key:** `GOOGLE_PRIVATE_KEY`
- **Value:** (kopiér HELE private key fra filen `renos-465008-90464e3ff9b7.json` i din repo)

**VIGTIGT:** I Render skal du paste den UDEN `\n` escape characters og UDEN anførselstegn.

**Den komplette key (copy-paste til Render):**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyeQeQKH5fo2AY
Sy0FOEOydzpx2heoOOLqv6xfN62MYQaEQ2DG8Olrn9h9LRxP8ytOR3ck2liEpvuK
NijdP+k33M6F2jVbC7o1oBE2s8KOEKqxWHTyjl3Np7of17ScLBQzY6WNfZu3fbjY
VuhdzeNTGpCzBXVsEbq7N7q8GrufgT0tLPzRPLKsqtErBJza53nFgeGR0qh754+s
GlPPYVenxngCPfjsS3Nfu51odviVqzmIRxCZNNloTd+L7Rf7T+LJ0DoTIfomioJI
S9DjgzNsVoc7g8/s04l2pd4QuIPfQKbKs/zDrW5dqQCs267fp0iHtmc6sFy4fDtM
w9yTTWKvAgMBAAECggEAB1/g5CAIOMNzcQ2KKrEMew9aJuIwIA9ZsQGCidyvGyHX
Nxfho9bIjl3ogCOhC9ysaWuijK9JARI1Spy6S4ochOZm0jkWA1EUvKqEi5IZ8+zU
YMea7XrcfWb01eP/3oQjwYvYh2QtTwOu46GTsGyVfBWY7QzIsVJ6OMowuR0Rq6GF
zbCXEeYOohlhB2lyCj7LQnTZZiYYZl05RQBc1JnMckqwLGqSoGp6rmmnRhxNFBr8
IKALv1HppQOQYBrHoLJyPr+TIl3TzOfdyVGK5LQo8w3Xun3Wd5cjSsc2/+lOV25m
I/Gm3cAP1xXDshy83+k6Jww1NtDLYlK+SPFPVKgvgQKBgQDb0eZYuTvNNWCAxiEm
ZXMUsKdVq33ErZ0Sw7MCLgbKKOQAsUnFnirPVGqsTPX8D4owvN7rMCML21+j2mNf
/yeOvCBHOtNCxE5HrNPcg7ylu8hsCLrlBUXLmqB0/tLroBLFocTh8TM5EO5uXdn+
PJDwjI/yBeqX0P2zwwsFkEvbfwKBgQDP2PhLX75LK6lPL1ZHmUyMSik2iPqm4cz6
/vAILiamEO2TwuRot+be8xVqIlm8lH4I1NgKPo+hybJbHEDDYOyusaClJJnC2QCb
TIBA7Ihh5l1xARm/qWMeGo4g7ZEOiNimU67vA7ycO/Bh6yMP3eDUvaso6hbcbqq2
1cQogPjQ0QKBgQDE24YhIMnYbZvd1xGq9CGKfuVsiGbacux++HlgU13LP7FomVzK
uGn4QM5DPazxLe2A1jQAhZxtKunMsHBccQG5BusVPy4g1fKQp8sX6XZRKglEDtFo
9j7aJsDZ5bd4QmNtUAEkosBPs8UDW9M0poLamdbzVK8RhJ0flmVRdzcn+wKBgQCl
SJEKv3SAKpRVF/uwrEOnPEJRz9QjaWSsJJeUqb6qSMPkwRMKA1Rg70WURQS/ZgZj
136FhwKJUe+3bFxEAou00CRDrztnK1HELa2/81jxIVQlTQ7Az162zb9AiCrWOBSx
D9MI1xvh0fhypZ4YPAVSqBG4U48idA7lnlCDNSyoQQKBgBBYRvkaWDpk3GribxgW
ZyeIi++399w7ZBFKgUb5CXymMa1CSxqloZL/J+tTirg3mZ4noobYt/pJ2uFfPBk9
sgJ4utWCudIoNzFYDPhJ3YePd7u78+XXUrF8FSldJog4uyf1gOgQNHCLjfEwynSC
AqF3g2zJruhVwRKNlZpO9UEw
-----END PRIVATE KEY-----
```

**Hvordan får du private key (hvis du skal bruge en anden):**
1. Gå til [Google Cloud Console](https://console.cloud.google.com)
2. **IAM & Admin** → **Service Accounts**
3. Find `renos-319@renos-465008.iam.gserviceaccount.com`
4. Klik **Keys** tab → **Add Key** → **Create new key** → **JSON**
5. Download JSON filen
6. Åbn filen og copy værdien fra `"private_key"` feltet
7. Paste i Render **UDEN** `\n` characters og **UDEN** anførselstegn

### 6. Klik "Create Web Service"
Render vil nu:
1. Clone dit repository
2. Installere dependencies (`npm install`)
3. Bygge projektet (`npm run build`)
4. Starte serveren (`npm start`)

### 7. Monitor Deploy
- Se live logs under **"Logs"** tab
- Deploy tager 2-5 minutter
- Når du ser `✅ Live` er backend klar!

### 8. Test Backend
Åbn: `https://renos-backend.onrender.com/health`

Skulle returnere:
```json
{"status": "ok", "timestamp": "..."}
```

---

## 🏗️ Oprette Environment på Render (Valgfrit - KUN hvis du vil organisere)

**⚠️ VIGTIGT: Du behøver IKKE oprette et projekt/environment for at deploye!**

Din `renos-backend` service kan fungere fint uden at være i et projekt. Projekter er kun til organisering hvis du har mange services eller vil have Staging + Production adskilt.

**Spring dette afsnit over hvis du:**
- Kun vil deploye én backend service
- Vil komme i gang hurtigt
- Ikke har brug for Staging environment

---

### Hvis du ALLIGEVEL vil organisere med Projects

### Trin 1: Opret et Project
1. Gå til Render Dashboard: <https://dashboard.render.com>
2. Klik **New → Project**
3. Indtast projekt navn: `RenOS` eller `Renos`
4. Indtast første environment navn: `Production`
5. Klik **Create a project**

### Trin 2: Tilføj din eksisterende backend service til projektet

**Metode A - Fra Workspace Dashboard (Nemmest):**
1. Gå til **Dashboard** (klik "My Workspace" i top venstre)
2. Find `renos-backend` service i listen over services
3. Sæt **checkmark** ved `renos-backend`
4. Klik **Move** knappen nederst på siden
5. Vælg projekt: `RenOS` (dit projekt navn)
6. Vælg environment: `Production`
7. Klik **Move service**

**Metode B - Fra Service Page:**
1. Åbn din `renos-backend` service
2. Klik **••• menu** (tre prikker øverst til højre)
3. Vælg **Move**
4. Vælg projekt: `RenOS`
5. Vælg environment: `Production`
6. Klik **Move service**

✅ Efter flytning vil servicen vises under **Production** environment i dit projekt.

### Trin 3: Opret Staging Environment (valgfrit)
1. Åbn dit `Renos` projekt
2. Klik **+ Add environment** (top højre)
3. Indtast navn: `Staging`
4. Klik **Create environment**

### Trin 4: Beskyt Production Environment
1. I dit projekt, scroll til **Production** environment
2. Klik **••• menu** → **All settings**
3. Scroll til **Permissions** section
4. Klik **Edit**
5. Vælg **Protected**
6. Klik **Save**

✅ **Nu er kun Admins kan:**
- Slette services i Production
- Ændre environment variables
- Se passwords/secrets
- Suspendere services

### Trin 5: Blokér Cross-Environment Traffic (valgfrit)
Forhindrer Staging i at tilgå Production database:

1. Scroll til **Staging** environment
2. Klik **••• menu**
3. Toggle **Block cross-environment connections**

✅ **Nu kan Staging ikke længere:**
- Tilgå Production database over private network
- Kommunikere med Production services

---

## 📋 Environment Groups (Delt Configuration)

Hvis du har flere services der deler samme env vars:

### Opret Environment Group
1. Dashboard → **Environment Groups**
2. Klik **New environment group**
3. Navn: `Renos Production Shared`
4. Tilføj fælles variables (fx `DATABASE_URL`, `SUPABASE_URL`)
5. Klik **Create**

### Scope til Production Environment
1. Åbn din environment group
2. Klik **Manage → Move group**
3. Vælg projekt: `Renos`
4. Vælg environment: `Production`
5. Klik **Move**

✅ **Fordele:**
- Dele variables mellem flere services
- Ændre ét sted → alle services opdateres
- Sikre at Staging ikke kan bruge Production credentials

---

**Alt er klar! 🎉 Email automation er slået fra og alle værdier er korrekte.**
