# 🔧 Environment Management System

TekUp monorepoet har nu et kraftfuldt environment management system, der gør det nemt at håndtere miljøvariabler på tværs af alle apps.

## 🚀 Hurtig Start

```bash
# Initialiser .env fra env.example
pnpm env:init

# Synkroniser env variabler til alle apps
pnpm env:sync

# Tjek status på tværs af monorepoet
pnpm env:status

# Valider alle env konfigurationer
pnpm env:validate
```

## 📁 Fil Struktur

```
tekup-org/
├── env.example              # Master template (tracked in git)
├── .env                     # Local values (gitignored)
├── scripts/env-manager.mjs  # Environment management script
└── apps/
    ├── flow-api/.env        # App-specific .env (gitignored)
    ├── flow-web/.env        # App-specific .env (gitignored)
    └── ...                  # Alle andre apps
```

## 🛠️ Kommandoer

### `pnpm env:init`
Opretter `.env` fil fra `env.example` template. Spørger om tilladelse hvis .env allerede eksisterer.

### `pnpm env:sync`
Synkroniserer miljøvariabler fra root `.env` til alle apps. Eksisterende app-specifikke variabler bevares.

### `pnpm env:status`
Viser status på environment variabler på tværs af hele monorepoet:
- ✅ Grønne checks for konfigurerede apps
- ❌ Røde X'er for manglende .env filer
- ⚠️ Advarsler for manglende core variabler

### `pnpm env:validate`
Validerer at alle apps har de påkrævede core environment variabler.

### `pnpm env:copy`
Kopierer root .env til alle apps (overskriver eksisterende - brug med forsigtighed).

## 🔑 Core Environment Variabler

Disse variabler skal være konfigureret i alle apps:

- `NODE_ENV` - Application environment (development/production)
- `DATABASE_URL` - PostgreSQL database connection
- `FLOW_API_URL` - TekUp Flow API endpoint
- `FLOW_API_KEY` - API nøgle til Flow API

## 🎯 Workflow

1. **Første gang setup:**
   ```bash
   pnpm env:init
   # Rediger .env med dine faktiske værdier
   pnpm env:sync
   ```

2. **Tilføjelse af nye env variabler:**
   ```bash
   # Tilføj til env.example først
   # Opdater din lokale .env
   pnpm env:sync
   ```

3. **Tjek regelmæssigt:**
   ```bash
   pnpm env:status
   pnpm env:validate
   ```

## 🔒 Sikkerhed

- ✅ `.env` filer er automatisk gitignored
- ✅ `env.example` er tracked i git (uden følsomme værdier)
- ✅ Kun example templates deles i kodebasen
- ✅ Faktiske API nøgler og secrets er aldrig i git

## 📱 App-Specifikke Variabler

Nogle apps har specifikke environment variabler:

### Frontend Apps (Next.js)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TENANT_API_KEY=dev-key
```

### AI Services
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
```

### Database Apps
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
```

## 🛡️ Fejlfinding

### Problem: "Missing required env"
```bash
pnpm env:validate  # Se hvilke variabler der mangler
pnpm env:sync      # Synkroniser fra root .env
```

### Problem: App starter ikke
```bash
pnpm env:status    # Tjek om app har .env fil
# Rediger apps/[app-name]/.env manuelt hvis nødvendigt
```

### Problem: Outdated env variabler
```bash
# Sammenlign med env.example
pnpm env:sync      # Hent nye variabler fra root
```

## 🔄 CI/CD Integration

Environment management scriptet kan også bruges i CI/CD:

```yaml
# GitHub Actions eksempel
- name: Setup Environment
  run: |
    pnpm env:init
    pnpm env:validate
```

## 📝 Best Practices

1. **Opdater altid `env.example` først** når du tilføjer nye variabler
2. **Kør `pnpm env:sync`** efter at have opdateret .env
3. **Brug `pnpm env:status`** regelmæssigt for at holde styr på miljøvariabler
4. **Test lokalt** før du deployer nye environment variabler
5. **Dokumenter nye variabler** i denne README når relevant

---

🎉 **Nu har du fuld kontrol over environment variabler på tværs af hele TekUp monorepoet!**
