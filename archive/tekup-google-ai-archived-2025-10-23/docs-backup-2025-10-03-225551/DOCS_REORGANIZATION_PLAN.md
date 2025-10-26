# 📚 Markdown Dokumentation Reorganisering Plan

## 🎯 Mål

Organisere alle 334+ markdown filer i en logisk, søgbar struktur der gør det nemt at finde dokumentation.

---

## 📊 Nuværende Situation

**Root directory:** 121 .md filer (kaos!)
**docs/ directory:** 43+ .md filer (delvist organiseret)

**Problemer:**
- ❌ Svært at finde relevant dokumentation
- ❌ Mange duplikater og forældede filer
- ❌ Ingen klar struktur eller hierarki
- ❌ Mix af session logs, guides, status reports
- ❌ Ingen master index

---

## 🏗️ Foreslået Ny Struktur

```
docs/
├── README.md                          # Master index
├── architecture/                      # 🏛️ System arkitektur
│   ├── VISUAL_ANALYSIS_REPORT.md
│   ├── VISUAL_ARCHITECTURE.md
│   ├── VISUAL_SUMMARY.md
│   ├── CSS_ARCHITECTURE_ANALYSIS.md
│   └── COMPLETE_SYSTEM_AUDIT.md
│
├── guides/                            # 📚 Bruger & udvikler guides
│   ├── user/                          # For brugere
│   │   ├── USER_GUIDE.md
│   │   ├── USER_GUIDE_CLI_COMMANDS.md
│   │   └── RENOS_UI_FUNKTIONALITET_GUIDE.md
│   ├── setup/                         # Setup & installation
│   │   ├── QUICK_AUTH_SETUP.md
│   │   ├── GOOGLE_CALENDAR_SETUP.md
│   │   ├── AUTHENTICATION_GUIDE.md
│   │   └── SETUP_CHECKLIST.md
│   └── developer/                     # For udviklere
│       ├── AGENT_GUIDE.md
│       ├── CONTRIBUTING.md
│       └── TROUBLESHOOTING_AUTH.md
│
├── deployment/                        # 🚀 Deployment & produktion
│   ├── guides/
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOY_INSTRUCTIONS.md
│   │   ├── GO_LIVE_GUIDE.md
│   │   └── RENDER_DEPLOYMENT.md
│   ├── status/
│   │   ├── DEPLOYMENT_STATUS.md
│   │   ├── DEPLOYMENT_SUCCESS.md
│   │   └── PRODUCTION_CHECKLIST.md
│   └── fixes/
│       ├── DEPLOYMENT_FIX_REPORT.md
│       ├── CRITICAL_FIX_DEPLOYED.md
│       └── URGENT_DEPLOYMENT_FIXES.md
│
├── features/                          # ✨ Feature dokumentation
│   ├── ai-chat/
│   │   ├── AI_CHAT_P0_COMPLETE.md
│   │   ├── AI_CHAT_LLM_IMPLEMENTATION.md
│   │   ├── AI_CHAT_GAP_ANALYSIS.md
│   │   └── OLLAMA_INTEGRATION_COMPLETE.md
│   ├── email/
│   │   ├── EMAIL_AUTO_RESPONSE.md
│   │   ├── EMAIL_APPROVAL_IMPLEMENTATION_COMPLETE.md
│   │   └── GMAIL_INTEGRATION_TEST_GUIDE.md
│   ├── calendar/
│   │   ├── CALENDAR_BOOKING.md
│   │   └── BOOKING_SYSTEM_SUCCESS.md
│   ├── customer/
│   │   ├── CUSTOMER_DATABASE.md
│   │   ├── CUSTOMER_360_FIX_GUIDE.md
│   │   └── KUNDE_SIDE_UDVIKLING_STATUS.md
│   └── integration/
│       ├── INTEGRATION_COMPLETE_FINAL_SUMMARY.md
│       ├── INTEGRATION_STATUS_REPORT.md
│       └── INTEGRATION_BUG_FIXES.md
│
├── sprints/                           # 🏃 Sprint dokumentation
│   ├── sprint-1/
│   │   ├── SPRINT_1_PROGRESS.md
│   │   └── SPRINT_1_COMPLETION_REPORT.md
│   ├── sprint-2/
│   │   ├── SPRINT_2_PROGRESS.md
│   │   └── SPRINT_2_COMPLETION_REPORT.md
│   └── sprint-3/
│       ├── SPRINT_3_TASK_7_LABELS.md
│       ├── SPRINT_3_TASK_8_FOLLOWUP.md
│       └── SPRINT_3_TASK_9_CONFLICT.md
│
├── testing/                           # ✅ Test dokumentation
│   ├── E2E_TEST_QUICK_START.md
│   ├── END_TO_END_TESTING_GUIDE.md
│   ├── TESTING_GUIDE_CRUD.md
│   ├── INTEGRATION_TEST_RESULTS.md
│   └── test-reports/
│       ├── TEST_BOOKING_CALENDAR_SYNC.md
│       ├── TEST_CUSTOMER360_EMAIL_ENDPOINTS.md
│       └── TEST_END_TO_END_PRODUCTION.md
│
├── sessions/                          # 📅 Session logs (arkiv)
│   ├── 2025-09/
│   │   └── SESSION_29_SEP_2025.md
│   └── 2025-10/
│       ├── SESSION_AFSLUTNING_2_OKT.md
│       ├── SESSION_COMPLETE_3_OKT_14_10.md
│       ├── SESSION_STATUS_3_OKT_2025.md
│       └── SESSION_SUMMARY_2_OKT.md
│
├── status/                            # 📊 Status rapporter
│   ├── current/                       # Aktuelle
│   │   ├── IMPLEMENTATION_COMPLETE_STATUS.md
│   │   ├── FOUNDATION_STATUS.md
│   │   └── MASSIVE_UPDATE_STATUS.md
│   └── archive/                       # Arkiv
│       ├── STATUS_OVERSIGT.md
│       ├── DEPLOYMENT_STATUS_AI_FEATURES.md
│       └── FRONTEND_UPDATE_STATUS.md
│
├── fixes/                             # 🔧 Bug fixes & patches
│   ├── MARKDOWN_FIX_COMPLETE_RAPPORT.md
│   ├── BROWSER_CACHE_FIX.md
│   ├── GLOBAL_INPUT_FIX_RAPPORT.md
│   ├── KUNDE_MODAL_FIX_RAPPORT.md
│   └── BAD_GATEWAY_FIX_REPORT.md
│
├── planning/                          # 📋 Planlægning & analyse
│   ├── GAP_ANALYSIS_REPORT.md
│   ├── INCOMPLETE_FEATURES_ANALYSIS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── NEXT_STEPS_GUIDE.md
│   └── TODO_PROGRESS_TRACKER.md
│
├── security/                          # 🔒 Sikkerhed
│   ├── SECURITY.md
│   ├── SECURITY_ANALYSIS.md
│   └── GOOGLE_PRIVATE_KEY_FIX.md
│
└── archive/                           # 🗄️ Gamle/forældede docs
    ├── old-deployments/
    ├── old-sessions/
    └── deprecated/
```

---

## 🎯 Kategoriserings Regler

### 📂 **architecture/** - System Design
- Filnavne: `VISUAL_*, CSS_*, COMPLETE_SYSTEM_*`
- Indhold: Arkitektur diagrammer, system design, tekniske analyser

### 📚 **guides/** - Dokumentation
- **user/**: End-user dokumentation
- **setup/**: Installation & konfiguration
- **developer/**: Udvikler dokumentation

### 🚀 **deployment/** - Deployment
- **guides/**: Deployment instruktioner
- **status/**: Deployment status
- **fixes/**: Deployment fixes

### ✨ **features/** - Feature Docs
- Organiseret efter feature (ai-chat, email, calendar, etc.)
- Implementation docs, gap analysis, status

### 🏃 **sprints/** - Sprint Tracking
- Organiseret efter sprint nummer
- Progress reports, completion reports, task docs

### ✅ **testing/** - Test Docs
- Test guides, results, reports
- E2E, integration, unit test docs

### 📅 **sessions/** - Session Logs
- Organiseret efter dato (YYYY-MM/)
- Kun til historisk reference

### 📊 **status/** - Status Reports
- **current/**: Aktuelle status
- **archive/**: Gamle status rapporter

### 🔧 **fixes/** - Bug Fixes
- Bug fix rapporter
- Patch dokumentation

### 📋 **planning/** - Planlægning
- Gap analysis, TODO tracking
- Implementation plans
- Next steps

### 🔒 **security/** - Sikkerhed
- Security policies, fixes, audits

### 🗄️ **archive/** - Arkiv
- Forældede docs
- Gamle versioner
- Deprecated features

---

## 🔄 Migration Plan

### Phase 1: Struktur (5 min)
1. ✅ Opret alle mapper under `docs/`
2. ✅ Opret README.md i hver hovedmappe

### Phase 2: Kategorisering (10 min)
3. ✅ Generer PowerShell script til auto-kategorisering
4. ✅ Review og juster kategorier manuelt

### Phase 3: Migration (5 min)
5. ✅ Kør move script
6. ✅ Verificer ingen filer mangler

### Phase 4: Index (10 min)
7. ✅ Opret master `docs/README.md`
8. ✅ Opret category indexes
9. ✅ Tilføj beskrivelser

### Phase 5: Cleanup (5 min)
10. ✅ Fjern duplikater
11. ✅ Arkiver forældede docs
12. ✅ Opdater links i kode

**Total tid:** ~35 minutter

---

## 📋 Execution Checklist

- [ ] Backup alle .md filer først
- [ ] Opret alle mapper
- [ ] Flyt filer baseret på regler
- [ ] Opret README.md i hver mappe
- [ ] Opret master docs/README.md
- [ ] Verificer ingen broken links
- [ ] Commit changes
- [ ] Opdater DOCUMENTATION_INDEX.md

---

## 🎯 Success Kriterier

✅ **Alle .md filer er kategoriseret**
✅ **Logisk hierarki er oprettet**
✅ **Master index findes i docs/README.md**
✅ **Hver kategori har README.md**
✅ **Ingen filer i root (undtagen README.md, CONTRIBUTING.md)**
✅ **Gamle docs er arkiveret**
✅ **Links virker stadig**

---

**Genereret:** 3. Oktober 2025
**Estimeret tid:** 35 minutter
**Prioritet:** HIGH - Kritisk for vedligeholdelse
