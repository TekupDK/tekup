# Railway Environment Variables Template

## 📋 Quick Reference

Use these environment variables when setting up services on Railway.

## 🎯 Inbox Orchestrator (Friday AI)

**Service:** `inbox-orchestrator`  
**File:** `services/tekup-ai/packages/inbox-orchestrator`

```bash
# Core Settings
NODE_ENV=production
PORT=3011
DEBUG=false

# External Services
GOOGLE_MCP_URL=https://google-mcp-production.up.railway.app
GEMINI_API_KEY=AIzaSyAQqh1Ow6UZ_Xv6OyDKcPNYUTbW35I_roQ

# Optional
LOG_LEVEL=info
```

## 🔧 Backend NestJS

**Service:** `backend-nestjs`  
**File:** `services/backend-nestjs`

```bash
# Core Settings
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://rendetalje-frontend-production.up.railway.app

# Friday AI Integration
AI_FRIDAY_URL=https://inbox-orchestrator-production.up.railway.app
ENABLE_AI_FRIDAY=true

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-strong-secret>
JWT_EXPIRES_IN=24h

# External Integrations
TEKUP_BILLY_URL=https://tekup-billy-production.up.railway.app
TEKUP_BILLY_API_KEY=<your-api-key>
TEKUPVAULT_URL=https://tekupvault-production.up.railway.app
TEKUPVAULT_API_KEY=<your-api-key>
RENOS_CALENDAR_URL=https://renos-calendar-production.up.railway.app
RENOS_CALENDAR_API_KEY=<your-api-key>

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
LOG_LEVEL=info

# Feature Flags
ENABLE_SWAGGER=true
ENABLE_REAL_TIME_TRACKING=true
ENABLE_AUTOMATIC_INVOICING=true
```

## 🎨 Frontend Next.js

**Service:** `frontend-nextjs`  
**File:** `services/frontend-nextjs`

```bash
# Core Settings
NODE_ENV=production
PORT=3002

# API Configuration
NEXT_PUBLIC_API_URL=https://rendetalje-backend-production.up.railway.app

# Supabase (if used)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔗 Service URL Dependencies

After deploying, update these URLs in order:

1. **Deploy Inbox Orchestrator** → Get URL → `AI_FRIDAY_URL` in Backend
2. **Deploy Backend** → Get URL → `NEXT_PUBLIC_API_URL` in Frontend
3. **Deploy Frontend** → Get URL → `FRONTEND_URL` in Backend

## 🔐 Security Notes

- Never commit secrets to git
- Use Railway's environment variable encryption
- Rotate secrets regularly
- Use strong, randomly generated secrets for JWT_SECRET and ENCRYPTION_KEY

## 🛠️ Generate Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

