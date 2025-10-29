# Tekup-Billy MCP Server - Deployment Configuration

Denne mappe indeholder alle deployment-relaterede konfigurationsfiler og guides til Tekup-Billy MCP Server.

## 📁 Deployment Files

### `../Dockerfile` (Located in root)

**Docker Container Configuration**

⚠️ **Important:** `Dockerfile` og `render.yaml` er placeret i **root directory** (ikke i deployment/) fordi Render kræver det der for automatisk Docker builds.

Definerer hvordan serveren bygges og køres i en Docker container:

- Base image: Node 18 Alpine (minimal footprint)
- Build steps: npm install, TypeScript compilation
- Runtime: Node.js med dist/http-server.js
- Exposed port: 3000
- Health check: curl <http://localhost:3000/health>

**Build lokalt:**

```bash
# Fra root directory
docker build -t tekup-billy-mcp .
```

**Kør lokalt:**

```bash
docker run --env-file .env -p 3000:3000 tekup-billy-mcp
```

### `../render.yaml` (Located in root)

**Render.com Service Configuration**

Blueprint for auto-deployment på Render.com:

- Service type: Web Service
- Runtime: Docker
- Region: Frankfurt (EU Central)
- Instance: Starter (0.5 CPU, 512 MB RAM)
- Auto-deploy: Enabled (main branch)
- Environment Groups: Billy MCP Environment, Tekup Database Environment

**Deploy:**
Push til GitHub main branch → Render auto-deploys

### Environment Group Files

#### `ENV_GROUP_1_BILLY.txt`

**Billy MCP Environment Variables**

Billy.dk API credentials og configuration:

```
BILLY_API_KEY           # Billy.dk API token
BILLY_ORGANIZATION_ID   # Organization ID
BILLY_TEST_MODE         # false (production)
BILLY_DRY_RUN          # false (real operations)
NODE_ENV               # production
```

**Setup på Render:**

1. Go to Dashboard → Environment Groups
2. Create "Billy MCP Environment"
3. Copy/paste content fra ENV_GROUP_1_BILLY.txt
4. Link til Tekup-Billy service

#### `ENV_GROUP_2_DATABASE.txt`

**Tekup Database Environment Variables**

Supabase credentials og encryption keys:

```
SUPABASE_URL            # Supabase project URL
SUPABASE_ANON_KEY      # Public anon key
SUPABASE_SERVICE_KEY   # Service role key (admin)
ENCRYPTION_KEY         # AES-256 encryption key (32 bytes hex)
ENCRYPTION_SALT        # Encryption salt (16 bytes hex)
```

**Setup på Render:**

1. Go to Dashboard → Environment Groups
2. Create "Tekup Database Environment"
3. Copy/paste content fra ENV_GROUP_2_DATABASE.txt
4. Link til Tekup-Billy service

**⚠️ VIGTIGT:** Samme SUPABASE_SERVICE_KEY skal også bruges i RenOS Production Environment!

### `UPDATE_MCP_API_KEY.txt`

**MCP API Key Update Guide**

Step-by-step instructions for updating MCP_API_KEY:

1. Generate ny secure key (32 bytes hex)
2. Update i Render Dashboard
3. Verify deployment
4. Test endpoints

**Generate ny key:**

```bash
node -e "console.log('MCP_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Deployment Process

### Initial Deployment

**1. Forbered Repository**

```bash
# Ensure all changes committed
git add .
git commit -m "feat: prepare for deployment"
git push origin main
```

**2. Setup Render.com**

- Create ny Web Service
- Connect til GitHub repository (TekupDK/Tekup-Billy)
- Select Docker environment
- Region: Frankfurt (EU Central)
- Instance: Starter

**3. Configure Environment Groups**

- Create "Billy MCP Environment" (copy from ENV_GROUP_1_BILLY.txt)
- Create "Tekup Database Environment" (copy from ENV_GROUP_2_DATABASE.txt)
- Link både groups til Tekup-Billy service

**4. Set MCP_API_KEY**
Generate og tilføj i Render Environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**5. Deploy**
Render auto-deploys fra GitHub main branch

**6. Verify Deployment**

```bash
curl https://tekup-billy.onrender.com/health
```

### Updates & Redeploy

**Automatisk (Anbefalet):**

```bash
git push origin main
# Render auto-deploys automatically
```

**Manuel:**

1. Go to Render Dashboard
2. Select Tekup-Billy service
3. Click "Manual Deploy" → "Deploy latest commit"

## 🔐 Security Configuration

### Encryption Keys

**Generate ENCRYPTION_KEY (32 bytes):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947
```

**Generate ENCRYPTION_SALT (16 bytes):**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Output: 9b2af923a0665b2f47c7a799b9484b28
```

### MCP API Key

**Generate MCP_API_KEY (32 bytes):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

**⚠️ VIGTIGT:** Gem alle keys sikkert! De er nødvendige for kryptering og authentication.

## 🌍 Production Environment

### Live Server

- **URL:** <https://tekup-billy.onrender.com>
- **Region:** Frankfurt (EU Central)
- **Instance:** Starter (0.5 CPU, 512 MB RAM)
- **Status:** ✅ Live and healthy

### Endpoints

**Health Check:**

```bash
GET https://tekup-billy.onrender.com/health
```

**Tool Execution:**

```bash
POST https://tekup-billy.onrender.com/api/v1/tools/{tool_name}
Headers:
  X-API-Key: <MCP_API_KEY>
  Content-Type: application/json
Body:
  {...tool arguments...}
```

### Environment Variables

**Production Mode:**

- NODE_ENV=production
- BILLY_TEST_MODE=false
- BILLY_DRY_RUN=false

**Credentials:**

- Billy.dk API credentials i ENV_GROUP_1_BILLY
- Supabase credentials i ENV_GROUP_2_DATABASE
- MCP_API_KEY i Render Environment

## 📊 Monitoring

### Health Checks

Render kører automated health checks hver 30 sekunder:

```bash
curl http://localhost:3000/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T10:02:08.480Z",
  "version": "1.0.0",
  "uptime": 565.816773038,
  "billy": {
    "connected": true,
    "organization": "pmf9tU56RoyZdcX3k69z1g"
  }
}
```

### Logs

**View Render Logs:**

1. Go to Render Dashboard
2. Select Tekup-Billy service
3. Click "Logs" tab

**Key log messages:**

- "✅ Environment validated"
- "✅ Billy client initialized"
- "🚀 Tekup-Billy MCP HTTP Server started!"
- "Available tools: 13"

### Performance Metrics

**Response Times:**

- Health check: ~1ms
- Invoice operations: 100-500ms
- Customer operations: 100-400ms
- Product operations: 100-300ms
- Revenue calculations: 300-700ms

**Rate Limiting:**

- 100 requests per 15 minutes per IP
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

## 🐛 Troubleshooting

### Deployment Failures

**Build errors:**

1. Check Render build logs
2. Verify Dockerfile syntax
3. Test build lokalt: `docker build -t tekup-billy-mcp .`

**Runtime errors:**

1. Check environment variables er sat
2. Verify Billy.dk credentials
3. Test Supabase connection
4. Review application logs

### Common Issues

**502 Bad Gateway:**

- Server is starting (wait 30-60 seconds)
- Check logs for startup errors

**Environment variable errors:**

- Verify Environment Groups are linked
- Check variable names match code expectations
- Ensure no typos in variable names

**Billy.dk connection errors:**

- Verify API key is correct
- Check organization ID matches
- Test directly via curl

**Supabase connection errors:**

- Verify SERVICE_KEY is correct
- Check key hasn't expired
- Test connection from Supabase Dashboard

## 📚 Documentation

For mere detaljeret information:

- [DEPLOYMENT_COMPLETE.md](../docs/DEPLOYMENT_COMPLETE.md) - Komplet deployment guide
- [PRODUCTION_VALIDATION_COMPLETE.md](../docs/PRODUCTION_VALIDATION_COMPLETE.md) - Validation report
- [README.md](../README.md) - Projekt overview

## 🔄 Rollback Procedure

Hvis en deployment fejler:

**1. Via Render Dashboard:**

- Go to Deployments tab
- Find previous working deployment
- Click "Redeploy"

**2. Via Git:**

```bash
git revert HEAD
git push origin main
# Render auto-deploys previous version
```

**3. Emergency:**

- Pause auto-deploy i Render
- Fix issues locally
- Test thoroughly
- Enable auto-deploy
- Push fix

---

**Last Updated:** October 11, 2025  
**Deployment Status:** ✅ Live in Production  
**Current Version:** 1.0.0  
**Region:** Frankfurt (EU Central)
