# Phase 0: Spike - Validate Approach

**Duration**: 2-3 timer  
**Goal**: Quick validation før vi committer til full build  
**Decision Point**: GO/NO-GO for full implementation

---

## 🎯 Spike Objectives

1. **Understand** hvordan nuværende ChatPanel virker
2. **Prototype** simpleste mulige AI-email integration
3. **Test** om flow føles naturligt
4. **Decide** om vi skal fortsætte med fuld plan

> **Environment reminder:** Sørg for at `GOOGLE_MCP_URL` og `GMAIL_MCP_URL` er sat (fx `http://calendar-mcp:3001` / `http://gmail-mcp:3000`), ellers rammer prototypen fallback-URL’er og Google-kald fejler.

---

## Task 0.1: Analyse Current ChatPanel (1 time)

### Scope

Forstå eksisterende AI chat implementation for at genbruge logik.

### Questions to Answer

1. ✅ Hvor sender ChatPanel requests? (endpoint, payload)
2. ✅ Hvordan håndteres context? (conversation history)
3. ✅ Hvilke komponenter kan genbruges? (input, message display)
4. ✅ Hvordan håndteres streaming? (partial responses)
5. ✅ Error handling og loading states?

### Files to Examine

```
client/src/components/ChatPanel.tsx
client/src/components/ChatInput.tsx
server/routers/chat.ts
server/_core/llm.ts
```

### Deliverable

**Document**: `01-CURRENT-CHAT-ANALYSIS.md`

```markdown
# Current ChatPanel Analysis

## Architecture

[Diagram of current flow]

## Key Components

- ChatPanel: Main container
- ChatInput: User input
- MessageList: Display messages
- useChat hook: State management

## API Endpoints

- POST /api/trpc/chat.sendMessage
- Payload: { conversationId, message, context }

## Context Handling

- Context stored in: [location]
- Context format: [structure]

## Reusable Pieces

✅ Can reuse: [list]
❌ Must rebuild: [list]

## Critical Risks Identified

1. [Risk 1]
2. [Risk 2]
```

### Success Criteria

- [ ] Alle 5 spørgsmål besvaret
- [ ] Identificeret 2-3 komponenter til genbrug
- [ ] Identificeret 2-3 kritiske risici
- [ ] Document oprettet og reviewed

---

## Task 0.2: Quick Prototype (1 time)

### Scope

Build simpleste mulige version: Sidebar + Summarize knap + AI response.

**IKKE** production-ready - bare proof of concept!

### Implementation Steps

#### Step 1: Hardcode Email Context (15 min)

```typescript
// EmailThreadView.tsx - Add test button
const testEmail = {
  threadId: "test-123",
  subject: "Re: Booking for renovation",
  from: "kunde@example.com",
  body: "Hi, I would like to book a renovation..."
};

<Button onClick={() => handleSummarize(testEmail)}>
  TEST: Summarize This Email
</Button>
```

#### Step 2: Create Minimal Sidebar (20 min)

```typescript
// AIChatSidebarPrototype.tsx
export function AIChatSidebarPrototype({
  emailContext,
  onClose
}: Props) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    // Call API with email context
    const result = await fetch('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ emailContext })
    });
    const data = await result.json();
    setSummary(data.summary);
    setLoading(false);
  };

  return (
    <div className="w-80 border-l p-4">
      <h3>AI Assistant</h3>
      <Button onClick={handleSummarize}>Summarize</Button>
      {loading && <Spinner />}
      {summary && <p>{summary}</p>}
    </div>
  );
}
```

#### Step 3: Add Email Context to API (15 min)

```typescript
// server/routers/chat.ts (or new ai.ts)
.mutation("summarizeEmail", {
  input: z.object({
    threadId: z.string(),
    subject: z.string(),
    from: z.string(),
    body: z.string(),
  }),
  async resolve({ input }) {
    const prompt = `Summarize this email in 2-3 bullet points:
    From: ${input.from}
    Subject: ${input.subject}

    ${input.body}`;

    const response = await callLLM({ prompt });
    return { summary: response };
  }
})
```

#### Step 4: Wire it up (10 min)

```typescript
// EmailThreadView.tsx
const [showAISidebar, setShowAISidebar] = useState(false);
const [emailContext, setEmailContext] = useState(null);

const handleAIAction = () => {
  setEmailContext({
    threadId: thread.id,
    subject: thread.subject,
    from: thread.from,
    body: thread.body
  });
  setShowAISidebar(true);
};

return (
  <div className="flex">
    <div className="flex-1">
      {/* Email content */}
      <Button onClick={handleAIAction}>
        🤖 AI Assist
      </Button>
    </div>
    {showAISidebar && (
      <AIChatSidebarPrototype
        emailContext={emailContext}
        onClose={() => setShowAISidebar(false)}
      />
    )}
  </div>
);
```

### Success Criteria

- [ ] Prototype compiles uden errors
- [ ] Kan klikke button og se sidebar
- [ ] Kan klikke "Summarize" og få AI response
- [ ] Response vises i sidebar
- [ ] Flow føles naturligt (subjektiv vurdering)

### Time Box

**MAX 1 time**! Hvis ikke fungerende efter 1t, STOP og evaluer.

---

## Task 0.3: Test & Decide (30 min)

### Test Protocol

#### Test 1: Basic Functionality

- [ ] Åbn en rigtig email
- [ ] Klik AI button
- [ ] Verificer sidebar åbner
- [ ] Klik Summarize
- [ ] Verificer summary vises
- [ ] Læs summary - er den relevant?

#### Test 2: Edge Cases

- [ ] Hvad hvis email er TOM?
- [ ] Hvad hvis API er langsom (>5s)?
- [ ] Hvad hvis API fejler?
- [ ] Kan man lukke sidebar igen?

#### Test 3: UX Feel

**Subjektive vurderinger** (1-5 stjerner):

- [ ] Flow føles naturligt? ⭐⭐⭐⭐⭐
- [ ] Sidebar placering giver mening? ⭐⭐⭐⭐⭐
- [ ] Summary kvalitet er god? ⭐⭐⭐⭐⭐
- [ ] Response tid er acceptabel? ⭐⭐⭐⭐⭐

### Decision Criteria

#### ✅ GO hvis:

- [x] Basic functionality virker (Test 1 passed)
- [x] Ingen showstopper bugs
- [x] UX feel score: Average ≥ 4 stars
- [x] Team har confidence i approach

#### ❌ NO-GO hvis:

- [ ] Fundamentale tekniske problemer
- [ ] API responses er ubrugelige
- [ ] UX føles forkert/awkward
- [ ] Better alternative approach identified

### Deliverable

**Document**: `SPIKE-DECISION.md`

```markdown
# Spike Decision - AI Email Integration

## Test Results

### Functionality

✅ Basic flow works
✅ API integration successful
⚠️ Edge case: [describe issue]

### UX Feel

- Naturalness: ⭐⭐⭐⭐⭐
- Placement: ⭐⭐⭐⭐☆
- Quality: ⭐⭐⭐⭐⭐
- Speed: ⭐⭐⭐☆☆

Average: 4.25/5 ✅

### Key Learnings

1. [Learning 1]
2. [Learning 2]

### Identified Issues

1. [Issue 1 + mitigation]
2. [Issue 2 + mitigation]

## Decision: GO / NO-GO

**Verdict**: [GO/NO-GO]

**Reasoning**: [1-2 sætninger]

**Next Steps**:

- If GO → Proceed to Phase 1 (Task 1.1)
- If NO-GO → [Alternative approach]

**Confidence Level**: [Low/Medium/High]

---

Signed off by: [Name]
Date: [Date]
```

---

## 🎯 Spike Success Definition

**Spike er SUCCESS hvis**:

1. Vi kan besvare: "Skal vi bygge dette?"
2. Vi har confidence i at full build er muligt
3. Vi har identificeret de 2-3 største risici
4. Vi ved præcis hvad Task 1.1 skal være

**Spike er FAILURE hvis**: 5. Vi stadig er usikre på approach 6. Vi har fundamental technical blockers 7. Vi ikke ved hvordan vi skal fortsætte

---

## 📋 Checklist - Before Starting Spike

- [ ] Læst hele spike plan
- [ ] Forstår GO/NO-GO criteria
- [ ] Har 2-3 timer uafbrudt tid
- [ ] Har adgang til dev environment
- [ ] Har teste-emails klar
- [ ] Team er aligned på spike scope

---

## 🚀 Start Here

**Next Action**: Begin Task 0.1 → Analyse ChatPanel

**Time Limit**: MAX 3 timer total

**Output**: GO/NO-GO beslutning + SPIKE-DECISION.md

Good luck! 🎯
