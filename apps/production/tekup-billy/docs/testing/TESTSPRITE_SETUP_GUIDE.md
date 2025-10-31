# TestSprite Setup Guide for Tekup-Billy

**Dato:** 31. Oktober 2025  
**Status:** Guide til TestSprite konfiguration

---

## TestSprite Konfiguration

### Testing Configuration

#### Testing Types
- **Mode:** ✅ **Backend** (korrekt - tekup-billy er en backend MCP server)
- **Scope:** ✅ **Codebase** (test hele codebase)

#### Authentication

⚠️ **VIGTIGT:** Tekup-Billy har forskellige auth requirements afhængigt af endpoint:

**For MCP endpoints (`/`, `/mcp`):**
- Authentication: **None** (public MCP discovery)
- TestSprite skal teste: `http://localhost:3000/` eller `http://localhost:3000/mcp`

**For REST API endpoints (`/api/v1/tools/*`):**
- Authentication: **Custom Header**
- Header Name: `X-API-Key`
- Header Value: `<din MCP_API_KEY fra .env>`

**Anbefaling for TestSprite:**
- Brug **"None"** hvis TestSprite tester MCP endpoints (`/`, `/mcp`)
- Brug **"Custom Header"** hvis TestSprite tester REST API (`/api/v1/tools/*`)

#### Local Development Port

- **Port:** `3000`
- **Path:** `/` (eller `/mcp` for MCP SSE transport)
- **Full URL:** `http://localhost:3000/`

**⚠️ Sørg for at serveren kører:**
```bash
cd Tekup/apps/production/tekup-billy
npm run dev:http
```

Eller hvis du vil teste MCP stdio server:
```bash
npm run dev
```

---

## Product Specification Document

TestSprite kræver en PRD (Product Requirements Document) for at generere tests.

### Option 1: Upload eksisterende spec

**Upload denne fil:**
- `docs/PROJECT_SPEC.md` - Komplet projekt specifikation
- `docs/TEKUP_BILLY_V2_SPECIFICATION.md` - v2.0 spec
- `README.md` - Project overview

### Option 2: Generer via TestSprite MCP

Du kan også bruge TestSprite MCP tool til at generere en standardiseret PRD:

```bash
# Via Cursor AI
# Jeg kan kalde: testsprite_generate_standardized_prd
```

Men det kræver at projektet har en PRD fil først - så bedste approach er at uploade `PROJECT_SPEC.md`.

---

## TestSprite Konfiguration Summary

| Setting | Value | Notes |
|---------|-------|-------|
| **Mode** | Backend | ✅ Korrekt |
| **Scope** | Codebase | Test hele projektet |
| **Authentication** | None (eller Custom Header) | Afhænger af endpoint |
| **Port** | 3000 | Default port |
| **Path** | `/` | Root endpoint |
| **Server Running** | ✅ Required | `npm run dev:http` |

---

## Forventede Tests

TestSprite vil generere tests for:

### 1. Health Endpoints
- `GET /health` - Health check
- `GET /version` - Version info
- `GET /health/metrics` - Metrics

### 2. MCP Endpoints (hvis authentication = None)
- `POST /` - MCP protocol (ChatGPT)
- `POST /mcp` - MCP SSE transport (Claude)
- `GET /.well-known/mcp.json` - MCP discovery

### 3. REST API Endpoints (hvis authentication = Custom Header)
- `POST /api/v1/tools/list_invoices`
- `POST /api/v1/tools/create_invoice`
- `POST /api/v1/tools/list_customers`
- `POST /api/v1/tools/get_revenue`
- ... (alle 27+ tools)

---

## Næste Skridt

1. ✅ **Upload PRD:** Upload `docs/PROJECT_SPEC.md` til TestSprite
2. ✅ **Configurer authentication:** Vælg "None" for MCP endpoints eller "Custom Header" for REST API
3. ✅ **Start server:** `npm run dev:http` (port 3000)
4. ✅ **Click "Continue"** i TestSprite UI
5. ✅ **Review generated test plan**
6. ✅ **Execute tests**

---

## Troubleshooting

### "Server not reachable"

**Fix:**
1. Verify server kører: `curl http://localhost:3000/health`
2. Check firewall ikke blokkerer port 3000
3. Prøv at køre: `npm run dev:http` i terminal

### "Authentication failed" (hvis du bruger Custom Header)

**Fix:**
1. Check at `X-API-Key` header er sat korrekt
2. Verify API key i `.env` fil: `MCP_API_KEY=...`
3. Test manuelt: `curl -H "X-API-Key: your-key" http://localhost:3000/api/v1/tools/list_invoices`

### "No PRD file found"

**Fix:**
1. Upload `docs/PROJECT_SPEC.md` i TestSprite UI
2. Eller upload `README.md` som fallback
3. TestSprite vil generere en standardiseret PRD baseret på filen

---

**Status:** Guide klar til brug 🚀

