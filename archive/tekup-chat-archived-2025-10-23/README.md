# Tekup AI Assistant 🤖

AI-powered chat assistant for the Tekup portfolio with integrated knowledge base powered by TekupVault.

## Features

✅ **ChatGPT-like Interface**
- Clean, modern UI similar to ChatGPT, Claude, and Copilot
- Real-time streaming responses
- Markdown + code syntax highlighting
- Multi-turn conversations with context

✅ **TekupVault Integration**
- Searches 1,063 documents from 8 repositories
- Semantic search with pgvector
- Automatic source citations
- Context-aware responses

✅ **Advanced Capabilities**
- Voice input (Danish language support)
- Code block copy functionality
- File attachments (planned)
- Chat history persistence
- Export conversations (planned)

✅ **Tekup-Specific**
- Knows TIER system (1-5 repository prioritization)
- Understands strategic context
- Prevents costly mistakes (e.g., deleting valuable repos)
- Follows Tekup coding standards

## Tech Stack

- **Frontend:** Next.js 15, React 18, TailwindCSS 4
- **Backend:** Next.js API Routes, Server-Sent Events
- **AI:** OpenAI GPT-4o, streaming
- **Knowledge Base:** TekupVault RAG API
- **Database:** Supabase (PostgreSQL)
- **Validation:** Zod schemas
- **Markdown:** react-markdown + remark-gfm
- **Code Highlighting:** react-syntax-highlighter

## Setup

### 1. Prerequisites

```bash
# Required
- Node.js 18+
- pnpm (or npm)
- OpenAI API key
- Supabase project
- TekupVault running
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o

# TekupVault
TEKUPVAULT_API_URL=https://tekupvault.onrender.com/api
TEKUPVAULT_API_KEY=your-tekupvault-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Database Setup

Run this SQL in Supabase:

```sql
-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB,
  code_blocks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_updated ON chat_sessions(updated_at DESC);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at ASC);
```

### 4. Install & Run

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Chat

1. Type your question in the input box
2. Press Enter or click Send
3. Watch the AI response stream in real-time
4. Sources are automatically cited below responses

### Voice Input

1. Click the microphone icon
2. Allow browser microphone access
3. Speak in Danish
4. Your speech is converted to text

### Example Queries

**Code Help:**
```
How do I create an invoice in Billy.dk?
```

**Strategic Decisions:**
```
Should I delete Tekup-org to save disk space?
```

**Cross-Repo Search:**
```
Where is AgentScope implemented?
```

**Daily Planning:**
```
What should I work on today?
```

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  - /api/chat    │
│  - /api/sessions│
│  - /api/messages│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ OpenAI  │ │  TekupVault  │
│  GPT-4o │ │  RAG Search  │
└─────────┘ └──────────────┘
    │              │
    └──────┬───────┘
           ▼
    ┌─────────────┐
    │  Supabase   │
    │ (Chat DB)   │
    └─────────────┘
```

## Project Structure

```
tekup-chat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # Streaming chat endpoint
│   │   │   ├── sessions/route.ts  # Session management
│   │   │   └── messages/route.ts  # Message history
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main chat UI
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx     # Main chat container
│   │   │   ├── MessageBubble.tsx  # Message rendering
│   │   │   └── MessageInput.tsx   # Input with voice
│   │   └── sidebar/
│   │       └── SessionList.tsx    # Chat history sidebar
│   └── lib/
│       ├── openai.ts              # OpenAI integration
│       ├── tekupvault.ts          # TekupVault API client
│       └── supabase.ts            # Database operations
├── .env.example
├── package.json
└── README.md
```

## Testing

### Test Scenarios

See `AI_ASSISTANT_USER_TEST_SCENARIOS.md` for comprehensive test cases.

**Quick Tests:**

1. **Knowledge Retrieval** (KR-001)
   - Query: "How do I create an invoice in Billy.dk?"
   - Expected: Code example + file citation in <3s

2. **Strategic Decision** (SD-002)
   - Query: "Can I delete Tekup-org?"
   - Expected: WARNING about €360K value + extraction plan

3. **Multi-Turn** (MT-001)
   - Turn 1: "Help me add MCP tool"
   - Turn 2: "How do I test it?"
   - Expected: Context maintained across turns

### Manual Testing

```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","title":"Test Chat"}'

# Test TekupVault integration
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<uuid>","message":"Test query","messages":[]}'
```

## Roadmap

### Phase 1: MVP ✅ (Week 1)
- [x] Core chat interface
- [x] Streaming responses
- [x] TekupVault integration
- [x] Message persistence
- [x] Session management

### Phase 2: Enhanced Features (Week 2)
- [ ] File upload & analysis
- [ ] Improved voice input (Whisper API)
- [ ] Code execution sandbox
- [ ] Export conversations (Markdown/PDF)

### Phase 3: Advanced (Week 3)
- [ ] Chat search
- [ ] Smart suggestions
- [ ] Usage analytics
- [ ] Team collaboration

### Phase 4: Production (Week 4)
- [ ] Authentication (NextAuth)
- [ ] User management
- [ ] Rate limiting
- [ ] Production deployment

## Comparison to Market Leaders

| Feature | Tekup AI | ChatGPT | Claude | Copilot |
|---------|----------|---------|--------|---------|
| **Tekup Knowledge** | ✅ 1,063 docs | ❌ | ❌ | ❌ |
| **Multi-Repo Context** | ✅ 8 repos | ❌ | Partial | ❌ |
| **Strategic Awareness** | ✅ TIER system | ❌ | ❌ | ❌ |
| **Code Citations** | ✅ File:line | Partial | Partial | ✅ |
| **Streaming** | ✅ SSE | ✅ | ✅ | ❌ |
| **Voice Input** | ✅ Danish | ❌ | ❌ | ❌ |
| **Cost/Month** | ~$87-105 | $25 | $20 | $10 |

**Unique Advantages:**
- Only solution with full Tekup portfolio knowledge
- Prevents costly mistakes (e.g., €360K Tekup-org deletion)
- Enforces Tekup coding standards
- Strategic decision support

## Troubleshooting

### Issue: Streaming not working
```bash
# Check API route logs
# Verify OpenAI API key
# Ensure fetch() supports streaming
```

### Issue: TekupVault search returns no results
```bash
# Verify TekupVault is running
curl https://tekupvault.onrender.com/api/health

# Check API key
echo $TEKUPVAULT_API_KEY

# Test search directly
curl -X POST https://tekupvault.onrender.com/api/search \
  -H "X-API-Key: $TEKUPVAULT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":5}'
```

### Issue: Voice input not working
```bash
# Requires HTTPS in production (or localhost for dev)
# Chrome/Edge only (uses webkitSpeechRecognition)
# Allow microphone permission in browser
```

## Contributing

1. Follow Tekup coding standards
2. Use TypeScript strict mode
3. Validate with Zod
4. Add tests for new features
5. Update documentation

## License

Proprietary - Tekup Portfolio

## Contact

Jonas Abde - Portfolio Owner

---

**Status:** MVP Complete ✅  
**Version:** 1.0.0  
**Last Updated:** October 18, 2025
