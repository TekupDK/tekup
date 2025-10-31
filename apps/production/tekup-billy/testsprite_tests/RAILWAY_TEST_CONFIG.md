# TestSprite Configuration for Railway Deployment

**Dato:** 31. Oktober 2025  
**Railway URL:** https://tekup-billy-production.up.railway.app

---

## 🔧 TestSprite Configuration Update

Da tekup-billy er deployed på Railway (ikke localhost), skal TestSprite konfigureres til at teste mod Railway URL.

### Opdateret Configuration:

| Setting            | Value                                           | Notes                           |
| ------------------ | ----------------------------------------------- | ------------------------------- |
| **Mode**           | Backend                                         | ✅                              |
| **Scope**          | Codebase                                        | ✅                              |
| **Authentication** | None                                            | ✅ (for MCP endpoints)          |
| **Port**           | N/A                                             | Railway uses HTTPS on port 443  |
| **Base URL**       | `https://tekup-billy-production.up.railway.app` | ⚠️ **SKIFT FRA localhost:3000** |
| **Path**           | `/` eller `/api/v1/tools/*`                     | Afhænger af endpoints           |

---

## 📋 TestSprite UI Configuration

### Option 1: Test MCP Endpoints (Recommended)

```
Base URL: https://tekup-billy-production.up.railway.app
Path: /
Authentication: None
```

**Tests:**

- `POST /` - MCP protocol (ChatGPT)
- `POST /mcp` - MCP SSE transport
- `GET /.well-known/mcp.json` - MCP discovery

### Option 2: Test REST API Endpoints

```
Base URL: https://tekup-billy-production.up.railway.app
Path: /api/v1/tools/*
Authentication: Custom Header
  Header Name: X-API-Key
  Header Value: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

**Tests:**

- All 27+ tools via `/api/v1/tools/*` endpoints

---

## ✅ Environment Variables on Railway

Railway deployment har allerede environment variables sat:

- ✅ `BILLY_API_KEY` - Set in Railway
- ✅ `BILLY_ORGANIZATION_ID` - Set in Railway
- ✅ `BILLY_API_BASE` - Set in Railway
- ✅ `MCP_API_KEY` - Set in Railway (if needed)

**No local .env file needed** - Railway handles all env vars.

---

## 🚀 Re-run TestSprite Tests

### Steps:

1. **Opdater TestSprite Configuration:**
   - Change `http://localhost:3000` → `https://tekup-billy-production.up.railway.app`
   - Keep authentication as "None" for MCP endpoints
   - OR use "Custom Header" if testing REST API

2. **Verify Railway Server:**

   ```bash
   curl https://tekup-billy-production.up.railway.app/health
   ```

   Expected: `{"status":"healthy",...}`

3. **Re-run Tests:**
   - Tests vil nu køre mod Railway deployment
   - All environment variables er sat på Railway
   - Customer creation skal virke

---

## 📊 Expected Results

**After Railway Configuration:**

- ✅ All 10 tests should pass
- ✅ Customer creation will work (env vars set on Railway)
- ✅ Invoice creation will work
- ✅ All endpoints functional

---

## 🔍 Verification

**Health Check:**

```bash
curl https://tekup-billy-production.up.railway.app/health
```

**Test Customer Creation:**

```bash
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/create_customer \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" \
  -d '{"name":"Test Customer","email":"test@test.dk"}'
```

---

**Status:** Ready for Railway testing! 🚀
