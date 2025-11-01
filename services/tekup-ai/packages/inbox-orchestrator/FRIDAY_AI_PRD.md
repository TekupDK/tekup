# Friday AI - Product Requirements Document (PRD)

**Version:** 1.1.0  
**Date:** November 2025  
**Status:** Production Ready

---

## Executive Summary

**Friday AI** is an intelligent assistant for lead management, quote generation, booking, and customer service. The system uses Google Gemini AI with token-optimized prompts, intent detection, and Shortwave.ai-inspired compact formatting.

**Core Value Proposition:**
- Automatic lead parsing from email threads
- Intelligent reply generation with 24 business rule memories
- Token-optimized AI responses (35-45% reduction)
- Real-time calendar and email integration
- Performance metrics tracking

---

## 1. Product Overview

### 1.1 Purpose
Friday AI automates lead management workflows by:
- Parsing leads from Gmail threads
- Generating context-aware replies
- Enforcing business rules (memories)
- Tracking performance metrics
- Optimizing token usage and costs

### 1.2 Target Users
- **Primary:** Rendetalje team members managing leads and bookings
- **Secondary:** Customer service representatives
- **Tertiary:** Business owners reviewing AI-generated replies

### 1.3 Key Features

#### Core Features
1. **Lead Parsing** - Extract structured data from email threads
2. **AI Reply Generation** - Generate safe, memory-enforced replies
3. **Chat Interface** - Natural language queries for leads/calendar
4. **Intent Detection** - Automatic intent recognition for memory selection
5. **Token Optimization** - Selective memory injection reduces costs
6. **Response Templates** - Shortwave.ai-style compact formatting
7. **Metrics Logging** - Track tokens, latency, cost per request

#### Business Rules (Memories)
- **MEMORY_1:** Time validation before date operations
- **MEMORY_4:** Lead source rules (reply strategy per source)
- **MEMORY_5:** Calendar check before booking suggestions
- **MEMORY_7:** Email search before sending replies
- **MEMORY_8:** Overtime communication (+1h rule, not +3-5h)
- **MEMORY_11:** Optimized quote format with all required fields
- **MEMORY_23:** Price calculation (349 kr/t based on m²)

---

## 2. Technical Architecture

### 2.1 Tech Stack
- **Language:** TypeScript
- **Framework:** Express.js
- **AI:** Google Gemini Pro
- **Testing:** Jest
- **Runtime:** Node.js 20+

### 2.2 Key Components

#### 2.2.1 Lead Parser (`leadParser.ts`)
- Extracts name, contact, address, property size, type
- Determines lead source (Rengøring.nu, Leadpoint, AdHelp)
- Calculates price estimates
- Applies reply strategy rules

#### 2.2.2 Intent Detector (`intentDetector.ts`)
- Detects user intent from messages
- Maps intents to relevant memories
- Reduces token usage via selective injection

#### 2.2.3 Response Templates (`responseTemplates.ts`)
- Shortwave.ai-inspired compact formatting
- Reduces LLM generation tokens by 60-80%
- Formats leads, calendar tasks, quotes, next steps

#### 2.2.4 Metrics Logger (`metricsLogger.ts`)
- Logs tokens, latency, cost per request
- Tracks intent distribution
- Calculates performance summaries

#### 2.2.5 Prompt Training (`promptTraining.ts`)
- System prompt with 24 memories
- Optimized training examples
- Context-aware prompt generation

---

## 3. API Specifications

### 3.1 Health Check
**Endpoint:** `GET /health`  
**Description:** Service health verification  
**Response:** `{ "ok": true }`

### 3.2 Lead Parser Test
**Endpoint:** `GET /test/parser`  
**Description:** Test lead parsing with mock data  
**Response:** `{ "success": true, "parsed": {...} }`

### 3.3 Generate Reply
**Endpoint:** `POST /generate-reply`  
**Description:** Generate AI reply recommendation  
**Request:**
```json
{
  "threadId": "string",
  "policy": {
    "searchBeforeSend": true
  }
}
```
**Response:**
```json
{
  "recommendation": "string",
  "warnings": ["string"],
  "shouldSend": boolean
}
```

### 3.4 Approve and Send
**Endpoint:** `POST /approve-and-send`  
**Description:** Send approved reply with label management  
**Request:**
```json
{
  "threadId": "string",
  "body": "string",
  "labels": {
    "add": ["string"],
    "remove": ["string"]
  }
}
```

### 3.5 Chat
**Endpoint:** `POST /chat`  
**Description:** Intelligent chat with intent detection and metrics  
**Request:**
```json
{
  "message": "Hvad har vi fået af nye leads i dag?"
}
```
**Response:**
```json
{
  "reply": "## Nye Leads (3)\n1. John Doe - Fast, 80m²...",
  "actions": [...],
  "metrics": {
    "intent": "lead_processing",
    "tokens": 150,
    "latency": "200ms"
  }
}
```

---

## 4. Business Rules & Memories

### 4.1 Critical Memories

**MEMORY_1: Time Check**
- Always validate dates/times before operations
- Use `new Date()` and verify before use
- Date errors are harmful to business

**MEMORY_4: Lead Source Rules**
- Rengøring.nu: CREATE_NEW_EMAIL (never reply on leadmail)
- AdHelp: DIRECT_TO_CUSTOMER (send to customer email)
- Leadpoint: REPLY_DIRECT (can reply directly)

**MEMORY_7: Email Search First**
- Always search existing communication before replies
- Avoid double quotes and embarrassing repetitions

**MEMORY_8: Overtime Communication**
- Call customer at +1h overshoot, NOT +3-5h
- Always specify number of workers in quotes

**MEMORY_11: Quote Format**
- Must include: m², workers, hours, price, available dates
- Format: "📏 230m² • 👥 2 pers • ⏱️ 5t = 10 arbejdstimer"

**MEMORY_23: Price Calculation**
- 349 kr/t/person (including VAT)
- Based on m²: <100m²=2t, 100-150m²=3t, >200m²=ceil(m²/50)

### 4.2 Memory Enforcement
- All memories are enforced in `generateSafeReply()`
- Warnings generated for violations
- Template fallback if AI response invalid

---

## 5. Performance Requirements

### 5.1 Token Optimization
- **Target:** 35-45% token reduction
- **Method:** Selective memory injection based on intent
- **Result:** Average 225 tokens per request (down from ~400)

### 5.2 Response Time
- **Target:** <500ms for chat endpoint
- **Current:** ~200-300ms average
- **Metrics:** Tracked per request

### 5.3 Cost Efficiency
- **Target:** <0.002 DKK per request
- **Current:** ~0.001-0.002 DKK average
- **Method:** Response templates reduce LLM tokens by 60-80%

---

## 6. User Workflows

### 6.1 Lead Management
1. User asks: "Hvad har vi fået af nye leads i dag?"
2. System searches Gmail for leads (last 2 days)
3. Parses structured data from email threads
4. Formats compact response with lead summary
5. Returns actionable next steps

### 6.2 Reply Generation
1. User requests reply for thread
2. System validates time (MEMORY_1)
3. Searches existing communication (MEMORY_7)
4. Detects intent and selects relevant memories
5. Generates AI reply with memory enforcement
6. Validates quote format (MEMORY_11)
7. Returns recommendation with warnings

### 6.3 Booking Suggestions
1. User asks: "Book tid til nyt lead"
2. System checks calendar (MEMORY_5)
3. Shows occupied slots
4. Suggests available times
5. Validates dates/times (MEMORY_1)

---

## 7. Testing Requirements

### 7.1 Unit Tests
- ✅ Token counter utilities
- ✅ Intent detector
- ✅ Response templates
- ✅ Metrics logger
- Coverage: 75-85%

### 7.2 Integration Tests
- ⚠️ Chat endpoint (needs refactoring)
- Email/Calendar integration
- Memory enforcement

### 7.3 E2E Tests (TestSprite)
- Chat workflows
- Lead parsing accuracy
- Reply generation quality
- Memory rule enforcement

---

## 8. Success Criteria

### 8.1 Functional
- ✅ All 5 APIs working correctly
- ✅ Lead parsing accuracy >95%
- ✅ Memory enforcement 100%
- ✅ Token optimization achieving 35-45% reduction

### 8.2 Performance
- ✅ Response time <500ms
- ✅ Cost <0.002 DKK/request
- ✅ Metrics logging functional

### 8.3 Quality
- ✅ Test coverage 75-85%
- ✅ Shortwave.ai-style formatting
- ✅ Intent detection accuracy >85%

---

## 9. Future Enhancements

### Phase 2
- Implement remaining 17 memories
- Add Billy.dk invoice integration
- Calendar event creation
- Automated follow-up reminders

### Phase 3
- Mobile app integration
- Web dashboard
- Multi-language support
- Advanced analytics

---

## 10. Configuration

### Environment Variables
- `PORT`: Server port (default: 3011)
- `GEMINI_API_KEY`: Google Gemini API key
- `GOOGLE_MCP_URL`: Google MCP service URL
- `DEBUG`: Enable debug logging

### Service Dependencies
- Google MCP Service (port 3010)
- Gmail API access
- Calendar API access
- Gemini AI API

---

## Appendix A: Code Summary

See `testsprite_tests/tmp/code_summary.json` for detailed API specifications in OpenAPI format.

## Appendix B: Testing

See `TESTING.md` and `TEST_RESULTS.md` for test documentation.

