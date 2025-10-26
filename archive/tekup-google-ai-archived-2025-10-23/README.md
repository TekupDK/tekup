# RenOS – Rendetalje Operating System
\n\n
\n\nRenOS er det komplette AI-driftsystem til Rendetalje.dk. Platformen automatiserer hele forretningsprocessen fra første lead til afsluttet opgave og frigør tid til det, der betyder noget: tilfredse kunder og et stærkt team.

\n\n## 🎯 Mission & kerneformål
\n\n
\n\n- Eliminere manuelt arbejde med e-mails, booking og kundeservice.
\n\n- Automatisere lead-konvertering fra kilder som Rengø## 🗄️ Database Migration Notice

⚠️ **MIGRATION PLANLAGT:** RenOS database (Prisma + PostgreSQL) skal migreres til central Supabase

📋 **[→ Se Migration Plan](../DATABASE_CONSOLIDATION_ANALYSE.md)** - Komplet analyse og roadmap  
🚀 **[→ Quick Start Guide](../MIGRATION_QUICK_START.md)** - Kom i gang på 30 minutter  
🛠️ **[→ Migration Tools](../GITHUB_MIGRATION_RESOURCES.md)** - GitHub resources

**Hvad betyder dette?**
- ✅ Nuværende database fungerer som normalt
- 🎯 Migration planlagt som **høj prioritet** (Fase 1)
- 📦 19 modeller (536 linjer schema) skal migreres
- 💰 Estimeret besparelse: 30-65% på database costs

**Næste skridt:** Review migration plan og beslut GO/NO-GO

---

## 📚 Dokumentation

- **Kom i gang**: [CONTRIBUTING.md](./CONTRIBUTING.md) | [FRONTEND_SETUP.md](./FRONTEND_SETUP.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md) | [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | [DEPLOY_NOW.md](./DEPLOY_NOW.md)
- **Sikkerhed**: [SECURITY.md](./SECURITY.md) | [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md)
- **Features**: [DASHBOARD.md](./DASHBOARD.md) | [docs/CALENDAR_BOOKING.md](./docs/CALENDAR_BOOKING.md) | [docs/EMAIL_AUTO_RESPONSE.md](./docs/EMAIL_AUTO_RESPONSE.md)
- **Business**: [docs/COMPETITIVE_ANALYSIS_CLEANMANAGER.md](./docs/COMPETITIVE_ANALYSIS_CLEANMANAGER.md) | [MARKET_ANALYSIS_2025.md](./MARKET_ANALYSIS_2025.md)
- **Teknisk**: [docs/DATA_FETCHING.md](./docs/DATA_FETCHING.md) | [docs/CUSTOMER_DATABASE.md](./docs/CUSTOMER_DATABASE.md) | [docs/CACHING.md](./docs/CACHING.md)nu, Rengøring Aarhus og AdHelp.
\n\n- Optimere kalenderen med intelligent booking, ombooking og kapacitetsstyring.
\n\n- Levere smart kundeservice med konfliktløsning, opfølgning og betalingsoverblik.
\n\n- Drive data-drevne beslutninger via indbyggede business-intelligence dashboards.
\n\n
\n\n## 🏗️ Arkitektursoverblik
\n\n
\n\n### AI-hjernen
\n\n
\n\n- **LLM-integration** (OpenAI/Claude klar): driver beslutningstagning og tekstgenerering.
\n\n- **Intentklassificering**: forstår kundernes henvendelser og vælger rigtige workflows.
\n\n- **Task planning**: omsætter intents til konkrete planer via `TaskPlanner`.
\n\n- **Plan execution**: udfører planer gennem modulære handlers (mail, kalender, hukommelse).
\n\n
\n\n### Google-integration
\n\n
\n\n- **Gmail-automation**: sender tilbud, følger op og håndterer klager med thread-awareness.
\n\n- **Kalenderstyring**: booker, ombooker og foreslår alternative slots.
\n\n- **Thread intelligence**: genbruger eksisterende tråde for at undgå dobbelt-tilbud.
\n\n
\n\n### Forretningspipeline
\n\n
\n\n`� Lead → 🤖 AI analyse → 📋 Tilbud → 📅 Booking → ✅ Udført`

\n\n### Repos-struktur
\n\n
\n\n```text
\n\n└── src
    ├── agents           # Intentklassificering, planlægning og eksekvering
\n\n    ├── controllers      # HTTP-kontrollere og API-endpoints
\n\n    ├── llm              # Prompt-templates og provider-abstraktioner
\n\n    ├── routes           # Express routing
\n\n    ├── services         # Google, hukommelse og eksterne integrationer
\n\n    ├── workflows        # Domænespecifikke automations (udvides løbende)
\n\n    └── types.ts         # Delte TypeScript-typer
\n\n```
\n\n
\n\n## 🔄 Automatiserede workflows
\n\n
\n\n1. **Lead management** (foundation 🚀)
\n\n
   - Ny e-mail → klassificer kilde → søg eksisterende tråde → generer tilbud → send & track.
\n\n   - Rengøring.nu: Opret ny e-mail (må ikke svares direkte).
\n\n   - Rengøring Aarhus: Svar direkte på lead.
\n\n   - AdHelp: Svar på kundens e-mailadresse, ikke AdHelp’s.
\n\n
\n\n2. **Tilbuds-generation** (fase 2 planlagt)
\n\n
   - Dynamiske estimater for boligstørrelse, teamstørrelse, varighed og pris (349 kr/time).
\n\n   - Forslag til ledige tider og klar kommunikation om opfølgning ved +1 times overskridelse.
\n\n
\n\n3. **Kalenderoptimering** (foundation + udbygning)
\n\n
   - Automatisk booking i ledige slots og proaktive ombookinger ved konflikter.
\n\n   - Tidsestimering baseret på historik samt påmindelser til kunder og team.
\n\n
\n\n4. **Kundeservice-automation** (fase 2 planlagt)
\n\n
   - Konfliktløsning: anerkend fejl → tilbud kompensation → find løsning.
\n\n   - Automatiske opfølgninger 7-10 dage efter tilbud og struktur for betalingspåmindelser.
\n\n
\n\n## 🎛️ Funktioner & capabilities
\n\n
\n\n### Leveret i Fase 1 – Foundation ✅
\n\n
\n\n- Intentklassificering med heuristik og LLM fallback.
\n\n- Google Gmail/Calendar-integration med domain-wide delegation og dry-run sikkerhed.
\n\n- Planlægning/eksekvering via modulære handlers.
\n\n- Konfigurerbar miljøopsætning og CI-klare test/lint scripts.
\n\n
\n\n### På vej i Fase 2 – Intelligence 🚧
\n\n
\n\n- Avanceret bookingoptimering og konfliktløsning.
\n\n- Kundeservice workflows med automatisk eskalation og opfølgning.
\n\n- Business-intelligence dashboards for leads, performance og pricing.
\n\n
\n\n### Planlagt i Fase 3 – Scale 🧭
\n\n
\n\n- Mobil- og tabletapps til teamet.
\n\n- Integrationer til Billy.dk, MobilePay/bank og udvidet lead-økosystem.
\n\n- Team collaboration features og avanceret forecasting.
\n\n
\n\n## Integration layer
\n\n
\n\n- 🔗 **Gmail API** – fuld e-mail automation og thread tracking.
\n\n- 🔗 **Google Calendar API** – komplet kalenderstyring.
\n\n- 🔗 **Billy.dk** – fakturering (fase 3).
\n\n- 🔗 **MobilePay/bank** – betalingsflow (fase 3).
\n\n- 🔗 **Lead-kilder** – Rengøring.nu, Rengøring Aarhus, AdHelp m.fl.
\n\n
\n\n## 📱 Multi-platform adgang
\n\n
\n\n- **Mobilapp** (planlagt): real-time notifikationer, hurtige bookinger, team chat.
\n\n- **Tablet-dashboard** (planlagt): dagsoversigt, kundehistorik, performance-metrics.
\n\n- **Desktop command center** (eksisterende web-app): fuld forretningskontrol og rapportering.
\n\n
\n\n## 🚀 Implementeringsfaser
\n\n
\n\n- [x] **Fase 1 – Foundation**: AI-kerne, Google-integration og basis e-mail-automation.
\n\n- [ ] **Fase 2 – Intelligence**: Bookingoptimering, kundeserviceflows, BI dashboards.
\n\n- [ ] **Fase 3 – Scale**: Mobile/tablet apps, økonomiintegrationer, avanceret analytics.
\n\n
\n\n## 💡 Unikke fordele
\n\n
\n\n### Vs. manuelle processer
\n\n
\n\n- 95 % reduktion i manuel e-mail-håndtering.
\n\n- Intelligent booking i stedet for telefonkæder.
\n\n- Predictive analytics frem for gætværk.
\n\n- Konsistent kvalitet med automatiserede processer.
\n\n
\n\n### Vs. generiske CRM-systemer
\n\n
\n\n- Domænespecifik intelligens til rengøringsbranchen.
\n\n- Indbyggede forretningsregler baseret på Rendetaljes erfaringer.
\n\n- Seamless Google Workspace-integration.
\n\n- Optimeret til danske kunder (sprog, kultur, forventninger).
\n\n
\n\n## 🎯 Forretningsimpact
\n\n
\n\n### Effektivitet
\n\n
\n\n- Automatiser 80 % af gentagne opgaver.
\n\n- Reducer svartider fra timer til minutter.
\n\n- Eliminer dobbeltarbejde og fejl.
\n\n- Udnyt kapacitet optimalt.
\n\n
\n\n### Vækst
\n\n
\n\n- Håndter tre gange flere leads uden ekstra personale.
\n\n- Højere konvertering via konsistente tilbud.
\n\n- Bedre kundeservice = flere anbefalinger.
\n\n- Data-drevet optimering skaber større profit.
\n\n
\n\n### Kvalitet
\n\n
\n\n- Standardiserede processer og proaktiv fejlhåndtering.
\n\n- Konsistent kommunikation i alle kanaler.
\n\n- Professionelt brand image og transparens.
\n\n
\n\n## Kom godt i gang
\n\n
\n\n### Handler-moduler
\n\n
\n\nEksekveringslaget består af små handlers i `src/agents/handlers/`, så hver opgavetype kan udvides og testes isoleret. `PlanExecutor` holder kun et registry af handlers og gør nye automations simple at tilføje.

\n\n### Forudsætninger
\n\n
\n\n- Node.js 20+
\n\n- NPM 9+
\n\n- Google Cloud servicekonto med adgang til Gmail- og Calendar-API (domain-wide delegation)
\n\n- OpenAI API-nøgle (valgfrit, men anbefalet for mere præcis intentklassificering)
\n\n
\n\n### Installation
\n\n
\n\n```powershell
\n\ncd "c:\Users\empir\Tekup Google AI"
npm install
\n\n```

\n\n### Miljøvariabler
\n\n
\n\n```ini
\n\nPORT=3000
OPENAI_API_KEY=
GEMINI_KEY=...
GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
DEFAULT_EMAIL_FROM=info@rendetalje.dk
ORGANISATION_NAME=Rendetalje.dk
RUN_MODE=dry-run
LOG_LEVEL=info
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:3000/oauth/callback
GMAIL_PROJECT_ID=...
GMAIL_USER_EMAIL=info@rendetalje.dk
\n\n# Test helpers (valgfrit)
\n\nSMOKETEST_EMAIL_TO=info@rendetalje.dk
\n\nSMOKETEST_CALENDAR_ID=primary
SMOKETEST_TIMEZONE=Europe/Copenhagen
\n\n```

> `RUN_MODE=dry-run` sikrer, at mails og kalenderaftaler ikke sendes/booges mens du tester.

\n\n### Kørsel
\n\n
\n\n```powershell
\n\nnpm run dev
\n\n```

Serveren starter på `http://localhost:3000` (development) eller `https://api.renos.dk` (production).

\n\n### Test
\n\n
\n\n```powershell
\n\nnpm test
\n\n```

\n\n### Lint
\n\n
\n\n```powershell
\n\nnpm run lint
\n\n```

Projektet anvender ESLints moderne flat-config via `eslint.config.cjs`; ingen `.eslintrc*`-filer er nødvendige.

\n\n## Google-integration (Gmail & Kalender)
\n\n
\n\nFør systemet kan sende mails eller oprette kalenderaftaler, skal der oprettes en Google Cloud-servicekonto med domæne-delegerede rettigheder.

\n\n1. **Aktivér Gmail API og Google Calendar API** i Google Cloud Console.
\n\n2. **Opret eller genbrug en servicekonto** og download nøglen (JSON).
\n\n3. **Aktivér domæne-delegering** på servicekontoen og notér klient-ID'et.
\n\n4. **Tillad scopes i Google Workspace Admin** under *Security → API Controls → Domain-wide Delegation*:
\n\n
    ```text
    https://www.googleapis.com/auth/gmail.modify
    https://www.googleapis.com/auth/calendar.events
    https://www.googleapis.com/auth/calendar.readonly
    ```

\n\n5. **Del postkasse og kalender** med den bruger, der skal impersoneres (fx `info@rendetalje.dk`).
\n\n6. **Opdater `.env`** med servicekontoens værdier og sæt `GOOGLE_IMPERSONATED_USER` til den valgte Gmail-bruger.
\n\n7. Start i `RUN_MODE=dry-run`, og skift først til `live`, når du er klar til at sende rigtige mails og møder.

> Gem nøgler og klienthemmeligheder sikkert (f.eks. i Google Secret Manager eller GitHub Secrets) og commit dem aldrig til repositoriet.

\n\n### Gmail & Calendar Data Fetching 🆕
\n\n
\n\nRenOS kan nu hente data fra Gmail og Google Calendar for at give AI'en bedre kontekst:

\n\n```powershell
\n\n# Hent både Gmail og Calendar data
\n\nnpm run data:fetch
\n\n
\n\n# Kun Gmail beskeder
\n\nnpm run data:gmail
\n\n
\n\n# Kun Calendar begivenheder
\n\nnpm run data:calendar
\n\n```
\n\n
**Funktioner:**

\n\n- 📧 **Gmail**: Hent seneste beskeder med ID, afsender, emne, dato og forhåndsvisning
\n\n- 📅 **Calendar**: Hent kommende begivenheder med titel, tidspunkt, lokation og deltagere
\n\n- 🎯 **Filtrering**: Understøtter labels, søgeforespørgsler og tidsintervaller
\n\n- 🔒 **Sikker**: Fungerer i dry-run mode (kun læsning, ingen ændringer)
\n\n
Se [docs/DATA_FETCHING.md](./docs/DATA_FETCHING.md) for detaljeret dokumentation, use cases og API-reference.

\n\n### Lead Monitoring System 🆕
\n\n
\n\nAutomatisk overvågning af Leadmail.no emails med intelligent parsing og AI-drevet lead konvertering:

\n\n```powershell
\n\n# Start lead monitoring (cron job)
\n\nnpm run monitor:leads
\n\n
\n\n# Hent nye leads manuelt
\n\nnpm run monitor:check
\n\n
\n\n# Test lead parser
\n\nnpm run monitor:test
\n\n```
\n\n
**Features:**

\n\n- 🔍 **Automatisk Detection**: Overvåger Gmail for nye leads fra Leadmail.no
\n\n- 📊 **Intelligent Parsing**: Udtrækker kunde-info, boligtype, størrelse, opgave-type
\n\n- 🔔 **Real-time Callbacks**: Trigger custom workflows når nye leads ankommer
\n\n- 📝 **Struktureret Data**: ParsedLead objekter klar til AI processing
\n\n- ⏱️ **Cron Scheduling**: Konfigurerbar overvågningsfrekvens
\n\n
Se [docs/LEAD_MONITORING.md](./docs/LEAD_MONITORING.md) for komplet dokumentation og eksempler.

\n\n### Email Auto-Response System 🆕
\n\n
\n\nAutomatisk generering og afsendelse af personaliserede email-svar med Gemini AI:

\n\n```powershell
\n\n# Test email generation
\n\nnpm run email:test
\n\n
\n\n# List pending responses
\n\nnpm run email:pending
\n\n
\n\n# Approve/reject responses
\n\nnpm run email:approve <leadId>
\n\nnpm run email:reject <leadId>

\n\n# View statistics
\n\nnpm run email:stats
\n\n
\n\n# Start auto-response monitoring
\n\nnpm run email:monitor
\n\n```
\n\n
**Highlights:**

\n\n- 🤖 **Gemini AI Integration**: Bruger Google's Gemini 2.0 Flash til professionelle danske svar
\n\n- ✅ **Approval Workflow**: Optional manual review før afsendelse
\n\n- 📊 **Daily Limits**: Beskyttelse mod spam (50 svar/dag default)
\n\n- 🎯 **Template System**: Moving cleaning, regular cleaning, quote requests
\n\n- 💰 **Smart Pricing**: Automatisk pris-estimater (250-300 kr/t regular, 300 kr/t moving)
\n\n- 📈 **Status Tracking**: pending/sent/approved/rejected/failed
\n\n- 🇩🇰 **Dansk Sprog**: Professionel tone med korrekt formatering
\n\n
Se [docs/EMAIL_AUTO_RESPONSE.md](./docs/EMAIL_AUTO_RESPONSE.md) for fuld dokumentation, API reference og best practices.

\n\n### Calendar Booking Management 🆕
\n\n
\n\nIntelligent kalender-management med automatisk tilgængelighedstjek og bekræftelses-emails:

\n\n```powershell
\n\n# List alle kommende bookings
\n\nnpm run booking:list
\n\n
\n\n# Tjek tilgængelighed for en specifik dato
\n\nnpm run booking:availability 2025-10-01
\n\n
\n\n# Find næste ledige tidspunkt (standard: 120 min)
\n\nnpm run booking:next-slot 90
\n\n
\n\n# Tjek om specifikt tidspunkt er ledigt
\n\nnpm run booking:check-slot 2025-10-01T09:00:00Z 2025-10-01T11:00:00Z
\n\n
\n\n# Se booking-statistikker
\n\nnpm run booking:stats
\n\n```
\n\n
**Features:**

\n\n- 📅 **Automatisk Tilgængelighedstjek**: Undgår dobbelt-booking med Google Calendar freebusy API
\n\n- 🔍 **Intelligent Slot-søgning**: Finder automatisk næste ledige tidspunkt (op til 14 dage frem)
\n\n- ✉️ **Bekræftelses-emails**: Professionelle danske emails med booking-detaljer (dato, tid, lokation, Google Calendar link)
\n\n- 🔄 **Smart Ombooking**: Finder alternativer ved konflikter og sender reschedule-notifikation
\n\n- 📊 **Statistikker**: Overblik over sidste/næste 7 dage med total tid og gennemsnitlig varighed
\n\n- 🇩🇰 **Dansk Formatering**: Datoer i fuldt dansk format (f.eks. "fredag den 3. oktober 2025 kl. 11.00")
\n\n
**Booking Workflow:**

\n\n1. Anmodning om booking → 2. Tjek tilgængelighed → 3. Find alternativer ved konflikt → 4. Opret Google Calendar event → 5. Send bekræftelses-email

Se [docs/CALENDAR_BOOKING.md](./docs/CALENDAR_BOOKING.md) (kommer snart) for komplet dokumentation og API reference.

\n\n### Bug Fixes & Known Issues 🔧
\n\n
\n\nRenOS dokumenterer alle kendte bugs og deres løsninger for transparens og læring:

**Løste Issues:**

\n\n- ✅ Gmail API maxResults NaN bug (29. sep 2025) - Fixed robust validation
\n\n
Se [docs/BUG_FIXES.md](./docs/BUG_FIXES.md) for detaljeret teknisk analyse, root cause, løsning og prevention guidelines.

\n\n### Google live smoke test
\n\n
\n\nNår du er klar til at verificere den live Google-opsætning:

\n\n1. Sæt `RUN_MODE=live` i din shell-session (eller midlertidigt i `.env`).
\n\n1. (Valgfrit) Juster `SMOKETEST_EMAIL_TO`, `SMOKETEST_CALENDAR_ID` og `SMOKETEST_TIMEZONE` for at styre destinationen.
\n\n1. Kør smoke testen:

  ```powershell
  npm run google:smoketest
  ```

\n\n1. Scriptet sender en e-mail og opretter en kalenderaftale som `info@rendetalje.dk`. Et JSON-resumé gemmes i `reports/google-live-test-<timestamp>.json`.
\n\n1. Skift `RUN_MODE` tilbage til `dry-run`, hvis du ikke ønsker flere live-opkald.

\n\n## API-reference
\n\n
\n\n### POST `/api/chat`
\n\n
\n\nSender en besked til RenOS og modtager den fulde plan + eksekveringsresultatet.
\n\n
\n\n#### Request body
\n\n
\n\n```json
\n\n{
  "message": "Hej, vi skal bruge hjælp til rengøring af 150m2 kontor",
  "sessionId": "optional-session-id",
  "userId": "crm-123",
  "channel": "desktop",
  "lead": {
    "source": "Rengøring Aarhus",
    "email": "kunde@example.com",
    "squareMeters": 150,
    "rooms": 6,
    "taskType": "Erhvervsrengøring"
  }
}
\n\n```

\n\n#### Response
\n\n
\n\n```json
\n\n{
  "sessionId": "generated-id",
  "response": {
    "intent": {
      "intent": "email.lead",
      "confidence": 0.9,
      "rationale": "Matched keyword"
    },
    "plan": [
      { "type": "email.compose", "provider": "gmail" }
    ],
    "execution": {
      "summary": "Plan eksekveret: ...",
      "actions": [
        {
          "taskId": "...",
          "provider": "gmail",
          "status": "queued",
          "detail": "Tilbud klar..."
        }
      ]
    }
  }
}
\n\n```

\n\n## 📚 Dokumentation
\n\n
\n\nRenOS har omfattende dokumentation for alle aspekter af systemet. For en komplet oversigt over alle tilgængelige dokumentationsfiler, se:

\n\n### [📖 DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
\n\n
\n\n**Hurtige links til vigtig dokumentation:**

\n\n- **Kom i gang**: [CONTRIBUTING.md](./CONTRIBUTING.md) | [FRONTEND_SETUP.md](./FRONTEND_SETUP.md)
\n\n- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md) | [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | [DEPLOY_NOW.md](./DEPLOY_NOW.md)
\n\n- **Sikkerhed**: [SECURITY.md](./SECURITY.md) | [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md)
\n\n- **Features**: [DASHBOARD.md](./DASHBOARD.md) | [docs/CALENDAR_BOOKING.md](./docs/CALENDAR_BOOKING.md) | [docs/EMAIL_AUTO_RESPONSE.md](./docs/EMAIL_AUTO_RESPONSE.md)
\n\n- **Render Integration**: [MCP Setup](./docs/RENDER_MCP_QUICK_SETUP.md) | [MCP Guide](./docs/RENDER_MCP_INTEGRATION.md) | [REST API Examples](./docs/RENDER_REST_API_EXAMPLES.md) | [API vs MCP](./docs/RENDER_API_VS_MCP_GUIDE.md)
\n\n- **Teknisk**: [docs/DATA_FETCHING.md](./docs/DATA_FETCHING.md) | [docs/CUSTOMER_DATABASE.md](./docs/CUSTOMER_DATABASE.md) | [docs/CACHING.md](./docs/CACHING.md)
\n\n
**Total antal dokumentationsfiler**: 40

\n\n## 🚀 Render Integration - Administrer Infrastruktur

**NYT**: RenOS understøtter nu **to måder** at arbejde med Render produktionsmiljø:

**🤖 MCP Server - Naturligt Sprog i IDE**

Til interaktiv udvikling og debugging:
- 📊 "Vis status for tekup-renos og tekup-renos-frontend"
- 📝 "Hent fejllogfiler fra den sidste time"
- 💾 "Kør forespørgsel på databasen for kunder oprettet i denne uge"
- ⚙️ "List miljøvariabler for tekup-renos"

**Kom i gang:** [RENDER_MCP_QUICK_SETUP.md](./docs/RENDER_MCP_QUICK_SETUP.md) (5 minutter)

**🔌 REST API - Programmatisk Adgang**

Til automation, CI/CD og scripting:

```powershell
# Tjek service status
curl.exe -s "https://api.render.com/v1/services/${SERVICE_ID}" `
  -H "Authorization: Bearer ${RENDER_API_KEY}"

# Trigger deploy
curl.exe -X POST "https://api.render.com/v1/services/${SERVICE_ID}/deploys" `
  -H "Authorization: Bearer ${RENDER_API_KEY}"
```

**20+ færdige scripts:** [RENDER_REST_API_EXAMPLES.md](./docs/RENDER_REST_API_EXAMPLES.md)

### 📖 Hvilken Skal Jeg Bruge?

- **MCP**: Hurtige checks under udvikling, ad-hoc queries, debugging
- **REST API**: Automated deploys, monitoring scripts, CI/CD pipelines

**Beslutningsguide**: [RENDER_API_VS_MCP_GUIDE.md](./docs/RENDER_API_VS_MCP_GUIDE.md)

**Begge bruger samme API-nøgle**: [Opret her](https://dashboard.render.com/account/api-keys)

## Næste skridt
\n\n
\n\n- Udvidet OAuth-flow til kunders egen Google-konto.
\n\n- Mobil/tablet-clients via websockets eller push-notifikationer.
\n\n- Persistenslag (PostgreSQL) for hukommelse, analyser og audit-log.
\n\n- Automatiserede kundeserviceflows inkl. konfliktlog og kompensation.
\n\n
\n\n## Licens
\n\n
\n\nMIT
