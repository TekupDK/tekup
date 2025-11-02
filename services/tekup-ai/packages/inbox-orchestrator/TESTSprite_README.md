# 🧪 TestSprite Setup Guide - Friday AI

## ✅ Præ-Test Checklist

Følg denne guide for at få Friday AI klar til TestSprite testing.

---

## 1. Verificer Server Setup

### 1.1 Installer Dependencies

```bash
cd C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator
npm install
```

### 1.2 Check Environment Variables

Serveren har følgende environment variables:

- `PORT`: 3011 (default)
- `GEMINI_API_KEY`: (optional - fallback hvis mangler)
- `GOOGLE_MCP_URL`: (optional - for production)
- `NODE_ENV`: test (for test mode)

**Note:** Serveren kan køre uden disse variabler (med begrænsninger).

---

## 2. Start Friday AI Server

### 2.1 Development Mode

```bash
cd C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator
npm run dev
```

**Expected Output:**
```
Friday AI (Inbox Orchestrator) listening on :3011
```

### 2.2 Verificer Server Kører

Åbn browser eller terminal og test:

```bash
curl http://localhost:3011/health
```

**Expected Response:**
```json
{"ok":true}
```

---

## 3. TestSprite Configuration

### 3.1 Upload PRD Document

I TestSprite dashboard, upload:
```
C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator\FRIDAY_AI_PRD.md
```

### 3.2 Test Configuration Settings

**Mode:** Backend  
**Scope:** Codebase  
**Authentication:** None  
**Port:** 3011  
**Path:** /  

---

## 4. Test Endpoints Ready

### 4.1 Health Check

```
GET http://localhost:3011/health
Response: {"ok": true}
```

### 4.2 Lead Parser Test

```
GET http://localhost:3011/test/parser
Response: {"success": true, "parsed": {...}}
```

### 4.3 Generate Reply

```
POST http://localhost:3011/generate-reply
Body: {"threadId": "test", "policy": {"searchBeforeSend": true}}
Response: {"recommendation": "...", "warnings": [], "shouldSend": true}
```

### 4.4 Approve and Send

```
POST http://localhost:3011/approve-and-send
Body: {"threadId": "test", "body": "Test reply"}
Response: {"ok": true}
```

### 4.5 Chat

```
POST http://localhost:3011/chat
Body: {"message": "Hvad har vi fået af nye leads i dag?"}
Response: {"reply": "...", "actions": [], "metrics": {...}}
```

---

## 5. TestSprite Test Plan

TestSprite vil teste:

1. ✅ **TC001:** Health Check API
2. ✅ **TC002:** Lead Parser Test API
3. ✅ **TC003:** Generate Reply API (med memory enforcement)
4. ✅ **TC004:** Approve and Send API
5. ✅ **TC005:** Chat API (med intent detection og metrics)

---

## 6. Files Generated for TestSprite

```
testsprite_tests/
├── tmp/
│   ├── code_summary.json          ✅ API specifications
│   └── prd_files/
│       └── FRIDAY_AI_PRD.md       ✅ PRD document
├── testsprite_backend_test_plan.json  ✅ Test plan (5 test cases)
└── testsprite-mcp-test-report.md     📝 (Will be generated after tests)
```

---

## 7. Quick Start Commands

### Start Server

```bash
cd C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator
npm run dev
```

### Test Server Manually

```bash
# Health check
curl http://localhost:3011/health

# Lead parser
curl http://localhost:3011/test/parser

# Chat (requires running server)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hej"}'
```

### Run Jest Tests (Optional)

```bash
npm test
```

---

## 8. Troubleshooting

### Server won't start

- Check port 3011 is not in use: `netstat -ano | findstr :3011`
- Check Node.js version: `node --version` (should be 20+)
- Check dependencies: `npm install`

### TestSprite can't connect

- Verify server is running on port 3011
- Check firewall settings
- Try: `curl http://localhost:3011/health` from terminal

### API errors

- Check console logs for errors
- Verify environment variables (optional)
- Check Google MCP service (if used)

---

## 9. Success Criteria

✅ Server starter uden fejl  
✅ `/health` endpoint responder  
✅ TestSprite kan connecte til server  
✅ Alle 5 endpoints kan testes  
✅ TestSprite genererer rapport  

---

## 10. Next Steps After TestSprite

1. Review test rapport
2. Fix identified issues
3. Re-run tests
4. Update documentation
5. Deploy improvements

---

**Status:** ✅ Ready for TestSprite Testing

