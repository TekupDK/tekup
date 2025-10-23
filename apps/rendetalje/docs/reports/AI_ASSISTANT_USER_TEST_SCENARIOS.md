# AI Assistant User Test Scenarios
**Version:** 1.0 | **Date:** 18. Oktober 2025 | **Purpose:** Testing framework for Tekup AI Assistant

## 🎯 Testing Strategy

### Core Principles
1. **User-Centric:** Test real workflows, measure time-to-value
2. **Market-Aligned:** Compare against ChatGPT/Claude/Copilot benchmarks  
3. **Tekup-Specific:** Validate TekupVault integration & multi-repo context
4. **Quality-Focused:** Accuracy > Speed, citations mandatory

---

## 👤 User Personas

### Persona 1: Jonas (Portfolio Owner)
- **Role:** Founder & Strategic Decision Maker
- **Frequency:** Daily (2-4h/day)
- **Use Cases:** Strategic planning, repository prioritization, architecture decisions
- **Success:** 50% faster decisions, 90%+ accuracy, full context across 8 repos

### Persona 2: Developer (Team Member)
- **Role:** Full-stack TypeScript Developer
- **Frequency:** Daily (6-8h/day)  
- **Use Cases:** Code help, API lookup, debugging, best practices
- **Success:** <2min answers, working code examples, reduced context switching

### Persona 3: New Team Member
- **Role:** Onboarding Developer
- **Frequency:** First 2 weeks intensive
- **Use Cases:** Project structure, tech stack, documentation, decisions
- **Success:** 50% faster onboarding, 80% self-service, confident first PR

---

## 📊 Test Categories
- **Knowledge Retrieval:** 30% of tests
- **Code Assistance:** 25% of tests
- **Strategic Decisions:** 20% of tests  
- **Multi-Turn Conversations:** 15% of tests
- **Edge Cases:** 10% of tests

---

## 🧪 CATEGORY 1: Knowledge Retrieval

### KR-001: Simple Documentation Lookup ⭐ P0
**Persona:** Developer | **Difficulty:** Easy

**Query:** "How do I create an invoice in Billy.dk?"

**Expected:**
1. Search TekupVault for "Billy invoice create"
2. Return code example with explanation
3. Cite source file

**Success Criteria:**
- ✅ Response <3 seconds
- ✅ Working code example
- ✅ Specific file citation
- ✅ Parameter explanation

**Benchmark:** ChatGPT gives generic answer, no code, ~5s

---

### KR-002: Cross-Repository Search ⭐ P0
**Persona:** Jonas | **Difficulty:** Medium

**Query:** "Where is AgentScope implemented across my projects?"

**Expected:**
1. Search all repos in TekupVault
2. Find 3+ locations
3. Compare implementations
4. Recommend which to extract

**Success Criteria:**
- ✅ Finds all locations (Tekup-org, Tekup-Google-AI)
- ✅ Shows code snippets from each
- ✅ Explains differences  
- ✅ Extraction recommendation

**Benchmark:** Claude needs manual file uploads, no cross-repo search

---

### KR-003: Historical Decision Lookup ⭐ P1
**Persona:** New Team Member | **Difficulty:** Medium

**Query:** "Why did we choose NestJS over Express?"

**Expected:**
1. Find architecture decision docs
2. Explain reasoning
3. Show alternatives considered
4. Link to related docs

**Success Criteria:**
- ✅ Finds decision documentation
- ✅ Clear reasoning
- ✅ Trade-offs explained
- ✅ Related docs linked

**Benchmark:** Perplexity good at web, not internal docs

---

## 💻 CATEGORY 2: Code Assistance

### CA-001: Code Generation ⭐ P0
**Persona:** Developer | **Difficulty:** Easy

**Query:** "Generate a Zod schema for creating a cleaning booking"

**Expected:**
1. Search existing Zod patterns
2. Find cleaning service models
3. Generate type-safe schema
4. Include validation rules

**Success Criteria:**
- ✅ Uses existing Tekup patterns
- ✅ All required fields
- ✅ Proper validation
- ✅ TypeScript inference works

**Benchmark:** GitHub Copilot generic, doesn't know Tekup patterns

---

### CA-002: Debugging Assistance ⭐ P0  
**Persona:** Developer | **Difficulty:** Medium

**Query:** "TypeError: Cannot read property embeddings in TekupVault"

**Expected:**
1. Search for similar errors
2. Find error handling patterns
3. Provide specific fix
4. Explain root cause

**Success Criteria:**
- ✅ Identifies exact issue
- ✅ Working fix
- ✅ Root cause explained
- ✅ Prevention tips

**Benchmark:** ChatGPT generic TypeScript advice, doesn't know TekupVault

---

### CA-003: Code Review ⭐ P1
**Persona:** Jonas | **Difficulty:** Hard

**Query:** [200-line TypeScript file] "Review for Tekup standards"

**Expected:**
1. Check against Tekup patterns
2. Validate type safety
3. Check error handling  
4. Suggest improvements

**Success Criteria:**
- ✅ Pattern violations found
- ✅ Zod usage checked
- ✅ Error handling validated
- ✅ Tekup-specific improvements

**Benchmark:** Claude good generic review, doesn't know Tekup patterns

---

## 🎯 CATEGORY 3: Strategic Decisions

### SD-001: Repository Prioritization ⭐ P0
**Persona:** Jonas | **Difficulty:** Medium

**Query:** "Should I work on Tekup-AI-Assistant or Tekup-Billy?"

**Expected:**
1. Check repository tiers
2. Reference strategic docs
3. Consider priorities
4. Clear recommendation

**Success Criteria:**
- ✅ References TIER system
- ✅ Cites strategic docs
- ✅ Clear recommendation
- ✅ Reasoning explained

**Benchmark:** Generic AI has no portfolio context

---

### SD-002: Extraction vs Delete ⭐ P0
**Persona:** Jonas | **Difficulty:** Hard

**Query:** "Can I delete Tekup-org to save disk space?"

**Expected:**
1. Check extraction value (€360K!)
2. WARN immediately
3. Provide extraction plan
4. Estimate time

**Success Criteria:**
- ✅ Immediate warning
- ✅ Shows €360K value
- ✅ Step-by-step extraction
- ✅ Time estimates

**Benchmark:** Generic AI would say "yes delete" - loses €360K!

---

### SD-003: Technology Choice ⭐ P1
**Persona:** Jonas | **Difficulty:** Medium

**Query:** "Should I use Dify or LangChain for RAG?"

**Expected:**
1. Point out existing TekupVault
2. Compare alternatives
3. Consider maintenance
4. Recommend reuse

**Success Criteria:**
- ✅ Mentions existing solution
- ✅ Comparison table
- ✅ Maintenance considered
- ✅ Pragmatic choice

**Benchmark:** Claude/ChatGPT compares frameworks, doesn't know TekupVault exists

---

## 🔄 CATEGORY 4: Multi-Turn Conversations

### MT-001: Iterative Development ⭐ P0
**Persona:** Developer | **Difficulty:** Medium

**Flow:**
1. "Help add new MCP tool to Tekup-Billy"
2. "How do I test this tool?"
3. "Test failing with Zod error"
4. "Show me similar tools"

**Success Criteria:**
- ✅ Context maintained across 4 turns
- ✅ Builds on previous answers
- ✅ References earlier code
- ✅ Debugging specific to conversation

**Benchmark:** ChatGPT loses context after 2-3 turns

---

### MT-002: Learning Journey ⭐ P1
**Persona:** New Team Member | **Difficulty:** Progressive

**Flow:**
1. "I'm new, where do I start?"
2. "What's the tech stack?"
3. "How run Billy integration locally?"
4. "Where are tests?"
5. "Show example PR"

**Success Criteria:**
- ✅ Structured onboarding
- ✅ Progressive complexity
- ✅ Tracks skill level
- ✅ Personalized path

---

## ⚠️ CATEGORY 5: Edge Cases & Error Handling

### EC-001: Ambiguous Query
**Query:** "Fix the bug"

**Expected:** Ask clarifying questions
- Which repository?
- What bug/error?
- When does it occur?

---

### EC-002: Conflicting Information
**Query:** "Which invoice schema is correct?"

**Expected:** 
- Find multiple schemas
- Explain differences
- Recommend canonical version
- Suggest consolidation

---

### EC-003: Out of Scope
**Query:** "How do I configure AWS Lambda?"

**Expected:**
- Acknowledge Tekup uses Render, not AWS
- Offer Render.com equivalent
- Or suggest external resources

---

### EC-004: Hallucination Prevention
**Query:** "Show me the deleteTekupOrg function"

**Expected:**
- Search TekupVault
- Report "not found"
- Don't make up code
- Suggest similar functions

---

### EC-005: Rate Limiting / API Errors
**Scenario:** TekupVault API returns 429 Too Many Requests

**Expected:**
- Graceful degradation
- Use cached knowledge
- Inform user of limitation
- Retry with backoff

---

## 📈 Success Metrics

### Response Quality
- **Accuracy:** 95%+ correct answers
- **Citations:** 100% of code/doc references cited
- **Relevance:** 90%+ on-topic responses
- **Hallucination Rate:** <2%

### Performance
- **Simple Queries:** <3 seconds
- **Complex Queries:** <10 seconds
- **Multi-turn Context:** Maintained 5+ turns
- **Uptime:** 99.5%+

### User Satisfaction
- **Time Saved:** 10+ hours/month per user
- **Confidence:** 85%+ trust in answers
- **Adoption:** 80%+ daily active usage
- **NPS:** 50+

---

## 🧪 Test Execution Plan

### Phase 1: MVP Testing (Week 1)
```yaml
Focus: Core functionality
Tests: KR-001, KR-002, CA-001, CA-002, SD-001, SD-002
Goal: Validate basic Q&A + TekupVault integration
```

### Phase 2: Advanced Features (Week 2)
```yaml
Focus: Multi-turn + edge cases
Tests: MT-001, MT-002, EC-001 to EC-005
Goal: Conversation memory + error handling
```

### Phase 3: User Acceptance (Week 3)
```yaml
Focus: Real workflows
Users: Jonas + 2 developers
Goal: 10 hours real usage, collect feedback
```

### Phase 4: Optimization (Week 4)
```yaml
Focus: Performance + quality
Tests: All scenarios repeated
Goal: <3s responses, 95%+ accuracy
```

---

## 🔧 Test Tools & Infrastructure

### Automated Testing
```typescript
// Example test harness
describe('AI Assistant Tests', () => {
  test('KR-001: Invoice creation lookup', async () => {
    const response = await aiAssistant.query(
      'How do I create an invoice in Billy.dk?'
    );
    
    expect(response.time).toBeLessThan(3000);
    expect(response.citations).toContain('Tekup-Billy');
    expect(response.code).toMatch(/createInvoice/);
  });
});
```

### Manual Testing Checklist
- [ ] Response accuracy verified by domain expert
- [ ] Citations lead to correct files
- [ ] Code examples tested and run
- [ ] User persona matches scenario
- [ ] Benchmark comparison documented

### Performance Monitoring
```yaml
Metrics to Track:
  - Response latency (p50, p95, p99)
  - TekupVault API calls
  - Token usage (OpenAI)
  - Error rates by category
  - User satisfaction scores
```

---

## 📊 Benchmark Comparison Matrix

| Feature | Tekup AI | ChatGPT | Claude | Copilot | Grok |
|---------|----------|---------|--------|---------|------|
| **Tekup Docs Access** | ✅ 1,063 | ❌ | ❌ | ❌ | ❌ |
| **Multi-Repo Context** | ✅ 8 repos | ❌ | Partial | ❌ | ❌ |
| **Strategic Awareness** | ✅ TIER system | ❌ | ❌ | ❌ | ❌ |
| **Code Citations** | ✅ File:line | Partial | Partial | ✅ | ❌ |
| **Conversation Memory** | ✅ 10+ turns | ✅ | Partial | ❌ | ✅ |
| **Response Time** | <3s goal | ~2s | ~2s | <1s | ~3s |
| **Accuracy** | 95% goal | 85% | 90% | 75% | 80% |
| **Cost/Month** | $87-105 | $25 | $20 | $10 | $16 |

**Unique Advantages:**
- 🎯 Only solution with full Tekup portfolio knowledge
- 🎯 Prevents costly mistakes (e.g. €360K Tekup-org)
- 🎯 Enforces Tekup coding standards
- 🎯 Strategic decision support

---

## 🎓 Lessons from Market Leaders

### ChatGPT Best Practices
✅ **Adopt:**
- Custom instructions for context
- API actions for external data
- Memory feature for preferences
- Clear citation format

❌ **Avoid:**
- Over-reliance on general knowledge
- Hallucinating code examples
- Generic responses

### Claude Best Practices
✅ **Adopt:**
- 200K context window approach
- Projects for domain separation
- Detailed reasoning
- Code review quality

❌ **Avoid:**
- File upload limitations
- No API integration

### GitHub Copilot Best Practices
✅ **Adopt:**
- Inline code suggestions
- Fast response times
- IDE integration
- Pattern learning

❌ **Avoid:**
- Limited context (single file)
- No conversation
- Basic Q&A only

### Perplexity Best Practices
✅ **Adopt:**
- Transparent citations
- Source diversity
- Search-first approach
- Team collaboration

❌ **Avoid:**
- Web-only focus
- Limited code understanding

---

## 🚀 Implementation Roadmap

### Week 1: Foundation
- [ ] Deploy core chat interface
- [ ] Integrate TekupVault API
- [ ] Implement basic streaming
- [ ] Test scenarios: KR-001, KR-002, CA-001

### Week 2: Intelligence
- [ ] Add conversation memory
- [ ] Implement citation system
- [ ] Strategic decision logic
- [ ] Test scenarios: SD-001, SD-002, MT-001

### Week 3: Polish
- [ ] Error handling
- [ ] Edge case coverage
- [ ] Performance optimization
- [ ] Test all scenarios

### Week 4: Launch
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Team training
- [ ] Production deployment

---

## 📝 Test Results Template

```yaml
Test ID: [e.g. KR-001]
Date: YYYY-MM-DD
Tester: [Name]
Persona: [Jonas/Developer/New Member]

Query: "[exact user input]"

Expected Outcome:
  - [Bullet points from scenario]

Actual Outcome:
  - Response Time: Xs
  - Accuracy: X/10
  - Citations: [count]
  - Code Quality: [working/partial/broken]

Pass/Fail: [PASS/FAIL]
Notes: [observations]

Compared to [Benchmark]:
  - Better: [aspects]
  - Worse: [aspects]  
  - Same: [aspects]

Improvements Needed:
  - [Action items]
```

---

## 🎯 Success Criteria Summary

### Must Have (MVP)
✅ KR-001, KR-002: Basic knowledge retrieval  
✅ CA-001, CA-002: Code help & debugging  
✅ SD-001, SD-002: Strategic decisions  
✅ 90%+ accuracy on P0 scenarios  
✅ <5s response time  
✅ Citations on all code/docs

### Should Have (V1.0)
✅ MT-001, MT-002: Multi-turn conversations  
✅ EC-001 to EC-005: Edge case handling  
✅ 95%+ accuracy overall  
✅ <3s response time  
✅ 5+ turn conversation memory

### Nice to Have (V1.1+)
✅ Voice input (Danish)  
✅ File upload & analysis  
✅ Export conversations  
✅ Team collaboration  
✅ Usage analytics

---

**Status:** Ready for Implementation  
**Next Action:** Begin MVP development (Phase 1)  
**Owner:** Jonas Abde  
**Timeline:** 4 weeks to production

