# AI Email Integration - Task Structure

**Location**: `/tasks/ai-email-integration/`  
**Status**: Planning → Spike → Implementation  
**Start Date**: November 5, 2025

---

## 📁 Folder Structure

```
tasks/ai-email-integration/
├── 00-PROJECT-OVERVIEW.md          # High-level project plan
├── PHASE-0-SPIKE.md                # Spike validation plan (2-3t)
├── 01-CURRENT-CHAT-ANALYSIS.md     # ChatPanel analysis findings
├── 02-AI-SIDEBAR-DESIGN.md         # Component design spec
├── 03-EMAIL-CONTEXT-SYSTEM.md      # Context extraction guide
├── 04-API-INTEGRATION.md           # Backend endpoints
├── 05-TESTING-PLAN.md              # Test strategy
├── SPIKE-DECISION.md               # GO/NO-GO decision doc
└── README.md                       # This file
```

---

## 🎯 Quick Start

### For Developers Starting This Task

1. **Read First** (15 min):
   - [ ] `00-PROJECT-OVERVIEW.md` - Understand goals & architecture
   - [ ] `PHASE-0-SPIKE.md` - Understand spike approach

2. **Execute Spike** (2-3 hours):
   - [ ] Task 0.1: Analyse ChatPanel
   - [ ] Task 0.2: Build prototype
   - [ ] Task 0.3: Test & decide

3. **Decision Point**:
   - ✅ **GO** → Create `SPIKE-DECISION.md`, proceed to Task 1.1
   - ❌ **NO-GO** → Document why, propose alternative

4. **Implementation** (if GO):
   - [ ] Phase 1: MVP (1 dag)
   - [ ] Phase 2: Smart Replies (0.5 dag)
   - [ ] Phase 3: Polish (0.5 dag)

---

## 🛠️ Environment Prerequisites

AI/MCP integration kræver at MCP-servicerne er tilgængelige via korrekte environment-variabler:

| Variable         | Status         | Notes                                                                |
| ---------------- | -------------- | -------------------------------------------------------------------- |
| `GOOGLE_MCP_URL` | **DEPRECATED** | No longer used. Gmail/Calendar use direct Google API (google-api.ts) |
| `GMAIL_MCP_URL`  | **DEPRECATED** | No longer used. Gmail/Calendar use direct Google API (google-api.ts) |

> ✅ **Migration Complete (Nov 5, 2025):** MCP servers removed. All email/calendar functionality now uses direct Google API calls via `google-api.ts` and `gmail-labels.ts` for better performance and reliability. MCP URLs are no longer required.

---

## 🔄 Current Status

**Phase**: Planning ✅  
**Next**: Spike (Task 0.1) ⏭️  
**Blocker**: None

### Completed

- [x] Project planning
- [x] Documentation structure
- [x] Task breakdown

### In Progress

- [ ] Nothing yet

### Blocked

- [ ] Nothing yet

---

## 📊 Success Metrics (from Overview)

### Primary KPIs

- **Time to reply**: Reducér gennemsnitlig tid med 40%
- **AI usage rate**: 60%+ af emails bruger AI features
- **User satisfaction**: 4.5+ rating på AI suggestions

### Spike Success

- [ ] Can answer: "Should we build this?"
- [ ] Confidence in full build
- [ ] Identified 2-3 biggest risks
- [ ] Know exactly what Task 1.1 should be

---

## 🎓 Key Learnings (Updated as we go)

### From Shortwave Analysis

- Integrated sidebar > separate panel
- Context-aware AI > generic chat
- Quick actions > free-form chat
- Persistent history per thread

### From Our Spike

_To be filled after spike completion_

---

## ⚠️ Known Risks (from Overview)

1. **API Rate Limits** - Mitigation: Queue + fallback + caching
2. **Slow Responses** - Mitigation: Streaming + optimistic UI + timeout
3. **Irrelevant Suggestions** - Mitigation: Better context + feedback loop
4. **Storage Bloat** - Mitigation: Auto-delete + compression + limits

---

## 🔗 Related Documentation

### Internal Docs

- `/EMAIL_THREAD_LOADING_PERFORMANCE.md` - Performance baseline
- `/EMAIL_FUNCTIONS_DOCUMENTATION.md` - Current email features
- `/SHORTWAVE_CONTEXT_FEATURE.md` - Inspiration source

### External References

- [Shortwave AI Features](https://shortwave.ai)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## 👥 Team & Ownership

**Project Lead**: [TBD]  
**Backend**: [TBD]  
**Frontend**: [TBD]  
**Design**: [TBD]  
**QA**: [TBD]

---

## 📅 Timeline

| Phase           | Duration     | Start     | End       | Status      |
| --------------- | ------------ | --------- | --------- | ----------- |
| Planning        | 1 day        | Nov 5     | Nov 5     | ✅ Done     |
| Spike           | 0.5 day      | Nov 5     | Nov 5     | ⏭️ Next     |
| Phase 1 MVP     | 1 day        | Nov 6     | Nov 6     | ⏸️ Waiting  |
| Phase 2 Replies | 0.5 day      | Nov 7     | Nov 7     | ⏸️ Waiting  |
| Phase 3 Polish  | 0.5 day      | Nov 8     | Nov 8     | ⏸️ Waiting  |
| Testing         | 1 day        | Nov 8     | Nov 8     | ⏸️ Waiting  |
| **Total**       | **3-4 days** | **Nov 5** | **Nov 8** | 🎯 On Track |

---

## 🚀 How to Contribute

### Before Starting

1. Read `00-PROJECT-OVERVIEW.md`
2. Check current status above
3. Pick a task from todo list
4. Mark task as in-progress

### While Working

1. Update status in this README
2. Document learnings
3. Create sub-documents as needed
4. Test thoroughly

### After Completing

1. Update completion status
2. Document key decisions
3. Create handoff notes
4. Mark task as done

---

## 🆘 Need Help?

### Questions?

- Check `00-PROJECT-OVERVIEW.md` first
- Review `PHASE-0-SPIKE.md` for spike details
- Ask in team chat
- Create issue in GitHub

### Blockers?

- Document blocker in this README
- Notify team immediately
- Propose solutions
- Escalate if needed after 2 hours

---

## 📝 Change Log

| Date        | Change                                  | Author  |
| ----------- | --------------------------------------- | ------- |
| Nov 5, 2025 | Initial project setup and documentation | Copilot |
| Nov 5, 2025 | Spike plan created                      | Copilot |

---

**Last Updated**: November 5, 2025  
**Next Review**: After spike completion
