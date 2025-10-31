# 🏗️ Architecture Overview - Friday AI

**Friday AI** (tidligere Rendetalje Inbox AI) er en token-optimeret, intelligent assistent for lead management, tilbud, booking og kundeservice.

## 📊 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Desktop    │  │    Mobile    │  │     Web      │      │
│  │   (Electron) │  │ (React Native)│ │  (Next.js)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   RAILWAY API  │
                    │  (Cloud Host)  │
                    └────────┬────────┘
                             │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
    │  Google   │      │  Inbox     │     │   Tekup    │
    │    MCP    │      │ Orchestrator│     │  Cloud     │
    │           │      │             │     │ Dashboard  │
    └─────┬─────┘      └─────┬───────┘     └────────────┘
          │                  │
          │                  │
    ┌─────▼──────────────────▼─────┐
    │     Gmail API               │
    │     Calendar API             │
    │     Gemini API               │
    └──────────────────────────────┘
```

---

## 🔧 Services

### **1. Google MCP Service** (`google-mcp`)

**Port:** 3010 (local), Railway (production)

**Endpoints:**

- `GET /health` - Health check
- `POST /gmail/search` - Search email threads
  - Parameters: `query`, `maxResults`, `readMask`
  - Returns: Array of thread IDs and snippets
- `POST /gmail/thread` - Get full thread with bodyFull
- `POST /gmail/send-reply` - Send email reply
- `POST /calendar/events` - Get calendar events
  - Parameters: `start`, `end`
  - Returns: Detailed event information

**Responsibilities:**

- Direct interaction with Google APIs (Gmail, Calendar)
- Authentication handling
- API rate limiting

---

### **2. Inbox Orchestrator** (`inbox-orchestrator`)

**Port:** 3011 (local), Railway (production)

**Endpoints:**

- `GET /health` - Health check
- `GET /test/parser` - Test lead parser
- `POST /generate-reply` - Generate email reply
- `POST /approve-and-send` - Approve and send reply
- `POST /chat` - Main chat endpoint ⭐
  - Natural language input
  - Function calling logic
  - Returns structured response

**Responsibilities:**

- Intent detection (email, calendar, booking)
- Function calling / tool execution
- Lead parsing and data extraction
- Memory integration (business rules)
- Response generation

**Key Components:**

- `leadParser.ts` - Lead data extraction
- `googleMcpClient.ts` - Google MCP API client
- `index.ts` - Main orchestrator logic

---

### **3. Tekup Cloud Dashboard** (`tekup-cloud-dashboard`)

**Port:** 3000 (preview), 5173 (dev)

**Responsibilities:**

- Frontend UI for chat interface
- Rendetalje Inbox UI
- Real-time metrics (optional)

---

## 🧠 Intelligence Layer

### **Data Flow:**

```
1. User Input → Intent Detection
   ↓
2. Email Search (readMask: snippets only)
   ↓
3. Get Threads (bodyFull) - Parallel loading
   ↓
4. Parse Leads (leadParser.ts)
   ↓
5. Apply Memory Rules
   - MEMORY_4: Reply strategy
   - MEMORY_23: Price calculation
   - MEMORY_5: Calendar check
   ↓
6. Generate Structured Output
```

### **Lead Parser Pipeline:**

```
Email Thread
  ↓
extractSource() → 'Rengøring.nu' | 'Rengøring Aarhus' | 'AdHelp'
  ↓
extractName() → "Rene Fly Jensen"
  ↓
extractContact() → { email: "...", phone: "..." }
  ↓
extractBolig() → { sqm: 230, type: "Villa" }
  ↓
extractType() → "Fast" | "Flytterengøring" | ...
  ↓
extractAddress() → "Ahornvej 1, 9310 Hadsten"
  ↓
determineStatus() → "Needs Reply" | "Tilbud sendt"
  ↓
applyLeadSourceRules() → replyStrategy, replyTo
  ↓
calculatePrice() → priceEstimate
  ↓
Lead Object (Structured Data)
```

---

## 💾 Memory System

### **MEMORY_4: Lead Source Rules**

```typescript
Rengøring.nu → CREATE_NEW_EMAIL (ikke reply på leadmail)
AdHelp → DIRECT_TO_CUSTOMER (send til kunde)
Leadpoint → REPLY_DIRECT (kan svares direkte)
```

### **MEMORY_23: Price Calculation**

```typescript
HOURLY_RATE = 349 kr/t (inkl. moms)

< 100 m²:  2 timer, 1 person → 698-1047 kr
100-150 m²: 3 timer, 1 person → 1047-1396 kr
150-200 m²: 4 timer, 2 personer → 2792-3490 kr
> 200 m²:   ceil(m²/50) timer, 2 personer
```

### **MEMORY_5: Calendar Check**

```typescript
Booking Intent → Check calendar (næste 7 dage)
  → Show occupied slots
  → Suggest available times
```

---

## 🔄 Request Flow Example

### **Example: "Hvad har vi fået af nye leads i dag?"**

1. **User sends request** → `/chat` endpoint
2. **Intent Detection:**
   - `hasEmailIntent = true` (detects "leads", "i dag")
   - `hasCalendarIntent = false`
   - `sourceFilter = null`

3. **Function Calls (Parallel):**
   - Email search: `after:2025/10/29 (from:leadmail.no OR ...)`
   - Calendar: Today's events

4. **Data Processing:**
   - Load bodyFull for found threads
   - Parse each thread → Lead objects
   - Apply memory rules

5. **Response Generation:**
   ```
   📥 NYE LEADS (modtaget 30.10.2025):
   1. Rene Fly Jensen [THREAD_REF_1]
      * Kilde: Rengøring.nu
      * Type: Fast
      ...
   ```

---

## 📁 File Structure

```
apps/rendetalje/
├── services/
│   ├── google-mcp/          # Google API service
│   │   └── src/
│   │       ├── index.ts     # Express server
│   │       ├── google/
│   │       │   ├── gmail.ts  # Gmail API
│   │       │   └── calendar.ts # Calendar API
│   │       └── Dockerfile
│   └── ...
├── docker-compose.yml       # Local development
└── docs/                   # Documentation

services/tekup-ai/packages/
└── inbox-orchestrator/
    └── src/
        ├── index.ts        # Main orchestrator
        ├── leadParser.ts   # Intelligence layer
        └── adapters/
            ├── googleMcpClient.ts
            └── tekupBillyClient.ts
```

---

## 🚀 Deployment

### **Local Development:**

```bash
docker-compose up -d
```

### **Production (Railway):**

- Google MCP: Railway deployment
- Inbox Orchestrator: Railway deployment
- Environment variables: Railway dashboard

---

## 🔐 Environment Variables

### **Google MCP:**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

### **Inbox Orchestrator:**

- `GOOGLE_MCP_URL` - Google MCP service URL
- `GEMINI_API_KEY` - Gemini AI API key
- `PORT` - Server port (default: 3011)

### **Tekup Cloud Dashboard:**

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_MCP_URL`
- `VITE_ORCHESTRATOR_URL`
- `VITE_DISABLE_WS` - Disable WebSocket in preview

---

## 📊 Performance

### **Optimizations:**

- ✅ Parallel loading of threads (Promise.all)
- ✅ Initial search with `readMask` (only snippets)
- ✅ Full body loading only for found threads
- ✅ Date range: 2 days (configurable)

### **Limitations:**

- Email search: Max 50 threads per query
- Calendar: Max 7 days for booking suggestions
- Response time: ~2-5 seconds (depends on API calls)

---

**Dokument opdateret:** 31. oktober 2025
