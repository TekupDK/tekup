# Friday AI Integration Testing Guide

## Prerequisites

1. **Start all services:**
```bash
# Terminal 1: Inbox Orchestrator
cd services/tekup-ai/packages/inbox-orchestrator
npm run dev  # Port 3011

# Terminal 2: Backend NestJS
cd services/backend-nestjs
npm run start:dev  # Port 3000

# Terminal 3: Frontend Next.js
cd services/frontend-nextjs
npm run dev  # Port 3002
```

2. **Environment Variables:**
```bash
# Backend .env
AI_FRIDAY_URL=http://localhost:3011
ENABLE_AI_FRIDAY=true

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Test Scenarios

### 1. Backend API Format Test

**Direct to Inbox Orchestrator:**
```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'
```

**Expected Response:**
```json
{
  "reply": "...",
  "actions": [],
  "metrics": {
    "intent": "lead_processing",
    "tokens": 450,
    "latency": "1234ms"
  }
}
```

### 2. Backend NestJS Integration Test

**Test Backend to Inbox Orchestrator:**
```bash
# First, get auth token (login)
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.accessToken')

# Then test Friday AI
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

**Expected Response:**
```json
{
  "sessionId": "sess_...",
  "response": {
    "message": "...",
    "actions": [],
    "data": {}
  }
}
```

### 3. Frontend Chat Widget Test

1. Open browser: `http://localhost:3002`
2. Login with test credentials
3. Look for floating chat button (bottom right)
4. Click to open chat widget
5. Send test message: "Hvad har vi fået af nye leads i dag?"
6. Verify response appears
7. Test minimize/maximize
8. Test close button

### 4. Workflow Testing

#### Lead Processing Workflow
1. Message: "Hvad har vi fået af nye leads i dag?"
2. Expected: List of leads with details
3. Verify: Intent is "lead_processing"
4. Verify: Actions include search_leads

#### Booking Workflow
1. Message: "Vis mig ledige tider i morgen"
2. Expected: Calendar slots available
3. Verify: Intent is "calendar_query"
4. Verify: Actions include calendar check

#### Customer Support Workflow
1. Message: "Hjælp mig med at finde en kunde"
2. Expected: Customer search or suggestions
3. Verify: Intent is appropriate
4. Verify: Helpful response

#### Conflict Resolution Workflow
1. Message: "Hvordan håndterer jeg en klage?"
2. Expected: MEMORY_9 guidance
3. Verify: Conflict resolution memory applied
4. Verify: Step-by-step instructions

### 5. Error Scenario Testing

#### Network Error
1. Stop inbox-orchestrator
2. Send message from frontend
3. Verify error message appears
4. Verify fallback response

#### Authentication Error
1. Logout user
2. Try to send message
3. Verify authentication error
4. Verify redirect to login

#### Invalid Message
1. Send empty message
2. Verify validation error
3. Verify no API call made

### 6. Performance Testing

```bash
# Load test with multiple requests
for i in {1..10}; do
  curl -X POST http://localhost:3011/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test message '$i'"}' &
done
wait

# Check response times
# Should be < 3 seconds for most requests
```

## Verification Checklist

- [ ] Backend sends correct format to inbox-orchestrator
- [ ] Frontend chat widget appears on all pages
- [ ] Messages send and receive correctly
- [ ] Session management works
- [ ] Error handling works
- [ ] All 24 memory rules are applied
- [ ] Actions processing works
- [ ] Performance is acceptable (<3s response time)
- [ ] Authentication is enforced
- [ ] Different user roles work correctly

## Debugging

### Backend Logs
```bash
# Watch backend logs
cd services/backend-nestjs
npm run start:dev | grep -i "friday\|ai"
```

### Inbox Orchestrator Logs
```bash
# Watch orchestrator logs
cd services/tekup-ai/packages/inbox-orchestrator
npm run dev | grep -i "friday"
```

### Frontend Console
- Open browser DevTools
- Check Console for errors
- Check Network tab for API calls
- Verify request/response format

## Common Issues

### Issue: "AI Friday integration not configured properly"
**Solution:** Set `AI_FRIDAY_URL=http://localhost:3011` in backend `.env`

### Issue: "CORS error"
**Solution:** Ensure backend allows frontend origin in CORS config

### Issue: "401 Unauthorized"
**Solution:** Check JWT token is valid and not expired

### Issue: "Chat widget not appearing"
**Solution:** Check layout.tsx has FridayChatWidget imported and rendered

### Issue: "Messages not sending"
**Solution:** Check browser console for errors, verify API endpoint path

