# RenOS Calendar MCP - Deployment Guide

Complete guide til deployment via CLI automation.

## Quick Start

```powershell
# 1. Install CLI tools (one-time)
cd renos-calendar-mcp
./scripts/install-cli-tools.ps1

# 2. Login (one-time)
./scripts/login-cli-tools.ps1

# 3. Setup secrets
# Option A: Manual
cp -r deployment/.secrets.example/* deployment/.secrets/
# Then fill in actual credentials in deployment/.secrets/*.txt

# Option B: AI Browser (recommended)
# Use deployment/COMET_PROMPT.md with Comet or similar

# 4. Deploy everything
./scripts/deploy-all.ps1

# 5. Verify
./scripts/verify-deployment.ps1
```

## Directory Structure

```
deployment/
├── .secrets/              # Git ignored - your actual credentials
│   ├── google-private-key.txt
│   ├── supabase-anon-key.txt
│   ├── supabase-service-key.txt
│   └── twilio-*.txt (optional)
│
├── .secrets.example/      # Templates (tracked in Git)
│   └── README.txt
│
├── COMET_PROMPT.md       # AI browser automation guide
└── README.md             # This file
```

## Environment Groups (Render)

### Group 1: RenOS Calendar MCP (Create New)

```bash
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=<from deployment/.secrets/google-private-key.txt>
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
BILLY_MCP_URL=https://tekup-billy.onrender.com
MCP_API_KEY=renos-calendar-mcp-secret-key-2025
```

### Group 2: Tekup Database Environment (Reuse Existing)

This group already exists and contains:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- ENCRYPTION_KEY
- ENCRYPTION_SALT

Link this group to your service in Render dashboard.

## Deployment Methods

### Method 1: Automatic (Recommended)

```powershell
# Push to GitHub
git add .
git commit -m "Deploy RenOS Calendar MCP"
git push origin main

# Then in Render dashboard:
# 1. New → Blueprint
# 2. Connect your repo
# 3. Render auto-detects render.yaml
# 4. Configure environment groups
# 5. Deploy!
```

### Method 2: CLI (Partial Automation)

```powershell
# Deploy Supabase
./scripts/deploy-supabase.ps1

# Deploy Render (provides instructions)
./scripts/deploy-render.ps1
```

### Method 3: Manual

See deployment/MANUAL_SETUP_GUIDE.md (if you prefer clicking)

## Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `install-cli-tools.ps1` | Install Render + Supabase CLI | One-time setup |
| `login-cli-tools.ps1` | Authenticate CLIs | One-time setup |
| `deploy-supabase.ps1` | Run database migrations | Every schema change |
| `deploy-render.ps1` | Deploy backend + dashboard | Instructions/manual |
| `deploy-all.ps1` | Complete deployment | First deployment |
| `verify-deployment.ps1` | Test all endpoints | After deployment |

## Verification Checklist

After deployment, verify:

- [ ] Backend health: https://renos-calendar-mcp.onrender.com/health
- [ ] Tools endpoint: https://renos-calendar-mcp.onrender.com/tools
- [ ] Dashboard loads: https://renos-calendar-dashboard.onrender.com
- [ ] Supabase tables exist (5 tables)
- [ ] Google Calendar sync works
- [ ] No errors in Render logs

Run: `./scripts/verify-deployment.ps1` for automated checks.

## Troubleshooting

### CLI tools not found

```powershell
npm install -g @render/cli supabase
```

### Authentication failed

```powershell
render login
supabase login
```

### Secrets missing

```powershell
# Check files exist
dir deployment\.secrets\

# Should show:
# - google-private-key.txt
# - supabase-anon-key.txt
# - supabase-service-key.txt
```

### Supabase migration fails

Fallback: Manual migration
1. Go to https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/editor
2. Open new query
3. Copy-paste docs/SUPABASE_SCHEMA.sql
4. Run

### Render deployment fails

Check logs:
```powershell
render logs --service renos-calendar-mcp --tail
```

Common issues:
- Missing environment variables
- Docker build errors (check Dockerfile)
- Health check timeout (increase start period)

## URLs

After deployment:

- **Backend API**: https://renos-calendar-mcp.onrender.com
- **Dashboard**: https://renos-calendar-dashboard.onrender.com
- **Health Check**: https://renos-calendar-mcp.onrender.com/health
- **API Docs**: https://renos-calendar-mcp.onrender.com/tools

## CI/CD Integration

For automatic deployments on every push:

1. render.yaml is already configured
2. Just push to GitHub main branch
3. Render auto-deploys

No GitHub Actions needed - Render handles it!

## Security Best Practices

- ✅ Secrets in deployment/.secrets/ (Git ignored)
- ✅ Environment variables via Render groups
- ✅ Non-root user in Docker
- ✅ Health checks enabled
- ✅ HTTPS by default (Render)
- ✅ Rate limiting configured

## Support

- Render docs: https://render.com/docs
- Supabase docs: https://supabase.com/docs
- Project issues: Check ../PROJECT_STATUS.md

