# 🔧 Render CLI Installation & Setup Guide

## Hvad Er Render CLI?

Render CLI er et kommandolinjeværktøj der giver dig mulighed for at:

- Deploy services direkte fra terminalen
- Opdatere environment variables
- Se logs i real-time
- Administrere services uden at bruge web dashboard

## Installation

### Windows (PowerShell)

```powershell
# Install via npm (anbefalet)
npm install -g @render-tools/cli

# Verificer installation
render --version
```

### Alternative Metoder

**Via Scoop:**
```powershell
scoop bucket add render https://github.com/render-oss/render-cli-scoop
scoop install render
```

**Via Chocolatey:**
```powershell
choco install render-cli
```

## Setup og Login

```powershell
# Login til Render
render login

# Dette åbner browser - log ind med dine Render credentials
# CLI vil automatisk gemme din API token
```

## Basis Kommandoer

### List Services

```powershell
# Vis alle dine services
render services list

# Vis detaljer for en specifik service
render services get <service-id>
```

### Deploy

```powershell
# Deploy seneste commit til en service
render deploy <service-id>

# Deploy med custom branch
render deploy <service-id> --branch staging
```

### Environment Variables

```powershell
# List alle env vars for en service
render env list <service-id>

# Tilføj ny env var
render env set <service-id> SENTRY_DSN=https://your-dsn@sentry.io/123

# Tilføj flere env vars på én gang
render env set <service-id> \
  SENTRY_DSN=https://your-dsn@sentry.io/123 \
  LOG_LEVEL=info \
  SENTRY_ENVIRONMENT=production

# Slet env var
render env delete <service-id> OLD_VAR_NAME
```

### Logs

```powershell
# Vis real-time logs
render logs <service-id> --tail

# Vis logs fra sidste 100 linjer
render logs <service-id> --tail 100

# Filter logs
render logs <service-id> --filter "error"
```

### Service Management

```powershell
# Restart service
render services restart <service-id>

# Suspend service
render services suspend <service-id>

# Resume service
render services resume <service-id>
```

## Praktiske Eksempler for Rendetalje

### Deploy Backend Med Monitoring

```powershell
# 1. Find backend service ID
render services list | Select-String "rendetalje-backend"

# 2. Tilføj monitoring env vars
$BACKEND_ID="srv-xxxxx"
render env set $BACKEND_ID \
  SENTRY_DSN=https://your-backend-dsn@sentry.io/123 \
  SENTRY_ENVIRONMENT=production \
  LOG_LEVEL=info \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Deploy
render deploy $BACKEND_ID

# 4. Watch logs
render logs $BACKEND_ID --tail
```

### Deploy Frontend Med Monitoring

```powershell
# 1. Find frontend service ID
$FRONTEND_ID="srv-yyyyy"

# 2. Tilføj Sentry
render env set $FRONTEND_ID \
  NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/456 \
  NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# 3. Deploy
render deploy $FRONTEND_ID
```

### Bulk Environment Setup (Script)

```powershell
# setup-monitoring.ps1

$BACKEND_ID="srv-xxxxx"
$FRONTEND_ID="srv-yyyyy"

# Backend Monitoring
Write-Host "Setting up backend monitoring..."
render env set $BACKEND_ID `
  SENTRY_DSN=$env:BACKEND_SENTRY_DSN `
  SENTRY_ENVIRONMENT="production" `
  LOG_LEVEL="info" `
  SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_KEY

# Frontend Monitoring
Write-Host "Setting up frontend monitoring..."
render env set $FRONTEND_ID `
  NEXT_PUBLIC_SENTRY_DSN=$env:FRONTEND_SENTRY_DSN `
  NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

Write-Host "✅ Monitoring setup complete!"
```

## Advanced Features

### Configuration File (render.yaml)

Render CLI kan bruge din `render.yaml` til at automatisere deployments:

```powershell
# Deploy fra render.yaml
render blueprint apply

# Validate render.yaml
render blueprint validate render.yaml
```

### Scripting & Automation

```powershell
# health-check.ps1
$SERVICE_ID="srv-xxxxx"
$STATUS = render services get $SERVICE_ID --json | ConvertFrom-Json

if ($STATUS.service.status -ne "available") {
    Write-Error "Service is down!"
    # Send alert via email/Slack
} else {
    Write-Host "✅ Service is healthy"
}
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Render
  run: |
    npm install -g @render-tools/cli
    render login --api-key ${{ secrets.RENDER_API_KEY }}
    render deploy ${{ secrets.RENDER_SERVICE_ID }}
```

## Troubleshooting

### Problem: "render: command not found"

**Løsning:**
```powershell
# Reload PowerShell profile
. $PROFILE

# Eller restart PowerShell
```

### Problem: "Unauthorized"

**Løsning:**
```powershell
# Logout og login igen
render logout
render login
```

### Problem: "Service ID not found"

**Løsning:**
```powershell
# List alle services og find korrekt ID
render services list

# Service ID starter altid med "srv-"
```

## Alternative: Render Dashboard

Hvis du **IKKE** vil bruge CLI, kan du gøre alt via web dashboard:

1. **Environment Variables**: <https://dashboard.render.com> → Service → Environment
2. **Deployments**: <https://dashboard.render.com> → Service → Manual Deploy
3. **Logs**: <https://dashboard.render.com> → Service → Logs

## Hvornår Skal Du Bruge CLI vs Dashboard?

| Use Case | CLI | Dashboard |
|----------|-----|-----------|
| Hurtige env updates | ✅ Bedre | ⚠️ Langsommere |
| Se real-time logs | ✅ Bedre | ⚠️ Browser refresh |
| Initial setup | ⚠️ OK | ✅ Nemmere |
| Bulk operations | ✅ Scripting | ⚠️ Manuelt |
| CI/CD automation | ✅ Nødvendigt | ❌ Ikke muligt |

## Anbefaling for Rendetalje

**Start med Dashboard** for initial setup:

- Nemmere at se alle options
- God overview
- Less steep learning curve

**Brug CLI til**:

- Daglige deployments
- Hurtige env updates
- Debugging med real-time logs
- Automation/scripting

## Quick Reference

```powershell
# Login
render login

# List services
render services list

# Deploy
render deploy <service-id>

# Set env var
render env set <service-id> KEY=value

# View logs
render logs <service-id> --tail

# Help
render --help
render services --help
```

## Ressourcer

- **Render CLI Docs**: <https://render.com/docs/cli>
- **GitHub Repo**: <https://github.com/render-oss/cli>
- **API Reference**: <https://api-docs.render.com/>

---

**💡 TIP:** Du behøver IKKE CLI for at følge monitoring implementationen. Alt kan gøres via Render Dashboard på <https://dashboard.render.com>
