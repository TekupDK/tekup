## 🏗️ MCP Production Architecture - Phase 1: Deploy 3 MCP Servers

**Labels:** `enhancement`, `infrastructure`, `mcp`, `production`  
**Priority:** High  
**Assignee:** @empir eller TekupDK team

---

## 🎯 Objective

Deploy 3 nye MCP servere til production (Render.com) baseret på proven architecture fra tekup-billy og tekupvault.

**Related Documentation:**

- [MCP_PRODUCTION_ARCHITECTURE_PLAN.md](./tekup-mcp-servers/docs/MCP_PRODUCTION_ARCHITECTURE_PLAN.md)
- [Tekup-Billy Deployment Guide](./apps/production/tekup-billy/docs/DEPLOYMENT_COMPLETE.md)

---

## 📦 Servers Ready for Deployment

### 1. Knowledge MCP ✅ Code Complete

- **Location:** `tekup-mcp-servers/packages/knowledge-mcp/`
- **Features:**
  - `search_knowledge` - Search in markdown/txt documentation
  - Frequency-based scoring algorithm
  - Fast-glob file scanning (5000 files limit)
- **Status:** Built, tested locally with dotenv

### 2. Code Intelligence MCP ✅ Code Complete

- **Location:** `tekup-mcp-servers/packages/code-intelligence-mcp/`
- **Features:**
  - `find_code` - Semantic code search by description
  - `analyze_file` - File structure + function extraction
  - `find_similar_code` - Pattern detection across codebase
  - `get_file_dependencies` - Import/dependency analysis
- **Supported:** `.ts, .tsx, .js, .jsx, .py, .java, .go, .rs`

### 3. Database MCP ✅ Code Complete

- **Location:** `tekup-mcp-servers/packages/database-mcp/`
- **Features:**
  - `query_database` - Read-only SQL with Row Level Security
  - `get_schema` - Full database schema inspection
  - `get_table_info` - Table details + sample data
  - `list_tables` - Enumerate all public tables
  - `analyze_query_performance` - EXPLAIN ANALYZE output
- **Security:** INSERT/UPDATE/DELETE blocked, RLS enforced

---

## ✅ Pre-Deployment Checklist

- [x] All 3 servers compiled successfully (`pnpm run build`)
- [x] TypeScript builds without errors
- [x] `.env` file created with credentials
- [x] `dotenv` package installed for env loading
- [x] Tested locally - servers start without errors
- [x] Git committed (commits: 62b6966, 3ac952b, 9f8d0e6)
- [x] Pushed to GitHub master branch

---

## 🚀 Deployment Steps

### Step 1: Create Render.com Services

For each server, create a new **Web Service** in Render.com:

#### Knowledge MCP Configuration

```yaml
Name: tekup-knowledge-mcp
Region: Frankfurt (EU Central)
Branch: master
Root Directory: /
Build Command: cd tekup-mcp-servers/packages/knowledge-mcp && pnpm install && pnpm run build
Start Command: node tekup-mcp-servers/packages/knowledge-mcp/dist/index.js
Instance Type: Starter ($7/month)
Auto-Deploy: Yes
```

**Environment Variables:**
```bash
NODE_ENV=production
KNOWLEDGE_SEARCH_ROOT=/opt/render/project/src/tekup-mcp-servers
KNOWLEDGE_FILE_GLOBS=**/*.{md,mdx,txt}
KNOWLEDGE_MAX_FILES=5000
```

#### Code Intelligence MCP Configuration

```yaml
Name: tekup-code-intelligence-mcp
Region: Frankfurt (EU Central)
Branch: master
Root Directory: /
Build Command: cd tekup-mcp-servers/packages/code-intelligence-mcp && pnpm install && pnpm run build
Start Command: node tekup-mcp-servers/packages/code-intelligence-mcp/dist/index.js
Instance Type: Starter ($7/month)
Auto-Deploy: Yes
```

**Environment Variables:**
```bash
NODE_ENV=production
CODE_SEARCH_ROOT=/opt/render/project/src
```

#### Database MCP Configuration

```yaml
Name: tekup-database-mcp
Region: Frankfurt (EU Central)
Branch: master
Root Directory: /
Build Command: cd tekup-mcp-servers/packages/database-mcp && pnpm install && pnpm run build
Start Command: node tekup-mcp-servers/packages/database-mcp/dist/index.js
Instance Type: Starter ($7/month)
Auto-Deploy: Yes
```

**Environment Variables:**
```bash
NODE_ENV=production
SUPABASE_URL=https://uagsdymcvdwcgfvqbtwj.supabase.co
SUPABASE_ANON_KEY=[FROM SUPABASE DASHBOARD - Project Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[FROM SUPABASE DASHBOARD - Keep Secret!]
```

⚠️ **Get SUPABASE_SERVICE_ROLE_KEY from:** <https://supabase.com/dashboard/project/uagsdymcvdwcgfvqbtwj/settings/api>

---

### Step 2: Test Deployments

After deployment, verify each server:

```bash
# 1. Check if server is running
curl https://tekup-knowledge-mcp.onrender.com

# 2. Monitor logs in Render dashboard
# Look for: "Server started successfully" or similar

# 3. Test locally by updating .kilocode/mcp.json with production URLs
```

---

### Step 3: Update MCP Configuration

Add production servers to `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "knowledge-prod": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/sdk-http-client"],
      "env": {
        "MCP_SERVER_URL": "https://tekup-knowledge-mcp.onrender.com"
      }
    }
    // ... similar for code-intelligence and database
  }
}
```

---

## 📊 Success Criteria

- [ ] All 3 servers deployed to Render.com
- [ ] Servers start without errors (check logs)
- [ ] Environment variables configured correctly
- [ ] Auto-deploy triggers on git push
- [ ] Health checks passing
- [ ] Response time < 1s for test queries
- [ ] No credential exposure in logs

---

## 💰 Monthly Cost

```
Knowledge MCP:          $7
Code Intelligence MCP:  $7
Database MCP:           $7
────────────────────────────
Total Phase 1:          $21/month
```

**Existing servers:**

- tekup-billy: $15/month
- tekupvault: $15/month

**Total MCP Infrastructure:** $51/month

---

## 🔒 Security Checklist

- [ ] All credentials in environment variables (never hardcoded)
- [ ] SUPABASE_SERVICE_ROLE_KEY kept secret (not in git)
- [ ] Database MCP enforces read-only queries
- [ ] Row Level Security enabled on all Supabase tables
- [ ] No sensitive data in server logs
- [ ] CORS configured appropriately (if HTTP transport)

---

## 📈 Next Steps After Deployment

**Phase 2 (Week 3-4):**

- [ ] Build MCP Gateway service
- [ ] Implement load balancing
- [ ] Add centralized monitoring
- [ ] Setup health check aggregation

**Phase 3 (Month 2):**

- [ ] Integrate into Tekup Dashboard
- [ ] Add AI assistant UI component
- [ ] Create user documentation
- [ ] Beta testing with team

---

## 📚 References

- Architecture Plan: [MCP_PRODUCTION_ARCHITECTURE_PLAN.md](./tekup-mcp-servers/docs/MCP_PRODUCTION_ARCHITECTURE_PLAN.md)
- Security Guidelines: [TEKUP_MCP_SECURITY.md](./tekup-mcp-servers/docs/TEKUP_MCP_SECURITY.md)
- Render.com Docs: <https://render.com/docs/web-services>
- Tekup-Billy Example: [DEPLOYMENT_COMPLETE.md](./apps/production/tekup-billy/docs/DEPLOYMENT_COMPLETE.md)

---

**Created:** 27. oktober 2025  
**Target Completion:** Within 1 week  
**Estimated Effort:** 4-6 hours
