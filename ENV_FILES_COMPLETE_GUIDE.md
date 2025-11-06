# Environment Files - Complete Overview for Tekup AI v2

## 🎯 Quick Reference

| Environment     | File            | Used By              | DATABASE_URL        | NODE_ENV    |
| --------------- | --------------- | -------------------- | ------------------- | ----------- |
| **Development** | `.env`          | Local dev (pnpm dev) | Supabase PostgreSQL | development |
| **Production**  | `.env.prod`     | Docker container     | Supabase PostgreSQL | production  |
| **Test**        | `.env.test`     | Test suite           | Supabase PostgreSQL | test        |
| **Supabase**    | `.env.supabase` | Same as .env         | Supabase PostgreSQL | development |

## 📁 All Environment Files

### Active Files (In Use)

1. **`.env`** - Primary development environment
   - Used by: `pnpm dev`, local development
   - DATABASE_URL: `postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require`
   - Purpose: Local development på din maskine
   - Node: Læses af dotenv ved `pnpm dev`

2. **`.env.prod`** - Production environment
   - Used by: Docker container via `pnpm start`
   - DATABASE_URL: Same Supabase connection
   - Purpose: Production build i Docker
   - Node: Loaded by `dotenv -e .env.prod` in package.json start script

3. **`.env.dev`** - Development template
   - Used by: Can be used instead of .env
   - DATABASE_URL: Same Supabase connection
   - Purpose: Clean development configuration

4. **`.env.supabase`** - Supabase-specific config
   - Used by: Same as .env (backup/reference)
   - DATABASE_URL: Same Supabase connection
   - Purpose: Supabase PostgreSQL setup reference

### Template Files (Not Used Directly)

5. **`.env.dev.template`** - Template for new developers
6. **`.env.prod.template`** - Template for production setup
7. **`env.template.txt`** - General template with documentation

### Backup/Test Files

8. **`.env.backup`** - Backup of previous configuration
9. **`.env.test`** - Test environment (vitest)
10. **`.env.test-db`** - Database test configuration
11. **`.env.test-supabase`** - Supabase test configuration
12. **`.env.supabase.tmp`** - Temporary file (can be deleted)

## 🔄 How Environment Files Are Loaded

### Local Development (`pnpm dev`)

```bash
# package.json: "dev": "dotenv -e .env -- ..."
1. Loads .env file
2. Starts Vite dev server
3. NODE_ENV=development (default)
```

### Docker Production (`pnpm start` inside container)

```bash
# package.json: "start": "dotenv -e .env.prod -- ..."
# docker-compose.yml: env_file: [".env"]
1. Docker reads .env via docker-compose.yml env_file
2. Container CMD runs: dotenv -e .env.prod -- node dist/index.js
3. .env.prod overrides values from .env
4. NODE_ENV=production (explicitly set)
```

### Which File Wins?

**Priority order** (highest to lowest):

1. `docker-compose.yml` environment variables (explicit values)
2. `.env.prod` (loaded by dotenv in start script)
3. `.env` (loaded by docker-compose env_file)
4. Default values in docker-compose.yml `${VAR:-default}`

## 🗄️ Database Configuration

All active env files use **Supabase PostgreSQL**:

```bash
DATABASE_URL=postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require
```

**Connection Details:**

- Host: `db.oaevagdgrasfppbrxbey.supabase.co`
- Port: `5432`
- User: `postgres`
- Password: `Habibie12345@` (URL-encoded as `Habibie12345%40`)
- Database: `postgres`
- Schema: `friday_ai`
- SSL: required

## 🔑 Critical Environment Variables

### Required for All Environments

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=minimum-32-characters-random-string
OWNER_OPEN_ID=owner-friday-ai-dev

# AI
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=... (optional)

# App Identity
VITE_APP_ID=friday-ai
NODE_ENV=development|production
PORT=3000
```

### Optional Integrations

```bash
# Billy.dk Integration
BILLY_API_KEY=...
BILLY_ORGANIZATION_ID=...

# Google Workspace
GOOGLE_SERVICE_ACCOUNT_KEY=./google-service-account.json
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
GOOGLE_CALENDAR_ID=c_395...@group.calendar.google.com

# Inbound Email
INBOUND_EMAIL_WEBHOOK_URL=http://localhost:3000/api/inbound/email
INBOUND_STORAGE_TYPE=supabase
INBOUND_STORAGE_BUCKET=emails
```

## 🎬 MCP Configuration

For GitHub Copilot MCP servers to work, you need to set environment variables at **system level** or **user level** (not just in .env files):

### Windows (PowerShell)

```powershell
# Temporary (current session only)
$env:DATABASE_URL = "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require"

# Permanent (add to PowerShell profile)
notepad $PROFILE
# Add the line above to the file
```

### Windows (System Environment Variables)

1. Open System Properties → Advanced → Environment Variables
2. Add new User or System variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require`
3. Restart VS Code

## 🚀 Common Tasks

### Switch Environment

```bash
# Use development
pnpm dev

# Use production (Docker)
docker-compose up

# Use specific env file
dotenv -e .env.test -- pnpm test
```

### Create New Environment

```bash
# Copy template
cp .env.dev.template .env.local

# Edit values
code .env.local

# Use it
dotenv -e .env.local -- pnpm dev
```

### Verify Current Environment

```bash
# Check loaded environment
pnpm dev
# Look for console output showing loaded env vars

# In Docker
docker exec friday-ai-container env | grep DATABASE_URL
```

## 🧹 Cleanup Recommendations

**Safe to delete:**

- `.env.supabase.tmp` (temporary file)
- `.env.test-db` (if not using)
- `.env.test-supabase` (if not using)
- `.env.backup` (after verifying current setup works)

**Keep these:**

- `.env` (primary development)
- `.env.prod` (Docker production)
- `.env.dev` (development reference)
- `.env.supabase` (Supabase reference)
- `.env.dev.template` (for new developers)
- `.env.prod.template` (for production setup)

## 🔒 Security Notes

1. **Never commit .env files** - They're in .gitignore
2. **Use templates for version control** - Commit `.env.*.template` files
3. **Rotate secrets regularly** - Especially JWT_SECRET and API keys
4. **Use strong JWT_SECRET** - Minimum 32 characters, random
5. **URL-encode passwords** - Special characters must be encoded in DATABASE_URL

## 📝 Environment File Naming Convention

```
.env                    # Default local development
.env.dev                # Development (explicit)
.env.prod               # Production
.env.test               # Test environment
.env.[name].template    # Templates for version control
.env.[name].backup      # Backups
.env.[name].tmp         # Temporary files
```

## 🎯 Best Practices

1. **Local Development**: Use `.env` only
2. **Docker/Production**: Use `.env.prod` with docker-compose
3. **CI/CD**: Set environment variables directly in CI platform
4. **Secrets**: Never hardcode, always use env vars
5. **Templates**: Keep templates updated with new variables
6. **Documentation**: Update this file when adding new variables

## ✅ Current Setup Status

- ✅ Supabase PostgreSQL configured
- ✅ Docker uses .env.prod
- ✅ Local dev uses .env
- ✅ JWT authentication configured
- ⚠️ MCP needs system-level DATABASE_URL
- ⚠️ Some API keys need to be set (check template files)
