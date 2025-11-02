# Railway Deployment Guide - Billy-mcp By Tekup v2.0.1

## Overview

This is an isolated deployment configuration for Railway that avoids Tekup monorepo conflicts with Railway Railpack auto-detection.

## Railway Configuration

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard** → Your Project → Settings → Build
2. **Set Root Directory:** `apps/production/tekup-billy`
3. **Set Builder:** `DOCKERFILE` (force Docker builder)
4. **Set Dockerfile Path:** `Dockerfile` (relative to root directory)
5. **Save Configuration**
6. **Trigger New Deployment**

### Method 2: Railway CLI

```bash
# Navigate to the billy-mcp directory
cd apps/production/tekup-billy

# Login to Railway
railway login

# Link to your project
railway link tekup-billy-production

# Deploy from current directory
railway up --detach
```

## Environment Variables

Configure these in Railway Dashboard → Variables:

### Required
- `BILLY_API_KEY` - Your Billy.dk API key
- `BILLY_ORGANIZATION_ID` - Your Billy.dk organization ID
- `MCP_API_KEY` - Your MCP API authentication key

### Optional (with defaults)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: production)
- `BILLY_API_BASE` - Billy API base URL (default: https://api.billysbilling.com/v2)
- `CORS_ORIGIN` - CORS origin (default: *)
- `ENABLE_SUPABASE_LOGGING` - Enable Supabase logging (default: false)

## Deployment Features

✅ **Version:** 2.0.1  
✅ **Branding:** "Billy-mcp By Tekup"  
✅ **Builder:** Dockerfile (Node 20 Alpine)  
✅ **Start Command:** `npx tsx src/http-server.ts`  
✅ **Health Check:** `/health` endpoint with 15s timeout  
✅ **No Monorepo Dependencies:** Clean, standalone deployment  

## v2.0.0 Features

- 🏷️ **Rebranding:** "Billy-mcp By Tekup" throughout
- 🚀 **Enhanced Pagination:** Full dataset retrieval (fixes Jørgen Pagh search)
- 🎯 **Critical Fix:** Customer search with complete pagination
- 🛡️ **Type Safety:** Improved interfaces and error handling
- 📊 **Better Error Handling:** Billy API response format handling

## Verification

After deployment, verify the service is running:

```bash
# Health check
curl https://your-railway-url.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-02T10:00:00.000Z",
  "version": "2.0.1",
  "uptime": 123,
  "billy": {
    "connected": true,
    "organization": "Your Org Name"
  }
}
```

## Troubleshooting

### Issue: Railway detects workspace/monorepo
**Solution:** Set Root Directory in Railway Dashboard to `apps/production/tekup-billy`

### Issue: Dockerfile not found
**Solution:** Ensure Dockerfile Path is set to `Dockerfile` (relative to root directory)

### Issue: Dependencies not installing
**Solution:** Ensure package.json has no monorepo file: dependencies (should use only npm registry packages)

## Files Structure

```
apps/production/tekup-billy/
├── Dockerfile              # Docker configuration
├── railway.json            # Railway deployment config
├── package.json            # No monorepo dependencies
├── src/                    # Source code
│   ├── http-server.ts      # Entry point
│   ├── billy-client.ts     # Billy API client
│   └── ...
├── .env.example            # Environment template
└── README.md               # Main documentation
```

## Support

For issues or questions:
- GitHub: https://github.com/TekupDK/tekup
- Documentation: See README.md in this directory
