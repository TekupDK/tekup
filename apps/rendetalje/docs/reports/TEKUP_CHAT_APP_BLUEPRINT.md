# 🤖 Tekup AI Assistant - Chat App Blueprint

**Dato:** 18. Oktober 2025  
**Type:** Standalone Chat Application (som ChatGPT/Claude/Copilot)  
**Status:** Design & Implementation Plan

---

## 🎯 Vision

**Tekup Chat** = ChatGPT-lignende interface + TekupVault knowledge + Lokale modeller + Business integrations

### Hvad Det Bliver

```yaml
Interface: Web app (React/Next.js) + Desktop app (Tauri optional)
Backend: Node.js/NestJS med streaming support
AI Engine: Hybrid (lokal Ollama + cloud OpenAI/Claude fallback)
Knowledge: TekupVault RAG integration
Features: Voice, file upload, code highlighting, eksport
```

---

## 🏗️ Eksisterende Foundation

### ✅ Hvad I HAR Allerede (Fra Tekup Google AI/renos)

```typescript
// Chat Controller ✅
src/controllers/chatController.ts
- Intent classification
- Task planning & execution
- Session management
- Friday AI integration
- History tracking

// Streaming ✅
src/controllers/chatStreamController.ts
- SSE (Server-Sent Events)
- Real-time streaming
- OpenAI integration
- Chunked responses

// AI Engine ✅
src/ai/friday.ts
- System prompts (dansk)
- Multi-intent handling
- Context awareness
- LLM provider abstraction
```

### 📊 Gap Analysis Findings

**Fra `AI_CHAT_GAP_ANALYSIS.md`:**

```yaml
✅ Works:
  - Core chat functionality
  - Session management
  - Markdown rendering
  - Quick actions
  - Auto-scroll

❌ Missing Critical Features:
  P0: Full LLM integration (5-7 timer)
  P0: Real streaming (3-4 timer)
  P1: Voice input (2 timer)
  P1: File upload (3-4 timer)
  P2: Export/search (3 timer)
  P3: Dark mode, reactions, etc. (8-10 timer)

Total MVP: 10-13 timer
```

---

## 🎨 UI/UX Design

### Interface Inspiration Matrix

| Feature | ChatGPT | Claude | Copilot | Tekup (Target) |
|---------|---------|--------|---------|----------------|
| **Layout** | Sidebar + Chat | Sidebar + Chat | Inline | Sidebar + Chat ✅ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ (implement) |
| **Voice** | ✅ | ❌ | ❌ | ✅ (P1) |
| **File Upload** | ✅ | ✅ | ❌ | ✅ (P1) |
| **Code Highlight** | ✅ | ✅ | ✅ | ✅ (add) |
| **Dark Mode** | ✅ | ✅ | ✅ | ✅ (P3) |
| **Export** | ❌ | ❌ | ❌ | ✅ (unique!) |
| **Knowledge RAG** | ❌ | ❌ | ❌ | ✅ (TekupVault!) |

### Component Structure

```
/app
├── layout.tsx (global layout)
├── page.tsx (landing)
└── chat/
    ├── page.tsx (main chat interface)
    ├── components/
    │   ├── ChatSidebar.tsx (conversations)
    │   ├── ChatWindow.tsx (messages)
    │   ├── MessageInput.tsx (input + voice + files)
    │   ├── MessageBubble.tsx (user/assistant)
    │   ├── CodeBlock.tsx (syntax highlighting)
    │   ├── StreamingIndicator.tsx (typing dots)
    │   └── QuickActions.tsx (shortcuts)
    └── hooks/
        ├── useChat.ts (chat logic)
        ├── useStreaming.ts (SSE connection)
        └── useVoice.ts (speech recognition)
```

---

## 🔧 Technical Architecture

### Full Stack

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 15)           │
│  - React 18 + TypeScript                │
│  - Tailwind CSS 4                       │
│  - shadcn/ui components                 │
│  - SSE client (EventSource)             │
└──────────────┬──────────────────────────┘
               │ REST + SSE
┌──────────────┴──────────────────────────┐
│      Backend (NestJS/Express)           │
│  - Chat endpoints (/chat, /stream)      │
│  - File upload (multer)                 │
│  - Session management                   │
│  - WebSocket (optional P3)              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┬────────────────┐
    │                     │                │
┌───┴────────┐   ┌────────┴─────┐  ┌──────┴────────┐
│ TekupVault │   │  LLM Layer   │  │  Integrations │
│   RAG API  │   │ OpenAI/Ollama│  │  Billy/RenOS  │
└────────────┘   └──────────────┘  └───────────────┘
```

### Key Technologies

```yaml
Frontend:
  - Next.js 15.5.2 (App Router)
  - React 18.3
  - TypeScript 5.6.3
  - Tailwind CSS 4.1.1
  - shadcn/ui components
  - React Markdown
  - Prism.js (code highlighting)
  - react-speech-recognition (voice)

Backend:
  - NestJS 10 (anbefalet) eller Express
  - TypeScript 5.6
  - Zod validation
  - multer (file upload)
  - ws eller socket.io (WebSocket P3)
  
AI/ML:
  - OpenAI SDK (streaming)
  - Ollama (local models optional)
  - TekupVault client SDK
  
Database:
  - Supabase (sessions, history)
  - Redis (optional caching)
```

---

## 📦 Implementation Roadmap

### Phase 1: MVP Foundation (Uge 1 - 10 timer)

**Goal:** Grundlæggende chat der virker

```yaml
Backend:
  ✅ Repurpose existing chatController.ts
  ✅ Enable streaming (chatStreamController.ts)
  ✅ TekupVault integration
  🆕 File upload endpoint

Frontend:
  🆕 Next.js app setup
  🆕 ChatWindow component
  🆕 MessageBubble component
  🆕 Streaming integration
  🆕 Basic styling (Tailwind)

Testing:
  ✅ Test streaming
  ✅ Test TekupVault search
  ✅ End-to-end flow
```

**Deliverables:**
- Working chat med streaming
- TekupVault knowledge search
- Basic UI (clean, functional)

---

### Phase 2: Power Features (Uge 2 - 6 timer)

**Goal:** Voice + Files

```yaml
Voice Input:
  - react-speech-recognition setup
  - Mic button component
  - Browser compatibility
  - Dansk language support

File Upload:
  - Frontend: File picker UI
  - Backend: Multer middleware
  - Support: PDF, images, docs
  - Preview: Show uploaded files

Code Highlighting:
  - Prism.js integration
  - Language detection
  - Copy button on code blocks
```

**Deliverables:**
- Voice-to-text input
- File attachment support
- Syntax highlighted code

---

### Phase 3: Productivity (Uge 3 - 4 timer)

**Goal:** Export + Search

```yaml
Export:
  - JSON export
  - Markdown export
  - TXT export
  - Share link (optional)

Search:
  - Message search bar
  - Highlight results
  - Jump to message
  - Filter by date/role

Sidebar:
  - Conversation list
  - New chat button
  - Rename conversations
  - Delete conversations
```

**Deliverables:**
- Exportable chat history
- Searchable messages
- Multi-conversation management

---

### Phase 4: Polish (Uge 4 - 6 timer)

**Goal:** Professional finish

```yaml
UI/UX:
  - Dark mode toggle
  - Custom themes
  - Mobile responsive
  - Keyboard shortcuts

Advanced:
  - Message reactions (👍/👎)
  - Code execution (sandbox)
  - Plugin system
  - Multi-modal (images in chat)
```

---

## 💻 Code Examples

### 1. Streaming Hook

```typescript
// hooks/useStreaming.ts
import { useState, useEffect } from 'react';

interface StreamingMessage {
  content: string;
  isComplete: boolean;
}

export function useStreaming(apiUrl: string) {
  const [message, setMessage] = useState<StreamingMessage>({
    content: '',
    isComplete: false
  });

  const stream = async (prompt: string) => {
    const response = await fetch(`${apiUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        setMessage(prev => ({ ...prev, isComplete: true }));
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.content) {
            setMessage(prev => ({
              content: prev.content + data.content,
              isComplete: false
            }));
          }
        }
      }
    }
  };

  return { message, stream };
}
```

### 2. Voice Input Component

```typescript
// components/VoiceInput.tsx
import { Mic, MicOff } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ language: 'da-DK', continuous: true });
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <button
      onClick={listening ? SpeechRecognition.stopListening : startListening}
      className={cn(
        "p-2 rounded-lg transition-colors",
        listening ? "bg-red-500 text-white" : "bg-gray-200"
      )}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
```

### 3. TekupVault Integration

```typescript
// lib/tekupvault.ts
export async function searchKnowledge(query: string, limit = 5) {
  const response = await fetch('https://tekupvault.onrender.com/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TEKUPVAULT_API_KEY!
    },
    body: JSON.stringify({ query, limit, threshold: 0.7 })
  });

  const data = await response.json();
  return data.results;
}

// In chat endpoint
export async function enrichPromptWithKnowledge(userMessage: string) {
  const relevantDocs = await searchKnowledge(userMessage);
  
  const context = relevantDocs
    .map(doc => `[${doc.document.repository}/${doc.document.path}]\n${doc.document.content}`)
    .join('\n\n');

  return `Context fra Tekup documentation:\n\n${context}\n\nBruger spørgsmål: ${userMessage}`;
}
```

---

## 🎨 UI Mockup (Text-Based)

```
┌─────────────────────────────────────────────────────────────┐
│  [☰] Tekup AI Assistant              [🔍] [⚙️] [👤]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  💬 New conversation about TekupVault                        │
│  📝 Billy.dk invoice help                                    │
│  🎨 Design system extraction                                 │
│  [+ Ny samtale]                                              │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 Hvordan laver jeg en faktura i Billy.dk?                │
│                                                              │
│  🤖 [Søger i TekupVault...]                                 │
│                                                              │
│  🤖 Baseret på dokumentation fra Tekup-Billy:               │
│                                                              │
│     ```typescript                                            │
│     // POST /invoices endpoint                              │
│     const invoice = await fetch('...', {                    │
│       method: 'POST',                                        │
│       body: JSON.stringify({ ... })                         │
│     });                                                      │
│     ```                                                      │
│                                                              │
│     Kilde: JonasAbde/Tekup-Billy/docs/API_REFERENCE.md     │
│                                                              │
│     [📋 Copy] [👍] [👎]                                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [📎] [🎤] │ Type a message...                │ [➤]         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Success Metrics

### MVP Success Criteria

```yaml
Functional:
  ✅ Chat sends & receives messages
  ✅ Streaming works smoothly
  ✅ TekupVault returns relevant docs
  ✅ Code blocks are highlighted
  ✅ Mobile responsive

Performance:
  ✅ First response < 2 seconds
  ✅ Streaming latency < 500ms
  ✅ TekupVault query < 1 second
  ✅ No memory leaks on long sessions

UX:
  ✅ Intuitive for non-technical users
  ✅ Fast keyboard navigation
  ✅ Clear loading states
  ✅ Error messages are helpful
```

### Business KPIs

```yaml
Usage:
  - 10+ queries/dag per user
  - 80%+ user satisfaction
  - < 5% error rate

Value:
  - 30 min saved/dag (dokumentation lookup)
  - Faster onboarding (new team members)
  - Centralized knowledge access

Cost:
  - < $100/måned (hosting + API calls)
  - Self-hosted option (Ollama)
```

---

## 🚀 Deployment Strategy

### Infrastructure

```yaml
Frontend:
  - Vercel (anbefalet) eller Render.com
  - Env: NEXT_PUBLIC_API_URL
  - Auto-deploy from GitHub main

Backend:
  - Render.com (existing setup)
  - Env: OPENAI_API_KEY, TEKUPVAULT_API_KEY
  - Worker: Background jobs

Database:
  - Supabase (existing)
  - Tables: chat_sessions, messages, files
```

### Continuous Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy Tekup Chat

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - uses: vercel/actions@v1
  
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - uses: render/deploy@v1
```

---

## 🎯 Next Steps - START HER!

### Uge 1: Foundation

**Dag 1-2: Project Setup**
```bash
# Create Next.js app
npx create-next-app@latest tekup-chat --typescript --tailwind --app

cd tekup-chat
npm install @supabase/supabase-js zod nanoid lucide-react
npm install react-markdown remark-gfm prism-react-renderer

# Backend (reuse existing)
cd ../tekup-google-ai
# Review chatController.ts & chatStreamController.ts
```

**Dag 3-4: Core Chat**
- Build ChatWindow component
- Integrate streaming
- Connect TekupVault

**Dag 5: Testing**
- E2E test
- Performance test
- Bug fixes

---

## 📚 Resources & Links

### Documentation
- Next.js Docs: https://nextjs.org/docs
- SSE Tutorial: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- React Speech Recognition: https://github.com/JamesBrill/react-speech-recognition
- Prism.js: https://prismjs.com/

### Internal
- TekupVault API: `c:\Users\empir\TekupVault\README.md`
- Existing Chat: `c:\Users\empir\Tekup Google AI\src\controllers\`
- Gap Analysis: `c:\Users\empir\Tekup Google AI\docs\planning\AI_CHAT_GAP_ANALYSIS.md`

---

**Oprettet:** 18. Oktober 2025  
**Næste Review:** Når MVP er deployed  
**Status:** ✅ Ready to Build
