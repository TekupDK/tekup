# 🔍 KOMPLET ENV ANALYSE - TEKUP AI V2

## 🚨 KRITISKE FUND

### 1. KONFLIKT: Package.json vs Docker vs .env Filer

**Package.json scripts bruger:**

- Development: `dotenv -e .env.dev`
- Production: `dotenv -e .env.prod`

**Docker-compose.yml bruger:**

```yaml
env_file:
  - .env # ← PROBLEM!
```

**Start kommando i Docker:**

```json
"start": "dotenv -e .env.prod -- ..."
```

**❌ KONFLIKT:** Docker loader først `.env`, derefter `pnpm start` loader `.env.prod` oveni. Dette skaber forvirring om hvilke værdier der vinder.

---

## 📊 ENV FIL SAMMENLIGNING

### REQUIRED Variables (fra server/\_core/env.ts)

```typescript
const required = [
  "JWT_SECRET", // ✅ Alle filer har det
  "OWNER_OPEN_ID", // ✅ Alle filer har det
  "DATABASE_URL", // ✅ Alle filer har det
  "VITE_APP_ID", // ❌ MANGLER i .env, .env.supabase
];
```

### Variabel-by-Variabel Analyse

| Variable                         | .env           | .env.dev            | .env.prod              | .env.supabase  | Required?        | Used In Code?          |
| -------------------------------- | -------------- | ------------------- | ---------------------- | -------------- | ---------------- | ---------------------- |
| **DATABASE_URL**                 | ✅ Supabase    | ✅ Supabase         | ⚠️ PRODUCTION_PASSWORD | ✅ Supabase    | ✅ YES           | server/db.ts           |
| **JWT_SECRET**                   | ⚠️ placeholder | ✅ dev value        | ⚠️ placeholder         | ⚠️ placeholder | ✅ YES           | server/\_core/env.ts   |
| **OWNER_OPEN_ID**                | ✅ dev         | ✅ dev              | ✅ prod                | ✅ dev         | ✅ YES           | server/\_core/env.ts   |
| **VITE_APP_ID**                  | ❌ MISSING     | ✅ tekup-friday-dev | ✅ tekup-friday-prod   | ❌ MISSING     | ✅ YES           | server/\_core/env.ts   |
| **NODE_ENV**                     | ✅ development | ✅ development      | ✅ production          | ❌ MISSING     | ⚠️ Set by script | Multiple files         |
| **PORT**                         | ✅ 3000        | ❌ MISSING          | ❌ MISSING             | ❌ MISSING     | ❌ Optional      | server/\_core/index.ts |
| **OPENAI_API_KEY**               | ⚠️ placeholder | ⚠️ placeholder      | ⚠️ placeholder         | ⚠️ placeholder | ❌ Optional      | server/\_core/env.ts   |
| **GEMINI_API_KEY**               | ⚠️ placeholder | ⚠️ placeholder      | ⚠️ placeholder         | ⚠️ placeholder | ❌ Optional      | server/\_core/env.ts   |
| **GOOGLE_SERVICE_ACCOUNT_KEY**   | ⚠️ mock JSON   | ✅ ./file           | ✅ ./file              | ⚠️ mock JSON   | ❌ Optional      | server/google-api.ts   |
| **GOOGLE_IMPERSONATED_USER**     | ✅             | ✅                  | ✅                     | ✅             | ❌ Has default   | server/google-api.ts   |
| **GOOGLE_CALENDAR_ID**           | ✅             | ⚠️ placeholder      | ⚠️ placeholder         | ✅             | ❌ Optional      | server/google-api.ts   |
| **BILLY_API_KEY**                | ⚠️ placeholder | ⚠️ placeholder      | ⚠️ placeholder         | ⚠️ placeholder | ❌ Optional      | server/billy.ts        |
| **BILLY_ORGANIZATION_ID**        | ⚠️ placeholder | ⚠️ placeholder      | ⚠️ placeholder         | ⚠️ placeholder | ❌ Optional      | server/billy.ts        |
| **INBOUND_EMAIL_WEBHOOK_URL**    | ✅             | ❌ MISSING          | ❌ MISSING             | ✅             | ❌ Optional      | (Phase 0)              |
| **INBOUND_EMAIL_WEBHOOK_SECRET** | ✅             | ❌ MISSING          | ❌ MISSING             | ✅             | ❌ Optional      | (Phase 0)              |
| **INBOUND_STORAGE_TYPE**         | ✅             | ❌ MISSING          | ❌ MISSING             | ✅             | ❌ Optional      | (Phase 0)              |
| **INBOUND_STORAGE_PATH**         | ✅             | ❌ MISSING          | ❌ MISSING             | ✅             | ❌ Optional      | (Phase 0)              |
| **INBOUND_STORAGE_BUCKET**       | ✅             | ❌ MISSING          | ❌ MISSING             | ✅             | ❌ Optional      | (Phase 0)              |
| **GOOGLE_MCP_URL**               | ❌ MISSING     | ❌ MISSING          | ❌ MISSING             | ❌ MISSING     | ❌ Has default   | server/mcp.ts          |
| **GMAIL_MCP_URL**                | ❌ MISSING     | ❌ MISSING          | ❌ MISSING             | ❌ MISSING     | ❌ Has default   | server/mcp.ts          |
| **DEBUG**                        | ❌ MISSING     | ❌ MISSING          | ❌ MISSING             | ❌ MISSING     | ❌ Optional      | server/logger.ts       |

---

## 🔍 DETALJEREDE PROBLEMER

### Problem 1: .env.prod har FORKERT DATABASE_URL

```bash
# Nuværende (FORKERT):
DATABASE_URL=postgresql://postgres:PRODUCTION_PASSWORD@...

# Skal være:
DATABASE_URL=postgresql://postgres:Habibie12345%40@...
```

### Problem 2: VITE_APP_ID mangler i .env og .env.supabase

Dette er **REQUIRED** ifølge env.ts validation, men mangler i hovedfilen!

### Problem 3: NODE_ENV mangler i .env.supabase

Alle andre har det, men ikke denne fil.

### Problem 4: PORT mangler i .env.dev og .env.prod

Selvom det har en default værdi (3000), burde det være eksplicit.

### Problem 5: Inbound Email vars mangler i .env.dev og .env.prod

Phase 0 funktionalitet kræver disse, men de mangler i de aktive filer.

### Problem 6: Templates er OUTDATED

- `.env.dev.template` mangler INBOUND\_\* vars
- `.env.prod.template` mangler INBOUND\_\* vars
- `env.template.txt` er ikke synkroniseret med .env

---

## 💡 ANBEFALEDE ÆNDRINGER

### Ændring 1: Fix Docker Configuration

**docker-compose.yml skal ændres fra:**

```yaml
env_file:
  - .env
```

**Til:**

```yaml
env_file:
  - .env.prod # Brug prod-fil direkte i Docker
```

**Hvorfor:** Eliminerer konflikt mellem .env og .env.prod loading.

### Ændring 2: Standardiser på .env.dev og .env.prod

**Fjern eller deprecate:**

- `.env` - Erstat med .env.dev
- `.env.supabase` - Samme som .env, ikke nødvendig

**Behold:**

- `.env.dev` - Primary development
- `.env.prod` - Primary production

### Ændring 3: Fix ALLE Placeholders

Opdater ALLE env filer med korrekte værdier:

- DATABASE_URL i .env.prod
- VITE_APP_ID i .env og .env.supabase
- PORT i .env.dev og .env.prod
- Inbound Email vars i .env.dev og .env.prod

### Ændring 4: Opdater Templates

Synkroniser alle 3 template filer:

- `.env.dev.template`
- `.env.prod.template`
- `env.template.txt`

---

## 🎯 ENDELIG STRUKTUR (Anbefalet)

```
.env.dev           → Development (AKTIV - bruges af pnpm dev)
.env.prod          → Production (AKTIV - bruges af Docker)
.env.dev.template  → Template til nye udviklere
.env.prod.template → Template til production setup
env.template.txt   → Fuld dokumenteret template

# FJERN DISSE:
.env               → Redundant (duplikat af .env.supabase)
.env.supabase      → Redundant (samme som .env)
.env.backup        → Gammel backup
.env.test-*        → Ikke i brug
.env.supabase.tmp  → Temporary fil
```

---

## ✅ ACTION ITEMS

### Priority 1 - CRITICAL

1. [ ] Fix DATABASE_URL i .env.prod (forkert password)
2. [ ] Tilføj VITE_APP_ID til .env (required var mangler)
3. [ ] Fix docker-compose.yml env_file til .env.prod
4. [ ] Tilføj PORT til .env.dev og .env.prod

### Priority 2 - HIGH

5. [ ] Tilføj NODE_ENV til .env.supabase
6. [ ] Tilføj INBOUND\_\* vars til .env.dev
7. [ ] Tilføj INBOUND\_\* vars til .env.prod
8. [ ] Opdater .env.dev.template med alle vars
9. [ ] Opdater .env.prod.template med alle vars

### Priority 3 - MEDIUM

10. [ ] Synkroniser env.template.txt med alle vars
11. [ ] Dokumenter hvilke filer der er aktive
12. [ ] Lav cleanup plan for deprecated filer
13. [ ] Test alle scripts med nye env filer

---

## 🔒 SECURITY NOTES

### Placeholders der SKAL ændres:

```bash
# ❌ IKKE SIKKER:
JWT_SECRET=your-secure-jwt-secret-change-this-in-production

# ✅ SIKKER (eksempel):
JWT_SECRET=$(openssl rand -base64 48)
# Eller minimum 32 random characters
```

### API Keys der mangler rigtige værdier:

- OPENAI_API_KEY (alle filer har placeholder)
- GEMINI_API_KEY (alle filer har placeholder)
- BILLY_API_KEY (alle filer har placeholder)

---

## 📋 OPSUMMERING

**Antal filer analyseret:** 12  
**Antal aktive filer:** 2 (.env.dev, .env.prod)  
**Antal problemer fundet:** 13  
**Kritiske problemer:** 4  
**Manglende required vars:** 2 (VITE_APP_ID, PORT)  
**Forkerte værdier:** 1 (DATABASE_URL i .env.prod)  
**Outdated templates:** 3

**Anbefaling:** Implementer alle Priority 1 ændringer ASAP for at få et konsistent og funktionelt setup.
