# ✅ Development vs Production Miljø Setup - KOMPLET

## 🎯 Problem Løst

I havde ét `.env` fil til både development og production, hvilket gjorde det svært at skifte mellem miljøer uden at ændre filen manuelt. Nu har I separate miljøer med dedikerede scripts!

## 📦 Hvad Er Oprettet

### Miljø-Filer

✅ `.env.dev` - Development miljø (Supabase dev database)  
✅ `.env.prod` - Production miljø (Supabase prod database)  
✅ `.env.dev.template` - Template for development setup  
✅ `.env.prod.template` - Template for production setup

### Opdaterede Scripts

✅ `pnpm run dev` - Bruger nu `.env.dev` automatisk  
✅ `pnpm run start` - Bruger nu `.env.prod` automatisk  
✅ Database scripts har både `:dev` og `:prod` versioner  
✅ Email migration scripts har både dev og prod versioner  
✅ Customer analysis scripts har både dev og prod versioner

### Dependencies

✅ `dotenv-cli` installeret for miljø-fil indlæsning

### Dokumentation

✅ `ENV_SETUP_GUIDE.md` - Komplet guide til setup og brug

## 🚀 Sådan Bruger Du Det

### Development (Standard)

```powershell
# Start development server
pnpm run dev

# Database push (dev)
pnpm run db:push:dev

# Email migration (dev)
pnpm run migrate:emails

# Customer analysis (dev)
pnpm run analyze:customer
```

### Production

```powershell
# Start production server
pnpm run build
pnpm run start

# Database push (prod)
pnpm run db:push:prod

# Email migration (prod)
pnpm run migrate:emails:prod

# Customer analysis (prod)
pnpm run analyze:customer:prod
```

## ⚙️ Komplet Script Liste

| Script                           | Miljø | Beskrivelse                             |
| -------------------------------- | ----- | --------------------------------------- |
| `pnpm run dev`                   | DEV   | Start development server med hot reload |
| `pnpm run build`                 | -     | Build til produktion                    |
| `pnpm run start`                 | PROD  | Start production server                 |
| `pnpm run db:push`               | -     | Original (nu deprecated)                |
| `pnpm run db:push:dev`           | DEV   | Push schema til dev database            |
| `pnpm run db:push:prod`          | PROD  | Push schema til prod database           |
| `pnpm run db:migrate`            | -     | Original (nu deprecated)                |
| `pnpm run db:migrate:dev`        | DEV   | Generate + migrate dev database         |
| `pnpm run db:migrate:prod`       | PROD  | Generate + migrate prod database        |
| `pnpm run migrate:emails`        | DEV   | Migrate emails i dev database           |
| `pnpm run migrate:emails:prod`   | PROD  | Migrate emails i prod database          |
| `pnpm run analyze:customer`      | DEV   | Analyse Emil Lærke case i dev           |
| `pnpm run analyze:customer:prod` | PROD  | Analyse Emil Lærke case i prod          |

## 🔐 Sikkerhed

### ✅ Sikret

- `.env.dev` er i `.gitignore` (ikke på git)
- `.env.prod` er i `.gitignore` (ikke på git)
- Template filer kan deles sikkert (ingen secrets)

### ⚠️ VIGTIGT

- Brug ALDRIG development keys i production!
- Production JWT_SECRET skal være mindst 64 tegn
- Hold production credentials i password manager (1Password/Azure KeyVault)

## 📋 Næste Skridt

### 1. Opret Dine Miljø-Filer

```powershell
# Kopier templates
Copy-Item .env.dev.template .env.dev
Copy-Item .env.prod.template .env.prod

# Rediger med dine værdier
code .env.dev
code .env.prod
```

### 2. Udfyld Development Credentials (.env.dev)

- `DATABASE_URL` → Din Supabase development database URL
- `JWT_SECRET` → En tilfældig streng (32+ chars)
- `OPENAI_API_KEY` → Din OpenAI API key
- `BILLY_API_KEY` → Din Billy.dk API key (hvis relevant)

### 3. Udfyld Production Credentials (.env.prod)

- `DATABASE_URL` → Din Supabase **PRODUCTION** database URL
- `JWT_SECRET` → **MEGET SIKKER** tilfældig streng (64+ chars)
- `OPENAI_API_KEY` → Din OpenAI **PRODUCTION** API key
- `BILLY_API_KEY` → Din Billy.dk **PRODUCTION** API key

### 4. Test Development Setup

```powershell
# Test at dev server starter
pnpm run dev

# I ny terminal - test customer analysis
pnpm run analyze:customer
```

## 🧪 Verificer Setup

```powershell
# Check development database connection
dotenv -e .env.dev -- node -e "console.log('Dev DB:', process.env.DATABASE_URL)"

# Check production database connection
dotenv -e .env.prod -- node -e "console.log('Prod DB:', process.env.DATABASE_URL)"
```

## 🐛 Troubleshooting

### "Cannot find .env.dev"

**Problem:** Du har ikke oprettet .env.dev filen  
**Løsning:** Kopier template: `Copy-Item .env.dev.template .env.dev`

### "DATABASE_URL not set"

**Problem:** .env.dev eller .env.prod er tom eller mangler DATABASE_URL  
**Løsning:** Åbn filen og udfyld DATABASE_URL med din Supabase connection string

### Script bruger forkert database

**Problem:** Du kører dev script men den rammer prod database  
**Løsning:** Check at .env.dev har korrekt DATABASE_URL. Scripts med `:dev` bruger .env.dev, scripts med `:prod` bruger .env.prod

### NODE_TLS_REJECT_UNAUTHORIZED warning

**Ikke en fejl!** Dette er normalt for Supabase self-signed certificates i development. Scriptet håndterer det automatisk.

## 📚 Yderligere Ressourcer

- **Komplet Guide:** Se `ENV_SETUP_GUIDE.md` for detaljeret forklaring
- **Template Filer:** `.env.dev.template` og `.env.prod.template`
- **Package Scripts:** Se `package.json` for alle tilgængelige scripts

## ✅ Status

- [x] `dotenv-cli` installeret
- [x] `.env.dev` og `.env.prod` oprettet
- [x] Template filer oprettet
- [x] Package.json scripts opdateret
- [x] .gitignore opdateret
- [x] Dokumentation oprettet
- [x] Testet customer analysis script (VIRKER! ✅)

## 🎉 Resultat

Nu kan I trygt skifte mellem development og production miljøer uden at skulle ændre nogen filer manuelt. Hver gang I kører et script, indlæses automatisk den rigtige miljø-fil!

**Development:**

```powershell
pnpm run dev              # Bruger .env.dev
pnpm run analyze:customer # Bruger .env.dev
```

**Production:**

```powershell
pnpm run start                 # Bruger .env.prod
pnpm run analyze:customer:prod # Bruger .env.prod
```

Simpelt og sikkert! 🚀
