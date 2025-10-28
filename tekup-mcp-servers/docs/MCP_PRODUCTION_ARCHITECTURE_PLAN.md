# 🏗️ MCP Production Architecture Plan

**Dato:** 27. oktober 2025  
**Status:** Planning → Implementation Ready  
**Approved:** Pending

---

## 📋 EXECUTIVE SUMMARY

Baseret på analyse af eksisterende Tekup MCP servere (tekup-billy, tekup-vault) og industry best practices, anbefales en **phased production rollout** af MCP arkitektur for både TekupDK og Tekup platforme.

**Key Decision:** ✅ MCP er production-ready baseret på 10+ måneders drift af tekup-billy

---

## ✅ PROVEN: Hvad virker allerede

### 1. Tekup-Billy MCP (Production siden okt 2024)
- **Platform:** Render.com
- **Transport:** HTTP + stdio
- **Tools:** 13 Billy.dk integrations
- **Performance:** <500ms avg response
- **Architecture:**
  - Express.js HTTP server
  - Audit logging → Supabase
  - Cache layer (memory)
  - Health checks
  - Auto-restart on failure

**Bevis:** `https://tekup-billy.onrender.com` - Live production traffic

### 2. TekupVault MCP (Production)
- **Platform:** Render.com
- **Transport:** HTTP
- **Tools:** 6 semantic search tools
- **Stack:** Pinecone + OpenAI embeddings
- **Architecture:**
  - Session management
  - CORS configured
  - No auth on MCP endpoint (per spec)

### 3. RenOS Calendar MCP (Development)
- **Integration:** Google Calendar API
- **Auth:** OAuth2 with service account
- **Proof:** Complex enterprise integrations mulige

---

## 🎯 RECOMMENDED ARCHITECTURE

### Phase 1: Foundation (Uge 1-2)

**Deploy 3 nye MCP servere til Render.com:**

```
knowledge-mcp.onrender.com     ← Søg i dokumentation
code-intelligence-mcp.onrender.com  ← Kode søgning  
database-mcp.onrender.com      ← Supabase queries
```

**Existing servers fortsætter:**
```
tekup-billy.onrender.com       ← Billy.dk integration
tekupvault.onrender.com        ← Semantic search
```

### Phase 2: Gateway (Uge 3-4)

**Byg MCP Gateway service:**
```typescript
// mcp-gateway.tekup.dk
Express app der:
- Load balances requests
- Standardiserer error responses
- Logger alle requests
- Health checks på alle servere
- Rate limiting
- Authentication (optional)
```

**Benefits:**
- Single endpoint for alle MCP servere
- Centraliseret monitoring
- Failover capability
- Caching layer

### Phase 3: Integration (Måned 2)

**Integrer MCP i Tekup apps:**

1. **Tekup Dashboard (Next.js)**
```tsx
<AIAssistant
  mcpServers={["knowledge", "database", "billy"]}
  gateway="https://mcp-gateway.tekup.dk"
/>
```

2. **RenOS Mobile**
```typescript
// AI quick actions
"Find invoices for Client X" → Database MCP
"Create invoice" → Billy MCP
"Check calendar" → Calendar MCP
```

3. **Tekup API**
```typescript
// Backend AI features
POST /api/ai/query
{
  "query": "Analyze sales data",
  "context": { clientId: "..." }
}
```

---

## 📊 SCALABILITY ANALYSIS

### Current Capacity (Per Server)
```
Requests/second: 10-50
Concurrent: 5-10
Response time: <500ms avg
Uptime: 99.5%+ (tekup-billy proven)
```

### Scaling Strategy

**Horizontal:**
```yaml
# Render.com scaling
knowledge-mcp:
  instances: 2-5 (auto-scale)
  memory: 512MB per instance
  cpu: 0.5 cores per instance
```

**Caching:**
```typescript
// Redis cache layer
- Document search results: 15 min TTL
- Database queries: 5 min TTL
- Code intelligence: 30 min TTL
```

**Load Balancing:**
```
MCP Gateway → Round-robin across instances
Health check every 30s
Remove unhealthy instances
```

---

## 🔒 SECURITY CONSIDERATIONS

### 1. Authentication
```typescript
// MCP Gateway authenticates requests
Authorization: Bearer <tekup_api_key>

// Individual servers no auth (per MCP spec)
// Gateway handles security
```

### 2. Data Access
```typescript
// Database MCP: Read-only queries
// Row Level Security enabled
// Service role key only for admin tools
```

### 3. Audit Logging
```sql
-- All MCP requests logged
CREATE TABLE mcp_audit_logs (
  request_id UUID PRIMARY KEY,
  server TEXT NOT NULL,
  tool TEXT NOT NULL,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  success BOOLEAN
);
```

---

## 💰 COST ANALYSIS

### Infrastructure Costs (Monthly)

**Render.com (5 MCP servere):**
```
knowledge-mcp:           $7-15
code-intelligence-mcp:   $7-15
database-mcp:            $7-15
tekup-billy:             $15 (existing)
tekupvault:              $15 (existing)
mcp-gateway:             $7-15
---
Total:                   $65-90/month
```

**External Services:**
```
Supabase: $25/month (existing)
OpenAI API: ~$50/month (usage-based)
Pinecone: $70/month (existing)
---
Total:                   $145/month
```

**Grand Total:** ~$210-235/month

### ROI Calculation
```
Cost: $235/month = $2,820/year

Time Savings (Conservative):
- 20 hours/month developer time saved
- 2 developers × 20 hours = 40 hours/month
- 40 hours × $100/hour = $4,000/month
- $4,000 × 12 = $48,000/year

ROI: ($48,000 - $2,820) / $2,820 = 1,602%
```

---

## 📈 PERFORMANCE TARGETS

### Phase 1 (MVP)
```
Response time: <1s (p95)
Uptime: >99%
Error rate: <5%
Concurrent users: 5-10
```

### Phase 2 (Scaled)
```
Response time: <500ms (p95)
Uptime: >99.5%
Error rate: <1%
Concurrent users: 50-100
```

### Phase 3 (Production)
```
Response time: <300ms (p95)
Uptime: >99.9%
Error rate: <0.1%
Concurrent users: 500+
```

---

## 🚨 RISK MITIGATION

### Risk 1: MCP Server Downtime
**Impact:** High  
**Mitigation:**
- Multiple instances per server
- Health checks + auto-restart
- Fallback to cached data
- Gateway redirects to healthy instances

### Risk 2: Rate Limiting (OpenAI, Supabase)
**Impact:** Medium  
**Mitigation:**
- Request queuing
- Exponential backoff
- Cache aggressively
- Multiple API keys (rotation)

### Risk 3: Cost Overruns
**Impact:** Low  
**Mitigation:**
- Set Render.com spending limits
- Monitor API usage daily
- Alert på $200/month threshold
- Scale down unused servers

### Risk 4: Security Breach
**Impact:** Critical  
**Mitigation:**
- All credentials in tekup-secrets
- Environment variables only
- Audit logging on all requests
- Rate limiting per user
- RLS on database queries

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Deploy to Render ✅ Code Ready
- [ ] Create Render.com services (3 new)
- [ ] Configure environment variables
- [ ] Deploy from GitHub (auto-deploy on push)
- [ ] Test all tools individually
- [ ] Configure custom domains

### Phase 2: Build Gateway
- [ ] Create mcp-gateway repository
- [ ] Implement Express.js server
- [ ] Add load balancing logic
- [ ] Add health checks
- [ ] Add monitoring (Sentry)
- [ ] Deploy to Render.com

### Phase 3: Integration
- [ ] Update Tekup Dashboard
- [ ] Add AI assistant component
- [ ] Integrate with RenOS mobile
- [ ] Update API endpoints
- [ ] Add documentation

### Phase 4: Monitoring
- [ ] Setup Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Configure Sentry alerts
- [ ] Add Slack notifications
- [ ] Weekly performance reports

---

## 🎯 SUCCESS METRICS

### Week 1
- ✅ All 3 servers deployed
- ✅ Health checks passing
- ✅ Basic tool tests working

### Month 1
- ✅ Gateway operational
- ✅ 10+ daily active users
- ✅ <1s avg response time
- ✅ >99% uptime

### Month 3
- ✅ Integrated in 2+ apps
- ✅ 50+ daily active users
- ✅ <500ms avg response time
- ✅ Positive user feedback

### Month 6
- ✅ All 7 planned servers live
- ✅ 200+ daily active users
- ✅ $40k+ time savings achieved
- ✅ Ready for customer beta

---

## 🔄 NEXT STEPS

### Immediate (This Week)
1. Review and approve this architecture plan
2. Create GitHub issues for each phase
3. Setup Render.com accounts/projects
4. Prepare deployment configs

### Week 2
1. Deploy knowledge-mcp
2. Deploy code-intelligence-mcp
3. Deploy database-mcp
4. Integration testing

### Week 3-4
1. Build MCP Gateway
2. Deploy gateway
3. Create monitoring dashboards
4. Begin app integrations

---

## 📚 REFERENCE DOCUMENTATION

- [TEKUP_MCP_IMPLEMENTATION_GUIDE.md](./TEKUP_MCP_IMPLEMENTATION_GUIDE.md) - Setup guide
- [TEKUP_MCP_SECURITY.md](./TEKUP_MCP_SECURITY.md) - Security audit
- [TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md](./TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md) - Business case
- [Tekup-Billy Deployment Docs](../apps/production/tekup-billy/docs/DEPLOYMENT_COMPLETE.md)
- [TekupVault](https://github.com/TekupDK/tekup-vault) - Standalone repository (moved from monorepo)

---

**Document Owner:** TekupDK Development Team  
**Last Updated:** 27. oktober 2025  
**Next Review:** After Phase 1 completion
