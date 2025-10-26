# TekupVault Test Suite

AI-powered chat history archival system with semantic search capabilities.

## Hvad Tester Dette?

`test_tekupvault.py` tester hele TekupVault systemet:

### Core Features
1. **Chat Arkivering** - Gem hele samtaler med AI-genereret metadata
2. **Semantisk Søgning** - Find relevant indhold med vector similarity
3. **Code Extraction** - Udtræk kode snippets automatisk
4. **Artifact Management** - Gem beslutninger og konfigurationer
5. **Vector Embeddings** - Mock pgvector similarity search

## Kør Tests

```bash
# Kør alle tests
$env:PYTHONIOENCODING="utf-8"; python scripts/test_tekupvault.py

# Output:
# TEST 1: Archive Chat Session ✓
# TEST 2: Retrieve Context ✓
# TEST 3: Extract Code Snippets ✓
# TEST 4: Semantic Search Accuracy ✓
# TEST 5: Complete Workflow ✓
```

## Test Resultater

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
✓ TEST PASSED

... (4 more tests)

ALL TESTS PASSED!
```

## Features Testet

### 1. Chat Archival
- AI-genererede titler og summaries
- Automatisk tag extraction
- Code block detection
- Vector embedding generation
- Supabase storage (mocked)

### 2. Semantic Search
- Query embedding generation
- Cosine similarity calculation
- Ranked result ordering
- Context retrieval

### 3. Artifact Extraction
- Code snippet extraction
- Language detection
- Multi-language support (Python, TypeScript, Markdown, SQL, PowerShell)
- Metadata tagging

### 4. Search Accuracy
- Cross-session search
- Topic relevance
- Similarity scoring
- Result ranking

### 5. Complete Workflow
- Arkiver → Søg → Hent → Brug
- Real-world usage simulation
- Performance testing

## Mock Components

Testen bruger mock implementations for at teste logikken uden eksterne afhængigheder:

### MockEmbeddingService
- Genererer deterministiske vector embeddings (SHA256-based)
- 1536 dimensioner (matcher OpenAI ada-002)
- Cosine similarity beregning

### MockAIService
- Keyword-based summary generation
- Intelligent tag extraction
- Code block parsing
- Title generation

### MockSupabaseClient
- In-memory database
- Vector similarity search
- Session/embedding/artifact storage
- CRUD operations

## Data Models

```python
@dataclass
class ChatMessage:
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    index: int

@dataclass
class ChatArtifact:
    type: str  # code, decision, config, command, diagram
    title: str
    content: str
    language: str
    file_path: str
    tags: List[str]

@dataclass
class ChatSession:
    id: str
    title: str
    summary: str
    tags: List[str]
    messages: List[ChatMessage]
    artifacts: List[ChatArtifact]
    embedding_ids: List[str]
    message_count: int
```

## Næste Skridt

Efter succesfulde tests:

1. **Setup Supabase**
   ```bash
   # Opret konto på https://supabase.com
   # Aktivér pgvector extension
   # Kør database schema
   ```

2. **Implementer Real Services**
   - Skift Mock → Real Supabase client
   - Tilføj OpenAI embeddings eller lokal model
   - Integrer Llama 8B for summarization

3. **Deploy MCP Server**
   - Opret TypeScript/Python MCP server
   - Tilføj til Cursor/Jan AI konfiguration
   - Test med rigtige chats

4. **Production Ready**
   - Environment variables
   - Error handling
   - Rate limiting
   - Monitoring

## Integration med Projekt

TekupVault er designet til at integrere med:

- **Jan AI / Claude Desktop** - MCP protocol
- **Cursor IDE** - Built-in MCP support
- **Supabase** - PostgreSQL med pgvector
- **Ollama** - Local AI for summarization
- **OpenAI** - Optional embeddings API

## ROI

**Problem:** Glemmer løsninger og genopfinder hjulet

**Løsning:** Instant semantic search i chat historie

**Værdi:**
- 20 min/dag besparelse = 7 timer/måned
- 7 * 350 DKK = 2,450 DKK/måned
- Årlig ROI: 29,400 DKK

## Documentation

- **Full Guide:** [docs/guides/tekupvault-guide.md](../docs/guides/tekupvault-guide.md)
- **Database Schema:** Se `chat.md` line 2730+
- **Architecture:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Support

For spørgsmål eller problemer:
- Se full guide: `docs/guides/tekupvault-guide.md`
- Check test output for debugging
- Review mock implementations for logic

---

**Version:** 1.0.0  
**Status:** Test Suite Complete ✅  
**Next:** Production Implementation  
**Author:** TekUp Team

