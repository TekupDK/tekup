# AI Email Integration - Project Overview

**Status**: Planning  
**Priority**: High  
**Estimated Time**: 2-3 dage  
**Owner**: Team

---

## 🎯 Project Goal

Transform email experience fra "manual triage" til "AI-assisted workflow" - inspireret af Shortwave.

**Before**: Bruger læser email → tænker → skriver svar  
**After**: AI summarizer → foreslår replies → 1-click send

---

## 📊 Success Metrics

### Primary KPIs

- **Time to reply**: Reducér gennemsnitlig tid med 40%
- **AI usage rate**: 60%+ af emails bruger AI features
- **User satisfaction**: 4.5+ rating på AI suggestions

### Secondary KPIs

- API response time: <2s for summaries
- Smart reply accuracy: 80%+ acceptance rate
- Error rate: <5% failed AI requests

---

## 🎭 User Stories

### Story 1: Busy Manager

> "Som leder modtager jeg 50+ emails dagligt. Jeg vil hurtigt kunne se hvad emailen handler om og svare professionelt uden at skulle tænke over formuleringer."

**Solution**: Summarize + Suggest Reply buttons

### Story 2: Customer Support

> "Når kunde spørger ja/nej spørgsmål, vil jeg bare klikke 'Yes' og få en høflig email genereret automatisk."

**Solution**: Smart Reply buttons (Yes/No/Maybe)

### Story 3: Sales Team

> "Jeg vil have AI til at hjælpe mig med at følge op på leads baseret på email historik."

**Solution**: Email context awareness + conversation history

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              EmailThreadView                         │
├──────────────────────────┬──────────────────────────┤
│   Email Content          │   AI Sidebar             │
│   ┌──────────────────┐   │   ┌─────────────────┐    │
│   │ From: ...        │   │   │ 💡 Suggestions  │    │
│   │ Subject: ...     │   │   │ ────────────────│    │
│   │                  │   │   │ □ Summarize     │    │
│   │ Body text...     │   │   │ □ Draft Reply   │    │
│   │                  │   │   │                 │    │
│   │ [Smart Replies]  │   │   │ 💬 Chat         │    │
│   │ [Yes] [No] [More]│   │   │ ────────────────│    │
│   └──────────────────┘   │   │ > User: ...     │    │
│                          │   │ < AI: ...       │    │
└──────────────────────────┴───└─────────────────┘────┘
```

### Components

- **EmailThreadView**: Existing (modify to include sidebar)
- **AIChatSidebar**: New (collapsible right panel)
- **SmartReplyButtons**: New (below email body)
- **AI Quick Actions**: New (toolbar buttons)

### Data Flow

```
User Click → EmailContext → AI API → Response → UI Update
                ↓
        [threadId, subject, from, body, history]
```

---

## 📦 Phases & Dependencies

### Phase 0: Spike (2-3 timer) ⚡

**Goal**: Validate approach før full build

- [ ] **Task 0.1**: Analyse ChatPanel (1t)
- [ ] **Task 0.2**: Quick prototype (1t)
- [ ] **Task 0.3**: Test & beslut (30min)

**Deliverable**: GO/NO-GO beslutning

---

### Phase 1: MVP - Core Features (1 dag)

**Goal**: Ship minimum viable AI integration

#### MUST HAVE ✅

- [ ] **Task 1.1**: Email context system (3t)
- [ ] **Task 1.2**: Summarize email action (2t)
- [ ] **Task 1.3**: AI sidebar UI (3t)

**Deliverable**: Bruger kan klikke "Summarize" og se AI summary

---

### Phase 2: Smart Replies (0.5 dag)

**Goal**: 1-click email responses

#### SHOULD HAVE 🎯

- [ ] **Task 2.1**: Draft reply suggestions (2t)
- [ ] **Task 2.2**: Smart reply buttons (Yes/No/Maybe) (2t)

**Deliverable**: Bruger kan klikke "Yes" og få draft

---

### Phase 3: Persistence & Polish (0.5 dag)

**Goal**: Production-ready experience

#### NICE TO HAVE ✨

- [ ] **Task 3.1**: Chat history per thread (2t)
- [ ] **Task 3.2**: Pipeline view triggers (1t)
- [ ] **Task 3.3**: Error handling & loading states (1t)

**Deliverable**: Smooth, reliable UX

---

## ⚠️ Risks & Mitigation

### Risk 1: API Rate Limits

**Probability**: Medium  
**Impact**: High  
**Mitigation**:

- Implement request queueing
- Fallback to OpenAI hvis Gemini fails
- Cache common summaries (same email = same summary)

### Risk 2: Slow AI Responses

**Probability**: High  
**Impact**: Medium  
**Mitigation**:

- Streaming responses (show partial results)
- Optimistic UI (show skeleton immediately)
- Timeout after 10s with retry option

### Risk 3: Irrelevant AI Suggestions

**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:

- Better context engineering (include email history)
- User feedback loop ("Was this helpful?" thumbs up/down)
- A/B test different prompt templates

### Risk 4: Storage Bloat (Chat History)

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:

- Auto-delete chat history >30 days
- Compress old messages
- Limit to 50 messages per thread

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Email context extraction
- [ ] AI prompt generation
- [ ] Response parsing

### Integration Tests

- [ ] Full flow: Click Summarize → API → UI update
- [ ] Error scenarios (API down, timeout)
- [ ] Multiple concurrent requests

### User Acceptance Tests

- [ ] Test med 3-5 rigtige email threads
- [ ] Verificer summary kvalitet
- [ ] Verificer smart reply relevans
- [ ] Test på mobile/desktop

---

## ?? Rollout Plan

### Week 1: Spike + MVP

- Day 1: Spike → GO/NO-GO
- Day 2-3: MVP development
- Day 4: Internal testing

### Week 2: Iteration

- Day 1-2: Smart replies
- Day 3: Polish & testing
- Day 4-5: Soft launch (10% users)

### Week 3: Full Launch

- Monitor metrics
- Gather feedback
- Iterate based on data

---

## ?? Platform Requirements

- MCP endpoints skal være tilgængelige:
  - GOOGLE_MCP_URL (lokalt: http://calendar-mcp:3001, prod: Railway URL)
  - GMAIL_MCP_URL (lokalt: http://gmail-mcp:3000, prod: Railway URL)
- Hvis disse env-vars mangler, fallback’er backend til localhost, og Gmail/Calendar integration fejler.

---

# AI Email Integration - Project Overview

**Status**: Planning  
**Priority**: High  
**Estimated Time**: 2-3 dage  
**Owner**: Team

---

## 🎯 Project Goal

Transform email experience fra "manual triage" til "AI-assisted workflow" - inspireret af Shortwave.

**Before**: Bruger læser email → tænker → skriver svar  
**After**: AI summarizer → foreslår replies → 1-click send

---

## 📊 Success Metrics

### Primary KPIs

- **Time to reply**: Reducér gennemsnitlig tid med 40%
- **AI usage rate**: 60%+ af emails bruger AI features
- **User satisfaction**: 4.5+ rating på AI suggestions

### Secondary KPIs

- API response time: <2s for summaries
- Smart reply accuracy: 80%+ acceptance rate
- Error rate: <5% failed AI requests

---

## 🎭 User Stories

### Story 1: Busy Manager

> "Som leder modtager jeg 50+ emails dagligt. Jeg vil hurtigt kunne se hvad emailen handler om og svare professionelt uden at skulle tænke over formuleringer."

**Solution**: Summarize + Suggest Reply buttons

### Story 2: Customer Support

> "Når kunde spørger ja/nej spørgsmål, vil jeg bare klikke 'Yes' og få en høflig email genereret automatisk."

**Solution**: Smart Reply buttons (Yes/No/Maybe)

### Story 3: Sales Team

> "Jeg vil have AI til at hjælpe mig med at følge op på leads baseret på email historik."

**Solution**: Email context awareness + conversation history

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              EmailThreadView                         │
├──────────────────────────┬──────────────────────────┤
│   Email Content          │   AI Sidebar             │
│   ┌──────────────────┐   │   ┌─────────────────┐    │
│   │ From: ...        │   │   │ 💡 Suggestions  │    │
│   │ Subject: ...     │   │   │ ────────────────│    │
│   │                  │   │   │ □ Summarize     │    │
│   │ Body text...     │   │   │ □ Draft Reply   │    │
│   │                  │   │   │                 │    │
│   │ [Smart Replies]  │   │   │ 💬 Chat         │    │
│   │ [Yes] [No] [More]│   │   │ ────────────────│    │
│   └──────────────────┘   │   │ > User: ...     │    │
│                          │   │ < AI: ...       │    │
└──────────────────────────┴───└─────────────────┘────┘
```

### Components

- **EmailThreadView**: Existing (modify to include sidebar)
- **AIChatSidebar**: New (collapsible right panel)
- **SmartReplyButtons**: New (below email body)
- **AI Quick Actions**: New (toolbar buttons)

### Data Flow

```
User Click → EmailContext → AI API → Response → UI Update
                ↓
        [threadId, subject, from, body, history]
```

---

## 📦 Phases & Dependencies

### Phase 0: Spike (2-3 timer) ⚡

**Goal**: Validate approach før full build

- [ ] **Task 0.1**: Analyse ChatPanel (1t)
- [ ] **Task 0.2**: Quick prototype (1t)
- [ ] **Task 0.3**: Test & beslut (30min)

**Deliverable**: GO/NO-GO beslutning

---

### Phase 1: MVP - Core Features (1 dag)

**Goal**: Ship minimum viable AI integration

#### MUST HAVE ✅

- [ ] **Task 1.1**: Email context system (3t)
- [ ] **Task 1.2**: Summarize email action (2t)
- [ ] **Task 1.3**: AI sidebar UI (3t)

**Deliverable**: Bruger kan klikke "Summarize" og se AI summary

---

### Phase 2: Smart Replies (0.5 dag)

**Goal**: 1-click email responses

#### SHOULD HAVE 🎯

- [ ] **Task 2.1**: Draft reply suggestions (2t)
- [ ] **Task 2.2**: Smart reply buttons (Yes/No/Maybe) (2t)

**Deliverable**: Bruger kan klikke "Yes" og få draft

---

### Phase 3: Persistence & Polish (0.5 dag)

**Goal**: Production-ready experience

#### NICE TO HAVE ✨

- [ ] **Task 3.1**: Chat history per thread (2t)
- [ ] **Task 3.2**: Pipeline view triggers (1t)
- [ ] **Task 3.3**: Error handling & loading states (1t)

**Deliverable**: Smooth, reliable UX

---

## ⚠️ Risks & Mitigation

### Risk 1: API Rate Limits

**Probability**: Medium  
**Impact**: High  
**Mitigation**:

- Implement request queueing
- Fallback to OpenAI hvis Gemini fails
- Cache common summaries (same email = same summary)

### Risk 2: Slow AI Responses

**Probability**: High  
**Impact**: Medium  
**Mitigation**:

- Streaming responses (show partial results)
- Optimistic UI (show skeleton immediately)
- Timeout after 10s with retry option

### Risk 3: Irrelevant AI Suggestions

**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:

- Better context engineering (include email history)
- User feedback loop ("Was this helpful?" thumbs up/down)
- A/B test different prompt templates

### Risk 4: Storage Bloat (Chat History)

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:

- Auto-delete chat history >30 days
- Compress old messages
- Limit to 50 messages per thread

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Email context extraction
- [ ] AI prompt generation
- [ ] Response parsing

### Integration Tests

- [ ] Full flow: Click Summarize → API → UI update
- [ ] Error scenarios (API down, timeout)
- [ ] Multiple concurrent requests

### User Acceptance Tests

- [ ] Test med 3-5 rigtige email threads
- [ ] Verificer summary kvalitet
- [ ] Verificer smart reply relevans
- [ ] Test på mobile/desktop

---

## ?? Rollout Plan

### Week 1: Spike + MVP

- Day 1: Spike → GO/NO-GO
- Day 2-3: MVP development
- Day 4: Internal testing

### Week 2: Iteration

- Day 1-2: Smart replies
- Day 3: Polish & testing
- Day 4-5: Soft launch (10% users)

### Week 3: Full Launch

- Monitor metrics
- Gather feedback
- Iterate based on data

---

## ?? Platform Requirements

- MCP endpoints skal være tilgængelige:
  - GOOGLE_MCP_URL (lokalt: http://calendar-mcp:3001, prod: Railway URL)
  - GMAIL_MCP_URL (lokalt: http://gmail-mcp:3000, prod: Railway URL)
- Hvis disse env-vars mangler, fallback’er backend til localhost, og Gmail/Calendar integration fejler.

---

## 🎓 Learning from Shortwave Analysis

### What Shortwave Got Right

1. ✅ **Integrated, not separate** - AI ved siden af email, ikke i separat panel
2. ✅ **Context-aware** - AI ved hvad emailen handler om
3. ✅ **Quick actions** - Preset actions > fri chat
4. ✅ **Persistent** - History per email thread

### What We'll Do Differently

1. 🎯 **Start simpler** - MVP først, polish senere
2. 🎯 **Focus on dansk marked** - Optimize prompts for danske brugere
3. 🎯 **Leverage existing pipeline** - Integrate med vores status-baseret triage

---

## 📚 Reference Documents

- [Current ChatPanel Implementation](./01-CURRENT-CHAT-ANALYSIS.md)
- [AI Sidebar Design Spec](./02-AI-SIDEBAR-DESIGN.md)
- [Email Context System](./03-EMAIL-CONTEXT-SYSTEM.md)
- [API Integration Guide](./04-API-INTEGRATION.md)
- [Testing Plan](./05-TESTING-PLAN.md)

---

## 🔄 Next Steps

1. ✅ Read this overview
2. ⏭️ Start **Phase 0: Spike** (Task 0.1)
3. ⏭️ Create remaining task documents
4. ⏭️ Begin implementation

**Estimated start**: Nu  
**Estimated completion**: 3 dage fra nu
