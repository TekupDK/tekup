# TestSprite Configuration Checklist

**Status:** ⚠️ Uoverensstemmelse fundet - skal fixes før Continue

---

## 🔴 Problem: Authentication Mismatch

### Din nuværende konfiguration

- **Path:** `/api/v1/tools/*` (REST API endpoints)
- **Authentication:** None

### Problem

REST API endpoints (`/api/v1/tools/*`) kræver authentication via `X-API-Key` header. De kan ikke testes med "None" authentication.

---

## ✅ Løsning: Vælg én approach

### Option 1: Test MCP Endpoints (Anbefalet for første test)

**Konfiguration:**

- **Path:** `/` eller `/mcp`
- **Authentication:** None ✅
- **Endpoints der testes:**
  - `POST /` - MCP protocol (ChatGPT format)
  - `POST /mcp` - MCP SSE transport (Claude format)
  - `GET /.well-known/mcp.json` - MCP discovery

**Fordele:**

- Ingen authentication nødvendig
- Tester MCP protocol direkte
- Bedre for integration testing med AI agents

**Tester:** MCP tool discovery og protocol compliance

---

### Option 2: Test REST API (Kræver Authentication)

**Konfiguration:**

- **Path:** `/api/v1/tools/*`
- **Authentication:** **Custom Header** (ikke None!)
  - Header Name: `X-API-Key`
  - Header Value: `<din MCP_API_KEY fra .env>`

**Endpoints der testes:**

- `POST /api/v1/tools/list_invoices`
- `POST /api/v1/tools/create_invoice`
- `POST /api/v1/tools/list_customers`
- ... (alle 27+ tools)

**Fordele:**

- Tester REST API direkte
- Tester alle tools individuelt
- Mere granular test coverage

**Ulemper:**

- Kræver API key
- Måske ikke så relevant for MCP integration

---

## 📋 Anbefalet Konfiguration (Option 1)

### Testing Configuration

```
Mode: Backend ✅
Scope: Codebase ✅
Authentication: None ✅
Port: 3000 ✅
Path: / ✅ (eller /mcp)
```

### Tjek at serveren kører

```bash
cd C:\Users\empir\Tekup\apps\production\tekup-billy
npm run dev:http
```

### Test forbindelse

```bash
curl http://localhost:3000/health
```

Forventet response:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.4.3"
}
```

---

## 🚀 Næste Skridt

1. **FIX Path:** Skift fra `/api/v1/tools/*` til `/` i TestSprite
2. **Verify Server:** Kør `npm run dev:http` i terminal
3. **Test Connection:** Verificer `http://localhost:3000/health` virker
4. **Click Continue:** I TestSprite UI

---

## 📝 Full Configuration Summary

| Setting        | Value            | Notes                          |
| -------------- | ---------------- | ------------------------------ |
| Mode           | Backend          | ✅ Korrekt                     |
| Scope          | Codebase         | ✅ Korrekt                     |
| Authentication | None             | ✅ Korrekt (for MCP)           |
| Port           | 3000             | ✅ Korrekt                     |
| Path           | `/` eller `/mcp` | ⚠️ SKIFT fra `/api/v1/tools/*` |
| PRD            | PROJECT_SPEC.md  | ✅ Uploaded                    |

---

**Status:** FIX path først, derefter Continue! 🚀
