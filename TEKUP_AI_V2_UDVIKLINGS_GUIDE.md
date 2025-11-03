# 🚀 Tekup AI V2 Udviklings Guide

**Dato:** 3. november 2025  
**Status:** ✅ Komplet setup guide  
**Formål:** Guide til at arbejde med tekup-ai-v2 (Friday AI) i tekup repositoriet

---

## 📋 **Oversigt**

`tekup-ai-v2` er konfigureret som et **git submodule** der peger på det dedikerede [tekup-friday](https://github.com/TekupDK/tekup-friday) repository. Dette tillader dig at arbejde med Friday AI V2 direkte i din tekup workspace, mens koden lever i sit eget repository.

### **Fordele ved denne struktur:**

- ✅ **Dedikeret Repository:** tekup-friday har sin egen git historik
- ✅ **Enkel Integration:** Arbejd direkte fra tekup workspace
- ✅ **Version Control:** Pin specifikke versioner af Friday AI
- ✅ **Deployment:** Separat produktions-deployment fra monorepo

---

## 🎯 **Quick Start - Kom i Gang**

### **Trin 1: Initialiser Submodulet**

```bash
cd /path/to/tekup
git submodule init services/tekup-ai-v2
git submodule update --remote services/tekup-ai-v2
```

Eller i én kommando:

```bash
cd /path/to/tekup
git submodule update --init --remote services/tekup-ai-v2
```

### **Trin 2: Verificer Installation**

```bash
cd services/tekup-ai-v2
ls -la
```

Du skulle nu se hele Friday AI V2 kodebasen:

```
services/tekup-ai-v2/
├── client/          # React 19 frontend
├── server/          # Express + tRPC backend
├── drizzle/         # Database migrations
├── shared/          # Shared types
├── package.json
├── README.md
└── ...
```

### **Trin 3: Installer Dependencies**

```bash
cd services/tekup-ai-v2
pnpm install
```

### **Trin 4: Konfigurer Environment**

```bash
# Kopier example fil
cp .env.example .env

# Rediger .env med dine credentials:
# - DATABASE_URL
# - GOOGLE_SERVICE_ACCOUNT_KEY
# - BILLY_API_KEY
# - GEMINI_API_KEY
```

### **Trin 5: Setup Database**

```bash
pnpm db:push
```

### **Trin 6: Start Udviklings Server**

```bash
pnpm dev
```

Åbn din browser på `http://localhost:3000` 🎉

---

## 🔄 **Daglig Udviklings Workflow**

### **Start Din Arbejdsdag**

```bash
# Gå til tekup workspace
cd /path/to/tekup

# Opdater submodule til seneste version
cd services/tekup-ai-v2
git pull origin main

# Start udviklings server
pnpm dev
```

### **Lav Ændringer**

```bash
# Arbejd normalt i services/tekup-ai-v2/
# Rediger filer, test, etc.

# Commit dine ændringer
git add .
git commit -m "feat: add new feature"
git push origin main
```

### **Opdater Hovedrepo (tekup)**

Efter du har committed til tekup-friday, skal du opdatere submodule reference i hovedrepo:

```bash
# Gå tilbage til hovedrepo
cd /path/to/tekup

# Opdater submodule reference
git add services/tekup-ai-v2
git commit -m "chore: update tekup-ai-v2 to latest version"
git push origin main
```

---

## 📁 **Repository Struktur**

### **tekup (Hovedrepo)**

```
tekup/
├── services/
│   ├── tekup-ai-v2/         ← Git submodule → TekupDK/tekup-friday
│   ├── tekup-ai/            ← Ældre version (backup)
│   └── tekup-gmail-services/
├── apps/
│   └── rendetalje/
└── ...
```

### **tekup-friday (Submodule Repo)**

```
tekup-friday/
├── client/
│   ├── src/
│   │   ├── components/      # React komponenter
│   │   ├── lib/             # Utilities & hooks
│   │   └── App.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/          # tRPC endpoints
│   │   ├── services/        # Business logic
│   │   └── index.ts
│   └── package.json
├── drizzle/
│   └── schema.ts            # Database schema
├── shared/
│   └── types.ts             # Shared TypeScript types
└── package.json             # Root package.json
```

---

## 🛠️ **Nyttige Kommandoer**

### **Submodule Administration**

```bash
# Se submodule status
git submodule status

# Opdater alle submodules
git submodule update --remote

# Opdater kun tekup-ai-v2
git submodule update --remote services/tekup-ai-v2

# Clone repo med alle submodules
git clone --recurse-submodules https://github.com/TekupDK/tekup.git

# Tilføj submodule (kun hvis den ikke findes)
git submodule add https://github.com/TekupDK/tekup-friday.git services/tekup-ai-v2
```

### **Udviklings Kommandoer**

```bash
cd services/tekup-ai-v2

# Start udviklings server (HMR enabled)
pnpm dev

# Build til produktion
pnpm build

# Type check
pnpm check

# Kør tests
pnpm test

# Database migrations
pnpm db:push        # Push schema changes
pnpm db:studio      # Open Drizzle Studio UI
pnpm db:generate    # Generate migration files

# Format kode
pnpm format

# Lint kode
pnpm lint
```

---

## 🔧 **Fejlfinding**

### **Problem: Tomt services/tekup-ai-v2/ directory**

**Symptom:** Directory findes men er tom

**Løsning:**

```bash
cd /path/to/tekup
git submodule update --init --remote services/tekup-ai-v2
```

### **Problem: "fatal: no submodule mapping found"**

**Symptom:** Git kan ikke finde submodule konfiguration

**Løsning:**

```bash
# Verificer at .gitmodules indeholder korrekt konfiguration
cat .gitmodules

# Synkroniser submodule config
git submodule sync
git submodule update --init --remote services/tekup-ai-v2
```

### **Problem: Submodule er på forkert commit**

**Symptom:** Du har en gammel version af Friday AI

**Løsning:**

```bash
cd services/tekup-ai-v2
git checkout main
git pull origin main
cd ../..
git add services/tekup-ai-v2
git commit -m "chore: update tekup-ai-v2 to latest"
```

### **Problem: Kan ikke push til submodule**

**Symptom:** Permission denied eller authentication fejl

**Løsning:**

```bash
# Verificer at du har adgang til tekup-friday repo
cd services/tekup-ai-v2
git remote -v

# Verificer authentication
gh auth status

# Login hvis nødvendigt
gh auth login
```

### **Problem: Dependencies fejler ved installation**

**Symptom:** pnpm install fejler

**Løsning:**

```bash
cd services/tekup-ai-v2

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verificer Node version (skal være v18+)
node --version
```

---

## 🎨 **Udviklings Best Practices**

### **Branch Strategi**

```bash
# Lav nye features i feature branches
cd services/tekup-ai-v2
git checkout -b feature/min-nye-feature

# Commit ofte med beskrivende messages
git commit -m "feat: tilføj ny funktion til inbox"

# Push feature branch
git push origin feature/min-nye-feature

# Lav Pull Request på GitHub
# Efter merge, opdater main
git checkout main
git pull origin main
```

### **Testing Workflow**

```bash
# Kør tests før commit
pnpm test

# Type check
pnpm check

# Lint check
pnpm lint

# Alt i én kommando
pnpm test && pnpm check && pnpm lint
```

### **Database Changes**

```bash
# Efter schema ændringer i drizzle/schema.ts
pnpm db:generate    # Generer migration fil
pnpm db:push        # Apply til database

# Verificer i Drizzle Studio
pnpm db:studio
```

---

## 📚 **Relaterede Ressourcer**

### **Dokumentation**

- **Friday AI README:** `services/tekup-ai-v2/README.md`
- **Migration Plan:** `FRIDAY_AI_V2_MIGRATION_COMPLETE.md`
- **GitHub Organization:** `GITHUB_TEKUPDK_ORGANIZATION.md`
- **Workspace Guide:** `WORKSPACE_GUIDE.md`

### **Repositories**

- **tekup-friday (submodule):** <https://github.com/TekupDK/tekup-friday>
- **tekup (hovedrepo):** <https://github.com/TekupDK/tekup>
- **tekup-billy:** <https://github.com/TekupDK/tekup-billy>
- **tekup-secrets:** <https://github.com/TekupDK/tekup-secrets>

### **Live Resources**

- **Friday AI Live Demo (Development Instance):** <https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer>
  - *Note: This is a temporary development environment and may not always be available*
- **GitHub TekupDK Org:** <https://github.com/TekupDK>

---

## 🎯 **Vigtige Features i Friday AI V2**

### **1. Unified Inbox**

- 📧 **Email Tab:** Gmail integration med smart gruppering
- 📄 **Invoices Tab:** Billy.dk fakturaer med AI analyse
- 📅 **Calendar Tab:** Google Calendar med time-baseret visning
- 👤 **Leads Tab:** Sales pipeline (new → qualified → won → lost)
- ✓ **Tasks Tab:** Prioriteret opgavestyring

### **2. Intent-Based Actions**

1. **Create Lead** - Udtræk kontaktinfo fra beskeder
2. **Create Task** - Parse dansk dato/tid + prioritet
3. **Book Meeting** - Kalender integration (INGEN attendees!)
4. **Create Invoice** - Billy API (349 kr/time, kun drafts)
5. **Search Email** - Gmail med duplikat detektion
6. **Request Photos** - Flytterengøring workflow
7. **Job Completion** - 6-trins checklist automation

### **3. Multi-AI Support**

- **Gemini 2.5 Flash:** Hurtig, effektiv til daglige opgaver
- **Claude 3.5 Sonnet:** Dyb analyse og komplekse reasoning
- **GPT-4o:** OpenAI's kraftfulde model
- **Manus AI:** Specialiseret til danske business kontekster

### **4. 25 MEMORY Business Rules**

Indbyggede regler for Rendetalje's workflows:

- `MEMORY_15`: Kun runde timer (10:00, 10:30, 11:00)
- `MEMORY_16`: Fotos FØRST ved flytterengøring
- `MEMORY_17`: Billy drafts only, aldrig auto-godkend
- `MEMORY_19`: ALDRIG tilføj calendar attendees
- `MEMORY_24`: Job completion kræver 6-trins checklist
- + 20 yderligere kritiske business regler

---

## 🚀 **Avancerede Workflows**

### **Arbejd med Multiple Features**

```bash
# Terminal 1: Kør udviklings server
cd services/tekup-ai-v2
pnpm dev

# Terminal 2: Watch tests
pnpm test -- --watch

# Terminal 3: Database UI
pnpm db:studio

# Terminal 4: Type checking
pnpm check --watch
```

### **Sync med Upstream Changes**

```bash
# Hent seneste ændringer fra team
cd services/tekup-ai-v2
git fetch origin
git rebase origin/main

# Hvis der er konflikter, løs dem
git status
# Fix conflicts...
git add .
git rebase --continue
```

### **Deploy til Produktion**

Deployment håndteres automatisk via Manus platform:

1. Commit til `main` branch i tekup-friday
2. Push til GitHub
3. Manus platform builder og deployer automatisk
4. Verificer på live URL

---

## 📞 **Support & Hjælp**

### **Problemer eller Spørgsmål?**

- **GitHub Issues:** <https://github.com/TekupDK/tekup-friday/issues>
- **Team Chat:** Kontakt udviklingsteamet
- **Documentation:** Se relaterede guides ovenfor

### **Contributing**

Se `CONTRIBUTING.md` i både tekup og tekup-friday repositories for contribution guidelines.

---

## ✅ **Checklist: Er du klar til at udvikle?**

- [ ] Git submodule er initialiseret og opdateret
- [ ] Dependencies er installeret (`pnpm install`)
- [ ] Environment variables er konfigureret (`.env`)
- [ ] Database er opsat og migreret (`pnpm db:push`)
- [ ] Udviklings server starter uden fejl (`pnpm dev`)
- [ ] Du kan åbne `http://localhost:3000` i browseren
- [ ] Du kan logge ind via Manus OAuth
- [ ] Du forstår branch og commit workflow

---

**Held og lykke med udviklingen! 🚀**

Hvis du har problemer, se fejlfindingssektionen ovenfor eller kontakt teamet.
