# 🚀 DEPLOYMENT INSTRUCTIONS - FØLG DISSE STEPS\n\n\n\n## ✅ Status: Klar til Cloud Deployment\n\n\n\n**Alt er committed til Git! Nu skal vi deploye til Render.com.**

---
\n\n## STEP 1: Opret GitHub Repository\n\n\n\n### 1.1 Gå til GitHub.com\n\n\n\n- Åbn browser: <https://github.com/new>\n\n- Log ind med din GitHub konto\n\n\n\n### 1.2 Opret Nyt Repository\n\n\n\n```\n\nRepository Name: renos
Description: RenOS - Intelligent Business Automation System\n\nVisibility: Private (anbefalet) eller Public\n\n```

**VIGTIGT**: IKKE initialiser med README, .gitignore eller license (vi har dem allerede!)
\n\n### 1.3 Klik "Create Repository"\n\n
---
\n\n## STEP 2: Push til GitHub\n\n\n\nNår repository er oprettet, kører du disse kommandoer:
\n\n### Windows PowerShell\n\n\n\n```powershell\n\ngit remote add origin https://github.com/DIT-BRUGERNAVN/renos.git
git branch -M main
git push -u origin main\n\n```

**Erstat "DIT-BRUGERNAVN" med dit faktiske GitHub brugernavn!**
\n\n### Eksempel\n\n\n\n```powershell\n\ngit remote add origin https://github.com/rendetalje/renos.git
git branch -M main
git push -u origin main\n\n```

**Du vil blive bedt om GitHub login!**

---
\n\n## STEP 3: Deploy til Render.com\n\n\n\n### 3.1 Opret Render.com Konto\n\n\n\n1. Gå til: <https://render.com>\n\n2. Klik **Get Started** eller **Sign Up**\n\n3. Log ind med GitHub konto (anbefalet - nemmere integration)\n\n\n\n### 3.2 Create New Web Service (Backend)\n\n\n\n#### A. Fra Render Dashboard\n\n\n\n1. Klik **New +** → **Web Service**\n\n2. Connect dit GitHub repository `renos`\n\n3. Giv Render permissions
\n\n#### B. Konfigurer Backend Service\n\n\n\n```\n\nName: renos-backend
Region: Frankfurt
Branch: main
Root Directory: . (tom)
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npx prisma migrate deploy && npm run start:prod\n\n```
\n\n#### C. Advanced Settings\n\n\n\n```\n\nHealth Check Path: /health
Auto-Deploy: Yes\n\n```

**Klik "Create Web Service"** - MEN VENT MED AT DEPLOYE!\n\n\n\n### 3.3 Tilføj Environment Variables (Backend)\n\n\n\nKlik på **Environment** tab i Render og tilføj ALLE disse:\n\n\n\n```bash
NODE_ENV=production
PORT=3000
RUN_MODE=production
LOG_LEVEL=info
\n\n# Fra din .env fil - kopier værdierne:\n\nORGANISATION_NAME=Rendetalje.dk\n\nGEMINI_KEY=[kopier fra .env]\n\nGOOGLE_PROJECT_ID=[kopier fra .env]
GOOGLE_CLIENT_EMAIL=[kopier fra .env]
GOOGLE_PRIVATE_KEY=[kopier fra .env - HUSK at beholde \n]\n\nGOOGLE_IMPERSONATED_USER=[kopier fra .env]
DEFAULT_EMAIL_FROM=[kopier fra .env]
GMAIL_CLIENT_ID=[kopier fra .env]
GMAIL_CLIENT_SECRET=[kopier fra .env]
GMAIL_PROJECT_ID=[kopier fra .env]
GMAIL_USER_EMAIL=[kopier fra .env]
\n\n# Disse sætter vi om lidt:\n\nDATABASE_URL=[venter på database]\n\nFRONTEND_URL=[venter på frontend]
GMAIL_REDIRECT_URI=[venter på backend URL]\n\n```

**GEM IKKE endnu! Vi venter på database først!**
\n\n### 3.4 Opret PostgreSQL Database\n\n\n\n#### A. Fra Render Dashboard\n\n\n\n1. Klik **New +** → **PostgreSQL**\n\n2. Konfigurer:

   ```
   Name: renos-database
   Database: renos_db
   User: renos_user
   Region: Frankfurt
   Plan: Free
   ```
\n\n3. Klik **Create Database**\n\n4. Vent 2-3 minutter indtil status er "Available" (grøn)
\n\n#### B. Kopier Database URL\n\n\n\n1. Gå til database dashboard\n\n2. Find **Internal Database URL**\n\n3. Kopier HELE URL (starter med `postgresql://`)\n\n4. Gå tilbage til Backend service → Environment\n\n5. Tilføj/opdater:

   ```
   DATABASE_URL=[paste den kopierede URL]
   ```
\n\n### 3.5 Deploy Backend NU\n\n\n\nKlik **Manual Deploy** → **Deploy latest commit**\n\n
**Vent 3-5 minutter...**

Tjek **Logs** tab - du skulle se:\n\n\n\n```
Migrations applied successfully
Assistant service is listening on port 3000\n\n```
\n\n#### Få Backend URL\n\n\n\nNår deploy er færdig, kopier URL fra toppen (f.eks. `https://renos-backend-xyz.onrender.com`)
\n\n### 3.6 Opdater Backend Environment Variables\n\n\n\nGå tilbage til Environment tab og tilføj/opdater:
\n\n```
GMAIL_REDIRECT_URI=https://[din-backend-url].onrender.com/oauth/callback\n\n```

**GEM** - Backend deployer automatisk igen (1-2 min)\n\n\n\n### 3.7 Create Static Site (Frontend)\n\n\n\n#### A. Fra Render Dashboard\n\n\n\n1. Klik **New +** → **Static Site**\n\n2. Connect samme GitHub repository\n\n3. Konfigurer:

   ```
   Name: renos-frontend
   Region: Frankfurt
   Branch: main
   Build Command: cd client && npm install && npm run build
   Publish Directory: client/dist
   ```
\n\n#### B. Add Environment Variable\n\n\n\n```\n\nVITE_API_URL=https://[din-backend-url].onrender.com\n\n```

**Klik "Create Static Site"**

**Vent 3-5 minutter...**
\n\n#### Få Frontend URL\n\n\n\nNår deploy er færdig, kopier URL (f.eks. `https://renos-frontend-xyz.onrender.com`)
\n\n### 3.8 Opdater Backend med Frontend URL\n\n\n\nGå tilbage til Backend service → Environment:
\n\n```
FRONTEND_URL=https://[din-frontend-url].onrender.com\n\n```

**GEM** - Backend deployer automatisk igen\n\n
---
\n\n## STEP 4: Test Deployment! 🧪\n\n\n\n### 4.1 Test Backend\n\n\n\nÅbn browser:
\n\n```
https://[din-backend-url].onrender.com/health\n\n```

Du skulle se:
\n\n```json
{"status":"ok","timestamp":"2025-09-30T..."}\n\n```
\n\n### 4.2 Test Dashboard API\n\n\n\n```\n\nhttps://[din-backend-url].onrender.com/api/dashboard/stats/overview\n\n```

Du skulle se JSON med stats (kan være tomme tal hvis ingen data endnu).
\n\n### 4.3 Test Frontend\n\n\n\nÅbn:
\n\n```
https://[din-frontend-url].onrender.com\n\n```

Du skulle se RenOS Dashboard! 🎉

**Tjek at:**
\n\n- ✅ Dashboard loader\n\n- ✅ Stats vises (selvom de er 0)\n\n- ✅ Ingen CORS errors i browser console (F12)\n\n
---
\n\n## STEP 5: Seed Database (Valgfrit)\n\n\n\nHvis du vil have test-data:
\n\n### Via Render Shell\n\n\n\n1. Gå til Backend service → **Shell** tab\n\n2. Kør:

   ```bash
   npm run db:seed
   ```

Nu skulle dashboard vise test-data!

---
\n\n## 🎉 TILLYKKE! DU ER LIVE\n\n\n\n### Din RenOS Installation\n\n\n\n- 🌐 **Dashboard**: https://[din-frontend].onrender.com\n\n- 🔧 **API**: https://[din-backend].onrender.com\n\n- 💾 **Database**: Sikker PostgreSQL på Render\n\n\n\n### Næste Steps\n\n\n\n#### 1. Custom Domain (Valgfrit)\n\n\n\nRender Dashboard → Frontend → Settings → Custom Domain
\n\n- Tilføj: `app.rendetalje.dk`\n\n- Opdater DNS CNAME record\n\n- SSL certificate automatisk!\n\n\n\n#### 2. Monitoring Setup\n\n\n\n- **UptimeRobot** (gratis): <https://uptimerobot.com>\n\n  - Monitor: `https://[backend]/health`\n\n  - Email alerts ved downtime\n\n\n\n#### 3. Backup Rutine\n\n\n\n- Render Pro: Automatiske database backups\n\n- Gratis: Manuel export fra Dashboard → Database\n\n\n\n#### 4. Gå Live\n\n\n\nOpdater `RUN_MODE` fra `production` til faktisk produktion:
\n\n```bash
RUN_MODE=live  # Sender rigtige emails!\n\n```\n\n
---
\n\n## 🆘 Troubleshooting\n\n\n\n### Backend starter ikke\n\n\n\n**Tjek Logs tab for fejl**

Almindelige problemer:
\n\n- `DATABASE_URL` ikke sat korrekt\n\n- Prisma migration fejler (kør manuelt i Shell)\n\n- Environment variables mangler\n\n\n\n### Frontend viser "Cannot connect"\n\n\n\n**CORS problem**

Fix:
\n\n1. Verificer `FRONTEND_URL` i backend matcher frontend URL PRÆCIST\n\n2. Verificer `VITE_API_URL` i frontend matcher backend URL\n\n3. Redeploy begge services
\n\n### Database connection fejler\n\n\n\n**Tjek:**
\n\n1. Database er "Available" (grøn status)\n\n2. `DATABASE_URL` er **Internal Database URL** (ikke External)\n\n3. URL er kopieret komplet med `postgresql://`

---
\n\n## 📞 Support\n\n\n\n**Render Support**: <support@render.com>
**Documentation**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
**Troubleshooting**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---
\n\n## ⏱️ Tidslinje\n\n\n\n- ✅ **0-5 min**: Push til GitHub\n\n- ✅ **5-10 min**: Setup Render services\n\n- ✅ **10-15 min**: Configure environment variables\n\n- ✅ **15-25 min**: Deploy og test\n\n- 🎉 **25-30 min**: LIVE og kørende!\n\n\n\n**DU ER KLAR! START MED STEP 1! 🚀**
