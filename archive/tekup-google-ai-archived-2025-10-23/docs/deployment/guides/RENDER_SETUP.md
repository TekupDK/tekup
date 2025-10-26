# 🚀 Render.com Setup Guide - RenOS Backend\n\n\n\n## ✅ Step 1: Web Service Configuration\n\n\n\nDu er på den rigtige side! Her er hvad du skal udfylde:\n\n\n\n### Basic Settings (Allerede OK)\n\n\n\n- ✅ **Source Code**: `JonasAbde/tekup-renos`\n\n- ✅ **Name**: `tekup-renos`\n\n- ✅ **Language**: Docker (autofilled - perfekt!)\n\n- ✅ **Branch**: main\n\n- ✅ **Region**: Oregon (US West) - eller vælg Frankfurt hvis tilgængelig\n\n\n\n### Root Directory\n\n\n\n**VIGTIGT**: Lad dette felt være **TOMT** ✅\n\n\n\n### Instance Type\n\n\n\n**Vælg: Free** ✅\n\n\n\n- $0/måned\n\n- 512 MB RAM\n\n- 0.1 CPU\n\n- Perfekt til test/development\n\n
---
\n\n## ⚡ Step 2: Environment Variables\n\n\n\n**STOP!** Før du klikker "Deploy", skal du tilføje environment variables.\n\n
Klik på "Add Environment Variable" for hver af disse:
\n\n### 1. PORT\n\n\n\n```\n\nNAME: PORT
VALUE: 3000\n\n```
\n\n### 2. NODE_ENV\n\n\n\n```\n\nNAME: NODE_ENV
VALUE: production\n\n```
\n\n### 3. LOG_LEVEL\n\n\n\n```\n\nNAME: LOG_LEVEL
VALUE: info\n\n```
\n\n### 4. RUN_MODE\n\n\n\n```\n\nNAME: RUN_MODE
VALUE: dry-run\n\n```

(Skift til `production` når alt virker)
\n\n### 5. ORGANISATION_NAME\n\n\n\n```\n\nNAME: ORGANISATION_NAME
VALUE: Rendetalje.dk\n\n```
\n\n### 6. GEMINI_KEY\n\n\n\n```\n\nNAME: GEMINI_KEY
VALUE: [DIN GEMINI API KEY]\n\n```

⚠️ **Find denne i din .env fil**
\n\n### 7. GOOGLE_PROJECT_ID\n\n\n\n```\n\nNAME: GOOGLE_PROJECT_ID
VALUE: [DIN GOOGLE PROJECT ID]\n\n```
\n\n### 8. GOOGLE_CLIENT_EMAIL\n\n\n\n```\n\nNAME: GOOGLE_CLIENT_EMAIL
VALUE: [DIN SERVICE ACCOUNT EMAIL]\n\n```
\n\n### 9. GOOGLE_PRIVATE_KEY\n\n\n\n```\n\nNAME: GOOGLE_PRIVATE_KEY
VALUE: [DIN PRIVATE KEY]\n\n```

⚠️ **VIGTIGT**: Kopier HELE private key inklusiv `-----BEGIN PRIVATE KEY-----` og `-----END PRIVATE KEY-----`
\n\n### 10. GOOGLE_IMPERSONATED_USER\n\n\n\n```\n\nNAME: GOOGLE_IMPERSONATED_USER
VALUE: info@rendetalje.dk\n\n```
\n\n### 11. DEFAULT_EMAIL_FROM\n\n\n\n```\n\nNAME: DEFAULT_EMAIL_FROM
VALUE: info@rendetalje.dk\n\n```
\n\n### 12. GMAIL_CLIENT_ID\n\n\n\n```\n\nNAME: GMAIL_CLIENT_ID
VALUE: [DIN GMAIL CLIENT ID]\n\n```
\n\n### 13. GMAIL_CLIENT_SECRET\n\n\n\n```\n\nNAME: GMAIL_CLIENT_SECRET
VALUE: [DIN GMAIL CLIENT SECRET]\n\n```
\n\n### 14. GMAIL_REDIRECT_URI\n\n\n\n```\n\nNAME: GMAIL_REDIRECT_URI
VALUE: https://tekup-renos.onrender.com/oauth/callback\n\n```

⚠️ **OBS**: Dette bliver den rigtige URL efter deployment
\n\n### 15. GMAIL_PROJECT_ID\n\n\n\n```\n\nNAME: GMAIL_PROJECT_ID
VALUE: [SAMME SOM GOOGLE_PROJECT_ID]\n\n```
\n\n### 16. GMAIL_USER_EMAIL\n\n\n\n```\n\nNAME: GMAIL_USER_EMAIL
VALUE: info@rendetalje.dk\n\n```

---
\n\n## 🗄️ STOP! Opret Database Først\n\n\n\n**Du mangler en DATABASE!**
\n\n### Gør dette FØR du deployer backend\n\n\n\n1. **Åbn nyt tab**: <https://render.com/new/database>\n\n2. **Vælg**: PostgreSQL\n\n3. **Konfigurer**:
   - Name: `renos-database`\n\n   - Database: `renos_db`\n\n   - User: `renos_user`\n\n   - Region: **Samme som Web Service** (Oregon)\n\n   - Plan: **Free**\n\n4. **Klik**: "Create Database"\n\n5. **Vent** ~2 minutter til den er klar\n\n6. **Kopier**: "Internal Database URL" (under Connection Info)
\n\n### Derefter tilføj til Backend\n\n\n\n### 17. DATABASE_URL\n\n\n\n```\n\nNAME: DATABASE_URL
VALUE: [INTERNAL DATABASE URL FRA STEP OVENFOR]\n\n```

Ser sådan ud: `postgresql://renos_user:xxxxx@dpg-xxxxx/renos_db`
\n\n### 18. FRONTEND_URL\n\n\n\n```\n\nNAME: FRONTEND_URL
VALUE: https://tekup-renos-frontend.onrender.com\n\n```

(Opdater efter frontend er deployed)

---
\n\n## 🎯 Tjekliste Før Deploy\n\n\n\n- [ ] Database oprettet på Render\n\n- [ ] DATABASE_URL kopieret\n\n- [ ] Alle 18 environment variables tilføjet\n\n- [ ] Instance Type sat til "Free"\n\n- [ ] Root Directory er TOM\n\n
---
\n\n## ✅ Når Alt Er Klar\n\n\n\nKlik **"Deploy Web Service"** knappen nederst!\n\n
Deployment tager ~5-10 minutter første gang.

---
\n\n## 🔍 Efter Deployment\n\n\n\n### Verificer Backend\n\n\n\nNår deployment er færdig, test:
\n\n```
https://tekup-renos.onrender.com/health\n\n```

Skulle returnere:
\n\n```json
{"status":"ok","timestamp":"..."}\n\n```
\n\n### Test Dashboard API\n\n\n\n```\n\nhttps://tekup-renos.onrender.com/api/dashboard/stats/overview\n\n```

---
\n\n## ⚠️ Almindelige Problemer\n\n\n\n### "Build Failed"\n\n\n\n- Tjek at Dockerfile findes i repository root\n\n- Se build logs i Render dashboard\n\n\n\n### "Database Connection Failed"\n\n\n\n- Verificer DATABASE_URL er korrekt\n\n- Tjek at database er i samme region\n\n\n\n### "Health check failing"\n\n\n\n- Backend starter langsomt første gang (op til 2 min)\n\n- Free tier kan tage længere tid\n\n
---
\n\n## 📝 Næste Skridt\n\n\n\nEfter backend er deployed:
\n\n1. Deploy Frontend (Static Site)\n\n2. Opdater FRONTEND_URL i backend\n\n3. Test hele systemet

Se RENDER_FRONTEND.md for frontend deployment guide.
