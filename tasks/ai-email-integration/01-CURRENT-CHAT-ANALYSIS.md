# Current ChatPanel Analysis

**Date**: November 5, 2025  
**Analyzed By**: GitHub Copilot  
**Files Examined**: ChatPanel.tsx, routers.ts, llm.ts

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ChatPanel.tsx                        │
│                      (Frontend)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌───────────────────────┐       │
│  │ Conversation │      │   Messages Display    │       │
│  │     List     │      │                       │       │
│  │              │      │  - User messages      │       │
│  │  - New Chat  │      │  - Assistant messages │       │
│  │  - Select    │      │  - SafeStreamdown     │       │
│  └──────────────┘      └───────────────────────┘       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Chat Input Area                      │    │
│  │  - Model selector (Gemini/Claude/GPT-4o)        │    │
│  │  - Text input + Voice + Send                    │    │
│  │  - Context tracking (email state)               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │       SuggestionsBar (Feature-Flagged)          │    │
│  │  - Action suggestions                           │    │
│  │  - Approval workflow                            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                              ↓
                     tRPC: chat.sendMessage
                              ↓
┌─────────────────────────────────────────────────────────┐
│               server/routers.ts                         │
│                   (Backend Router)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  chat.sendMessage mutation:                             │
│    1. Create user message in DB                         │
│    2. Get conversation history                          │
│    3. Generate title (if first message)                 │
│    4. Build AI messages array                           │
│    5. Call routeAI() with context                       │
│    6. Create assistant message in DB                    │
│    7. Return response + pendingAction                   │
│                                                          │
│  Input Schema:                                          │
│    - conversationId: number                             │
│    - content: string                                    │
│    - model: enum (gemini-2.5-flash, claude, gpt-4o)     │
│    - attachments: array (optional)                      │
│    - context: object (Shortwave-style tracking)         │
│        ✅ page, selectedThreads, openThreadId           │
│        ✅ folder, viewMode, selectedLabels              │
│        ✅ searchQuery, openDrafts                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                              ↓
                       routeAI()
                              ↓
┌─────────────────────────────────────────────────────────┐
│               server/_core/llm.ts                       │
│                   (LLM Abstraction)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  invokeLLM(params):                                     │
│    - Normalizes messages                                │
│    - Checks API keys (Gemini first, OpenAI fallback)    │
│    - Formats payload (Gemini vs OpenAI format)          │
│    - Makes HTTP request                                 │
│    - Returns InvokeResult                               │
│                                                          │
│  Features:                                              │
│    ✅ Multi-content support (text, image_url, file_url) │
│    ✅ Tool calling support                              │
│    ✅ Response format (json_schema, json_object)        │
│    ✅ Automatic API selection (Gemini → OpenAI)         │
│    ✅ Error handling                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Answers to Key Questions

### 1. ✅ Where are requests sent?

**Endpoint**: `tRPC: chat.sendMessage`

**Payload Structure**:

```typescript
{
  conversationId: number,
  content: string,
  model: "gemini-2.5-flash" | "claude-3-5-sonnet" | "gpt-4o" | "manus-ai",
  attachments?: Array<{ url, name, type }>,
  context?: {
    page?: string,              // "email-tab"
    selectedThreads?: string[], // Thread IDs
    openThreadId?: string,      // Currently viewing
    folder?: string,            // inbox, sent, archive
    viewMode?: string,          // list, pipeline, dashboard
    selectedLabels?: string[],
    searchQuery?: string,
    openDrafts?: number
  }
}
```

**Response**:

```typescript
{
  userMessage: Message,
  assistantMessage: Message,
  pendingAction?: {
    id: string,
    type: string,
    params: Record<string, unknown>,
    riskLevel: "low" | "medium" | "high"
  }
}
```

---

### 2. ✅ How is context handled?

#### Conversation History

- **Storage**: Database (conversations + messages tables)
- **Retrieval**: `getConversationMessages(conversationId)`
- **Format**: Array of `{ role, content, createdAt }`
- **Mapping**: Converted to AI messages: `{ role: "user" | "assistant" | "system", content: string }`

#### Email Context (Shortwave-Style)

**Frontend Collection** (ChatPanel.tsx, line 195-217):

```typescript
const rawContext = {
  page: window.location.pathname.includes("/inbox") ? "email-tab" : undefined,
  selectedThreads: Array.from(emailContext.state.selectedThreads),
  openThreadId: emailContext.state.openThreadId || undefined,
  folder: emailContext.state.folder,
  viewMode: emailContext.state.viewMode,
  selectedLabels: emailContext.state.selectedLabels,
  searchQuery: emailContext.state.searchQuery || undefined,
  openDrafts: emailContext.state.openDrafts || undefined,
};

// Clean: remove undefined/null values and empty arrays
const context = Object.fromEntries(
  Object.entries(rawContext).filter(([_, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  })
);
```

**Backend Usage** (routers.ts, line 191-209):

- Context logged for debugging
- Passed to `routeAI()` function
- Used to enhance AI understanding of user's current state

**Key Insight**: Context is ALREADY being tracked and sent! We can leverage this for email-specific AI.

---

### 3. ✅ Which components are reusable?

#### ✅ Highly Reusable (Little to No Changes)

1. **SafeStreamdown** (line 19, line 467)
   - Purpose: Renders markdown safely with streaming support
   - Usage: `<SafeStreamdown content={message.content} />`
   - **Can use as-is** for AI responses in email sidebar

2. **SuggestionsBar** (line 20, line 503-510)
   - Purpose: Shows action suggestions with approval workflow
   - Already implemented and feature-flagged
   - **Can reuse** for email-specific suggestions (e.g., "Draft Reply", "Summarize")

3. **ActionApprovalModal** (line 21, line 542-548)
   - Purpose: User approval for AI actions
   - Features: Risk level display, always approve checkbox
   - **Can reuse** for email actions (send reply, archive, etc.)

4. **LLM Core** (server/\_core/llm.ts)
   - Functions: `invokeLLM()`, message normalization, API routing
   - **Can reuse directly** for email AI requests
   - Already supports Gemini + OpenAI fallback

#### 🔄 Partially Reusable (Minor Modifications)

5. **Chat Input Pattern** (line 511-541)
   - Structure: Model selector + Input + Voice + Send
   - **Needs adaptation**: Simpler UI for email sidebar (no model selector, no voice?)
   - Can reuse: Input component, send button logic

6. **Message Display Pattern** (line 440-498)
   - Structure: User/Assistant message bubbles with animation
   - **Needs adaptation**: Sidebar styling (narrower width, different colors)
   - Can reuse: Animation, role-based styling logic

#### ❌ Not Reusable (Different Use Case)

7. **Conversation List Sidebar** (line 361-430)
   - Too specific to multi-conversation management
   - Email sidebar won't need conversation switching

8. **Auto-Title Generation** (line 226-239)
   - Specific to chat conversations
   - Email threads already have subjects

---

### 4. ✅ How is streaming handled?

**Current Implementation**: NO STREAMING

- Messages are returned as complete strings
- Loading state: `sendMessage.isPending` (line 499-511)
- Display: Animated dots while waiting

**Evidence**:

- `invokeLLM()` returns full `InvokeResult` (not streamed chunks)
- Frontend shows loading animation, then full response
- No `ReadableStream` or `EventSource` usage

**Implication for Email AI**:

- ✅ Simple: Can show spinner, then full summary
- ❌ Slow perceived speed for long summaries
- 💡 Future enhancement: Could add streaming later if needed

---

### 5. ✅ Error/Loading States?

#### Loading States (ChatPanel.tsx)

**Mutation Pending** (line 499-511):

```tsx
{
  sendMessage.isPending && (
    <div className="flex justify-start animate-in fade-in">
      <div className="bg-muted border rounded-2xl px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
```

**Button Disabled** (line 531-540):

```tsx
<Button
  onClick={handleSendMessage}
  disabled={!inputMessage.trim() || sendMessage.isPending}
  size="icon"
>
```

#### Error Handling

**Frontend** (line 170-174):

```typescript
onError: error => {
  const errorMessage = error.message || "Unknown error occurred";
  toast.error("Failed to send message: " + errorMessage);
  console.error("[ChatPanel] Send message error:", error);
};
```

**Backend** (routers.ts):

```typescript
// Extensive console.log for debugging
console.log("[Chat] sendMessage called:", { ... });
console.log("[Chat] Creating user message...");
console.log("[Chat] User message created, ID:", userMessage.id);
```

**LLM Layer** (llm.ts, line 336-343):

```typescript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(
    `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
  );
}
```

**Strengths**:

- ✅ Clear error messages to user via toast
- ✅ Console logging for debugging
- ✅ Disabled states prevent duplicate requests

**Weaknesses**:

- ⚠️ No retry mechanism
- ⚠️ No timeout handling (could hang indefinitely)
- ⚠️ No rate limit handling

---

## 🔧 Reusable Pieces for Email AI

### Components We Can Reuse Directly

1. **SafeStreamdown** → Display AI summaries/responses
2. **SuggestionsBar** → Show quick actions (Summarize, Draft Reply, etc.)
3. **ActionApprovalModal** → Approve sending replies
4. **invokeLLM()** → Make AI requests (already has Gemini + OpenAI)

### Patterns We Can Adapt

1. **Context Tracking** → Already collecting email state, just need to enhance
2. **Loading Animation** → Use the bouncing dots for email sidebar
3. **Error Toast** → Reuse same error handling pattern
4. **Message Display** → Adapt styling for narrower sidebar

### What We Need to Build

1. **AIChatSidebar Component** → New layout (collapsible right panel)
2. **Email Context Extraction** → Convert thread → AI-friendly format
3. **Email-Specific Endpoints** → `summarizeEmail`, `draftReply`, etc.
4. **Integration with EmailThreadView** → Add button + sidebar

---

## ⚠️ Critical Risks Identified

### Risk 1: Context Completeness

**Problem**: Current context only tracks thread IDs, not actual email content

**Current State**:

```typescript
context: {
  openThreadId: "thread-abc123", // ❌ Just ID
  // Missing: subject, from, to, body, timestamp
}
```

**What We Need**:

```typescript
emailContext: {
  threadId: "thread-abc123",
  subject: "Re: Renovation quote",
  from: { name: "John Doe", email: "john@example.com" },
  to: [{ name: "Me", email: "me@tekup.dk" }],
  messages: [
    { from: "john@...", body: "...", timestamp: "..." },
    { from: "me@...", body: "...", timestamp: "..." }
  ]
}
```

**Mitigation**: Build email context extraction in spike prototype (Task 0.2)

---

### Risk 2: No Streaming

**Problem**: Long summaries will feel slow (waiting for full response)

**Current**: User waits → Full response appears  
**Better**: User sees partial response streaming in

**Impact**: Medium (UX issue, not blocker)

**Mitigation**:

- Phase 0-1: Accept non-streaming (simpler implementation)
- Phase 3: Add streaming if users complain about speed

---

### Risk 3: Rate Limits Not Handled

**Problem**: No queue, retry, or rate limit detection

**Evidence**:

```typescript
// llm.ts - No rate limit handling
if (!response.ok) {
  throw new Error(`LLM invoke failed: ${response.status}`);
  // ❌ Doesn't check if 429 (rate limit)
}
```

**Mitigation**:

- Phase 0-1: Accept risk (low traffic during testing)
- Phase 3: Add proper error handling (Task 12)

---

## 💡 Key Learnings

### 1. Context Infrastructure Already Exists! 🎉

We don't need to build context tracking from scratch. The `useEmailContext()` hook and context passing to AI is already implemented. We just need to:

- ✅ Enhance context with actual email content (not just IDs)
- ✅ Add email-specific fields (subject, from, body)

### 2. AI Router is Model-Agnostic

`routeAI()` already handles model selection:

- Gemini (primary)
- OpenAI (fallback)
- Claude (supported)

We can specify `preferredModel` per request.

### 3. Action Approval Pattern Exists

`pendingAction` + `ActionApprovalModal` is already built and tested. We can use this for:

- Sending AI-generated replies
- Archiving emails
- Updating pipeline status

### 4. Frontend is Modern & Performant

- React Query caching (staleTime: 30s for conversations, 10s for messages)
- Optimistic UI patterns
- Proper loading/error states
- Animation library (animate-in, fade-in, etc.)

---

## 🎯 Recommendations for Spike

### What to Build in Prototype (Task 0.2)

1. **Minimal Sidebar Component** (20 min)
   - Right panel, fixed width (300px)
   - Close button
   - One "Summarize" button
   - Response display area

2. **Email Context Extraction** (15 min)
   - Hardcode test email data
   - Format: `{ threadId, subject, from, body }`
   - Pass to AI endpoint

3. **New tRPC Endpoint** (15 min)

   ```typescript
   summarizeEmail: protectedProcedure
     .input(
       z.object({
         threadId: z.string(),
         subject: z.string(),
         from: z.string(),
         body: z.string(),
       })
     )
     .mutation(async ({ input, ctx }) => {
       const prompt = `Summarize this email in 2-3 bullet points:
       From: ${input.from}
       Subject: ${input.subject}
       
       ${input.body}`;

       const response = await invokeLLM({
         messages: [{ role: "user", content: prompt }],
       });

       return { summary: response.choices[0].message.content };
     });
   ```

4. **Wire Up** (10 min)
   - Add button to EmailThreadView
   - Open sidebar on click
   - Call tRPC mutation
   - Display response

### What NOT to Build Yet

- ❌ Beautiful UI (use basic shadcn components)
- ❌ Animations (keep it simple)
- ❌ Multiple AI features (just Summarize)
- ❌ Persistent history (in-memory is fine)
- ❌ Error handling polish (just console.log)
- ❌ Streaming (wait for full response)

---

## ✅ Spike Readiness Checklist

- [x] All 5 questions answered
- [x] Identified 4 reusable components (SafeStreamdown, SuggestionsBar, ActionApprovalModal, invokeLLM)
- [x] Identified 3 critical risks (context completeness, no streaming, no rate limits)
- [x] Document created and detailed
- [x] Clear recommendation for prototype scope

---

## 📋 Next Steps

1. ✅ **Task 0.1 COMPLETE** - This analysis document
2. ⏭️ **Task 0.2 START** - Build quick prototype (1 hour MAX)
3. ⏭️ **Task 0.3** - Test and make GO/NO-GO decision

**Confidence Level**: HIGH - Architecture supports email AI integration well

---

**Analysis completed**: November 5, 2025  
**Time spent**: ~30 minutes  
**Signed off by**: GitHub Copilot
