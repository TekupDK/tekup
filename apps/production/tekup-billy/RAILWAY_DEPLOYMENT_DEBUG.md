# Railway Deployment Debug Guide

## Problem: Continuous Restart Loop

Deployment starter men restarter kontinuerligt - sandsynligvis healthcheck eller crash issue.

---

## 🔍 Debug Steps

### 1. Check Deploy Logs

I Railway Dashboard → tekup-billy → **Deploy Logs**:

**Søg efter:**
- `[STARTUP] Starting Tekup-Billy server...` - Server starter
- `[SERVER] Tekup-Billy MCP HTTP Server started on port` - Server startet OK
- `Failed to start server` - Crash error
- `Error:` - Startup errors
- `Healthcheck timeout` - Healthcheck fejler

---

## 🐛 Common Issues

### Issue 1: Server Crasher ved Startup

**Symptom:** Logs viser crash før server starter

**Mulige årsager:**
1. **Manglende environment variables:**
   - `BILLY_API_KEY` mangler → crash i `getBillyConfig()`
   - `BILLY_ORGANIZATION_ID` mangler → crash i `getBillyConfig()`

2. **Import errors:**
   - Manglende dependencies
   - TypeScript compile errors

**Fix:**
- Tjek at ALLE environment variables er sat (se `RAILWAY_ENV_VARIABLES.md`)
- Tjek deploy logs for konkrete error messages

---

### Issue 2: Healthcheck Fejler

**Symptom:** Server starter men healthcheck fejler

**Mulige årsager:**
1. `/health` endpoint er ikke tilgængelig
2. Server lytter på forkert port
3. Healthcheck timeout for kort

**Fix:**
- Vi har allerede simplificeret `/health` endpoint til altid at returnere 200
- Tjek at server logger: `[SERVER] Tekup-Billy MCP HTTP Server started on port X`

---

### Issue 3: Port Mismatch

**Symptom:** Server starter på forkert port

**Mulige årsager:**
- Railway sætter `PORT` env var dynamisk
- Server bruger stadig hardcoded 3000

**Fix:**
- Koden bruger allerede `process.env.PORT || 3000` ✅
- Tjek logs: `[STARTUP] PORT: X` - skal matche Railway's PORT

---

## 🔧 Quick Fixes

### Fix 1: Force Server Start

Hvis server ikke starter pga. module resolution:

```bash
# I Dockerfile CMD, prøv:
CMD ["node", "--loader", "tsx/esm", "src/http-server.ts"]
```

Eller prøv med explicit PATH:

```bash
CMD ["sh", "-c", "npx tsx src/http-server.ts"]
```

### Fix 2: Add Startup Delay

Hvis tsx compilation tager tid, tilføj delay før healthcheck:

I `railway.json`:
```json
{
  "deploy": {
    "healthcheckTimeout": 30,
    "healthcheckInterval": 15
  }
}
```

---

## 📊 Verification Checklist

Efter deployment, tjek:

- [ ] **Deploy logs viser:** `[STARTUP] Starting Tekup-Billy server...`
- [ ] **Deploy logs viser:** `[STARTUP] Environment validated`
- [ ] **Deploy logs viser:** `[SERVER] Tekup-Billy MCP HTTP Server started`
- [ ] **Healthcheck:** Passer (ingen "service unavailable")
- [ ] **Manual test:** `curl https://tekup-billy-production.up.railway.app/health` → 200 OK

---

## 🚨 If Still Failing

1. **Copy hele deploy log output** (fra "Starting Tekup-Billy server" til fejl)
2. **Check for errors** i logs
3. **Verify environment variables** er sat korrekt
4. **Check Railway service settings:**
   - Root Directory: `apps/production/tekup-billy` (hvis muligt)
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `apps/production/tekup-billy/Dockerfile`

---

**Næste skridt:** Tjek Deploy Logs i Railway Dashboard og find den første error message.

