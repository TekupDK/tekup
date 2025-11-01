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

## ✅ Implementation Status

### 1. Backend API Format Fix ✅ COMPLETED

**Status:** ✅ FIXED - Backend sender nu korrekt format

**Implementation:**
- `AiFridayService.sendMessage()` opdateret til at sende `{ message: "..." }` format
- Context information inkluderet i message teksten via `buildContextualInfo()`
- Response mapping fra inbox-orchestrator format til FridayResponse format
- Health check opdateret til at matche inbox-orchestrator's format

**Code Changes:**
```typescript
// Fixed implementation in ai-friday.service.ts
const contextualInfo = await this.buildContextualInfo(context);
const enrichedMessage = contextualInfo ? `${contextualInfo}\n\n${message}` : message;

const response = await this.httpService.post(
  `${this.baseUrl}/chat`,
  {
    message: enrichedMessage,  // ✅ Correct format
  }
);
```

### 2. Frontend Chat Component ✅ COMPLETED

**Status:** ✅ IMPLEMENTED

**Components Created:**
- `FridayChatWidget.tsx` - Full-featured chat interface
- `useFridayChat.ts` - Custom hook for chat state management
- Integrated in `layout.tsx` - Available on all pages

**Features:**
- ✅ Responsive chat widget with floating button
- ✅ Minimize/maximize functionality
- ✅ Message history and scrolling
- ✅ Loading states and typing indicators
- ✅ Error handling
- ✅ Session management
- ✅ Voice input button (placeholder for future implementation)

### 3. Context Passing ✅ COMPLETED

**Status:** ✅ IMPLEMENTED - Context inkluderet i message

**Implementation:**
- `buildContextualInfo()` metoden bygger context string
- Context inkluderet i message før sending: `"${contextInfo}\n\n${message}"`
- Inbox-orchestrator modtager context som del af message
- Inbox-orchestrator's intent detection og memory selection virker korrekt

### 4. Actions Processing ✅ IMPLEMENTED

**Status:** ✅ BASIC IMPLEMENTATION

**Implementation:**
- Actions fra inbox-orchestrator mappes til FridayResponse format
- Navigation actions håndteres i frontend (window.location.href)
- Backend `processActions()` har placeholder for fremtidige action types
- Frontend hook håndterer action processing

## 📋 Test Flow

### Quick Test Commands

**1. Test Inbox Orchestrator Directly:**
```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'
```

**2. Test Backend Integration:**
```bash
# Get auth token first (login)
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.accessToken')

# Test Friday AI endpoint
curl -X POST http://localhost:3000/api/v1/ai-friday/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Hvad har vi fået af nye leads i dag?",
    "context": {
      "userRole": "owner",
      "organizationId": "test-org"
    }
  }'
```

**3. Test Frontend:**
- Open browser: `http://localhost:3002`
- Login with credentials
- Click floating chat button (bottom right)
- Send test message

See `TESTING_GUIDE.md` for comprehensive testing scenarios.

## 🎯 Implementation Status & Next Steps

### ✅ Completed (Prioritet 1)
- [x] Fix backend `AiFridayService` til at matche inbox-orchestrator API format
- [x] Opret frontend chat component
- [x] Integrate chat widget i layout
- [x] API client opdateret med Friday endpoints
- [x] Context passing implementeret

### 🔄 In Progress
- [ ] Test end-to-end flow med forskellige scenarios
- [ ] Verify alle workflows (lead processing, booking, customer support, conflicts)

### 📋 Future Enhancements (Prioritet 2 & 3)
- [ ] Streaming chat support (currently simulated)
- [ ] Full voice input implementation (Web Speech API)
- [ ] Session management UI (list, search, delete sessions)
- [ ] Enhanced actions processing (create_job, search_customers, etc.)
- [ ] Analytics dashboard for AI usage
- [ ] Performance optimization
- [ ] Multi-language support

## 📚 Relaterede Filer

- **Backend:** `services/backend-nestjs/src/ai-friday/`
- **Inbox Orchestrator:** `services/tekup-ai/packages/inbox-orchestrator/src/index.ts`
- **Test Chat Interface:** `test-chat-interface.html` (simple HTML test)
- **Documentation:** `docs/AI_FRIDAY_SETUP.md`

## 🔗 Eksterne Links

- [Inbox Orchestrator API Docs](../../services/tekup-ai/packages/inbox-orchestrator/README.md)
- [Backend AI Friday Setup](../../services/backend-nestjs/docs/AI_FRIDAY_SETUP.md)
- [Friday AI Optimization Plan](./friday-ai-optimization-documentation.plan.md)

## 🔍 Troubleshooting

### Common Issues

**Issue: Chat widget not appearing**
- Verify `FridayChatWidget` is imported in `layout.tsx`
- Check browser console for errors
- Verify React hooks are working correctly

**Issue: "AI Friday integration not configured properly"**
- Set `AI_FRIDAY_URL=http://localhost:3011` in backend `.env`
- Restart backend service

**Issue: "401 Unauthorized"**
- Verify JWT token is valid
- Check authentication headers in API client
- Verify user is logged in

**Issue: Messages not sending**
- Check browser console for errors
- Verify inbox-orchestrator is running on port 3011
- Check network tab for API calls

**Issue: CORS errors**
- Verify backend CORS configuration allows frontend origin
- Check `FRONTEND_URL` in backend configuration

---

**Last Updated:** 31. oktober 2025  
**Status:** ✅ IMPLEMENTATION COMPLETE - Ready for testing

**Components:**
- ✅ Backend API format fixed
- ✅ Frontend chat component implemented
- ✅ Integration complete
- ✅ Basic testing guide created

**Next:** Comprehensive testing and workflow validation

