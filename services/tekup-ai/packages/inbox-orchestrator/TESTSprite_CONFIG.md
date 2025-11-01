# 🎯 TestSprite Configuration - Copy These Settings

## Quick Copy-Paste Configuration

Brug disse indstillinger i TestSprite dashboard:

---

## Testing Configuration

### Mode
**Backend** ✅

### Scope  
**Codebase** ✅

### Authentication
- **Type:** None - No authentication required ✅

### Local Development Port
- **Port:** `3011`
- **Path:** `/`
- **Full URL:** `http://localhost:3011`

### Product Specification Doc
**Upload denne fil:**
```
C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator\FRIDAY_AI_PRD.md
```

**Alternativt kan du bruge:**
```
C:\Users\empir\Tekup\apps\rendetalje\r.plan.md
```

---

## Pre-Test Verification

Før du starter TestSprite tests, verificer:

### 1. Server er kørende
```bash
curl http://localhost:3011/health
```
**Expected:** `{"ok":true}`

### 2. Port er tilgængelig
Serveren skal køre på port 3011.

### 3. Test endpoints
Alle disse endpoints skal være tilgængelige:
- ✅ GET `/health`
- ✅ GET `/test/parser`
- ✅ POST `/generate-reply`
- ✅ POST `/approve-and-send`
- ✅ POST `/chat`

---

## TestSprite Will Test

1. **Health Check** - Service availability
2. **Lead Parser** - Email thread parsing
3. **Generate Reply** - AI reply generation with memories
4. **Approve and Send** - Email sending with labels
5. **Chat** - Intent detection, token optimization, metrics

---

## Expected Test Results

After TestSprite runs, you'll get:
- ✅ Test execution report
- ✅ API endpoint validation
- ✅ Memory enforcement verification
- ✅ Token optimization metrics
- ✅ Improvement recommendations

---

## Files Location

**Test Plan:**
```
testsprite_tests/testsprite_backend_test_plan.json
```

**Test Report (after execution):**
```
testsprite_tests/testsprite-mcp-test-report.md
```

---

**Ready to test! 🚀**

