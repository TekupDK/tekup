# AI Friday Setup Guide

## Overview

AI Friday is an intelligent assistant integrated into RendetaljeOS that provides context-aware help, voice interaction, and conversational AI capabilities. It connects to an external AI Friday API for natural language processing.

**Status:** ✅ Module implemented | ⚠️ External API configuration required

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend UI    │ ───> │ AiFridayModule   │ ───> │ External AI API │
│  (chat/voice)   │ <─── │ (NestJS)         │ <─── │ (Friday)        │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  v
                         ┌────────────────┐
                         │ PostgreSQL     │
                         │ (chat sessions)│
                         └────────────────┘
```

### Components

1. **AiFridayController** - 12 REST endpoints (chat, voice, sessions, analytics)
2. **AiFridayService** - External AI API integration with HttpModule
3. **ChatSessionsService** - Prisma-based session/message persistence
4. **Database Models** - RenosChatSession + RenosChatMessage

## Endpoints

### Chat Endpoints

#### POST `/api/v1/ai-friday/chat`
Send message to AI Friday and get response.

**Request:**
```json
{
  "message": "Hvordan opretter jeg et nyt job?",
  "sessionId": "optional-session-id",
  "context": {
    "userRole": "employee",
    "organizationId": "org_123",
    "currentPage": "jobs-list",
    "selectedJobId": "job_456",
    "selectedCustomerId": "cust_789",
    "recentActions": ["viewed_job", "updated_status"],
    "preferences": {}
  }
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "response": {
    "message": "For at oprette et nyt job skal du...",
    "actions": [
      {
        "type": "navigate",
        "payload": { "route": "/jobs/create" }
      }
    ],
    "suggestions": [
      "Vis mig eksisterende jobs",
      "Hvad er en standardpris for vinduespudsning?"
    ],
    "data": {}
  }
}
```

#### POST `/api/v1/ai-friday/chat/stream`
Streaming SSE responses for real-time chat experience.

**Request:** Same as `/chat` endpoint

**Response:** Server-Sent Events (text/event-stream)
```
data: {"chunk":"For ","sessionId":"sess_abc123"}

data: {"chunk":"at ","sessionId":"sess_abc123"}

data: [DONE]
```

### Voice Endpoints

#### POST `/api/v1/ai-friday/voice/transcribe`
Convert audio to text (speech recognition).

**Request:** `multipart/form-data`
- `audio` - Audio file (WAV, MP3, etc.)
- `language` - Language code (default: 'da' for Danish)

**Response:**
```json
{
  "text": "Hvordan opretter jeg et nyt job?"
}
```

#### POST `/api/v1/ai-friday/voice/synthesize`
Convert text to speech (TTS).

**Request:**
```json
{
  "text": "Velkommen til RendetaljeOS",
  "language": "da"
}
```

**Response:** Audio file (audio/wav)

### Session Management

#### GET `/api/v1/ai-friday/sessions?limit=20`
Get user's recent chat sessions.

**Response:**
```json
[
  {
    "id": "sess_abc123",
    "userId": "user_123",
    "organizationId": "org_123",
    "context": "employee",
    "title": "Chat fra jobs-list - 24.10.2025, 20:45:58",
    "metadata": {
      "currentPage": "jobs-list",
      "selectedJobId": "job_456"
    },
    "createdAt": "2025-10-24T18:45:58.000Z",
    "updatedAt": "2025-10-24T18:47:12.000Z"
  }
]
```

#### GET `/api/v1/ai-friday/sessions/:id`
Get session details with message history.

**Response:**
```json
{
  "session": { ... },
  "messages": [
    {
      "id": "msg_1",
      "sessionId": "sess_abc123",
      "role": "user",
      "content": "Hvordan opretter jeg et nyt job?",
      "metadata": {},
      "createdAt": "2025-10-24T18:45:58.000Z"
    },
    {
      "id": "msg_2",
      "sessionId": "sess_abc123",
      "role": "assistant",
      "content": "For at oprette et nyt job...",
      "metadata": {
        "actions": [...],
        "suggestions": [...]
      },
      "createdAt": "2025-10-24T18:46:02.000Z"
    }
  ]
}
```

#### PATCH `/api/v1/ai-friday/sessions/:id`
Update session title or metadata.

**Request:**
```json
{
  "title": "Job Creation Help",
  "metadata": { "starred": true }
}
```

#### DELETE `/api/v1/ai-friday/sessions/:id`
Delete session and all messages (204 No Content).

#### GET `/api/v1/ai-friday/sessions/search?q=job&limit=10`
Search sessions by title.

### Admin Endpoints

#### GET `/api/v1/ai-friday/analytics?from=2025-10-01&to=2025-10-31`
Get AI Friday usage analytics (Owner/Admin only).

**Response:**
```json
{
  "totalSessions": 156,
  "totalMessages": 834,
  "userMessages": 417,
  "assistantMessages": 417,
  "averageMessagesPerSession": 5.35,
  "sessionsByContext": {
    "owner": 23,
    "admin": 45,
    "employee": 78,
    "customer": 10
  },
  "dailyUsage": {
    "2025-10-24": 15,
    "2025-10-25": 18
  }
}
```

#### GET `/api/v1/ai-friday/health`
Check AI Friday service health (Owner/Admin only).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T18:50:00.000Z"
}
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# AI Friday External API Configuration
AI_FRIDAY_URL=https://api.aifriday.example.com
AI_FRIDAY_API_KEY=your-api-key-here
```

### Config Module

Update `src/config/configuration.ts`:

```typescript
export default () => ({
  // ... existing config
  integrations: {
    aiFriday: {
      url: process.env.AI_FRIDAY_URL,
      apiKey: process.env.AI_FRIDAY_API_KEY,
    },
  },
});
```

## Database Schema

### RenosChatSession

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | User who created session |
| organizationId | String | Organization context |
| context | String | User role (owner, admin, employee, customer) |
| title | String? | Session title (auto-generated) |
| metadata | Json? | Current page, selected IDs, preferences |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last activity timestamp |

**Indexes:** userId, organizationId, updatedAt

### RenosChatMessage

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| sessionId | String | Foreign key to RenosChatSession |
| role | String | 'user' or 'assistant' |
| content | String (Text) | Message text |
| metadata | Json? | Actions, suggestions, data from AI |
| createdAt | DateTime | Message timestamp |

**Indexes:** sessionId, createdAt

## Context-Aware Prompts

AI Friday generates role-specific system prompts:

### Owner Context
```
Du er Friday, en AI-assistent for RendetaljeOS.

Brugerens rolle: owner
Nuværende side: dashboard

Som ejer har du adgang til alle funktioner og kan se:
- Komplet overblik over virksomheden
- Finansielle rapporter og analyser
- Team performance og KPI'er
- Kundetilfredshed og reviews
```

### Employee Context
```
Som medarbejder kan du:
- Se dine tildelte jobs
- Registrere tid og status
- Kommunikere med kunder
- Få hjælp til procedurer
```

### Customer Context
```
Som kunde kan du:
- Booke nye rengøringsopgaver
- Se din servicehistorik
- Kommunikere med teamet
- Give feedback og reviews
```

## External AI Friday API Contract

### POST `/chat`

**Request:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Du er Friday, en AI-assistent..."
    },
    {
      "role": "user",
      "content": "Hvordan opretter jeg et nyt job?"
    }
  ],
  "context": {
    "organizationId": "org_123",
    "userRole": "employee",
    "currentPage": "jobs-list"
  },
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "message": "For at oprette et nyt job...",
  "actions": [],
  "suggestions": [],
  "data": {}
}
```

### POST `/chat/stream`
Same request, streaming response with SSE.

### POST `/transcribe`
Multipart form data with audio file.

### POST `/synthesize`
JSON with text + language, returns audio buffer.

### GET `/health`
Returns 200 OK if service is healthy.

## TODOs

### High Priority
- [ ] Configure external AI Friday API URL + API key
- [ ] Implement job/customer context lookups with LeadsService
- [ ] Implement AI actions (search_jobs, search_customers, create_job)
- [ ] Add integration tests for chat flow

### Medium Priority
- [ ] Add rate limiting for chat endpoints (prevent abuse)
- [ ] Implement conversation summarization for long sessions
- [ ] Add support for file attachments in chat
- [ ] Create admin dashboard for analytics visualization

### Low Priority
- [ ] Multi-language support (English, German, etc.)
- [ ] Voice command shortcuts
- [ ] Conversation export (PDF, JSON)
- [ ] Integration with mobile app push notifications

## Usage Examples

### Frontend Integration

```typescript
// Send chat message
const response = await fetch('/api/v1/ai-friday/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: 'Hvordan opretter jeg et nyt job?',
    sessionId: existingSessionId, // optional
    context: {
      userRole: user.role,
      organizationId: user.organizationId,
      currentPage: window.location.pathname,
      selectedJobId: selectedJob?.id,
      recentActions: ['viewed_jobs', 'filtered_by_status'],
    },
  }),
});

const { sessionId, response: aiResponse } = await response.json();

// Handle AI actions
aiResponse.actions?.forEach(action => {
  if (action.type === 'navigate') {
    router.push(action.payload.route);
  }
});
```

### Streaming Chat

```typescript
const eventSource = new EventSource(
  `/api/v1/ai-friday/chat/stream?message=${encodeURIComponent(message)}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data === '[DONE]') {
    eventSource.close();
    return;
  }
  
  appendToChat(data.chunk);
};
```

### Voice Input

```typescript
// Record audio
const mediaRecorder = new MediaRecorder(stream);
const chunks = [];

mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(chunks, { type: 'audio/wav' });
  
  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('language', 'da');
  
  const response = await fetch('/api/v1/ai-friday/voice/transcribe', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  
  const { text } = await response.json();
  sendChatMessage(text);
};
```

## Troubleshooting

### "AI Friday integration not configured properly" warning

**Cause:** Missing `AI_FRIDAY_URL` or `AI_FRIDAY_API_KEY` in environment variables.

**Fix:**
1. Add environment variables to `.env`
2. Restart backend server
3. Verify configuration in logs

### Chat endpoint returns fallback message

**Cause:** External AI Friday API is unreachable or returns error.

**Fix:**
1. Check AI Friday API health endpoint
2. Verify network connectivity
3. Check API key validity
4. Review backend logs for detailed error

### Voice endpoints fail with 400 error

**Cause:** Audio file format not supported or too large.

**Fix:**
1. Ensure audio is WAV, MP3, or M4A format
2. Keep files under 10MB
3. Sample rate: 16kHz recommended

## Performance Considerations

- **Timeout:** HTTP requests to AI Friday API timeout after 60 seconds
- **Retry:** Failed requests are retried up to 2 times
- **Session Limit:** Default 20 sessions per user query (configurable)
- **Message History:** Limited to 50 messages per session query (configurable)
- **Conversation Context:** Last 10 messages sent to AI for context

## Security Notes

- All endpoints require JWT authentication
- Analytics & health endpoints restricted to Owner/Admin roles
- Sessions are user-scoped (users can only access their own sessions)
- API keys stored in environment variables (never in code)
- Session metadata can contain sensitive info (handle with care)
- Audio files not persisted (transcribed and discarded)

---

**Last Updated:** October 24, 2025  
**Phase:** 2.10 Complete ✅  
**Total Endpoints:** 107 (95 existing + 12 AI Friday)
