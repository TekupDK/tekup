# Friday AI Frontend Integration Guide

## 🎯 Oversigt

Dette dokument forklarer hvordan end-brugeren kommunikerer med Friday AI gennem RendetaljeOS frontend og hvordan systemet er opbygget.

## 📊 Nuværende Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    END-BRUGER (Browser)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP POST /api/v1/ai-friday/chat
                       │ (med JWT authentication)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Frontend Next.js (RendetaljeOS)                    │
│  - Chat Interface Component                                 │
│  - Voice Input/Output                                        │
│  - Session Management UI                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP POST med context
                       │ { message, sessionId?, context: {...} }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      Backend NestJS (backend-nestjs)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AiFridayController                                │    │
│  │  - POST /api/v1/ai-friday/chat                     │    │
│  │  - POST /api/v1/ai-friday/chat/stream              │    │
│  │  - POST /api/v1/ai-friday/voice/transcribe         │    │
│  │  - GET  /api/v1/ai-friday/sessions                 │    │
│  │  - etc. (12 endpoints total)                       │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼─────────────────────────────────┐    │
│  │  AiFridayService                                   │    │
│  │  - sendMessage()                                   │    │
│  │  - streamMessage()                                 │    │
│  │  - buildContextualPrompt()                         │    │
│  │  - processActions()                                │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼─────────────────────────────────┐    │
│  │  ChatSessionsService                                │    │
│  │  - createSession()                                 │    │
│  │  - getSession()                                    │    │
│  │  - addMessage()                                     │    │
│  │  - getConversationHistory()                        │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ HTTP POST http://localhost:3011/chat
                      │ (Environment: AI_FRIDAY_URL)
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│      Inbox Orchestrator (inbox-orchestrator)                │
│      Port: 3011                                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  POST /chat                                        │    │
│  │  - Intent Detection                                │    │
│  │  - Memory Enforcement (24 memories)                │    │
│  │  - Email Search (MEMORY_7)                         │    │
│  │  - Calendar Integration                            │    │
│  │  - Lead Parsing                                    │    │
│  │  - Response Generation (Gemini AI)                  │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼─────────────────────────────────┐    │
│  │  Response:                                        │    │
│  │  {                                                 │    │
│  │    reply: "...",                                   │    │
│  │    actions: [...],                                 │    │
│  │    metrics: { intent, tokens, latency }           │    │
│  │  }                                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ (via adapters)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│      External Services                                       │
│  - Google MCP (Gmail + Calendar)                            │
│  - Gemini AI (GoogleGenerativeAI)                           │
│  - Billy.dk (via MCP)                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Konfiguration

### Backend Configuration (backend-nestjs)

For at backend-nestjs kan kalde inbox-orchestrator, skal følgende environment variables sættes:

```bash
# .env file
AI_FRIDAY_URL=http://localhost:3011  # Inbox Orchestrator URL
AI_FRIDAY_API_KEY=optional-api-key  # Optional (ikke brugt endnu)
ENABLE_AI_FRIDAY=true
```

**VIGTIGT:** Backend `AiFridayService` sender requests i dette format:
```typescript
POST http://localhost:3011/chat
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "context": { ... },
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Men** inbox-orchestrator forventer:
```typescript
POST http://localhost:3011/chat
{
  "message": "Hvad har vi fået af nye leads i dag?"
}
```

**⚠️ PROBLEM:** Der er et format mismatch! Backend skal opdateres til at matche inbox-orchestrator's API.

### Frontend Configuration

Frontend skal kalde backend-nestjs endpoints:

```typescript
// Frontend chat component
const response = await fetch('/api/v1/ai-friday/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Hvad har vi fået af nye leads i dag?',
    sessionId: sessionId || undefined,
    context: {
      userRole: user.role,
      organizationId: user.organizationId,
      currentPage: window.location.pathname,
      selectedJobId: selectedJob?.id,
      recentActions: ['viewed_jobs']
    }
  })
});
```

## 📱 Frontend Implementation

### Chat Interface Component

Frontend skal have en chat interface komponent. Der er allerede nogle eksempler:

1. **tekup-cloud-dashboard** har:
   - `src/components/inbox/AIPanel.tsx`
   - `src/components/ai/JarvisChat.tsx`

2. **RendetaljeOS frontend** mangler:
   - Chat widget komponent
   - Voice input interface
   - Session management UI

### Eksempel Frontend Chat Component

```tsx
// src/components/chat/FridayChatWidget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FridayChatWidget() {
  const { user, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch('/api/v1/ai-friday/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId || undefined,
          context: {
            userRole: user.role,
            organizationId: user.organizationId,
            currentPage: window.location.pathname,
            recentActions: []
          }
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle actions if any
      if (data.response.actions) {
        data.response.actions.forEach((action: any) => {
          if (action.type === 'navigate') {
            // Navigate to route
            window.location.href = action.payload.route;
          }
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, jeg kunne ikke svare på dit spørgsmål.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString('da-DK')}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Spørg Friday AI..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Streaming Chat Support

For real-time streaming (Server-Sent Events):

```typescript
const sendStreamingMessage = async () => {
  const eventSource = new EventSource(
    `/api/v1/ai-friday/chat/stream?message=${encodeURIComponent(message)}`
  );

  let fullResponse = '';

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data === '[DONE]') {
      eventSource.close();
      return;
    }
    
    fullResponse += data.chunk;
    setStreamingMessage(fullResponse);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };
};
```

## 🔄 Data Flow

### 1. Bruger sender besked i Frontend

```typescript
User types: "Hvad har vi fået af nye leads i dag?"
  ↓
Frontend: POST /api/v1/ai-friday/chat
  {
    message: "Hvad har vi fået af nye leads i dag?",
    context: { userRole, organizationId, currentPage, ... }
  }
```

### 2. Backend modtager besked

```typescript
AiFridayController.sendMessage()
  ↓
AiFridayService.sendMessage()
  - Builds contextual prompt
  - Prepares conversation history
  - Calls external AI API
```

### 3. Backend kalder Inbox Orchestrator

```typescript
POST http://localhost:3011/chat
  {
    message: "Hvad har vi fået af nye leads i dag?"
  }
```

### 4. Inbox Orchestrator processerer

```typescript
InboxOrchestrator.generateSafeReply()
  ↓
1. Intent Detection: "lead_processing"
2. Memory Selection: [MEMORY_4, MEMORY_7, MEMORY_23]
3. Email Search (MEMORY_7): Check existing communication
4. Lead Parsing: Extract leads from emails
5. Gemini AI: Generate response
6. Response Formatting: Markdown with emojis
```

### 5. Response returneres

```typescript
{
  reply: "## 📧 Nye Leads I Dag\n\n1. John Doe - Flytterengøring...",
  actions: [
    { name: "search_leads", args: { date: "2025-10-31" } }
  ],
  metrics: {
    intent: "lead_processing",
    tokens: 450,
    latency: "1234ms"
  }
}
```

## 🚧 Manglende Implementationer

### 1. Backend API Format Fix ⚠️ KRITISK

**Problem:** Backend sender `{ messages: [...] }` men inbox-orchestrator forventer `{ message: "..." }`.

**Fix:** Opdater `AiFridayService.sendMessage()` til at kalde inbox-orchestrator korrekt:

```typescript
// Current (WRONG):
const response = await this.httpService.post(
  `${this.baseUrl}/chat`,
  {
    messages: conversation,  // ❌ Wrong format
    context: context,
    stream: false,
    temperature: 0.7,
    max_tokens: 1000,
  }
);

// Should be:
const response = await this.httpService.post(
  `${this.baseUrl}/chat`,
  {
    message: message,  // ✅ Correct format
    // Optional: Add context if inbox-orchestrator supports it
  }
);
```

### 2. Frontend Chat Component

**Status:** ❌ Ikke implementeret i RendetaljeOS frontend

**Nødvendig:**
- Chat widget komponent (se eksempel ovenfor)
- Integration i layout/dashboard
- Voice input support
- Session management UI

### 3. Context Passing

**Problem:** Backend bygger contextual prompts, men inbox-orchestrator modtager kun `message`.

**Løsning:** Enten:
- A) Opdater inbox-orchestrator til at acceptere context parameter
- B) Inkluder context i message teksten

### 4. Actions Processing

Backend `AiFridayService.processActions()` skal implementeres til at håndtere actions fra inbox-orchestrator.

## 📋 Test Flow

### Test End-to-End Flow

1. **Start alle services:**
```bash
# Terminal 1: Inbox Orchestrator
cd services/tekup-ai/packages/inbox-orchestrator
npm run dev  # Port 3011

# Terminal 2: Backend NestJS
cd services/backend-nestjs
npm run start:dev  # Port 3000

# Terminal 3: Frontend Next.js
cd services/frontend-nextjs
npm run dev  # Port 3001
```

2. **Test direkte mod inbox-orchestrator:**
```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'
```

3. **Test gennem backend:**
```bash
curl -X POST http://localhost:3000/api/v1/ai-friday/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "Hvad har vi fået af nye leads i dag?",
    "context": {
      "userRole": "owner",
      "organizationId": "test-org"
    }
  }'
```

## 🎯 Næste Skridt

### Prioritet 1 (KRITISK)
- [ ] Fix backend `AiFridayService` til at matche inbox-orchestrator API format
- [ ] Test end-to-end flow
- [ ] Opret frontend chat component

### Prioritet 2
- [ ] Implementer streaming chat support
- [ ] Tilføj voice input i frontend
- [ ] Session management UI

### Prioritet 3
- [ ] Context passing til inbox-orchestrator
- [ ] Actions processing i backend
- [ ] Analytics dashboard

## 📚 Relaterede Filer

- **Backend:** `services/backend-nestjs/src/ai-friday/`
- **Inbox Orchestrator:** `services/tekup-ai/packages/inbox-orchestrator/src/index.ts`
- **Test Chat Interface:** `test-chat-interface.html` (simple HTML test)
- **Documentation:** `docs/AI_FRIDAY_SETUP.md`

## 🔗 Eksterne Links

- [Inbox Orchestrator API Docs](../../services/tekup-ai/packages/inbox-orchestrator/README.md)
- [Backend AI Friday Setup](../../services/backend-nestjs/docs/AI_FRIDAY_SETUP.md)
- [Friday AI Optimization Plan](./friday-ai-optimization-documentation.plan.md)

---

**Last Updated:** 31. oktober 2025  
**Status:** ⚠️ Backend API format mismatch skal fixes før frontend kan bruges

