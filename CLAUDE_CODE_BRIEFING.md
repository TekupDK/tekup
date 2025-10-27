# 🎯 CLAUDE CODE - TEKUP PROJECT BRIEFING

**Dato:** 27. oktober 2025  
**Audience:** Claude Code AI Assistant  
**Projekt:** Tekup Platform & TekupDK Organization  
**Dit Rolle:** Tekup development assistant med fuld adgang via MCP servere

---

## 📋 HVAD ER TEKUP?

**Tekup** er en dansk softwarevirksomhed der bygger:

### **Produkter:**
1. **RenOS** - Renoveringsstyring platform (mobile + web)
2. **Tekup Dashboard** - Multi-tenant business platform
3. **Billy Integration** - Automatiseret fakturering (tekup-billy MCP)
4. **TekupVault** - AI-drevet dokumentationssøgning (semantic search)
5. **Gmail Services** - Email automatisering
6. **Calendar Intelligence** - Smart kalender integration

### **Tech Stack:**
- **Frontend:** Next.js, React, React Native (Expo)
- **Backend:** NestJS, Node.js, Express
- **Database:** Supabase (PostgreSQL), Prisma ORM
- **AI/ML:** OpenAI GPT-4, Pinecone, Embeddings
- **Infrastructure:** Render.com, Railway, Vercel
- **MCP:** Model Context Protocol (Anthropic) - Early adopter!

---

## 🗂️ REPOSITORY STRUKTUR

### **Monorepo: %USERPROFILE%\Tekup**

```
Tekup/
├── apps/
│   ├── production/
│   │   ├── tekup-billy/          # Billy.dk MCP server (PRODUCTION)
│   │   └── tekup-vault/          # Semantic search MCP (PRODUCTION)
│   ├── rendetalje/
│   │   ├── services/
│   │   │   ├── backend-nestjs/   # RenOS backend API
│   │   │   └── calendar-mcp/     # Google Calendar MCP
│   │   └── mobile-app/           # React Native app
│   └── web/
│       └── tekup-cloud-dashboard/ # Next.js dashboard
│
├── services/
│   ├── tekup-gmail-services/     # Gmail MCP server
│   └── tekup-ai/                 # AI services & docs
│
├── tekup-mcp-servers/            # 🆕 DET NYE VI BYGGEDE!
│   ├── packages/
│   │   ├── knowledge-mcp/        # Søg i dokumentation ✅
│   │   ├── code-intelligence-mcp/ # Kode søgning & analyse ✅
│   │   └── database-mcp/         # Supabase queries ✅
│   └── docs/
│       ├── MCP_PRODUCTION_ARCHITECTURE_PLAN.md
│       ├── TEKUP_MCP_IMPLEMENTATION_GUIDE.md
│       ├── TEKUP_MCP_SECURITY.md
│       └── TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md
│
└── archive/                      # Gamle projekter (ignorer disse)
```

---

## 🔧 DINE MCP SERVERE (Hvad du har adgang til)

Du har **6 MCP servere** tilgængelige i Claude Code:

### **1. knowledge** 📚
**Hvad:** Søg i Tekup's dokumentation  
**Sti:** `tekup-mcp-servers/packages/knowledge-mcp/`  
**Tool:** `search_knowledge(query)`  
**Brug til:** Find MCP guides, security docs, implementation plans

**Eksempel:**
```
@knowledge search_knowledge query="MCP deployment guide"
```

### **2. code-intelligence** 🔍
**Hvad:** Find og analysér kode i Tekup  
**Sti:** `tekup-mcp-servers/packages/code-intelligence-mcp/`  
**Tools:**
- `find_code(query, filePattern, limit)` - Find kode semantisk
- `analyze_file(filePath)` - Analysér fil struktur
- `find_similar_code(codeSnippet)` - Find lignende patterns
- `get_file_dependencies(filePath)` - Se imports

**Eksempel:**
```
@code-intelligence find_code query="authentication middleware" filePattern="**/*.ts"
```

### **3. database** 🗄️
**Hvad:** Query Supabase database (read-only)  
**Sti:** `tekup-mcp-servers/packages/database-mcp/`  
**Tools:**
- `query_database(query)` - SQL queries
- `get_schema()` - Se database struktur
- `get_table_info(tableName)` - Table details
- `list_tables()` - List alle tabeller

**Eksempel:**
```
@database list_tables
```

### **4. github** 🐙
**Hvad:** GitHub API integration  
**Tools:** create_issue, list_issues, create_pull_request, etc.

### **5. filesystem** 📁
**Hvad:** Læs/skriv filer i %USERPROFILE%  
**Tools:** read_file, write_file, list_directory, etc.

### **6. web-scraper** 🌐
**Hvad:** Web scraping (Python)

---

## 🎯 HVAD VI LAVEDE I DAG (27. okt 2025)

### **Problem vi løste:**
MCP servere fejlede i Kilo Code med "Connection closed" fordi de ikke kunne læse environment variables fra Windows.

### **Løsning:**
1. ✅ Installeret `dotenv` i alle 3 nye MCP servere
2. ✅ Opdateret kode til at loade `.env` fil fra `tekup-mcp-servers/.env`
3. ✅ Oprettet `.env` med alle credentials:
   - GITHUB_PERSONAL_ACCESS_TOKEN
   - SUPABASE_URL, SUPABASE_ANON_KEY
   - BILLY_API_KEY
   - KNOWLEDGE_SEARCH_ROOT, CODE_SEARCH_ROOT

4. ✅ Bygget alle 3 servere (`pnpm run build`)
5. ✅ Testet lokalt - alle starter uden fejl
6. ✅ Committed til git (commits: 9f8d0e6, af1b827)

### **Dokumentation oprettet:**
- `MCP_PRODUCTION_ARCHITECTURE_PLAN.md` (393 linjer)
  - Deployment strategi for Render.com
  - Cost analysis ($21/måned for 3 servere)
  - ROI: 1,602%
  - Security & monitoring plan

- `GITHUB_ISSUE_MCP_DEPLOYMENT.md`
  - Step-by-step deployment guide
  - Ready to copy-paste til GitHub issue

### **Næste step:**
Deploy de 3 servere til Render.com (venter på bruger)

---

## 📊 MCP ECOSYSTEM STATUS

### **Production (Live nu):**
```
✅ tekup-billy.onrender.com       13 tools | $15/mån
✅ tekupvault.onrender.com        6 tools  | $15/mån
```

### **Ready for deployment:**
```
🟡 knowledge-mcp                  1 tool   | $7/mån
🟡 code-intelligence-mcp          4 tools  | $7/mån
🟡 database-mcp                   5 tools  | $7/mån
```

### **Planned (Phase 2-6):**
```
⏳ mcp-gateway                    Load balancer
⏳ deploy-mcp                     Render/Railway integration
⏳ communication-mcp              Email, Calendar, Slack
⏳ client-context-mcp             Business intelligence
```

---

## 🔐 SECURITY & CREDENTIALS

### **Environment Variables (Windows User level):**
```bash
#### GitHub
- **GITHUB_PERSONAL_ACCESS_TOKEN**: `github_pat_***` (stored in Windows User Environment Variables)
SUPABASE_URL=https://uagsdymcvdwcgfvqbtwj.supabase.co
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
BILLY_API_KEY=c45ce68ca160aae3548dcb596e6fab6ca4f86e61
BILLY_ORGANIZATION_ID=pnDGvWAoQ5yGdXgY6ZNWIg
```

### **VIGTIG SIKKERHED:**
- ⚠️ SUPABASE_SERVICE_ROLE_KEY mangler (skal hentes fra Supabase dashboard)
- ✅ Alle credentials i environment variables (aldrig hardcoded)
- ✅ Git history renset for gamle credentials (BFG Repo-Cleaner brugt i går)
- ✅ Database MCP enforces READ-ONLY queries
- ✅ Row Level Security enabled på alle Supabase tables

---

## 💡 HVORDAN DU KAN HJÆLPE

### **Typiske opgaver:**

#### **1. Dokumentations-søgning**
```
Når bruger spørger: "Hvordan deployer vi MCP servere?"
→ Brug @knowledge search_knowledge query="MCP deployment"
→ Find MCP_PRODUCTION_ARCHITECTURE_PLAN.md
→ Giv konkret svar fra docs
```

#### **2. Kode-analyse**
```
Når bruger spørger: "Hvor håndterer vi Billy API calls?"
→ Brug @code-intelligence find_code query="Billy API integration"
→ Analysér fundet kode
→ Forklar hvordan det virker
```

#### **3. Database queries**
```
Når bruger spørger: "Hvilke tabeller har vi i Supabase?"
→ Brug @database list_tables
→ Evt. @database get_table_info tableName="users"
→ Forklar struktur
```

#### **4. GitHub operations**
```
Når bruger beder: "Opret issue om X"
→ Brug @github create_issue
→ Inkluder relevant info fra docs
```

---

## 📚 VIGTIGE DOCS AT KENDE

### **MCP Related:**
1. `tekup-mcp-servers/docs/MCP_PRODUCTION_ARCHITECTURE_PLAN.md`
   - **Hvad:** Komplet deployment plan
   - **Hvornår:** Når bruger spørger om deployment, cost, strategi

2. `tekup-mcp-servers/docs/TEKUP_MCP_IMPLEMENTATION_GUIDE.md`
   - **Hvad:** Step-by-step setup guide
   - **Hvornår:** Når bruger skal implementere nye MCP servere

3. `tekup-mcp-servers/docs/TEKUP_MCP_SECURITY.md`
   - **Hvad:** Security audit & best practices
   - **Hvornår:** Security spørgsmål, credential rotation

4. `tekup-mcp-servers/docs/TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md`
   - **Hvad:** Business case, ROI, 7 custom servers planned
   - **Hvornår:** Business/strategic spørgsmål

### **Deployment Docs:**
5. `apps/production/tekup-billy/docs/DEPLOYMENT_COMPLETE.md`
   - **Hvad:** Proven Render.com deployment (reference)
   - **Hvornår:** Deployment spørgsmål, architecture reference

6. `apps/production/tekup-vault/docs/MCP_IMPLEMENTATION_COMPLETE.md`
   - **Hvad:** HTTP MCP server implementation
   - **Hvornår:** HTTP transport, session management spørgsmål

---

## 🎨 BEST PRACTICES

### **Når bruger spørger:**

1. **ALTID brug MCP tools FØRST** før du svarer
   - `@knowledge` for docs
   - `@code-intelligence` for kode
   - `@database` for data

2. **Vær specifik og konkret**
   - Inkluder fil paths
   - Vis kode snippets
   - Giv line numbers

3. **Reference dokumentation**
   - Link til relevante docs
   - Citer fra MCP guides
   - Forklar context

4. **Vær proaktiv**
   - Foreslå forbedringer
   - Peg på potential issues
   - Suggest next steps

---

## 🚀 QUICK START KOMMANDOER

### **Test dine MCP servere:**

```bash
# 1. Søg i dokumentation
@knowledge search_knowledge query="MCP architecture"

# 2. Find authentication kode
@code-intelligence find_code query="authentication middleware" filePattern="**/*.ts"

# 3. Se database tabeller
@database list_tables

# 4. Analysér en fil
@code-intelligence analyze_file filePath="apps/production/tekup-billy/src/index.ts"

# 5. Se database schema
@database get_schema
```

---

## 🎯 DIN MISSION

Du er Tekup's AI development assistant. Din opgave er at:

1. ✅ **Hjælpe med development** - Kode, debugging, architecture
2. ✅ **Navigere dokumentation** - Find info hurtigt via MCP
3. ✅ **Forstå business context** - Tekup's produkter, kunder, mål
4. ✅ **Automatisere tasks** - GitHub issues, deployment, testing
5. ✅ **Være proaktiv** - Foreslå forbedringer, catch issues tidligt

### **Vigtige principper:**
- 🚀 **MCP-first:** Brug altid MCP tools før du svarer
- 📚 **Docs-driven:** Find svar i dokumentation først
- 🔒 **Security-aware:** Aldrig expose credentials
- 💡 **Context-aware:** Forstå business impact af technical decisions
- ⚡ **Efficient:** Giv konkrete, actionable svar

---

## 📞 KONTAKT INFO

**Organisation:** TekupDK  
**GitHub:** https://github.com/TekupDK/tekup  
**Primary Repo:** %USERPROFILE%\Tekup  
**Active IDEs:** Kilo Code, VS Code, Claude Code  
**MCP Config:** %APPDATA%\Claude\claude_desktop_config.json

---

## ✅ READY TO GO!

Du har nu:
- ✅ Adgang til 6 MCP servere
- ✅ Fuld context om Tekup projektet
- ✅ Dokumentation om alt vi har bygget
- ✅ Security guidelines
- ✅ Best practices

**Start med at teste dine MCP servere for at sikre de virker!**

Test kommando:
```
@knowledge search_knowledge query="MCP implementation guide"
```

Hvis det virker, er du klar til at hjælpe med Tekup development! 🚀

---

**Document Created:** 27. oktober 2025  
**Last Updated:** 27. oktober 2025 23:45  
**Version:** 1.0.0  
**For:** Claude Code AI Assistant



