# 🔧 Development vs Production Environment Guide

## Problem Løst

Tidligere brugte alle scripts den samme `.env` fil, hvilket gjorde det svært at skifte mellem development og production miljøer. Nu har vi separate miljø-filer og scripts der automatisk loader den rigtige.

## 📁 Miljø-Filer

### Development (.env.dev)

- Bruges til lokal udvikling
- Peger på development database (Supabase dev)
- Bruger development API keys
- NODE_ENV=development

### Production (.env.prod)

- Bruges til produktion
- Peger på production database (Supabase prod)
- Bruger production API keys
- NODE_ENV=production

### Template Filer

- `.env.dev.template` - Kopi denne til `.env.dev`
- `.env.prod.template` - Kopi denne til `.env.prod`

**VIGTIGT:** `.env.dev` og `.env.prod` er i `.gitignore` og vil IKKE blive committed til git!

## 🚀 Opsætning

### 1. Opret Development Miljø

```powershell
# Kopier template
Copy-Item .env.dev.template .env.dev

# Rediger og udfyld dine development værdier
code .env.dev
```

### 2. Opret Production Miljø

```powershell
# Kopier template
Copy-Item .env.prod.template .env.prod

# Rediger og udfyld dine production værdier
code .env.prod
```

### 3. Installer Dependencies (kun første gang)

Dette er allerede gjort hvis du kører dette script!

```powershell
pnpm add -D dotenv-cli
```

## 📝 Opdaterede Scripts

### Development Scripts (bruger .env.dev)

```json
"dev": "dotenv -e .env.dev -- cross-env NODE_ENV=development tsx watch server/_core/index.ts"
"db:push:dev": "dotenv -e .env.dev -- drizzle-kit push"
"db:migrate:dev": "dotenv -e .env.dev -- drizzle-kit generate && dotenv -e .env.dev -- drizzle-kit migrate"
"migrate:emails": "dotenv -e .env.dev -- tsx server/scripts/migrate-gmail-to-database.ts"
"analyze:customer": "dotenv -e .env.dev -- tsx server/scripts/analyze-emil-laerke.ts"
```

### Production Scripts (bruger .env.prod)

```json
"start": "dotenv -e .env.prod -- cross-env NODE_ENV=production node dist/index.js"
"db:push:prod": "dotenv -e .env.prod -- drizzle-kit push"
"db:migrate:prod": "dotenv -e .env.prod -- drizzle-kit generate && dotenv -e .env.prod -- drizzle-kit migrate"
"migrate:emails:prod": "dotenv -e .env.prod -- tsx server/scripts/migrate-gmail-to-database.ts"
"analyze:customer:prod": "dotenv -e .env.prod -- tsx server/scripts/analyze-emil-laerke.ts"
```

## 💻 Brug Scripts

### Development (standard)

```powershell
# Start development server
pnpm run dev

# Database operations (dev)
pnpm run db:push:dev
pnpm run db:migrate:dev

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

# Database operations (prod)
pnpm run db:push:prod
pnpm run db:migrate:prod

# Email migration (prod)
pnpm run migrate:emails:prod

# Customer analysis (prod)
pnpm run analyze:customer:prod
```

## 🔒 Sikkerhed

### Development

- Brug test/development API keys
- JWT_SECRET kan være simpel (kun til lokal test)
- Database kan være shared dev environment

### Production

- Brug ALDRIG development keys i production!
- JWT_SECRET SKAL være mindst 64 tegn, helt tilfældig
- Database skal være dedikeret production environment
- Alle passwords skal være stærke og unikke

## 📊 Eksempel: Forskelle mellem Dev og Prod

### .env.dev

```bash
DATABASE_URL=postgresql://postgres:DevPass@db.devproject.supabase.co:5432/postgres?schema=friday_ai
JWT_SECRET=dev-jwt-secret-only-for-local-testing
VITE_APP_ID=tekup-friday-dev
OPENAI_API_KEY=sk-dev-key-for-testing
```

### .env.prod

```bash
DATABASE_URL=postgresql://postgres:SecureProdPass123!@db.prodproject.supabase.co:5432/postgres?schema=friday_ai
JWT_SECRET=x7k9mP2qL5nR8tY4wZ1vB6cH3jF0gD9eA5sK8mN2qP7rT4wY1zV6bC3hJ0fG9d
VITE_APP_ID=tekup-friday-prod
OPENAI_API_KEY=sk-prod-secure-production-key
```

## ✅ Verificer Opsætning

```powershell
# Check development miljø
dotenv -e .env.dev -- node -e "console.log('Dev DB:', process.env.DATABASE_URL)"

# Check production miljø
dotenv -e .env.prod -- node -e "console.log('Prod DB:', process.env.DATABASE_URL)"
```

## 🐛 Troubleshooting

### "Cannot find .env.dev"

Løsning: Kopier `.env.dev.template` til `.env.dev` og udfyld værdier

### "DATABASE_URL not set"

Løsning: Åbn din `.env.dev` eller `.env.prod` og sæt DATABASE_URL

### Script loader forkert miljø

Løsning: Check at du bruger det rigtige script suffix (ingen suffix = dev, `:prod` = prod)

### NODE_TLS_REJECT_UNAUTHORIZED fejl

Dette er normalt for Supabase development. Scriptet sætter allerede denne til '0' hvis nødvendigt.

## 📝 Best Practices

1. **Aldrig commit `.env.dev` eller `.env.prod`** - De er i .gitignore
2. **Hold template filer opdaterede** - Når du tilføjer nye environment variables
3. **Dokumenter nye variabler** - Tilføj kommentarer i template filerne
4. **Test lokalt først** - Brug altid dev miljø til test før prod
5. **Backup prod credentials** - Gem production credentials sikkert (1Password, Azure KeyVault, etc.)

## 🔄 Migration Fra Gammel Opsætning

Hvis du har en eksisterende `.env` fil:

```powershell
# Backup existing .env
Copy-Item .env .env.backup

# Brug den som development miljø
Copy-Item .env .env.dev

# Opret production fra template
Copy-Item .env.prod.template .env.prod
# Rediger .env.prod med production værdier
```

## 📚 Yderligere Info

- `dotenv-cli` dokumentation: https://github.com/entropitor/dotenv-cli
- `cross-env` dokumentation: https://github.com/kentcdodds/cross-env
- Supabase miljøer: https://supabase.com/docs/guides/cli/managing-environments
