# 🚀 Quick Test Reference Card

**Version:** 1.4.1  
**Updated:** 20. Oktober 2025

---

## ⚡ 30-Second Health Check

```powershell
# Check if server is up
Invoke-RestMethod https://tekup-billy.onrender.com/health

# Should show:
# ✅ status: healthy
# ✅ supabase: enabled + connected
# ✅ version: 1.4.1
```

---

## 🎯 Platform Test URLs

### ChatGPT

**Setup Guide:** `docs/integration/CHATGPT_INTEGRATION_GUIDE.md`

**Quick Test Prompts:**

```
1. "Show me my last 5 invoices"
2. "Create a Danish B2B customer named Test Corp"
3. "What's my revenue this month?"
```

---

### Shortwave.ai

**Setup Guide:** `docs/SHORTWAVE_INTEGRATION_GUIDE.md`

**MCP Endpoint:**

```
https://tekup-billy.onrender.com/mcp
```

**Auth Header:**

```
X-API-Key: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

**Quick Test:**

```
In Shortwave: "@billy show my invoices"
```

---

### Claude Desktop

**Setup Guide:** `CLAUDE_DESKTOP_SETUP.md`

**Config File:** `%APPDATA%\Claude\claude_desktop_config.json`

**Quick Test:**

```
In Claude: "List my Billy invoices"
```

---

## 📊 Performance Benchmarks

### Expected Response Times

| Operation | Cache Miss | Cache Hit | Target |
|-----------|------------|-----------|--------|
| Health Check | 50ms | 50ms | <100ms |
| List Tools | 100ms | 100ms | <200ms |
| List Customers | 250-500ms | 50-100ms | <100ms avg |
| Create Customer | 300-600ms | N/A | <1s |
| List Invoices | 250-500ms | 50-100ms | <100ms avg |

### Cache Hit Rate Target

```
Day 1:  20-40% (warming up)
Day 2:  40-60% (improving)
Day 3+: 60-80% (optimal) ✅
```

---

## 🔍 Quick Troubleshooting

### Problem: "Connection failed"

```powershell
# Check Render status
curl https://tekup-billy.onrender.com/health

# If 503 → Server restarting (wait 30s)
# If 404 → Wrong URL
# If timeout → Render cold start (wait 60s)
```

---

### Problem: "401 Unauthorized"

```powershell
# Verify API key
$headers = @{ "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" }
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/tools/list" -Headers $headers

# Should return 32 tools
```

---

### Problem: "Slow responses (>1s)"

```powershell
# Check cache status
Invoke-RestMethod https://tekup-billy.onrender.com/health/metrics

# Look for:
# cacheHitRate < 0.40 → Cache warming up, wait 10 min
# avgResponseTime > 500 → Check Supabase connection
```

---

## 🧪 One-Line Test Commands

### Full Integration Test

```powershell
npm run test:integration
```

### Production Endpoint Test

```powershell
npm run test:production
```

### Performance Benchmark

```powershell
.\scripts\benchmark.ps1  # (to be created)
```

---

## 📈 Monitoring Endpoints

```powershell
# Health status (JSON)
Invoke-RestMethod https://tekup-billy.onrender.com/health

# Metrics (JSON)
Invoke-RestMethod https://tekup-billy.onrender.com/health/metrics

# Human-readable summary (Text)
Invoke-RestMethod https://tekup-billy.onrender.com/health/summary
```

---

## 🎯 Success Criteria Checklist

### Deployment

- [ ] Build succeeds (no TypeScript errors)
- [ ] Health check returns 200 OK
- [ ] Supabase enabled = true
- [ ] All 32 tools listed

### Performance

- [ ] Cache hit rate >60% (after warm-up)
- [ ] Avg response time <100ms
- [ ] Error rate <5%
- [ ] Billy API calls <4000/month

### Platform Integration

- [ ] ChatGPT custom actions work
- [ ] Shortwave MCP connection stable
- [ ] Claude Desktop stdio works
- [ ] All test prompts return correct data

---

## 🔗 Quick Links

**Production:**
- Health: <https://tekup-billy.onrender.com/health>
- Metrics: <https://tekup-billy.onrender.com/health/metrics>
- Render Dashboard: <https://dashboard.render.com>

**Documentation:**
- Full Test Guide: `docs/testing/TESTING_WORKFLOW.md`
- ChatGPT Setup: `docs/integration/CHATGPT_INTEGRATION_GUIDE.md`
- Shortwave Setup: `docs/SHORTWAVE_INTEGRATION_GUIDE.md`
- Database Setup: `docs/operations/SUPABASE_CACHING_SETUP.md`

**GitHub:**
- Repo: <https://github.com/JonasAbde/Tekup-Billy>
- Issues: <https://github.com/JonasAbde/Tekup-Billy/issues>

---

**📋 Print this card and keep by your desk!**
