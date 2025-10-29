# 📋 TekupVault Requirements from Tekup-Billy

**Date:** 16. Oktober 2025  
**From:** Tekup-Billy MCP Server Team  
**To:** TekupVault Development Team  
**Subject:** Integration Requirements for Phase 1 & 2

---

## 🎯 Executive Summary

Tekup-Billy needs TekupVault to provide semantic search capabilities across our documentation and codebase. Currently, TekupVault API is live but missing critical functionality.

**Priority:** Get search endpoint working so AI agents can find Billy.dk integration information.

---

## 🔴 Critical Issues to Fix

### 1. Database Connection

**Current:** Worker service cannot connect to database  
**Error:** `TypeError: fetch failed`  
**Impact:** No data is being indexed from Tekup-Billy  
**Fix Needed:** Configure database environment variables in Render

### 2. Search Endpoint Not Implemented

**Current:** `POST /api/search` returns 404  
**Expected:** Working semantic search endpoint  
**Impact:** Cannot search for Billy.dk documentation

### 3. GitHub Sync Not Working

**Current:** Mock data being returned  
**Expected:** Real sync from TekupDK/Tekup-Billy repository  
**Impact:** No actual indexing happening

---

## 📝 What Tekup-Billy Needs (Phase 1)

### 1. Working Search API

```bash
POST https://tekupvault-api.onrender.com/api/search
Content-Type: application/json

{
  "query": "How to create invoice in Billy?",
  "limit": 10,
  "threshold": 0.7,
  "repository": "Tekup-Billy"  // Optional: filter by repo
}
```

**Expected Response:**

```json
{
  "results": [
    {
      "file": "src/tools/invoices.ts",
      "content": "export async function create_invoice(...)",
      "relevance": 0.95,
      "line_start": 45,
      "line_end": 120
    },
    {
      "file": "docs/BILLY_API_REFERENCE.md",
      "content": "## Creating Invoices\n\nTo create an invoice...",
      "relevance": 0.89,
      "line_start": 234,
      "line_end": 290
    }
  ],
  "total": 2,
  "query_time_ms": 125
}
```

### 2. Sync Status API

```bash
GET https://tekupvault-api.onrender.com/api/sync-status?repository=Tekup-Billy
```

**Expected Response:**

```json
{
  "repository": "TekupDK/Tekup-Billy",
  "last_sync": "2025-10-16T09:00:00Z",
  "files_indexed": 133,
  "status": "success",
  "next_sync": "2025-10-16T15:00:00Z"
}
```

### 3. Files to Index from Tekup-Billy

**Must Index:**
- All TypeScript files in `src/` (~22 files)
- All Markdown files in root and `docs/` (~106 files)
- Configuration files: `package.json`, `tsconfig.json`, `render.yaml`, `Dockerfile`, `.env.example`

**Do NOT Index:**
- `node_modules/`
- `dist/`
- `.git/`
- `archive/`
- Binary files
- Log files

---

## 🚀 What Tekup-Billy Needs (Phase 2)

### MCP Server Integration

When TekupVault implements MCP server, Tekup-Billy will add:

```typescript
// src/tools/tekupvault.ts
export async function search_tekup_docs(client: BillyClient, args: unknown) {
  const { query, repository, limit = 10 } = searchSchema.parse(args);
  
  // Call TekupVault MCP server
  const results = await tekupVaultMCP.search({
    query,
    repository: repository || 'all',
    limit
  });
  
  return {
    content: [{
      type: 'text' as const,
      text: formatSearchResults(results)
    }]
  };
}
```

This will allow Claude/ChatGPT to search across all Tekup projects when helping with Billy.dk integrations.

---

## 📊 Success Metrics

We'll know Phase 1 is complete when:

1. ✅ Search returns real results from Tekup-Billy codebase
2. ✅ Sync happens every 6 hours automatically
3. ✅ All 133 relevant files are indexed
4. ✅ Search relevance > 0.8 for common queries

**Test Queries:**
- "How to create an invoice?"
- "Billy API authentication"
- "MCP tool implementation"
- "Supabase configuration"
- "Error handling in Billy client"

---

## 🛠️ Technical Requirements

### API Authentication (if needed)

```http
Authorization: Bearer <api-key>
X-Repository: Tekup-Billy
```

### Rate Limiting

- Minimum: 100 requests/minute
- Preferred: 1000 requests/minute

### Response Time

- Search: < 500ms
- Sync status: < 100ms

### CORS Headers

```
Access-Control-Allow-Origin: https://tekup-billy.onrender.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📞 Contact & Support

**Tekup-Billy Team:**
- Repository: <https://github.com/TekupDK/Tekup-Billy>
- Production: <https://tekup-billy.onrender.com>
- Contact: Jonas Abde

**Questions About:**
- What file types to index
- Search query format
- MCP integration specs
- Authentication requirements

---

## 🎯 Priority Order

1. **Fix database connection** (ASAP)
2. **Implement search endpoint** (This week)
3. **Test with real queries** (Next week)
4. **Document API** (Before Phase 2)
5. **Plan MCP integration** (Q4 2025)

---

**Message to TekupVault Team:**

Hey team! 👋

TekupVault API is live which is great! But we need the search functionality working so our AI agents (Claude, ChatGPT) can find Billy.dk integration docs.

**Top 3 priorities:**
1. Fix database connection (getting fetch errors)
2. Implement `/api/search` endpoint
3. Start syncing from Tekup-Billy repo

Once search works, we can help thousands of users find Billy.dk API docs instantly!

Let me know if you need:
- GitHub access token for Tekup-Billy
- List of specific files to index
- Example search queries
- Help with testing

Thanks! 🚀

---

**End of Requirements Document**
