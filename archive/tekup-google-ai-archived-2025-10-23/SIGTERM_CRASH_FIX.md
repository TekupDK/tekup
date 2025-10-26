# 🔧 SIGTERM Crash Fix - 6. Oktober 2025, 23:18 CET

## 🚨 Problem

Backend crashede i production med **SIGTERM signal** umiddelbart efter at blive "live":

```
{"level":30,"time":1759788507666,"msg":"Assistant service is listening"}
==> Your service is live 🎉
npm error signal SIGTERM
npm error command sh -c node dist/index.js
```

**Timing:** Crash skete præcis når Render health check passerede og service blev markeret som "live".

---

## 🔍 Root Cause Analysis

### 1. Missing Signal Handlers
```typescript
// ❌ BEFORE: src/index.ts
server.listen(port, () => {
    logger.info({ port }, "Assistant service is listening");
    resolve();
});

// No SIGTERM/SIGINT handlers!
// When Render sends SIGTERM (deployment/scaling), process crashes
```

### 2. npm Script Wrapper Issue
```json
// ❌ package.json
"start": "node dist/index.js"

// When run as `npm start`, creates shell wrapper
// SIGTERM kills npm process but not Node child cleanly
```

### 3. Render startCommand
```yaml
# ❌ render.yaml
startCommand: npx prisma migrate deploy && node dist/index.js

# Multiple processes in chain makes signal handling unclear
```

---

## ✅ Solution Implemented

### Fix 1: Graceful Shutdown Handler (src/index.ts)

```typescript
// ✅ AFTER: Add graceful shutdown
const server: Server = createHttpServer(listener);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, closing server gracefully");
    
    server.close(() => {
        logger.info("Server closed successfully");
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 30000);
};

// Register signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

**Benefits:**
- ✅ Handles SIGTERM gracefully (from Render deployments)
- ✅ Handles SIGINT gracefully (from manual stops)
- ✅ Closes active connections properly
- ✅ 30-second timeout prevents hanging
- ✅ Logs shutdown reason for debugging

### Fix 2: Use `exec` in npm Scripts (package.json)

```json
// ✅ AFTER: Replace shell process with Node
"start": "exec node dist/index.js",
"start:prod": "NODE_ENV=production exec node dist/index.js"
```

**Why `exec`?**
- `exec` **replaces** the shell process with Node process
- SIGTERM goes directly to Node (not shell wrapper)
- Cleaner process tree
- Better signal propagation

### Fix 3: Direct Node Execution (render.yaml)

```yaml
# ✅ AFTER: Use exec in startCommand
startCommand: npx prisma migrate deploy && exec node dist/index.js
```

**Benefits:**
- Direct process control
- Consistent with npm script pattern
- No shell wrapper confusion

---

## 🧪 Testing

### Local Testing
```powershell
# Build
npm run build

# Start with signal handler
npm start

# In another terminal - test graceful shutdown
# Press Ctrl+C or send SIGTERM
taskkill /F /IM node.exe  # Should see graceful shutdown logs
```

### Production Testing (After Deploy)
```powershell
# Monitor Render logs
# Look for:
# ✅ "Assistant service is listening"
# ✅ "Your service is live 🎉"
# ✅ NO "npm error signal SIGTERM"
# ✅ Process stays running

# Test graceful shutdown during redeploy
# Should see: "Received shutdown signal, closing server gracefully"
```

---

## 📊 Expected Behavior

### ❌ BEFORE (Crash)
```
22:08:27 → Service listening on port 3000
22:08:36 → Your service is live 🎉
22:08:36 → npm error signal SIGTERM ❌
22:08:36 → Process killed
```

### ✅ AFTER (Graceful)
```
23:25:00 → Service listening on port 3000
23:25:10 → Your service is live 🎉
23:25:10 → Process continues running ✅
...
[Later deployment]
23:30:00 → Received shutdown signal SIGTERM
23:30:00 → Closing server gracefully
23:30:01 → Server closed successfully
23:30:01 → Process exit 0
```

---

## 🎯 Why This Happens

**Render Deployment Flow:**
1. Build new version
2. Start new instance
3. Wait for health check pass (`/health` returns 200)
4. Mark service as "live"
5. **Send SIGTERM to old instance** (if exists)
6. Route traffic to new instance

**The Bug:**
- Old code had **NO SIGTERM handler**
- When Render sent SIGTERM, Node process crashed uncleanly
- npm wrapper propagated crash as error
- Logs showed "signal SIGTERM" error

**The Fix:**
- New code **HANDLES SIGTERM** gracefully
- Server closes connections properly
- Process exits cleanly with code 0
- No error logs, clean shutdown

---

## 🔗 Related Issues

- Commit 8b9b972 attempted to fix with build separation
- That fixed frontend crashes, but backend SIGTERM remained
- This fix addresses the **root cause** (missing signal handlers)

---

## 📝 Prevention Checklist

For future Node.js services on Render:

- [ ] Always implement SIGTERM handler
- [ ] Always implement SIGINT handler (Ctrl+C)
- [ ] Use `exec` in npm start scripts
- [ ] Use `exec` in Render startCommand
- [ ] Add 30-second forced shutdown timeout
- [ ] Log shutdown signals for debugging
- [ ] Test graceful shutdown locally
- [ ] Verify no crash logs after "service is live"

---

## 🚀 Deployment

```powershell
# Commit fix
git add src/index.ts package.json render.yaml
git commit -m "fix: Add graceful SIGTERM/SIGINT handlers to prevent crashes"
git push origin main

# Render will auto-deploy
# Monitor logs: https://dashboard.render.com/web/srv-xxx/logs
```

---

**Status:** 🟢 FIXED - Ready for deployment  
**Impact:** CRITICAL (service crashed every deployment)  
**Risk:** LOW (adds safety, no breaking changes)
