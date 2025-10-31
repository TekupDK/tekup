# Railway Environment Variables - tekup-billy

**Gå til:** Railway Dashboard → `tekup-billy` service → **Variables** tab

---

## 🔑 Required Variables (Copy/Paste)

### 1. BILLY_API_KEY

```
Key:   BILLY_API_KEY
Value: 43e7439bccb58a8a96dd57dd06dae10add009111
```

### 2. BILLY_ORGANIZATION_ID

```
Key:   BILLY_ORGANIZATION_ID
Value: pmf9tU56RoyZdcX3k69z1g
```

### 3. BILLY_API_BASE

```
Key:   BILLY_API_BASE
Value: https://api.billysbilling.com/v2
```

### 4. MCP_API_KEY

```
Key:   MCP_API_KEY
Value: sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr
```

---

## ✅ Optional Variables (Allerede i railway.json)

Disse er allerede sat i `railway.json` og behøver IKKE at tilføjes manuelt:

- `NODE_ENV=production`
- `PORT=3000` (Railway sætter automatisk)
- `CORS_ORIGIN=*`
- `ENABLE_SUPABASE_LOGGING=true`
- `BILLY_DRY_RUN=false`
- `BILLY_TEST_MODE=false`
- `BILLY_API_BASE=https://api.billysbilling.com/v2`

---

## 📋 Quick Copy/Paste Format

Hvis Railway har bulk import, kopier dette:

```
BILLY_API_KEY=43e7439bccb58a8a96dd57dd06dae10add009111
BILLY_ORGANIZATION_ID=pmf9tU56RoyZdcX3k69z1g
BILLY_API_BASE=https://api.billysbilling.com/v2
MCP_API_KEY=sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr
```

---

## ⚠️ Supabase Variables (Optional - hvis du bruger Supabase)

Hvis du har Supabase integration, tilføj også:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
ENCRYPTION_KEY=<your-encryption-key>
ENCRYPTION_SALT=<your-encryption-salt>
```

---

## ✅ Verification

Efter du har sat variables:

1. Redeploy service
2. Check logs for: `[STARTUP] Environment validated: { organizationId: 'pmf9tU56RoyZdcX3k69z1g', ... }`
3. Test endpoint: `https://tekup-billy-production.up.railway.app/health`

---

**Status:** ✅ Ready for Railway Dashboard
