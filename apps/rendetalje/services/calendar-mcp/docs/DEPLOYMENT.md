# RenOS Calendar Intelligence MCP - Deployment Guide

## 📋 Pre-deployment Checklist

- [x] TypeScript builds uden fejl (`npm run build`)
- [x] Environment variables configured
- [x] Supabase schema deployed
- [x] Google Calendar credentials verified
- [x] Integration tests passed
- [ ] Domain DNS configured (optional)
- [ ] Twilio account setup (optional)

## 🚀 Deploy MCP Server (Backend) til Render.com

### 1. Opret Render.com Account

Gå til https://render.com og sign up med GitHub.

### 2. Opret New Web Service

1. **Connect Repository**: `Tekup-Cloud/renos-calendar-mcp`
2. **Name**: `renos-calendar-mcp`
3. **Region**: Frankfurt (EU Central)
4. **Branch**: `main`
5. **Root Directory**: `.` (tom hvis hele repo)
6. **Runtime**: Node
7. **Build Command**: `npm install && npm run build`
8. **Start Command**: `npm run start:http`

### 3. Environment Variables på Render

Kopier fra `.env` til Render Environment Variables:

```bash
# Google Calendar
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Supabase
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security
MCP_API_KEY=renos-calendar-mcp-secret-key-2025
ENCRYPTION_KEY=9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947
ENCRYPTION_SALT=9b2af923a0665b2f47c7a799b9484b28

# Node
NODE_ENV=production
PORT=3001
```

### 4. Deploy

Klik "Create Web Service" → Render deployer automatisk!

URL: `https://renos-calendar-mcp.onrender.com`

### 5. Verificér Deployment

```bash
curl https://renos-calendar-mcp.onrender.com/health
# → { "status": "ok", "timestamp": "..." }

curl https://renos-calendar-mcp.onrender.com/tools
# → { "tools": [...] }
```

## 📱 Deploy Dashboard (Frontend) til Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy Dashboard

```bash
cd dashboard
vercel --prod
```

### 3. Configure Environment

Vercel spørger efter `.env`:

```bash
VITE_API_URL=https://renos-calendar-mcp.onrender.com
```

### 4. Custom Domain (Optional)

På Vercel Dashboard:
- Settings → Domains
- Add: `renos.rendetalje.dk`
- Update DNS CNAME record

## 🗄️ Deploy Supabase Schema

### 1. Log ind på Supabase

https://supabase.com/dashboard

### 2. Vælg Project

`oaevagdgrasfppbrxbey` (RenOS project)

### 3. SQL Editor

Kopier indhold fra `docs/SUPABASE_SCHEMA.sql` og kør.

### 4. Verificér Tables

Tjek at følgende tables eksisterer:
- `customer_preferences`
- `booking_validations`
- `overtime_logs`
- `undo_actions`
- `customer_satisfaction`

## 🔧 Post-Deployment Configuration

### 1. Opdater Billy MCP URL

I `.env` (hvis Billy MCP er deployed):

```bash
BILLY_MCP_URL=https://tekup-billy.onrender.com
```

### 2. Configure CORS

Tilføj dashboard URL til CORS whitelist i `http-server.ts`:

```typescript
const allowedOrigins = [
  'https://renos.vercel.app',
  'https://renos.rendetalje.dk',
];
```

### 3. Setup Webhooks (Optional)

For real-time updates, configure webhooks:

- Google Calendar: https://console.cloud.google.com/apis/credentials
- Billy: https://www.billy.dk/api

## 📊 Monitoring & Logging

### Render Logs

```bash
# View logs
render logs --service renos-calendar-mcp --tail

# Health check
watch -n 30 curl https://renos-calendar-mcp.onrender.com/health
```

### Supabase Logs

Dashboard → Logs → Filter by table

### Error Tracking

Winston logs gemmes i Supabase via `insertLog()`.

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions

Opret `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm test
      - uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## 🎯 Performance Optimization

### 1. Enable Caching

Redis (optional):

```bash
# Upstash Redis
https://upstash.com/

# Add to .env
REDIS_HOST=us1-...upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=...
```

### 2. CDN for Dashboard

Vercel har automatisk CDN. For custom CDN:

```bash
# Cloudflare Pages
npm run build
wrangler pages deploy dist/
```

## 🔐 Security Hardening

### 1. Rate Limiting

Allerede konfigureret i `http-server.ts`:
- 100 requests per 15 min per IP

### 2. API Key Rotation

Opdater `MCP_API_KEY` hver måned:

```bash
# Generate new key
openssl rand -hex 32

# Update Render environment
render env:set MCP_API_KEY=new_key_here
```

### 3. SSL/TLS

Render og Vercel har automatisk HTTPS.

## 📞 Support & Troubleshooting

### Common Issues

**"Google Calendar API error"**
- Verificer service account har calendar access
- Check `GOOGLE_IMPERSONATED_USER` er korrekt

**"Supabase connection timeout"**
- Verificer `SUPABASE_SERVICE_KEY` (ikke ANON_KEY)
- Check RLS policies er konfigureret korrekt

**"Dashboard shows no data"**
- Verificer `VITE_API_URL` peger til Render URL
- Check CORS whitelist i backend

### Rollback

```bash
# Render
render rollback --service renos-calendar-mcp

# Vercel
vercel rollback
```

## ✅ Deployment Checklist

- [ ] MCP Server deployed til Render ✅
- [ ] Dashboard deployed til Vercel ✅
- [ ] Supabase schema migrated ✅
- [ ] Environment variables configured ✅
- [ ] Health checks passing ✅
- [ ] CORS configured ✅
- [ ] Domain connected (optional)
- [ ] Monitoring setup ✅
- [ ] Error tracking active ✅

## 🎉 Done!

**MCP Server**: https://renos-calendar-mcp.onrender.com
**Dashboard**: https://renos.vercel.app

Test med:

```bash
curl https://renos-calendar-mcp.onrender.com/validate-booking-date \
  -H "Content-Type: application/json" \
  -H "X-API-Key: renos-calendar-mcp-secret-key-2025" \
  -d '{
    "date": "2025-10-28",
    "expectedDayName": "tirsdag"
  }'
```

🚀 **RenOS Calendar Intelligence er nu LIVE!**

