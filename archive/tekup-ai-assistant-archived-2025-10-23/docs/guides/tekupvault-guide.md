# TekupVault Guide

**AI-powered chat history archival with semantic search**

---

## Hvad er TekupVault?

TekupVault er et intelligent chat historie arkiveringssystem der bruger AI og vector embeddings til at gøre dine samtaler søgbare og nyttige fremover.

### Hovedfunktioner

- **Automatisk Arkivering** - Gem hele chat sessioner med AI-genereret metadata
- **Semantisk Søgning** - Find relevant information fra tidligere samtaler
- **Artifact Extraction** - Udtr æk kode snippets, beslutninger, og konfigurationer
- **Vector Embeddings** - Brug pgvector i Supabase for hurtig similarity search
- **Smart Summaries** - AI-genererede resuméer og tags

---

## Arkitektur

```
┌─────────────────────┐
│  Chat Interface     │
│  (Jan AI / Claude)  │
└──────────┬──────────┘
           │
           ↓ MCP Protocol
┌─────────────────────┐
│  TekupVault MCP     │
│  - archive_chat     │
│  - retrieve_context │
│  - search_decisions │
└──────────┬──────────┘
           │
           ↓ HTTP API
┌─────────────────────┐
│  Supabase           │
│  - chat_sessions    │
│  - chat_embeddings  │
│  - chat_artifacts   │
│  - pgvector index   │
└─────────────────────┘
```

---

## Database Schema

TekupVault bruger Supabase med pgvector extension til vector similarity search.

### Chat Sessions

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  message_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)
);
```

### Chat Embeddings

```sql
CREATE TABLE chat_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI ada-002 dimensions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX ON chat_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

### Chat Artifacts

```sql
CREATE TABLE chat_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('code', 'decision', 'config', 'command', 'diagram')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  file_path TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## MCP Tools

### 1. archive_chat

Arkiver en chat session med automatisk AI-genereret metadata.

**Parameters:**
- `auto_summarize` (boolean) - Generer AI summary (default: true)
- `extract_code` (boolean) - Udtræk kode blocks (default: true)
- `extract_decisions` (boolean) - Udtræk arkitektur beslutninger (default: true)

**Process:**
1. Generer AI summary med Llama 8B
2. Udtræk artifacts (kode, beslutninger)
3. Generer vector embeddings
4. Gem i Supabase
5. Gem artifacts i `/docs/` folder

**Example:**
```typescript
// Archive current chat
await tekupvault.archive_chat({
  auto_summarize: true,
  extract_code: true,
  extract_decisions: true
});
```

### 2. retrieve_context

Hent relevant kontekst fra tidligere samtaler baseret på semantisk søgning.

**Parameters:**
- `query` (string, required) - Søgeforespørgsel
- `max_results` (number) - Maks antal resultater (default: 5)

**Process:**
1. Generer embedding for query
2. Søg med cosine similarity i pgvector
3. Returner rankerede resultater

**Example:**
```typescript
// Find relevant past conversations
const context = await tekupvault.retrieve_context({
  query: "Hvordan laver jeg en faktura i Billy.dk?",
  max_results: 3
});
```

### 3. search_decisions

Søg speciktificeret i arkitektur beslutninger (ADRs).

**Parameters:**
- `query` (string) - Søgeterm

**Example:**
```typescript
const decisions = await tekupvault.search_decisions({
  query: "MCP server architecture"
});
```

### 4. extract_code_snippets

Udtræk kode eksempler filtreret efter sprog.

**Parameters:**
- `language` (string, optional) - Programmeringssprog

**Example:**
```typescript
const pythonCode = await tekupvault.extract_code_snippets({
  language: "python"
});
```

---

## Installation

### 1. Setup Supabase

```bash
# Opret Supabase projekt på https://supabase.com
# Aktivér pgvector extension
```

I Supabase SQL Editor:
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Kør database schema (se ovenfor)
```

### 2. Installer Dependencies

```bash
npm install @supabase/supabase-js
npm install openai  # For embeddings
```

Eller brug lokal embedding model:
```bash
pip install sentence-transformers
```

### 3. Environment Variables

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# Eller brug lokal embedding model
USE_LOCAL_EMBEDDINGS=true
```

### 4. MCP Server Configuration

Tilføj til `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "tekupvault": {
      "command": "node",
      "args": ["./mcp-servers/tekupvault/dist/index.js"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

---

## Brugseksempler

### Arkiver en Samtale

```typescript
// Efter en produktiv coding session
You: "Arkiver denne samtale til TekupVault"

AI: "Arkiverer chat session..."
    [ARCHIVE] Archiving chat session...
    [AI] Generating summary: "MCP Server Implementation - 45 messages"
    [EXTRACT] Found 8 code snippets (TypeScript, Python)
    [EMBED] Generated 45 embeddings
    [STORE] Saved to Supabase
    ✓ Session archived with ID: abc-123-def
```

### Søg i Historie

```typescript
// Senere, i en ny samtale
You: "Hvordan implementerede vi Billy.dk API integration?"

AI: "Søger i TekupVault..."
    [SEARCH] Found 3 relevant messages:
    
    1. "Vi brugte MCP server pattern med HTTP client..."
       (Session: Billy Integration, Similarity: 0.92)
    
    2. "API key gemmes i .env file..."
       (Session: Billy Integration, Similarity: 0.87)
    
    3. "POST /invoices endpoint med body: {...}"
       (Session: Billy Integration, Similarity: 0.85)
```

### Find Kode Eksempler

```typescript
You: "Vis mig Python eksempler på MCP servers"

AI: "Her er 3 relevante eksempler fra tidligere samtaler:"
    
    1. mcp_web_scraper.py (Fra session: MCP Implementation)
    2. test_mcp_scraper.py (Fra session: Testing Guide)
    3. fetch_claude_share.py (Fra session: Web Scraping)
```

---

## Test Suite

Kør test suite for at validere funktionalitet:

```bash
# Kør alle tests
python scripts/test_tekupvault.py
```

### Test Output

```
================================================================================
                       TekupVault Test Suite                          
================================================================================

TEST 1: Archive Chat Session
[ARCHIVE] Archiving chat session to TekupVault...
   [AI] Generating AI summary...
   [EXTRACT] Extracting code snippets...
   [EMBED] Generating embeddings for 4 messages...
   [STORE] Storing in Supabase...
   [SUCCESS] Archived session
   [STATS] 4 messages, 1 artifacts, 1 tags
✓ TEST PASSED

TEST 2: Retrieve Context
[SEARCH] Searching TekupVault for: 'hvordan laver jeg en changelog?'
   [SUCCESS] Found 3 relevant messages
✓ TEST PASSED

TEST 3: Extract Code Snippets
   Found 1 markdown snippets
✓ TEST PASSED

TEST 4: Semantic Search Accuracy
   Found 3 sessions, 100% accuracy
✓ TEST PASSED

TEST 5: Complete Workflow
✓ TEST PASSED

================================================================================
ALL TESTS PASSED!
================================================================================
```

---

## Best Practices

### Hvornår Skal Man Arkivere?

✅ **Arkiver når:**
- Du har løst et komplekst problem
- Du har oprettet nyt kode eller arkitektur
- Du har truffet vigtige beslutninger
- Samtalen indeholder nyttig domain knowledge

❌ **Spring over når:**
- Trivielle spørgsmål
- Small talk
- Debugging uden løsning

### Optimering

**Embeddings:**
- Brug OpenAI ada-002 for bedst kvalitet (cost: $0.0001/1K tokens)
- Eller brug lokal model (sentence-transformers) for privacy

**Search:**
- Brug cosine similarity for vector search
- Filtrer resultater med metadata (tags, dates)
- Kombiner vector search med full-text search

**Storage:**
- Arkiver månedligt til cold storage
- Hold seneste 3 måneder i hot storage
- Brug compression for gamle chats

---

## ROI & Værdiskabelse

### Tidsbesparelser

```
Scenario: Find tidligere løsning
- Uden TekupVault: 15-30 min (søg i git, docs, manuelt)
- Med TekupVault: 30 sekunder (semantisk søgning)

Besparelse: ~20 min/dag = 7 timer/måned
Værdi: 7 * 350 DKK = 2,450 DKK/måned
```

### Knowledge Retention

- **Problem:** Glemmer løsninger efter 2-3 uger
- **Løsning:** Instant recall af tidligere samtaler
- **Værdi:** Undgå at løse samme problem flere gange

### Team Knowledge Base

- Del søgbar knowledge base med team
- Onboard nye udviklere hurtigere
- Document architectural decisions automatisk

---

## Fejlfinding

### Problem: Embeddings er for langsomme

**Løsning:**
```bash
# Brug batch processing
BATCH_SIZE=50 python scripts/generate_embeddings.py

# Eller kør async
USE_ASYNC=true python scripts/generate_embeddings.py
```

### Problem: Search resultater er ikke relevante

**Løsning:**
- Tjek embedding model (ada-002 vs local)
- Øg max_results parameter
- Filtrer med tags og metadata
- Kombiner med keyword search

### Problem: Supabase storage limits

**Løsning:**
```sql
-- Arkiver gamle sessions
UPDATE chat_sessions 
SET archived = true 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Slet meget gamle embeddings
DELETE FROM chat_embeddings 
WHERE session_id IN (
  SELECT id FROM chat_sessions WHERE archived = true
);
```

---

## Roadmap

### Version 1.0 (Current)
- ✅ Basic archival and retrieval
- ✅ Vector embeddings
- ✅ Code extraction
- ✅ Test suite

### Version 1.1 (Planned)
- [ ] Automatic archival after N messages
- [ ] GitHub integration (save to repo)
- [ ] Export to markdown/PDF
- [ ] Team sharing features

### Version 2.0 (Future)
- [ ] Multi-modal embeddings (images, diagrams)
- [ ] Automatic ADR generation
- [ ] Integration med Confluence/Notion
- [ ] Advanced analytics dashboard

---

## Support

- **Dokumentation:** [docs/guides/tekupvault-guide.md](./tekupvault-guide.md)
- **Test Suite:** `scripts/test_tekupvault.py`
- **Database Schema:** Se `chat.md` line 2730+
- **GitHub Issues:** [github.com/JonasAbde/tekup-ai-assistant/issues](https://github.com/JonasAbde/tekup-ai-assistant/issues)

---

**Sidst opdateret:** 2025-10-16  
**Version:** 1.0.0  
**Status:** Ready for Implementation

