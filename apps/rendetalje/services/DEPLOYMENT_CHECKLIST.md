# 🚀 Deployment Checklist - Monitoring Setup

## ✅ Allerede Implementeret (af AI)

- [x] Backend Sentry SDK installeret
- [x] Backend SentryInterceptor oprettet
- [x] Backend main.ts opdateret med Sentry
- [x] Frontend Sentry SDK installeret
- [x] Frontend Sentry configs (client/server/edge)
- [x] Error Boundary component
- [x] Winston logger med Supabase integration
- [x] Database migration SQL fil
- [x] Omfattende dokumentation

---

## 📋 BRUGER SKAL UDFØRE (Step-by-Step)

### **TRIN 1: Opret Sentry Konto (5 minutter)**

1. Gå til **<https://sentry.io/signup/>**
2. Opret gratis konto (supports Google SSO)
3. Opret **to projekter**:
   - **Backend Project**: Platform = Node.js
   - **Frontend Project**: Platform = Next.js

4. **Kopiér DSN nøgler**:
   ```
   Backend DSN:  https://xxx@xxx.ingest.sentry.io/xxx
   Frontend DSN: https://yyy@yyy.ingest.sentry.io/yyy
   ```

---

### **TRIN 2: Deploy Database Migration (3 minutter)**

1. Gå til **<https://supabase.com>**
2. Vælg dit projekt → **SQL Editor**
3. **Kopiér HELE indholdet** fra:
   ```
   apps/rendetalje/services/database/migrations/004_application_logs.sql
   ```
4. **Paste i SQL Editor** → Klik **Run**
5. ✅ Bekræft success: "Success. No rows returned"

#### **Verificér Migration:**

```sql
-- Kør dette i SQL Editor:
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_name = 'application_logs';

-- Forventet output: application_logs
```

---

### **TRIN 3: Tilføj Environment Variables til Render.com (5 minutter)**

1. Gå til **<https://dashboard.render.com>**
2. Vælg din **Backend Service**
3. Gå til **Environment** tab
4. Tilføj følgende nye variabler:

#### **Backend Environment Variables:**

```bash
# Sentry Configuration
SENTRY_DSN=<din-backend-dsn-fra-trin-1>
SENTRY_ENVIRONMENT=production  # eller staging/development

# Logger Configuration (valgfrit - kun hvis du vil gemme logs i Supabase)
SUPABASE_SERVICE_ROLE_KEY=<din-service-role-key>
LOG_LEVEL=info
```

5. Vælg din **Frontend Service** (Static Site)
6. Tilføj følgende:

#### **Frontend Environment Variables:**

```bash
# Sentry Configuration (VIGTIGT: Skal starte med NEXT_PUBLIC_)
NEXT_PUBLIC_SENTRY_DSN=<din-frontend-dsn-fra-trin-1>
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

7. **Klik "Save Changes"** på begge services

---

### **TRIN 4: Integrer Error Boundary i Frontend (2 minutter)**

**Åbn din root layout fil:**
```
apps/rendetalje/services/frontend-nextjs/src/app/layout.tsx
```

**Tilføj Error Boundary wrapper:**
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### **TRIN 5: Test Lokalt (5 minutter)**

#### **Test Backend:**

```powershell
# 1. Sæt miljøvariable (PowerShell)
$env:SENTRY_DSN="<din-backend-dsn>"
$env:NODE_ENV="development"

# 2. Start backend
cd apps/rendetalje/services/backend-nestjs
npm run start:dev

# 3. Test health endpoint
curl http://localhost:3000/health
# Forventet: { "status": "ok", "sentry": "configured" }

# 4. Test Sentry fejlhåndtering
curl http://localhost:3000/test-sentry
# Forventet: { "message": "Test error sent to Sentry" }
```

#### **Verificér i Sentry:**

1. Gå til **<https://sentry.io>**
2. Vælg **Backend Project** → **Issues**
3. Du skulle se fejlen: "Test Sentry Error from /test-sentry"

#### **Test Frontend:**

```powershell
# 1. Opret .env.local fil i frontend directory
cd apps/rendetalje/services/frontend-nextjs
echo NEXT_PUBLIC_SENTRY_DSN=<din-frontend-dsn> > .env.local

# 2. Build og start
npm run build
npm run start

# 3. Åbn browser på http://localhost:3000
# 4. Trigger en fejl (f.eks. gå til en ikke-eksisterende side)
```

---

### **TRIN 6: Deploy til Production (3 minutter)**

#### **Backend Deployment:**

1. Commit kode til GitHub:
   ```powershell
   git add .
   git commit -m "feat: Add Sentry monitoring and Winston logging"
   git push origin main
   ```

2. Render.com vil **automatisk deploye** når den ser commit

3. **Monitor deploy log** på Render dashboard

#### **Frontend Deployment:**

1. Push code (samme som ovenfor)
2. Frontend deployes automatisk

---

### **TRIN 7: Setup UptimeRobot (5 minutter)**

1. Gå til **<https://uptimerobot.com/signUp>**
2. Opret gratis konto (50 monitors inkluderet)
3. Klik **Add New Monitor**

#### **Monitor 1: Backend Health Check**

```
Monitor Type:    HTTP(s)
Friendly Name:   Rendetalje Backend Health
URL:             https://<din-backend-url>/health
Monitoring Interval: 5 minutes
Alert Contacts:  <din-email>
```

#### **Monitor 2: Frontend Availability**

```
Monitor Type:    HTTP(s)
Friendly Name:   Rendetalje Frontend
URL:             https://<din-frontend-url>
Monitoring Interval: 5 minutter
Alert Contacts:  <din-email>
```

4. Klik **Create Monitor** for begge

---

### **TRIN 8: Verificér Alt Virker (5 minutter)**

#### **1. Check Sentry Dashboards:**

- **Backend**: <https://sentry.io> → Backend Project → Issues
- **Frontend**: <https://sentry.io> → Frontend Project → Issues
- Begge skulle være tomme eller kun have test-fejl

#### **2. Check Supabase Logs:**

```sql
-- Gå til Supabase SQL Editor og kør:
SELECT * FROM application_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Du skulle se logs fra backend (hvis LOG_LEVEL er sat)
```

#### **3. Check UptimeRobot:**

- Gå til dashboard → Du skulle se **two green monitors**

#### **4. Test Error Tracking Live:**

**Trigger backend error:**
```powershell
curl https://<din-backend-url>/test-sentry
```

**Tjek i Sentry:** Fejlen skulle dukke op inden for 30 sekunder

---

## 🎯 Success Kriterier

✅ **Alle checks er grønne:**

- [ ] Sentry backend project modtager fejl
- [ ] Sentry frontend project modtager fejl
- [ ] Supabase `application_logs` tabel indeholder data
- [ ] UptimeRobot sender heartbeat notifications
- [ ] Backend `/health` endpoint returnerer `sentry: configured`
- [ ] Error Boundary virker (test ved at trigger en frontend error)

---

## 📊 Hvad Du Nu Har

### **Dashboards:**

- **Sentry**: Real-time error tracking + performance monitoring
- **UptimeRobot**: Uptime stats + downtime alerts
- **Supabase Logs**: Centralized logging med SQL queries

### **Alerting:**

- Email når Sentry fanger en kritisk fejl
- Email når backend/frontend er nede (UptimeRobot)

### **Costs:**

- **Sentry Free**: 5,000 errors/måned
- **UptimeRobot Free**: 50 monitors, 5-minute checks
- **Supabase**: Inden for free tier (500MB database)
- **Total**: $0/måned

---

## 🚨 Troubleshooting

### **Problem: "Sentry not configured" i /health**

**Løsning:**

- Check at `SENTRY_DSN` er sat korrekt i Render environment variables
- Restart backend service på Render

### **Problem: Ingen fejl i Sentry**

**Løsning:**

- Verificér DSN nøgle er korrekt
- Check browser console for Sentry init fejl
- Test med `/test-sentry` endpoint

### **Problem: Database migration fejler**

**Løsning:**
```sql
-- Drop tabellen og kør migration igen:
DROP TABLE IF EXISTS application_logs CASCADE;
-- Så kør hele 004_application_logs.sql igen
```

### **Problem: Winston logger virker ikke**

**Løsning:**

- Check at `SUPABASE_SERVICE_ROLE_KEY` er sat (IKKE den offentlige anon key)
- Check `LOG_LEVEL` environment variable (default er 'info')

---

## 📞 Support Resources

- **Sentry Docs**: <https://docs.sentry.io/platforms/node/>
- **Winston Docs**: <https://github.com/winstonjs/winston>
- **UptimeRobot Docs**: <https://uptimerobot.com/api/>

---

**Estimeret Total Tid:** 30-35 minutter

**Status:** 🟢 Klar til deployment
