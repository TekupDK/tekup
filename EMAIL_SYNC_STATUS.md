# Email Sync Status - tekup-ai-v2

**Dato:** 3. november 2025
**Status:** ⚠️ Under arbejde

---

## 📊 Aktuel Status

### ✅ Hvad virker:
- **Database Schema:** ✅ Migreret til Supabase PostgreSQL
- **Email Table:** ✅ Alle kolonner tilføjet (fromEmail, toEmail, providerId, etc.)
- **Backend Webhook:** ✅ `/api/inbound/email` endpoint klar til at modtage emails
- **Email Enrichment:** ✅ Auto-enrichment fra Billy/customer lookup
- **Gmail Sync Script:** ✅ Finder threads fra Gmail API (50 fundet i test)
- **Inbox Orchestrator:** ✅ Kører og healthy (port 3011)

### ⚠️ Problemer:
1. **Gmail MCP Server:** ❌ Kører ikke - kan ikke hente fuld email data
2. **Inbound Email Container:** ❌ Crasher - mangler `/app/index.js`
3. **Database Query i Scripts:** ⚠️ Search_path ikke sat korrekt i standalone scripts

---

## 🔧 Løsninger

### 1. Gmail Sync via Backend (QUICK WIN)

Backend'en kan allerede hente emails fra Gmail API gennem MCP, men MCP serveren skal køre:

```bash
# Option A: Start Gmail MCP server
# (Hvis den er i docker-compose, start den først)

# Option B: Brug inbox-orchestrator i stedet
# inbox-orchestrator har Gmail API integration
```

### 2. Inbound Email Container

`inbound-email` container skal have koden fra `sendbetter/inbound-email` repo:

**Problem:** Repo klones, men mangler `index.js`

**Løsning:**
- Enten fix Dockerfile til at bygge fra source korrekt
- Eller brug npm package `inbound-email` i stedet for git clone

### 3. Database Sync Script

Scriptet har nu fix for `search_path`, men skal køres fra container hvor:
- MCP serverer er tilgængelige (gmail-mcp, calendar-mcp)
- Environment variables er sat korrekt
- Database connection virker

---

## 🎯 Næste Steps

### Priority 1: Fix Database Sync Script ✅
- [x] Tilføj dotenv config
- [x] Fix search_path i script
- [ ] Test sync fra container

### Priority 2: Start Gmail MCP Server
- [ ] Find eller start gmail-mcp container
- [ ] Verificer GMAIL_MCP_URL i .env.supabase
- [ ] Test connection fra friday-ai container

### Priority 3: Fix Inbound Email
- [ ] Opdater Dockerfile til at bruge npm package
- [ ] Eller byg custom index.js baseret på inbound-email docs
- [ ] Test webhook modtagelse

### Priority 4: Inbox Orchestrator Integration
- [ ] Dokumenter hvad inbox-orchestrator gør
- [ ] Se om den kan bruges til Gmail sync
- [ ] Integrer med email database

---

## 📝 Noter

### Email Flow:
1. **Gmail API** → Backend (via MCP) → Database
2. **SMTP Inbound** → inbound-email container → Webhook → Backend → Database
3. **Inbox Orchestrator** → Gmail/Calendar/Billy → ? (dokumenter funktionalitet)

### Database Schema:
- `emails` table: ✅ Ready
- `email_threads` table: ✅ Ready
- `attachments` table: ✅ Ready
- Enrichment: ✅ Auto-enrichment fra Billy

### Testing:
```bash
# Test database query:
docker exec friday-ai-container-supabase sh -c "cd /app && pnpm migrate:emails 1 10"

# Test webhook:
curl -X POST http://localhost:3000/api/inbound/email \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","to":"info@rendetalje.dk","subject":"Test","messageId":"test-123","text":"Test email"}'
```

---

**Last Updated:** 3. november 2025, 01:10

