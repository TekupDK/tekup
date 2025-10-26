# 🚀 Render.com Deployment Guide\n\n\n\n## Quick Start (5-10 minutter)\n\n\n\n### 1. Forudsætninger\n\n\n\n- ✅ GitHub konto\n\n- ✅ Render.com konto (gratis - opret på <https://render.com>)\n\n- ✅ Dette repository pushed til GitHub\n\n\n\n### 2. Push til GitHub\n\n\n\n```bash\n\n# Hvis du ikke har et GitHub repo endnu:\n\ngit init\n\ngit add .
git commit -m "Initial commit - RenOS ready for deployment"\n\n\n\n# Opret nyt repo på GitHub.com og kør:\n\ngit remote add origin https://github.com/DIT-BRUGERNAVN/renos.git\n\ngit branch -M main
git push -u origin main\n\n```
\n\n### 3. Deploy på Render.com\n\n\n\n#### Option A: Automatisk (Blueprint) - ANBEFALET\n\n\n\n1. Gå til <https://render.com>\n\n2. Log ind og klik **New** → **Blueprint**\n\n3. Connect dit GitHub repository\n\n4. Render finder automatisk `render.yaml` og sætter alt op!\n\n5. Klik **Apply** og vent 5-10 minutter\n\n\n\n#### Option B: Manuel Setup\n\n\n\nHvis Blueprint ikke virker:
\n\n##### 3.1 Opret PostgreSQL Database\n\n\n\n1. Klik **New** → **PostgreSQL**\n\n2. Name: `renos-database`\n\n3. Database: `renos_db`\n\n4. User: `renos_user`\n\n5. Region: `Frankfurt`\n\n6. Plan: **Free**\n\n7. Klik **Create Database**\n\n8. Kopier **Internal Database URL**
\n\n##### 3.2 Deploy Backend\n\n\n\n1. Klik **New** → **Web Service**\n\n2. Connect GitHub repository\n\n3. Name: `renos-backend`\n\n4. Region: `Frankfurt`\n\n5. Branch: `main`\n\n6. Root Directory: `.` (tom = rod)\n\n7. Environment: `Node`\n\n8. Build Command:

   ```
   npm install && npx prisma generate && npm run build
   ```
\n\n9. Start Command:

   ```
   npx prisma migrate deploy && npm run start:prod
   ```
\n\n10. Plan: **Free**\n\n11. Advanced → Health Check Path: `/health`
\n\n##### 3.3 Tilføj Environment Variables (Backend)\n\n\n\nKlik på **Environment** tab og tilføj:\n\n\n\n```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=[paste Internal Database URL fra step 3.1]
RUN_MODE=production
LOG_LEVEL=info
ORGANISATION_NAME=Rendetalje.dk
GEMINI_KEY=[din Google AI key]
GOOGLE_PROJECT_ID=[dit GCP project ID]
GOOGLE_CLIENT_EMAIL=[din service account email]
GOOGLE_PRIVATE_KEY=[din private key - med \n]\n\nGOOGLE_IMPERSONATED_USER=info@rendetalje.dk
DEFAULT_EMAIL_FROM=info@rendetalje.dk
GMAIL_CLIENT_ID=[din OAuth client ID]
GMAIL_CLIENT_SECRET=[din OAuth secret]
GMAIL_REDIRECT_URI=https://[din-backend-url].onrender.com/oauth/callback
GMAIL_PROJECT_ID=[dit GCP project ID]
GMAIL_USER_EMAIL=info@rendetalje.dk
FRONTEND_URL=https://[din-frontend-url].onrender.com\n\n```

**Klik Save Changes** - Backend deployer automatisk!\n\n\n\n##### 3.4 Deploy Frontend\n\n\n\n1. Klik **New** → **Static Site**\n\n2. Connect samme GitHub repository\n\n3. Name: `renos-frontend`\n\n4. Region: `Frankfurt`\n\n5. Branch: `main`\n\n6. Build Command:

   ```
   cd client && npm install && npm run build
   ```
\n\n7. Publish Directory: `client/dist`\n\n8. Plan: **Free**
\n\n##### 3.5 Tilføj Environment Variable (Frontend)\n\n\n\nEnvironment tab:
\n\n```
VITE_API_URL=https://[din-backend-url].onrender.com\n\n```

**Klik Save** - Frontend deployer!\n\n\n\n### 4. Opdater CORS\n\n\n\nEfter frontend er deployed, opdater backend environment variable:
\n\n```
FRONTEND_URL=https://[din-faktiske-frontend-url].onrender.com\n\n```
\n\n### 5. Verificer Deployment\n\n\n\n#### Backend\n\n\n\n```bash\n\n# Health check\n\ncurl https://[din-backend].onrender.com/health\n\n\n\n# Dashboard API\n\ncurl https://[din-backend].onrender.com/api/dashboard/stats/overview\n\n```\n\n\n\n#### Frontend\n\n\n\nÅbn https://[din-frontend].onrender.com i browser
\n\n- Dashboard skulle vise og loade data\n\n\n\n### 6. Test Funktionalitet\n\n\n\n- ✅ Dashboard viser statistik\n\n- ✅ Cache metrics synlige\n\n- ✅ Recent leads loader\n\n- ✅ Upcoming bookings vises\n\n- ✅ Auto-refresh virker (30s)\n\n\n\n## Troubleshooting\n\n\n\n### Backend fejler at starte\n\n\n\n**Problem**: "Error: P1001: Can't reach database server"

**Løsning**:
\n\n1. Tjek at `DATABASE_URL` er sat korrekt\n\n2. Verificer at database er startet (grøn status)\n\n3. Tjek Logs tab for detaljeret fejl
\n\n### Frontend kan ikke forbinde til backend\n\n\n\n**Problem**: CORS error i browser console

**Løsning**:
\n\n1. Verificer `FRONTEND_URL` i backend environment variables matcher frontend URL\n\n2. Opdater `VITE_API_URL` i frontend til backend URL\n\n3. Redeploy begge services
\n\n### "This service is taking longer than expected"\n\n\n\n**Normalt!** Gratis tier kan tage 5-10 minutter første gang.\n\nCold starts kan tage 30-60 sekunder.
\n\n### Prisma migrations fejler\n\n\n\n**Problem**: "Migration failed"

**Løsning**:
\n\n```bash\n\n# Hvis migrations folder ikke findes, kør lokalt først:\n\nnpx prisma migrate dev --name init\n\ngit add prisma/migrations
git commit -m "Add initial migration"
git push\n\n```
\n\n## Performance på Gratis Tier\n\n\n\n### Forventninger\n\n\n\n- ✅ **Uptime**: 99%+\n\n- ⏱️ **Cold Start**: 30-60 sekunder efter 15 min inaktivitet\n\n- ⏱️ **Response Time**: <500ms (warm)\n\n- 💾 **Database**: 1GB storage\n\n- 📊 **Bandwidth**: 100GB/måned\n\n\n\n### Upgrade Options\n\n\n\nHvis du får meget trafik:
\n\n- **Starter Plan** ($7/måned): Ingen cold starts\n\n- **Standard Plan** ($25/måned): Mere RAM og CPU\n\n\n\n## Monitoring\n\n\n\n### Logs\n\n\n\nRender Dashboard → Service → **Logs** tab\n\n\n\n- Real-time logs\n\n- Filtrer efter error/warning\n\n\n\n### Metrics\n\n\n\nRender Dashboard → Service → **Metrics** tab\n\n\n\n- CPU usage\n\n- Memory usage\n\n- Response times\n\n\n\n### Alerts (Paid Plans)\n\n\n\nSetup email alerts for:
\n\n- Service crashes\n\n- High error rates\n\n- Performance issues\n\n\n\n## Automatic Deploys\n\n\n\n### Enable Auto-Deploy\n\n\n\nRender → Service → Settings → **Auto-Deploy**: **Yes**

Nu deployer Render automatisk ved hver push til `main` branch!
\n\n```bash\n\n# Lav en ændring\n\ngit add .\n\ngit commit -m "Update feature"
git push
\n\n# Render deployer automatisk! 🚀\n\n```\n\n\n\n## Backup & Rollback\n\n\n\n### Database Backup (Paid)\n\n\n\nRender Pro+ har automatiske backups.\n\n
**Gratis alternative**: Kør backup script lokalt
\n\n```bash\n\n# Brug Render dashboard → Database → Connection → Export\n\n```\n\n\n\n### Rollback Deployment\n\n\n\nRender Dashboard → Service → **Deploys** tab\n\n\n\n- Klik på gammel deploy\n\n- Klik **Rollback to this version**\n\n\n\n## Custom Domain\n\n\n\n### Tilføj Dit Eget Domæne\n\n\n\n1. Render Dashboard → Service → **Settings**\n\n2. Custom Domain → **Add Custom Domain**\n\n3. Indtast: `app.rendetalje.dk`\n\n4. Tilføj CNAME record hos din DNS provider:

   ```
   CNAME app.rendetalje.dk → [din-app].onrender.com
   ```
\n\n5. Render udsteder automatisk SSL certificate! 🔒
\n\n## Costs Breakdown\n\n\n\n### Gratis Tier (Perfekt til start)\n\n\n\n- PostgreSQL: FREE (1GB)\n\n- Backend: FREE (512MB RAM)\n\n- Frontend: FREE (Static site)\n\n- **Total: $0/måned** ✅\n\n\n\n### Paid Tiers (Når du scaler)\n\n\n\n- PostgreSQL Starter: $7/måned (10GB)\n\n- Backend Starter: $7/måned (No cold starts)\n\n- **Total: $14/måned for production-ready setup**\n\n\n\n## Next Steps\n\n\n\n1. ✅ Deploy til Render.com\n\n2. ✅ Test alle funktioner\n\n3. ⚠️ Setup uptime monitoring (UptimeRobot gratis)\n\n4. ⚠️ Konfigurer email alerts\n\n5. ⚠️ Overvåg logs de første dage\n\n6. 🎯 Når systemet er stabilt → Tilføj custom domain
\n\n## Support\n\n\n\n- **Render Docs**: <https://render.com/docs>\n\n- **Status Page**: <https://status.render.com>\n\n- **Support**: <support@render.com>\n\n
---

**Du er klar! Deploy nu og vær live om 10 minutter! 🚀**
